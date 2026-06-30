import { NextRequest, NextResponse } from "next/server";
import { parseCIConfig } from "@/lib/parsers";
import { analyzePipeline } from "@/lib/analyzers";
import { detectCIFormat } from "@/lib/utils";
import { analyzeRequestSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = analyzeRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation error",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { config, format } = parsed.data;
    const detectedFormat = format || detectCIFormat(config);

    const pipeline = parseCIConfig(config, detectedFormat);
    const result = analyzePipeline(pipeline);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to analyze pipeline" },
      { status: 500 }
    );
  }
}
