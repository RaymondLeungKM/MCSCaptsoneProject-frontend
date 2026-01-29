import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("[Word Learning API] Received request:", {
      word: body.word,
      child_id: body.child_id,
      source: body.source,
    });

    // Forward request directly to backend
    const backendUrl = `${API_URL}/api/v1/vocabulary/external/word-learned`;
    console.log("[Word Learning API] Forwarding to:", backendUrl);

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
      console.error("[Word Learning API] Backend error:", {
        status: response.status,
        error,
      });
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    console.log("[Word Learning API] Success:", data);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[Word Learning API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error", detail: error.message },
      { status: 500 },
    );
  }
}
