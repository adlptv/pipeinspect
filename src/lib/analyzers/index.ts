import type { ParsedPipeline, Suggestion, CostEstimate, AnalysisResult } from "@/lib/types";

export function findCriticalPath(pipeline: ParsedPipeline): string[] {
  const { jobs, edges } = pipeline;
  const jobMap = new Map(jobs.map((j) => [j.id, j]));

  // Build adjacency list
  const dependents = new Map<string, string[]>();
  const dependencies = new Map<string, string[]>();

  for (const job of jobs) {
    dependents.set(job.id, []);
    dependencies.set(job.id, [...job.dependencies]);
  }

  // Map job names to IDs for dependency resolution
  const nameToId = new Map(jobs.map((j) => [j.name, j.id]));

  for (const job of jobs) {
    for (const dep of job.dependencies) {
      const depId = nameToId.get(dep);
      if (depId) {
        const depDeps = dependencies.get(job.id) || [];
        if (!depDeps.includes(depId)) {
          depDeps.push(depId);
          dependencies.set(job.id, depDeps);
        }
        const depDependents = dependents.get(depId) || [];
        if (!depDependents.includes(job.id)) {
          depDependents.push(job.id);
          dependents.set(depId, depDependents);
        }
      }
    }
  }

  // Also add edges from DAG
  for (const edge of edges) {
    const depDependents = dependents.get(edge.source) || [];
    if (!depDependents.includes(edge.target)) {
      depDependents.push(edge.target);
      dependents.set(edge.source, depDependents);
    }
    const targetDeps = dependencies.get(edge.target) || [];
    if (!targetDeps.includes(edge.source)) {
      targetDeps.push(edge.source);
      dependencies.set(edge.target, targetDeps);
    }
  }

  // Topological sort + longest path
  const memo = new Map<string, { path: string[]; duration: number }>();

  function longestPath(jobId: string, visited: Set<string>): { path: string[]; duration: number } {
    if (memo.has(jobId)) return memo.get(jobId)!;
    if (visited.has(jobId)) return { path: [], duration: 0 };
    visited.add(jobId);

    const job = jobMap.get(jobId);
    if (!job) return { path: [], duration: 0 };

    const deps = dependencies.get(jobId) || [];
    if (deps.length === 0) {
      const result = { path: [jobId], duration: job.estimatedDuration };
      memo.set(jobId, result);
      return result;
    }

    let bestPath: string[] = [];
    let bestDuration = 0;

    for (const depId of deps) {
      const depResult = longestPath(depId, new Set(visited));
      if (depResult.duration > bestDuration) {
        bestDuration = depResult.duration;
        bestPath = depResult.path;
      }
    }

    const result = {
      path: [...bestPath, jobId],
      duration: bestDuration + job.estimatedDuration,
    };
    memo.set(jobId, result);
    return result;
  }

  // Find the overall longest path
  let criticalPath: string[] = [];
  let maxDuration = 0;

  for (const job of jobs) {
    const result = longestPath(job.id, new Set());
    if (result.duration > maxDuration) {
      maxDuration = result.duration;
      criticalPath = result.path;
    }
  }

  return criticalPath;
}

export function findBottlenecks(pipeline: ParsedPipeline): string[] {
  const criticalPath = findCriticalPath(pipeline);
  const { jobs } = pipeline;
  const jobMap = new Map(jobs.map((j) => [j.id, j]));

  const bottlenecks: string[] = [];

  // Find the slowest job on the critical path
  let slowestJob: { id: string; duration: number } | null = null;
  for (const jobId of criticalPath) {
    const job = jobMap.get(jobId);
    if (job && (!slowestJob || job.estimatedDuration > slowestJob.duration)) {
      slowestJob = { id: jobId, duration: job.estimatedDuration };
    }
  }
  if (slowestJob) bottlenecks.push(slowestJob.id);

  // Find jobs that are much slower than average
  const avgDuration = jobs.reduce((sum, j) => sum + j.estimatedDuration, 0) / jobs.length;
  for (const job of jobs) {
    if (job.estimatedDuration > avgDuration * 2 && !bottlenecks.includes(job.id)) {
      bottlenecks.push(job.id);
    }
  }

  return bottlenecks;
}

