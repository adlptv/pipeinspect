import yaml from "js-yaml";
import type { PipelineJob, PipelineStage, ParsedPipeline, DAGNode, DAGEdge, CIFormat } from "@/lib/types";
import { generateId, sanitizeYamlInput } from "@/lib/utils";

export function parseGitHubActions(config: string): ParsedPipeline {
  const sanitized = sanitizeYamlInput(config);
  const doc = yaml.load(sanitized) as Record<string, any>;

  const jobs: PipelineJob[] = [];
  const stages: PipelineStage[] = [];
  const dagNodes: DAGNode[] = [];
  const dagEdges: DAGEdge[] = [];

  const rawJobs = doc.jobs || {};
  const jobNames = Object.keys(rawJobs);

  // First pass: create jobs
  for (const jobName of jobNames) {
    const rawJob = rawJobs[jobName];
    const needs: string[] = Array.isArray(rawJob.needs) ? rawJob.needs : rawJob.needs ? [rawJob.needs] : [];

    const commands: string[] = [];
    const steps = rawJob.steps || [];
    for (const step of steps) {
      if (step.run) {
        const lines = step.run.split("\n").map((l: string) => l.trim()).filter(Boolean);
        commands.push(...lines);
      }
      if (step.uses) {
        commands.push(`uses: ${step.uses}`);
      }
    }

    // Estimate duration based on steps
    const estimatedDuration = Math.max(1, Math.ceil(steps.length * 0.8 + 2));

    const job: PipelineJob = {
      id: generateId(),
      name: jobName,
      dependencies: needs,
      commands,
      runner: rawJob["runs-on"] || "ubuntu-latest",
      estimatedDuration,
      stage: needs.length === 0 ? "build" : "test",
      environment: rawJob.environment,
      needs,
      parallel: false,
    };
    jobs.push(job);
  }

  // Create stages based on dependency depth
  const stageMap = new Map<string, string>();
  const computeDepth = (jobName: string, visited: Set<string>): number => {
    if (visited.has(jobName)) return 0;
    visited.add(jobName);
    const job = jobs.find((j) => j.name === jobName);
    if (!job || job.dependencies.length === 0) return 0;
    return 1 + Math.max(...job.dependencies.map((dep) => computeDepth(dep, visited)));
  };

  for (const job of jobs) {
    const depth = computeDepth(job.name, new Set());
    const stageName = depth === 0 ? "build" : depth === 1 ? "test" : depth === 2 ? "deploy" : `stage-${depth}`;
    job.stage = stageName;
    stageMap.set(job.name, stageName);
  }

  // Build stages
  const stageNames = [...new Set(jobs.map((j) => j.stage || "default"))];
  stageNames.forEach((name, i) => {
    stages.push({
      name,
      jobs: jobs.filter((j) => j.stage === name).map((j) => j.id),
      sequence: i,
    });
  });

  // Build DAG nodes
  for (const job of jobs) {
    dagNodes.push({
      id: job.id,
      label: job.name,
      type: "job",
      stage: job.stage,
      duration: job.estimatedDuration,
      isCriticalPath: false,
      isBottleneck: false,
    });
  }

  // Build DAG edges
  for (const job of jobs) {
    for (const dep of job.dependencies) {
      const depJob = jobs.find((j) => j.name === dep);
      if (depJob) {
        dagEdges.push({
          source: depJob.id,
          target: job.id,
          type: "dependency",
        });
      }
    }
  }

  // Add stage-order edges for jobs in the same stage without explicit deps
  for (let i = 1; i < stages.length; i++) {
    const prevStageJobs = stages[i - 1].jobs;
    const currStageJobs = stages[i].jobs;
    // Connect last job of prev stage to first job of curr stage if no explicit dep
    if (prevStageJobs.length > 0 && currStageJobs.length > 0) {
      const hasExplicitDep = jobs.some((j) =>
        currStageJobs.includes(j.id) && j.dependencies.length > 0
      );
      if (!hasExplicitDep) {
        dagEdges.push({
          source: prevStageJobs[prevStageJobs.length - 1],
          target: currStageJobs[0],
          type: "stage-order",
        });
      }
    }
  }

  const maxParallelism = Math.max(...stages.map((s) => s.jobs.length), 1);

  return {
    format: "github-actions" as CIFormat,
    jobs,
    stages,
    dag: dagNodes,
    edges: dagEdges,
    metadata: {
      totalJobs: jobs.length,
      totalStages: stages.length,
      maxParallelism,
    },
  };
}
