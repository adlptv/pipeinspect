import type { ParsedPipeline, CIFormat } from "@/lib/types";
import { detectCIFormat } from "@/lib/utils";
import { parseGitHubActions } from "./github-actions";
import { parseGitLabCI } from "./gitlab-ci";
import { parseJenkinsfile } from "./jenkinsfile";
import { parseCircleCI } from "./circleci";

export function parseCIConfig(config: string, format?: CIFormat): ParsedPipeline {
  const detectedFormat = format || detectCIFormat(config);

  switch (detectedFormat) {
    case "github-actions":
      return parseGitHubActions(config);
    case "gitlab-ci":
      return parseGitLabCI(config);
    case "jenkinsfile":
      return parseJenkinsfile(config);
    case "circleci":
      return parseCircleCI(config);
    default:
      throw new Error(`Unsupported CI format: ${detectedFormat}`);
  }
}

export { parseGitHubActions, parseGitLabCI, parseJenkinsfile, parseCircleCI };
