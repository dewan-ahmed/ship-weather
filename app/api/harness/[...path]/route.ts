import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOST = /(^|\.)harness\.io$/i;

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path } = await context.params;
    const baseHeader = (request.headers.get("x-harness-url") || "https://app.harness.io")
      .trim()
      .replace(/\/$/, "");
    const baseUrl = new URL(baseHeader);
    if (baseUrl.protocol !== "https:" || !ALLOWED_HOST.test(baseUrl.hostname)) {
      return NextResponse.json(
        { message: "Base URL must be an https://*.harness.io host." },
        { status: 400 },
      );
    }

    const apiKey = request.headers.get("x-api-key") || "";
    if (!apiKey) {
      return NextResponse.json({ message: "Missing PAT (x-api-key)." }, { status: 401 });
    }

    const search = request.nextUrl.search;
    const upstreamPath = `/${path.join("/")}${search}`;
    const body = await request.text();
    const upstream = await fetch(`${baseUrl.origin}${upstreamPath}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
      },
      body: body || undefined,
    });

    const text = await upstream.text();
    return new NextResponse(text, {
      status: upstream.status,
      headers: {
        "content-type": upstream.headers.get("content-type") || "application/json",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Proxy failed talking to Harness.",
      },
      { status: 502 },
    );
  }
}
