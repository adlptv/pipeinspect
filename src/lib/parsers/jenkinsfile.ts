import type { PipelineJob, PipelineStage, ParsedPipeline, DAGNode, DAGEdge, CIFormat } from "@/lib/types";
import { generateId } from "@/lib/utils";

export function parseJenkinsfile(config: string): ParsedPipeline {
  const jobs: PipelineJob[] = [];
  const stages: PipelineStage[] = [];
  const dagNodes: DAGNode[] = [];
  const dagEdges: DAGEdge[] = [];

  // Parse declarative pipeline stages using regex
  // Match: stage('Name') { ... }
  const stageRegex = /stage\s*\(\s*['"]([^'"]+)['"]\s*\)\s*\{/g;
  const agentRegex = /agent\s*\{([^}]+)\}/g;
  const stepsRegex = /steps\s*\{([\s\S]*?)\n\s*\}/g;
  const parallelRegex = /parallel\s*\{/g;

  // Extract stages with their content
  const rawStages: { name: string; content: string; agent?: string; steps: string[] }[] = [];
  let match: RegExpExecArray | null;

  // Find all stage blocks with balanced braces
  const stageBlocks = extractStageBlocks(config);

  for (const block of stageBlocks) {
    const nameMatch = block.header.match(/stage\s*\(\s*['"]([^'"]+)['"]\s*\)/);
    if (!nameMatch) continue;

    const name = nameMatch[1];
    const content = block.body;

    // Extract agent
    const agentMatch = content.match(/agent\s*\{\s*([^}]+)\}/);
    const agent = agentMatch ? agentMatch[1].trim() : "any";

    // Extract steps
    const steps: string[] = [];
    const stepsMatch = content.match(/steps\s*\{([\s\S]*?)\n\s*\}/);
    if (stepsMatch) {
      const stepsContent = stepsMatch[1];
      // Extract sh, bat, echo, script, etc.
      const commandRegex = /(?:sh|bat|powershell|echo|script)\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
      let cmdMatch: RegExpExecArray | null;
      while ((cmdMatch = commandRegex.exec(stepsContent)) !== null) {
        steps.push(cmdMatch[1]);
      }
      // Also match sh '''multi-line'''
      const multiLineRegex = /sh\s*'''([\s\S]*?)'''/g;
      while ((cmdMatch = multiLineRegex.exec(stepsContent)) !== null) {
        steps.push(cmdMatch[1].trim());
      }
    }

    // Check for parallel
    const isParallel = /parallel\s*\{/.test(content);

    rawStages.push({ name, content, agent, steps });
  }

  // Extract parallel branches if present
  for (let i = 0; i < rawStages.length; i++) {
    const stage = rawStages[i];
    const parallelBranches = extractParallelBranches(stage.content);

    if (parallelBranches.length > 0) {
      // Create separate jobs for each parallel branch
      for (const branch of parallelBranches) {
        const estimatedDuration = Math.max(1, Math.ceil(branch.steps.length * 0.8 + 1));
        const job: PipelineJob = {
          id: generateId(),
          name: `${stage.name}_${branch.name}`,
          dependencies: i > 0 ? [rawStages[i - 1].name] : [],
          commands: branch.steps,
          runner: stage.agent || "any",
          estimatedDuration,
          stage: stage.name,
          parallel: true,
        };
        jobs.push(job);
      }
    } else {
      const estimatedDuration = Math.max(1, Math.ceil(stage.steps.length * 0.8 + 1));
      const job: PipelineJob = {
        id: generateId(),
        name: stage.name,
        dependencies: i > 0 ? [rawStages[i - 1].name] : [],
        commands: stage.steps,
        runner: stage.agent || "any",
        estimatedDuration,
        stage: stage.name,
        parallel: false,
      };
      jobs.push(job);
    }
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
      const depJobs = jobs.filter((j) => j.stage === dep || j.name === dep);
      for (const depJob of depJobs) {
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
    format: "jenkinsfile" as CIFormat,
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

interface StageBlock {
  header: string;
  body: string;
}

function extractStageBlocks(config: string): StageBlock[] {
  const blocks: StageBlock[] = [];
  const stageRegex = /stage\s*\(\s*['"][^'"]+['"]\s*\)\s*\{/g;
  let match: RegExpExecArray | null;

  while ((match = stageRegex.exec(config)) !== null) {
    const startIdx = match.index + match[0].length - 1; // Position of opening brace
    let depth = 1;
    let endIdx = startIdx + 1;

    while (depth > 0 && endIdx < config.length) {
      if (config[endIdx] === "{") depth++;
      if (config[endIdx] === "}") depth--;
      endIdx++;
    }

    blocks.push({
      header: match[0],
      body: config.slice(startIdx + 1, endIdx - 1),
    });
  }

  return blocks;
}

interface ParallelBranch {
  name: string;
  steps: string[];
}

function extractParallelBranches(content: string): ParallelBranch[] {
  const branches: ParallelBranch[] = [];
  const parallelMatch = content.match(/parallel\s*\{([\s\S]*?)\n\s*\}/);
  if (!parallelMatch) return branches;

  const parallelContent = parallelMatch[1];
  const branchRegex = /['"]([^'"]+)['"]\s*:\s*\{([\s\S]*?)\n\s*\}/g;
  let match: RegExpExecArray | null;

  while ((match = branchRegex.exec(parallelContent)) !== null) {
    const name = match[1];
    const branchContent = match[2];

    const steps: string[] = [];
    const commandRegex = /(?:sh|bat|powershell|echo)\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    let cmdMatch: RegExpExecArray | null;
    while ((cmdMatch = commandRegex.exec(branchContent)) !== null) {
      steps.push(cmdMatch[1]);
    }

    branches.push({ name, steps });
  }

  return branches;
}
