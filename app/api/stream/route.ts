import { generateResponseStream } from "@/app/actions/cerebras_stream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Helper for CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function POST(req: Request) {
  try {
    const { message, history, chatbot, warmup, sessionId } = await req.json();

    // ✅ WARMUP: Fast path to wake up the Lambda/Model
    if (warmup === true) {
      if (chatbot) {
        // Fire and forget a trivial request to warm connections
        generateResponseStream("hi", {
          chatbot,
          chatHistory: [],
          sessionId: "warmup",
        }).catch((e) => console.log("Warmup error (ignored)", e));
      }
      return new Response("ok", {
        status: 200,
        headers: { ...corsHeaders },
      });
    }

    if (!message || !chatbot || !chatbot.namespace) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400, headers: corsHeaders },
      );
    }

    console.log(
      `📞 Embed Stream: "${message.substring(0, 20)}..." (${chatbot.chatbotId})`,
    );

    // ✅ Generate Stream
    const stream = await generateResponseStream(message, {
      chatbot,
      sessionId, // Pass session ID for server-side logging/tracking if needed
      chatHistory: history || [],
      evalMode: false,
    });

    return new Response(stream, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Embed API error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders },
    );
  }
}

// ✅ Handle CORS Preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}
