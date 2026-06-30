import { NextRequest, NextResponse } from "next/server";
import { parseCIConfig } from "@/lib/parsers";
import { detectCIFormat } from "@/lib/utils";
import { parseRequestSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = parseRequestSchema.safeParse(body);

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

    const result = parseCIConfig(config, detectedFormat);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to parse CI configuration" },
      { status: 500 }
    );
  }
}