export function generateSuggestions(pipeline: ParsedPipeline): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const { jobs, stages, edges } = pipeline;

  // 1. Find jobs that could run in parallel but don't
  const criticalPath = findCriticalPath(pipeline);
  const criticalSet = new Set(criticalPath);

  // Group jobs by stage
  for (const stage of stages) {
    const stageJobs = stage.jobs
      .map((id) => jobs.find((j) => j.id === id))
      .filter(Boolean) as typeof jobs;

    if (stageJobs.length > 1) {
      // Check if jobs in the same stage are sequential
      const hasExplicitDeps = stageJobs.some((j) =>
        j.dependencies.some((d) => stageJobs.some((sj) => sj.name === d))
      );

      if (!hasExplicitDeps) {
        const totalSequential = stageJobs.reduce((sum, j) => sum + j.estimatedDuration, 0);
        const maxParallel = Math.max(...stageJobs.map((j) => j.estimatedDuration));
        const timeSaved = totalSequential - maxParallel;

        if (timeSaved > 0) {
          suggestions.push({
            id: `parallel-${stage.name}`,
            type: "parallelization",
            severity: timeSaved > 5 ? "warning" : "info",
            title: `Parallelize jobs in "${stage.name}" stage`,
            description: `Jobs ${stageJobs.map((j) => j.name).join(", ")} can run in parallel. Running sequentially costs ${totalSequential.toFixed(1)}m; parallel would take ${maxParallel.toFixed(1)}m.`,
            affectedJobs: stageJobs.map((j) => j.id),
            estimatedTimeSaved: timeSaved,
            estimatedCostSaved: timeSaved * 0.008,
          });
        }
      }
    }
  }

  // 2. Find jobs without caching that could benefit
  for (const job of jobs) {
    const hasCacheStep = job.commands.some((cmd) =>
      cmd.toLowerCase().includes("cache") || cmd.toLowerCase().includes("restore_cache")
    );
    const hasInstallStep = job.commands.some((cmd) =>
      cmd.toLowerCase().includes("npm install") ||
      cmd.toLowerCase().includes("yarn install") ||
      cmd.toLowerCase().includes("pip install") ||
      cmd.toLowerCase().includes("bundle install") ||
      cmd.toLowerCase().includes("mvn install") ||
      cmd.toLowerCase().includes("gradle build")
    );

    if (hasInstallStep && !hasCacheStep) {
      suggestions.push({
        id: `cache-${job.id}`,
        type: "caching",
        severity: "info",
        title: `Add dependency caching for "${job.name}"`,
        description: `"${job.name}" runs dependency installation but doesn't use caching. Adding cache could save 30-60% of job time.`,
        affectedJobs: [job.id],
        estimatedTimeSaved: Math.ceil(job.estimatedDuration * 0.4),
        estimatedCostSaved: Math.ceil(job.estimatedDuration * 0.4) * 0.008,
      });
    }
  }

  // 3. Find duplicate jobs
  const commandSignature = new Map<string, string[]>();
  for (const job of jobs) {
    const sig = job.commands.sort().join("|");
    if (!commandSignature.has(sig)) {
      commandSignature.set(sig, []);
    }
    commandSignature.get(sig)!.push(job.name);
  }

  for (const [sig, jobNames] of commandSignature) {
    if (jobNames.length > 1) {
      suggestions.push({
        id: `duplicate-${jobNames[0]}`,
        type: "removal",
        severity: "warning",
        title: `Duplicate jobs detected: ${jobNames.join(", ")}`,
        description: `These jobs execute identical commands. Consider consolidating them into a single job or using a matrix strategy.`,
        affectedJobs: jobs.filter((j) => jobNames.includes(j.name)).map((j) => j.id),
        estimatedTimeSaved: jobs.filter((j) => jobNames.includes(j.name))[0]?.estimatedDuration || 0,
        estimatedCostSaved: (jobs.filter((j) => jobNames.includes(j.name))[0]?.estimatedDuration || 0) * 0.008,
      });
    }
  }

  // 4. Find long-running jobs that could be split
  const avgDuration = jobs.reduce((sum, j) => sum + j.estimatedDuration, 0) / jobs.length;
  for (const job of jobs) {
    if (job.estimatedDuration > avgDuration * 2 && job.commands.length > 5) {
      suggestions.push({
        id: `split-${job.id}`,
        type: "splitting",
        severity: "warning",
        title: `Consider splitting "${job.name}" into smaller jobs`,
        description: `"${job.name}" takes ${job.estimatedDuration}m and runs ${job.commands.length} commands. Splitting it into parallel jobs could reduce wall time.`,
        affectedJobs: [job.id],
        estimatedTimeSaved: Math.ceil(job.estimatedDuration * 0.3),
        estimatedCostSaved: Math.ceil(job.estimatedDuration * 0.3) * 0.008,
      });
    }
  }

  // 5. Suggest runner upgrades for critical path jobs
  for (const jobId of criticalPath) {
    const job = jobs.find((j) => j.id === jobId);
    if (job && (job.runner.includes("medium") || job.runner.includes("shared"))) {
      suggestions.push({
        id: `runner-${job.id}`,
        type: "runner-upgrade",
        severity: "info",
        title: `Upgrade runner for "${job.name}"`,
        description: `"${job.name}" is on the critical path using runner "${job.runner}". Upgrading to a larger runner could reduce execution time.`,
        affectedJobs: [job.id],
        estimatedTimeSaved: Math.ceil(job.estimatedDuration * 0.25),
        estimatedCostSaved: 0, // Larger runners cost more, net savings may vary
      });
    }
  }

  return suggestions;
}

