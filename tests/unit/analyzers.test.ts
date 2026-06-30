import { describe, it, expect } from "vitest";
import { parseGitHubActions } from "@/lib/parsers/github-actions";
import {
  findCriticalPath,
  findBottlenecks,
  generateSuggestions,
  calculateCostEstimate,
  calculateComplexityScore,
  calculateTotalDuration,
  calculateParallelizedDuration,
  analyzePipeline,
} from "@/lib/analyzers";

const SAMPLE_CONFIG = `
name: CI
on:
  push:
    branches: [main]
jobs:
  install:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run lint
  build:
    needs: install
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run build
  test-unit:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run test:unit
  test-e2e:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run test:e2e
  deploy:
    needs: [test-unit, test-e2e]
    runs-on: ubuntu-latest
    steps:
      - run: echo "deploying"
`;

const pipeline = parseGitHubActions(SAMPLE_CONFIG);

describe("Analyzers", () => {
  describe("findCriticalPath", () => {
    it("finds a non-empty critical path", () => {
      const path = findCriticalPath(pipeline);
      expect(path.length).toBeGreaterThan(0);
    });

    it("includes jobs from start to end", () => {
      const path = findCriticalPath(pipeline);
      const jobMap = new Map(pipeline.jobs.map((j) => [j.id, j]));
      const firstJob = jobMap.get(path[0]);
      const lastJob = jobMap.get(path[path.length - 1]);
      expect(firstJob?.dependencies.length).toBe(0);
    });
  });

  describe("findBottlenecks", () => {
    it("returns at least one bottleneck for non-trivial pipelines", () => {
      const bottlenecks = findBottlenecks(pipeline);
      expect(bottlenecks.length).toBeGreaterThan(0);
    });

    it("bottleneck IDs exist in pipeline", () => {
      const bottlenecks = findBottlenecks(pipeline);
      const jobIds = new Set(pipeline.jobs.map((j) => j.id));
      bottlenecks.forEach((id) => {
        expect(jobIds.has(id)).toBe(true);
      });
    });
  });

  describe("generateSuggestions", () => {
    it("generates suggestions for the sample pipeline", () => {
      const suggestions = generateSuggestions(pipeline);
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it("suggestions have valid structure", () => {
      const suggestions = generateSuggestions(pipeline);
      suggestions.forEach((s) => {
        expect(s.id).toBeDefined();
        expect(s.type).toBeDefined();
        expect(s.severity).toBeDefined();
        expect(s.title).toBeDefined();
        expect(s.description).toBeDefined();
        expect(s.affectedJobs).toBeInstanceOf(Array);
        expect(typeof s.estimatedTimeSaved).toBe("number");
        expect(typeof s.estimatedCostSaved).toBe("number");
      });
    });

    it("detects caching opportunities for npm install jobs", () => {
      const suggestions = generateSuggestions(pipeline);
      const cacheSuggestions = suggestions.filter((s) => s.type === "caching");
      expect(cacheSuggestions.length).toBeGreaterThan(0);
    });
  });

  describe("calculateCostEstimate", () => {
    it("calculates total cost correctly", () => {
      const cost = calculateCostEstimate(pipeline);
      expect(cost.runnerMinutes).toBeGreaterThan(0);
      expect(cost.totalCost).toBeGreaterThan(0);
      expect(cost.totalCost).toBeCloseTo(cost.runnerMinutes * cost.costPerMinute, 5);
      expect(cost.breakdown.length).toBe(pipeline.jobs.length);
    });

    it("uses USD by default", () => {
      const cost = calculateCostEstimate(pipeline);
      expect(cost.currency).toBe("USD");
    });
  });

  describe("calculateComplexityScore", () => {
    it("returns a score between 0 and 100", () => {
      const score = calculateComplexityScore(pipeline);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it("higher for more complex pipelines", () => {
      const score = calculateComplexityScore(pipeline);
      const simpleConfig = `
name: CI
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: echo "hello"
`;
      const simplePipeline = parseGitHubActions(simpleConfig);
      const simpleScore = calculateComplexityScore(simplePipeline);
      expect(score).toBeGreaterThan(simpleScore);
    });
  });

  describe("calculateTotalDuration", () => {
    it("returns positive duration", () => {
      const duration = calculateTotalDuration(pipeline);
      expect(duration).toBeGreaterThan(0);
    });
  });

  describe("calculateParallelizedDuration", () => {
    it("returns positive duration", () => {
      const duration = calculateParallelizedDuration(pipeline);
      expect(duration).toBeGreaterThan(0);
    });

    it("is less than or equal to total duration", () => {
      const total = calculateTotalDuration(pipeline);
      const parallel = calculateParallelizedDuration(pipeline);
      expect(parallel).toBeLessThanOrEqual(total);
    });
  });

  describe("analyzePipeline (full)", () => {
    it("returns a complete analysis result", () => {
      const result = analyzePipeline(pipeline);
      expect(result.pipeline).toBeDefined();
      expect(result.suggestions).toBeInstanceOf(Array);
      expect(result.criticalPath).toBeInstanceOf(Array);
      expect(result.totalDuration).toBeGreaterThan(0);
      expect(result.parallelizedDuration).toBeGreaterThan(0);
      expect(result.complexityScore).toBeGreaterThanOrEqual(0);
      expect(result.costEstimate).toBeDefined();
    });

    it("marks critical path nodes in DAG", () => {
      const result = analyzePipeline(pipeline);
      const criticalNodes = result.pipeline.dag.filter((n) => n.isCriticalPath);
      expect(criticalNodes.length).toBeGreaterThan(0);
    });

    it("marks bottleneck nodes in DAG", () => {
      const result = analyzePipeline(pipeline);
      const bottleneckNodes = result.pipeline.dag.filter((n) => n.isBottleneck);
      expect(bottleneckNodes.length).toBeGreaterThan(0);
    });
  });
});
