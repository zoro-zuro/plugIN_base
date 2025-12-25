import { NextResponse } from "next/server";
import { generateResponse } from "@/app/actions/message";
import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

// ✅ Use nodejs runtime (Edge doesn't support Pinecone/LangChain)
export const runtime = "nodejs";

// ✅ Force dynamic to prevent caching
export const dynamic = "force-dynamic";

// ✅ Increase timeout for serverless function (Vercel default is 10s)
export const maxDuration = 30; // 30 seconds

export async function POST(req: Request) {
  try {
    const { message, history, chatbot } = await req.json();

    if (!message) {
      return NextResponse.json(
        { success: false, error: "Message is required" },
        { status: 400 },
      );
    }

    if (!chatbot) {
      return NextResponse.json(
        { success: false, error: "Chatbot data is required" },
        { status: 400 },
      );
    }

    if (!chatbot.namespace) {
      return NextResponse.json(
        { success: false, error: "Namespace is required" },
        { status: 400 },
      );
    }

    const sessionId = `embed-${chatbot.chatbotId}-${Date.now()}`;

    console.log("📞 Embed chat request:", {
      question: message.substring(0, 50),
      chatbotId: chatbot.chatbotId,
      namespace: chatbot.namespace,
    });

    // ✅ Track activity (non-blocking)
    // fetchMutation(api.documents.updateLastActive, {
    //   chatbotId: chatbot.chatbotId,
    // }).catch((err) => console.warn("Activity tracking failed:", err));

    // ✅ Generate response
    const result = await generateResponse(message, {
      evalMode: false,
      chatbot,
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