export function calculateCostEstimate(pipeline: ParsedPipeline): CostEstimate {
  const costPerMinute = 0.008; // USD per minute for standard runners
  const breakdown = pipeline.jobs.map((job) => ({
    jobName: job.name,
    minutes: job.estimatedDuration,
    cost: job.estimatedDuration * costPerMinute,
  }));

  const runnerMinutes = pipeline.jobs.reduce((sum, j) => sum + j.estimatedDuration, 0);

  return {
    runnerMinutes,
    costPerMinute,
    totalCost: runnerMinutes * costPerMinute,
    currency: "USD",
    breakdown,
  };
}

export function calculateComplexityScore(pipeline: ParsedPipeline): number {
  const { jobs, edges, stages, metadata } = pipeline;

  // Factors:
  // 1. Number of jobs (0-30 points)
  const jobScore = Math.min(30, jobs.length * 2);

  // 2. Number of dependencies/edges (0-25 points)
  const edgeScore = Math.min(25, edges.length * 2);

  // 3. Number of stages (0-15 points)
  const stageScore = Math.min(15, stages.length * 3);

  // 4. Max parallelism (0-15 points)
  const parallelScore = Math.min(15, metadata.maxParallelism * 3);

  // 5. Average dependencies per job (0-15 points)
  const avgDeps = jobs.length > 0
    ? jobs.reduce((sum, j) => sum + j.dependencies.length, 0) / jobs.length
    : 0;
  const depScore = Math.min(15, avgDeps * 5);

  return Math.round(jobScore + edgeScore + stageScore + parallelScore + depScore);
}

export function calculateTotalDuration(pipeline: ParsedPipeline): number {
  const criticalPath = findCriticalPath(pipeline);
  const { jobs } = pipeline;
  const jobMap = new Map(jobs.map((j) => [j.id, j]));
  return criticalPath.reduce((sum, id) => sum + (jobMap.get(id)?.estimatedDuration || 0), 0);
}

export function calculateParallelizedDuration(pipeline: ParsedPipeline): number {
  const { stages, jobs } = pipeline;
  const jobMap = new Map(jobs.map((j) => [j.id, j]));
  let total = 0;

  for (const stage of stages) {
    const stageJobs = stage.jobs.map((id) => jobMap.get(id)).filter(Boolean) as typeof jobs;
    if (stageJobs.length === 0) continue;
    // Parallel duration for a stage = max job duration in that stage
    total += Math.max(...stageJobs.map((j) => j.estimatedDuration));
  }

  return total;
}

export function analyzePipeline(pipeline: ParsedPipeline): AnalysisResult {
  const criticalPath = findCriticalPath(pipeline);
  const bottlenecks = findBottlenecks(pipeline);
  const suggestions = generateSuggestions(pipeline);
  const costEstimate = calculateCostEstimate(pipeline);
  const complexityScore = calculateComplexityScore(pipeline);
  const totalDuration = calculateTotalDuration(pipeline);
  const parallelizedDuration = calculateParallelizedDuration(pipeline);

  // Mark critical path and bottlenecks on DAG nodes
  const enhancedPipeline: ParsedPipeline = {
    ...pipeline,
    dag: pipeline.dag.map((node) => ({
      ...node,
      isCriticalPath: criticalPath.includes(node.id),
      isBottleneck: bottlenecks.includes(node.id),
    })),
  };

  return {
    pipeline: enhancedPipeline,
    suggestions,
    criticalPath,
    totalDuration,
    parallelizedDuration,
    complexityScore,
    costEstimate,
  };
}
