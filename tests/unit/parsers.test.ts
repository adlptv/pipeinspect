import { describe, it, expect } from "vitest";
import { parseGitHubActions } from "@/lib/parsers/github-actions";
import { parseGitLabCI } from "@/lib/parsers/gitlab-ci";
import { parseJenkinsfile } from "@/lib/parsers/jenkinsfile";
import { parseCircleCI } from "@/lib/parsers/circleci";
import { parseCIConfig } from "@/lib/parsers";
import { detectCIFormat } from "@/lib/utils";

const GITHUB_ACTIONS_CONFIG = `
name: CI
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run build
  test:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm test
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - run: echo "deploy"
`;

const GITLAB_CONFIG = `
stages:
  - build
  - test
  - deploy

build_job:
  stage: build
  script:
    - npm ci
    - npm run build

test_job:
  stage: test
  script:
    - npm test

deploy_job:
  stage: deploy
  script:
    - echo "deploying"
`;

const JENKINSFILE_CONFIG = `
pipeline {
  agent any
  stages {
    stage('Build') {
      steps {
        sh 'npm ci'
        sh 'npm run build'
      }
    }
    stage('Test') {
      steps {
        sh 'npm test'
      }
    }
    stage('Deploy') {
      steps {
        sh 'echo deploying'
      }
    }
  }
}
`;

const CIRCLECI_CONFIG = `
version: 2.1
orbs:
  node: circleci/node@5.0.0
jobs:
  build:
    docker:
      - image: cimg/node:18.0
    steps:
      - checkout
      - run: npm ci
      - run: npm run build
  test:
    docker:
      - image: cimg/node:18.0
    steps:
      - checkout
      - run: npm test
workflows:
  default:
    jobs:
      - build
      - test:
          requires:
            - build
`;

describe("Parsers", () => {
  describe("detectCIFormat", () => {
    it("detects GitHub Actions", () => {
      expect(detectCIFormat(GITHUB_ACTIONS_CONFIG)).toBe("github-actions");
    });

    it("detects GitLab CI", () => {
      expect(detectCIFormat(GITLAB_CONFIG)).toBe("gitlab-ci");
    });

    it("detects Jenkinsfile", () => {
      expect(detectCIFormat(JENKINSFILE_CONFIG)).toBe("jenkinsfile");
    });

    it("detects CircleCI", () => {
      expect(detectCIFormat(CIRCLECI_CONFIG)).toBe("circleci");
    });

    it("defaults to github-actions for unknown", () => {
      expect(detectCIFormat("runs-on: ubuntu-latest")).toBe("github-actions");
    });
  });

  describe("parseGitHubActions", () => {
    it("parses jobs correctly", () => {
      const result = parseGitHubActions(GITHUB_ACTIONS_CONFIG);
      expect(result.format).toBe("github-actions");
      expect(result.jobs.length).toBe(3);
      expect(result.jobs[0].name).toBe("build");
      expect(result.jobs[1].name).toBe("test");
      expect(result.jobs[2].name).toBe("deploy");
    });

    it("detects dependencies", () => {
      const result = parseGitHubActions(GITHUB_ACTIONS_CONFIG);
      const testJob = result.jobs.find((j) => j.name === "test");
      expect(testJob?.dependencies).toContain("build");
    });

    it("extracts commands", () => {
      const result = parseGitHubActions(GITHUB_ACTIONS_CONFIG);
      const buildJob = result.jobs.find((j) => j.name === "build");
      expect(buildJob?.commands.length).toBeGreaterThan(0);
      expect(buildJob?.commands.some((c) => c.includes("npm"))).toBe(true);
    });

    it("creates DAG nodes", () => {
      const result = parseGitHubActions(GITHUB_ACTIONS_CONFIG);
      expect(result.dag.length).toBe(3);
      expect(result.edges.length).toBeGreaterThan(0);
    });

    it("computes metadata", () => {
      const result = parseGitHubActions(GITHUB_ACTIONS_CONFIG);
      expect(result.metadata.totalJobs).toBe(3);
      expect(result.metadata.totalStages).toBeGreaterThan(0);
      expect(result.metadata.maxParallelism).toBeGreaterThan(0);
    });
  });

  describe("parseGitLabCI", () => {
    it("parses stages and jobs", () => {
      const result = parseGitLabCI(GITLAB_CONFIG);
      expect(result.format).toBe("gitlab-ci");
      expect(result.jobs.length).toBe(3);
      expect(result.stages.length).toBe(3);
    });

    it("assigns jobs to stages", () => {
      const result = parseGitLabCI(GITLAB_CONFIG);
      const buildStage = result.stages.find((s) => s.name === "build");
      expect(buildStage?.jobs.length).toBe(1);
    });
  });

  describe("parseJenkinsfile", () => {
    it("parses declarative stages", () => {
      const result = parseJenkinsfile(JENKINSFILE_CONFIG);
      expect(result.format).toBe("jenkinsfile");
      expect(result.jobs.length).toBe(3);
    });

    it("creates sequential dependencies", () => {
      const result = parseJenkinsfile(JENKINSFILE_CONFIG);
      expect(result.jobs[1].dependencies).toContain("Build");
      expect(result.jobs[2].dependencies).toContain("Test");
    });
  });

  describe("parseCircleCI", () => {
    it("parses workflow jobs", () => {
      const result = parseCircleCI(CIRCLECI_CONFIG);
      expect(result.format).toBe("circleci");
      expect(result.jobs.length).toBe(2);
      expect(result.jobs[0].name).toBe("build");
      expect(result.jobs[1].name).toBe("test");
    });

    it("resolves requires as dependencies", () => {
      const result = parseCircleCI(CIRCLECI_CONFIG);
      const testJob = result.jobs.find((j) => j.name === "test");
      expect(testJob?.dependencies).toContain("build");
    });
  });

  describe("parseCIConfig (dispatcher)", () => {
    it("dispatches to correct parser", () => {
      const gh = parseCIConfig(GITHUB_ACTIONS_CONFIG);
      expect(gh.format).toBe("github-actions");

      const gl = parseCIConfig(GITLAB_CONFIG);
      expect(gl.format).toBe("gitlab-ci");

      const jk = parseCIConfig(JENKINSFILE_CONFIG);
      expect(jk.format).toBe("jenkinsfile");

      const cc = parseCIConfig(CIRCLECI_CONFIG);
      expect(cc.format).toBe("circleci");
    });

    it("throws on empty input", () => {
      expect(() => parseCIConfig("")).toThrow();
    });
  });
});
