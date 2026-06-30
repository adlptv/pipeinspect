import { NextRequest, NextResponse } from "next/server";
import { exportBadgeSchema } from "@/lib/validation";

const COLOR_MAP: Record<string, string> = {
  blue: "0066cc",
  green: "4c1",
  yellow: "dfb317",
  orange: "fe7d37",
  red: "e05d44",
  purple: "8957e5",
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const params = {
      label: searchParams.get("label") || "pipeline",
      value: searchParams.get("value") || "analyzed",
      color: (searchParams.get("color") || "blue") as keyof typeof COLOR_MAP,
    };

    const parsed = exportBadgeSchema.safeParse(params);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid badge parameters" },
        { status: 400 }
      );
    }

    const { label, value, color } = parsed.data;
    const colorHex = COLOR_MAP[color] || COLOR_MAP.blue;

    // Generate shields.io style SVG badge
    const labelWidth = label.length * 6.5 + 10;
    const valueWidth = value.length * 6.5 + 10;
    const totalWidth = labelWidth + valueWidth;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20">
  <linearGradient id="b" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <mask id="a">
    <rect width="${totalWidth}" height="20" rx="3" fill="#fff"/>
  </mask>
  <g mask="url(#a)">
    <path fill="#333" d="M0 0h${labelWidth}v20H0z"/>
    <path fill="#${colorHex}" d="M${labelWidth} 0h${valueWidth}v20H${labelWidth}z"/>
    <path fill="url(#b)" d="M0 0h${totalWidth}v20H0z"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,DejaVu Sans,sans-serif" font-size="11">
    <text x="${labelWidth / 2}" y="14">${escapeXml(label)}</text>
    <text x="${labelWidth + valueWidth / 2}" y="14">${escapeXml(value)}</text>
  </g>
</svg>`;

    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to generate badge" },
      { status: 500 }
    );
  }
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
