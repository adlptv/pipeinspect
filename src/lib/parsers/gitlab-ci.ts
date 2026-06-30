import yaml from "js-yaml";
import type { PipelineJob, PipelineStage, ParsedPipeline, DAGNode, DAGEdge, CIFormat } from "@/lib/types";
import { generateId, sanitizeYamlInput } from "@/lib/utils";

export function parseGitLabCI(config: string): ParsedPipeline {
  const sanitized = sanitizeYamlInput(config);
  const doc = yaml.load(sanitized) as Record<string, any>;

  const jobs: PipelineJob[] = [];
  const stages: PipelineStage[] = [];
  const dagNodes: DAGNode[] = [];
  const dagEdges: DAGEdge[] = [];

  // Extract stage definitions
  const stageNames: string[] = Array.isArray(doc.stages)
    ? doc.stages
    : ["build", "test", "deploy"];

  // Filter out non-job keys
  const reservedKeys = new Set([
    "stages", "include", "variables", "default", "workflow",
    "image", "services", "before_script", "after_script",
    "cache", "artifacts", "only", "except", "rules", "tags",
    "template", "hidden_jobs",
  ]);

  const jobNames = Object.keys(doc).filter((k) => !reservedKeys.has(k) && !k.startsWith("."));

  // Create stage objects
  stageNames.forEach((name, i) => {
    stages.push({ name, jobs: [], sequence: i });
  });

  // Parse each job
  for (const jobName of jobNames) {
    const rawJob = doc[jobName];
    if (typeof rawJob !== "object" || rawJob === null) continue;

    const stage = rawJob.stage || "test";
    const needs: string[] = Array.isArray(rawJob.needs)
      ? rawJob.needs.map((n: any) => (typeof n === "string" ? n : n.job))
      : [];

    const commands: string[] = [];
    if (rawJob.script) {
      if (Array.isArray(rawJob.script)) {
        commands.push(...rawJob.script.map((s: string) => String(s)));
      } else {
        commands.push(String(rawJob.script));
      }
    }
    if (rawJob.before_script) {
      const bs = Array.isArray(rawJob.before_script) ? rawJob.before_script : [rawJob.before_script];
      commands.unshift(...bs.map((s: string) => String(s)));
    }
    if (rawJob.after_script) {
      const as = Array.isArray(rawJob.after_script) ? rawJob.after_script : [rawJob.after_script];
      commands.push(...as.map((s: string) => String(s)));
    }

    const estimatedDuration = Math.max(1, Math.ceil(commands.length * 0.7 + 1));

    const job: PipelineJob = {
      id: generateId(),
      name: jobName,
      dependencies: needs,
      commands,
      runner: rawJob.image || rawJob.tags?.[0] || "shared",
      estimatedDuration,
      stage,
      environment: rawJob.environment,
      needs,
      parallel: false,
    };
    jobs.push(job);

    // Add to stage
    const stageObj = stages.find((s) => s.name === stage);
    if (stageObj) {
      stageObj.jobs.push(job.id);
    }
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

  // Build DAG edges from explicit needs
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

  // Add stage-order edges (jobs in later stages depend on all jobs in previous stage)
  for (let i = 1; i < stages.length; i++) {
    const prevStage = stages[i - 1];
    const currStage = stages[i];
    for (const prevJobId of prevStage.jobs) {
      for (const currJobId of currStage.jobs) {
        const currJob = jobs.find((j) => j.id === currJobId);
        if (currJob && currJob.dependencies.length === 0) {
          dagEdges.push({
            source: prevJobId,
            target: currJobId,
            type: "stage-order",
          });
        }
      }
    }
  }

  const maxParallelism = Math.max(...stages.map((s) => s.jobs.length), 1);

  return {
    format: "gitlab-ci" as CIFormat,
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
