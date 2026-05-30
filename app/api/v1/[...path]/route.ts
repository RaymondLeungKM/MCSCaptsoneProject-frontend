/**
 * Catch-all proxy route: /api/v1/* → http://localhost:8000/api/v1/*
 *
 * Runs server-side inside Next.js so the browser never makes a cross-origin
 * request — eliminating CORS entirely.  Works with Turbopack dev server.
 */
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const BACKEND_URL =
  process.env.BACKEND_URL || "http://localhost:8000";

// Headers that should not be forwarded upstream
const SKIP_REQUEST_HEADERS = new Set([
  "host",
  "connection",
  "keep-alive",
  "proxy-connection",
  "transfer-encoding",
  "upgrade",
  "te",
]);

// Headers that Next.js manages itself — strip from upstream response
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
  const backendUrl = `${BACKEND_URL}/api/v1/${pathStr}${search}`;

  // Forward relevant request headers
  const forwardHeaders = new Headers();
  request.headers.forEach((value, key) => {
    if (!SKIP_REQUEST_HEADERS.has(key.toLowerCase())) {
      forwardHeaders.set(key, value);
    }
  });

  // Read body for non-GET/HEAD requests
  let bodyInit: BodyInit | undefined;
  if (request.method !== "GET" && request.method !== "HEAD") {
    const buf = await request.arrayBuffer();
    if (buf.byteLength > 0) bodyInit = buf;
  }

  try {
    const upstream = await fetch(backendUrl, {
      method: request.method,
      headers: forwardHeaders,
      body: bodyInit,
      // Follow redirects server-side (e.g. FastAPI trailing-slash redirect)
      redirect: "follow",
    });

    // Build response headers, stripping ones Next.js manages
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
      { detail: "Backend unavailable. Ensure the backend server is running on port 8000." },
      { status: 503 },
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
