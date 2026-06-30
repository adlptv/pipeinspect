import { NextRequest, NextResponse } from "next/server";
import { prisma, createAnalysis, listAnalyses } from "@/lib/db";
import { createAnalysisSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const analyses = await listAnalyses(
      Math.min(limit, 100),
      Math.max(offset, 0)
    );

    return NextResponse.json({
      analyses: analyses.map((a) => ({
        id: a.id,
        name: a.name,
        format: a.format,
        complexityScore: a.complexityScore,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
      })),
      total: analyses.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to list analyses" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createAnalysisSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation error",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const analysis = await createAnalysis(parsed.data);

    return NextResponse.json(
      {
        id: analysis.id,
        name: analysis.name,
        format: analysis.format,
        complexityScore: analysis.complexityScore,
        createdAt: analysis.createdAt,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create analysis" },
      { status: 500 }
    );
  }
}
