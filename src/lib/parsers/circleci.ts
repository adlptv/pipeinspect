import yaml from "js-yaml";
import type { PipelineJob, PipelineStage, ParsedPipeline, DAGNode, DAGEdge, CIFormat } from "@/lib/types";
import { generateId, sanitizeYamlInput } from "@/lib/utils";

export function parseCircleCI(config: string): ParsedPipeline {
  const sanitized = sanitizeYamlInput(config);
  const doc = yaml.load(sanitized) as Record<string, any>;

  const jobs: PipelineJob[] = [];
  const stages: PipelineStage[] = [];
  const dagNodes: DAGNode[] = [];
  const dagEdges: DAGEdge[] = [];

  const rawJobs = doc.jobs || {};
  const workflows = doc.workflows?.["default"] || doc.workflows?.[Object.keys(doc.workflows || {})[0]] || {};
  const workflowJobs = workflows.jobs || [];

  // Create a map of job names to their config
  const jobConfigs = new Map<string, any>();
  for (const [name, config] of Object.entries(rawJobs)) {
    jobConfigs.set(name, config);
  }

  // Parse workflow jobs with their dependencies
  const processedJobs: { name: string; requires: string[] }[] = [];

  for (const wfJob of workflowJobs) {
    if (typeof wfJob === "string") {
      processedJobs.push({ name: wfJob, requires: [] });
    } else {
      const name = Object.keys(wfJob)[0];
      const config = wfJob[name];
      const requires: string[] = Array.isArray(config.requires) ? config.requires : [];
      processedJobs.push({ name, requires });
    }
  }

  // Create pipeline jobs
  for (const { name, requires } of processedJobs) {
    const jobConfig = jobConfigs.get(name) || {};
    const steps = jobConfig.steps || [];
    const commands: string[] = [];

    for (const step of steps) {
      if (typeof step === "string") {
        commands.push(step);
      } else if (step.run) {
        if (typeof step.run === "string") {
          commands.push(step.run);
        } else if (step.run.command) {
          commands.push(step.run.command);
        }
      } else if (step.checkout) {
        commands.push("checkout");
      } else if (step.restore_cache) {
        commands.push("restore_cache");
      } else if (step.save_cache) {
        commands.push("save_cache");
      }
    }

    // Determine stage based on dependency depth
    const computeDepth = (jobName: string, visited: Set<string>): number => {
      if (visited.has(jobName)) return 0;
      visited.add(jobName);
      const job = processedJobs.find((j) => j.name === jobName);
      if (!job || job.requires.length === 0) return 0;
      return 1 + Math.max(...job.requires.map((r) => computeDepth(r, visited)));
    };

    const depth = computeDepth(name, new Set());
    const stageName = depth === 0 ? "build" : depth === 1 ? "test" : depth === 2 ? "deploy" : `stage-${depth}`;

    const estimatedDuration = Math.max(1, Math.ceil(steps.length * 0.8 + 2));

    const job: PipelineJob = {
      id: generateId(),
      name,
      dependencies: requires,
      commands,
      runner: jobConfig.docker?.[0]?.image || jobConfig.machine?.image || "circleci/node",
      estimatedDuration,
      stage: stageName,
      needs: requires,
      parallel: false,
    };
    jobs.push(job);
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

  const maxParallelism = Math.max(...stages.map((s) => s.jobs.length), 1);

  return {
    format: "circleci" as CIFormat,
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
