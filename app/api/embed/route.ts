import { NextResponse } from "next/server";
import { generateResponse } from "@/app/actions/message";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { message, history, userid } = await req.json();

    if (!message) {
      return NextResponse.json(
        { success: false, error: "Message is required" },
        { status: 400 },
      );
    }

    // ✅ Check userid from request body instead of Clerk
    if (!userid) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 },
      );
    }

    const namespace = userid; // Use userid from widget
    const sessionId = `embed-${Date.now()}`;

    console.log("📞 Embed chat request:", {
      question: message.substring(0, 50),
      namespace,
    });

    const result = await generateResponse(message, {
      evalMode: false,
      namespace: namespace,
      sessionId: sessionId,
      chatHistory: history || [],
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        answer: result.answer,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Embed chat API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Enable CORS for embedding on other websites
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
