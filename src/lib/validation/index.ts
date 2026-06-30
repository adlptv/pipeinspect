import { z } from "zod";

export const ciFormatSchema = z.enum([
  "github-actions",
  "gitlab-ci",
  "jenkinsfile",
  "circleci",
]);

export const parseRequestSchema = z.object({
  config: z.string().min(1, "Configuration text is required").max(500000, "Configuration too large"),
  format: ciFormatSchema.optional(),
});

export const analyzeRequestSchema = z.object({
  config: z.string().min(1, "Configuration text is required").max(500000, "Configuration too large"),
  format: ciFormatSchema.optional(),
});

export const compareRequestSchema = z.object({
  beforeConfig: z.string().min(1, "Before configuration is required").max(500000),
  afterConfig: z.string().min(1, "After configuration is required").max(500000),
  format: ciFormatSchema.optional(),
});

export const createAnalysisSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  format: ciFormatSchema,
  config: z.string().min(1).max(500000),
  parsedPipeline: z.string(),
  suggestions: z.string(),
  complexityScore: z.number().min(0).max(100),
});

export const exportBadgeSchema = z.object({
  label: z.string().default("pipeline"),
  value: z.string().default("analyzed"),
  color: z.enum(["blue", "green", "yellow", "orange", "red", "purple"]).default("blue"),
});

export type ParseRequest = z.infer<typeof parseRequestSchema>;
export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;
export type CompareRequest = z.infer<typeof compareRequestSchema>;
export type CreateAnalysisRequest = z.infer<typeof createAnalysisSchema>;
