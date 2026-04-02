import { generateResponseStream } from "@/app/actions/cerebras_stream";
import { getPineconeVectorStore } from "@/lib/vectorStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// 🛠️ DYNAMIC CORS & SECURITY HEADERS
const getCorsHeaders = (origin: string | null) => {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
};

export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  const currentHeaders = getCorsHeaders(origin);

  try {
    const text = await req.text();
    if (!text) {
      return Response.json({ error: "Empty request body" }, { status: 400, headers: currentHeaders });
    }
    const { message, history, chatbot, warmup, sessionId } = JSON.parse(text);

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
        headers: { ...currentHeaders },
      });
    }

    if (!message || !chatbot || !chatbot.namespace) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400, headers: currentHeaders },
      );
    }

    // ✅ DOMAIN WHITELISTING SECURITY CHECK
    if (chatbot.isDomainWhitelistingEnabled && chatbot.allowedDomains?.length > 0) {
       const referer = req.headers.get("referer");
       const currentHost = (referer || origin || "").toLowerCase();
       
       // ⚡️ CONFIGURABLE INTERNAL BYPASS: (Defaults to official prod + localhost)
       const bypassConfig = process.env.INTERNAL_BYPASS_URLS || "plug-in-base.vercel.app,localhost,127.0.0.1";
       const bypassDomains = bypassConfig.split(",").map(d => d.trim().toLowerCase());
       
       const isInternal = bypassDomains.some(domain => currentHost.includes(domain));

       if (!isInternal) {
         const isAllowed = chatbot.allowedDomains.some((domain: string) => 
            currentHost.toLowerCase().includes(domain.toLowerCase())
         );

         if (!isAllowed) {
            console.warn(`🛑 Blocked unauthorized embed request from: ${currentHost}`);
            return Response.json(
              { error: "This domain is not authorized to use this chatbot." },
              { status: 403, headers: currentHeaders }
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
        ...currentHeaders,
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Embed API error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500, headers: currentHeaders },
    );
  }
}

// ✅ Handle CORS Preflight
export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin");
  return new Response(null, {
    status: 200,
    headers: getCorsHeaders(origin),
  });
}
