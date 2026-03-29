import { generateResponseStream } from "@/app/actions/cerebras_stream";
import { getPineconeVectorStore } from "@/lib/vectorStore";

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

    if (warmup === true) {
      if (chatbot && chatbot.namespace) {
        console.log(`🔥 Blocking Warmup for: ${chatbot.namespace}`);

        // ✅ AWAIT BOTH to guarantee readiness
        await Promise.allSettled([
          // 1. Warmup Vector Store (Critical)
          getPineconeVectorStore(chatbot.namespace),

          // 2. Warmup LLM (Critical)
          generateResponseStream("hi", {
            chatbot,
            chatHistory: [],
            sessionId: "warmup",
          }),
        ]);

        console.log("✅ Warmup Complete");
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

    // ✅ DOMAIN WHITELISTING SECURITY CHECK
    if (chatbot.isDomainWhitelistingEnabled && chatbot.allowedDomains?.length > 0) {
       const referer = req.headers.get("referer");
       const origin = req.headers.get("origin");
       const currentHost = referer || origin || "";
       
       // Allow Localhost for development
       if (!currentHost.includes("localhost") && !currentHost.includes("127.0.0.1")) {
         const isAllowed = chatbot.allowedDomains.some((domain: string) => 
            currentHost.toLowerCase().includes(domain.toLowerCase())
         );

         if (!isAllowed) {
            console.warn(`🛑 Blocked unauthorized embed request from: ${currentHost}`);
            return Response.json(
              { error: "This domain is not authorized to use this chatbot." },
              { status: 403, headers: corsHeaders }
            );
         }
       }
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
