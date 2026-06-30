// Core pipeline types

export type CIFormat = "github-actions" | "gitlab-ci" | "jenkinsfile" | "circleci";

export interface PipelineJob {
  id: string;
  name: string;
  dependencies: string[];
  commands: string[];
  runner: string;
  estimatedDuration: number; // minutes
  stage?: string;
  environment?: string;
  needs?: string[];
  parallel?: boolean;
}

export interface PipelineStage {
  name: string;
  jobs: string[];
  sequence: number;
}

export interface ParsedPipeline {
  format: CIFormat;
  jobs: PipelineJob[];
  stages: PipelineStage[];
  dag: DAGNode[];
  edges: DAGEdge[];
  metadata: {
    totalJobs: number;
    totalStages: number;
    maxParallelism: number;
  };
}

export interface DAGNode {
  id: string;
  label: string;
  type: "job" | "stage";
  stage?: string;
  duration: number;
  isCriticalPath: boolean;
  isBottleneck: boolean;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number;
  fy?: number;
}

export interface DAGEdge {
  source: string;
  target: string;
  type: "dependency" | "stage-order";
  weight?: number;
}

export interface Suggestion {
  id: string;
  type: "parallelization" | "caching" | "removal" | "splitting" | "runner-upgrade";
  severity: "info" | "warning" | "critical";
  title: string;
  description: string;
  affectedJobs: string[];
  estimatedTimeSaved: number; // minutes
  estimatedCostSaved: number; // dollars
}

export interface AnalysisResult {
  pipeline: ParsedPipeline;
  suggestions: Suggestion[];
  criticalPath: string[];
  totalDuration: number;
  parallelizedDuration: number;
  complexityScore: number;
  costEstimate: CostEstimate;
}

export interface CostEstimate {
  runnerMinutes: number;
  costPerMinute: number;
  totalCost: number;
  currency: string;
  breakdown: {
    jobName: string;
    minutes: number;
    cost: number;
  }[];
}

export interface ComparisonResult {
  before: AnalysisResult;
  after: AnalysisResult;
  timeSaved: number;
  costSaved: number;
  suggestionsApplied: number;
}

export interface ExecutionRecord {
  jobId: string;
  jobName: string;
  duration: number;
  status: "success" | "failed" | "cancelled" | "running";
  timestamp: string;
  runId: string;
}
