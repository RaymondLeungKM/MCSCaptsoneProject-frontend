import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("[API Route] Received external word learning request:", {
      word: body.word,
      child_id: body.child_id,
      source: body.source,
    });

    // For external word learning (mobile app integration), we don't require
    // web session authentication. The backend will validate the child_id exists.
    // In production, mobile apps should use API keys or OAuth tokens.

    // Forward request directly to backend
    const backendUrl = `${API_URL}/api/v1/vocabulary/external/word-learned`;
    console.log("[API Route] Forwarding to backend:", backendUrl);

    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: "Unknown error" }));
      console.error("[API Route] Backend error:", {
        status: response.status,
        error,
      });
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    console.log("[API Route] Success:", data);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[API Route] Error recording external word learning:", error);
    return NextResponse.json(
      { error: "Internal server error", detail: error.message },
      { status: 500 },
    );
  }
}
