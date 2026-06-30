import { NextRequest, NextResponse } from "next/server";
import { parseCIConfig } from "@/lib/parsers";
import { analyzePipeline } from "@/lib/analyzers";
import { detectCIFormat } from "@/lib/utils";
import { compareRequestSchema } from "@/lib/validation";
import type { ComparisonResult } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = compareRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation error",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { beforeConfig, afterConfig, format } = parsed.data;

    const beforeFormat = format || detectCIFormat(beforeConfig);
    const afterFormat = format || detectCIFormat(afterConfig);

    const beforePipeline = parseCIConfig(beforeConfig, beforeFormat);
    const afterPipeline = parseCIConfig(afterConfig, afterFormat);

    const beforeAnalysis = analyzePipeline(beforePipeline);
    const afterAnalysis = analyzePipeline(afterPipeline);

    const result: ComparisonResult = {
      before: beforeAnalysis,
      after: afterAnalysis,
      timeSaved: beforeAnalysis.totalDuration - afterAnalysis.totalDuration,
      costSaved: beforeAnalysis.costEstimate.totalCost - afterAnalysis.costEstimate.totalCost,
      suggestionsApplied: beforeAnalysis.suggestions.length - afterAnalysis.suggestions.length,
    };

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to compare pipelines" },
      { status: 500 }
    );
  }
}
