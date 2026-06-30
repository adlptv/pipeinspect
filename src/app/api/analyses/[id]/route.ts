import { NextRequest, NextResponse } from "next/server";
import { prisma, getAnalysis, deleteAnalysis } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const analysis = await getAnalysis(params.id);

    if (!analysis) {
      return NextResponse.json(
        { error: "Analysis not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: analysis.id,
      name: analysis.name,
      format: analysis.format,
      config: analysis.config,
      parsedPipeline: JSON.parse(analysis.parsedPipeline),
      suggestions: JSON.parse(analysis.suggestions),
      complexityScore: analysis.complexityScore,
      createdAt: analysis.createdAt,
      updatedAt: analysis.updatedAt,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch analysis" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existing = await getAnalysis(params.id);
    if (!existing) {
      return NextResponse.json(
        { error: "Analysis not found" },
        { status: 404 }
      );
    }

    await deleteAnalysis(params.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete analysis" },
      { status: 500 }
    );
  }
}
