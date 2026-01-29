import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("[External API] Received word learning request:", {
      word: body.word,
      child_id: body.child_id,
      source: body.source,
    });

    // Forward request directly to backend
    const backendUrl = `${API_URL}/api/v1/vocabulary/external/word-learned`;
    console.log("[External API] Forwarding to backend:", backendUrl);

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
      console.error("[External API] Backend error:", {
        status: response.status,
        error,
      });
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    console.log("[External API] Success:", data);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[External API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error", detail: error.message },
      { status: 500 },
    );
  }
}
