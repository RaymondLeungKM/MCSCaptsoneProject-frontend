/**
 * Catch-all asset proxy route: /uploads/* -> http://localhost:8000/uploads/*
 *
 * This keeps browser asset requests same-origin even when API calls go through
 * the Next.js proxy at /api/v1.
 */
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

const SKIP_REQUEST_HEADERS = new Set([
  "host",
  "connection",
  "keep-alive",
  "proxy-connection",
  "transfer-encoding",
  "upgrade",
  "te",
]);

const SKIP_RESPONSE_HEADERS = new Set([
  "content-encoding",
  "transfer-encoding",
  "connection",
  "keep-alive",
]);

async function proxy(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const pathStr = path.join("/");
  const { search } = new URL(request.url);
  const backendUrl = `${BACKEND_URL}/uploads/${pathStr}${search}`;

  const forwardHeaders = new Headers();
  request.headers.forEach((value, key) => {
    if (!SKIP_REQUEST_HEADERS.has(key.toLowerCase())) {
      forwardHeaders.set(key, value);
    }
  });

  try {
    const upstream = await fetch(backendUrl, {
      method: request.method,
      headers: forwardHeaders,
      redirect: "follow",
    });

    const responseHeaders = new Headers();
    upstream.headers.forEach((value, key) => {
      if (!SKIP_RESPONSE_HEADERS.has(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    });

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch {
    return NextResponse.json(
      {
        detail:
          "Backend unavailable. Ensure the backend server is running on port 8000.",
      },
      { status: 503 },
    );
  }
}

export const GET = proxy;
export const HEAD = proxy;