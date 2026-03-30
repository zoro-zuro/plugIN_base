"use client";

import { useState, useRef, useEffect, use } from "react";
import { FiSend, FiLoader, FiThumbsUp, FiThumbsDown } from "react-icons/fi";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { Zap } from "lucide-react";
import { flushSync } from "react-dom";
import { StepProgress } from "@/components/ui/StepProgress";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  messageId?: string | null;
  feedback?: "positive" | "negative" | null;
  isStreaming?: boolean;
  latencyMs?: number;
};

type StepStatus = "pending" | "active" | "complete" | "error";

export default function EmbedChatWidget({
  params,
}: {
  params: Promise<{ chatbotId: string }>;
}) {
  const { chatbotId } = use(params);
  const chatbot = useQuery(api.documents.getChatbotById, {
    chatbotId: chatbotId,
  });

  const trackSession = useMutation(api.analytics.startChatSession);
  const trackMessage = useMutation(api.analytics.trackMessage);
  const addFeedback = useMutation(api.analytics.addMessageFeedback);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingSteps, setStreamingSteps] = useState<
    Record<string, StepStatus>
  >({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const welcomeInitialized = useRef(false);
  const sessionIdRef = useRef<string | null>(null);

  // Streaming refs
  const streamTextRef = useRef("");
  const streamRafRef = useRef<number | null>(null);
  const streamIdRef = useRef<string | null>(null);

  // 1. Domain Guard System: Zero-Flash Architecture
  const [authStatus, setAuthStatus] = useState<"pending" | "authorized" | "unauthorized">("pending");

  useEffect(() => {
    if (!chatbot) return;

    if (!chatbot.isDomainWhitelistingEnabled) {
      setAuthStatus("authorized");
      return;
    }

    // Enforcement Logic
    try {
      const parentUrl = document.referrer;
      const currentOrigin = window.location.origin;

      // ⚡️ INTERNAL BYPASS: Always authorize if we are on our own domain (plug-in-base.vercel.app)
      const isInternalSite = 
          currentOrigin.includes("localhost") || 
          currentOrigin.includes("127.0.0.1") || 
          currentOrigin.includes("plug-in-base.vercel.app");

      // Case 1: In an iframe where parent is us (Dashboard/Playground)
      if (parentUrl) {
         try {
            const parentOrigin = new URL(parentUrl).origin;
            if (parentOrigin === currentOrigin || parentOrigin.includes("plug-in-base.vercel.app")) {
               setAuthStatus("authorized");
               return;
            }
         } catch { /* Silent fail */ }
      } else if (isInternalSite) {
          // Direct hit to our site (not in an iframe)
          setAuthStatus("authorized");
          return;
      }

      // If no parent URL and we're strictly enforced, it's unauthorized
      if (!parentUrl) {
        setAuthStatus("unauthorized");
        return;
      }

      const parentOrigin = new URL(parentUrl).origin;
      const registry = chatbot.allowedDomains || [];

      if (registry.length === 0) {
        setAuthStatus("unauthorized");
        return;
      }

      const isWhitelisted = registry.some(domain => {
        const d = domain.trim().replace(/\/$/, ""); 
        const normalizedDomain = d.startsWith("http") ? d : `https://${d}`;
        try {
          const allowedOrigin = new URL(normalizedDomain).origin;
          return allowedOrigin === parentOrigin;
        } catch {
          return domain === parentOrigin || parentOrigin.includes(domain);
        }
      });

      setAuthStatus(isWhitelisted ? "authorized" : "unauthorized");
    } catch (e) {
      setAuthStatus("unauthorized");
    }
  }, [chatbot]);

  // 1. Initialize & Warmup (Optimized: Fire-Once Logic)
  useEffect(() => {
    // Only proceed if authorized
    if (chatbot && !welcomeInitialized.current && authStatus === "authorized") {
      welcomeInitialized.current = true; // Mark as done immediately

      // Set Welcome Message
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: chatbot.welcomeMessage || "Hi! How can I help you today?",
          feedback: null, 
        },
      ]);

      // ✅ FIRE WARMUP
      console.log("🔥 Firing Warmup Request");
      fetch("/api/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          warmup: true,
          chatbot: chatbot,
        }),
      })
        .then(() => console.log("Warmup signal sent"))
        .catch((err) => console.log("Warmup failed silently", err));
    }
  }, [chatbot, authStatus]);

  // 2. Geolocation & Session Tracking
  useEffect(() => {
    if (chatbot && !sessionIdRef.current) {
      sessionIdRef.current = `session-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`;

      const getGeolocation = async () => {
        const apis = [
          "https://ipapi.co/json/",
          "https://ip-api.com/json/",
          "https://freeipapi.com/api/json",
        ];

        try {
          // ✅ Optimization: Race the APIs to get the fastest valid response
          const fastestData = await Promise.any(
            apis.map(url => 
              fetch(url, { signal: AbortSignal.timeout(3000) })
                .then(async res => {
                  if (!res.ok) throw new Error();
                  const text = await res.text();
                  if (!text || text.trim().length === 0) throw new Error("Empty body");
                  const data = JSON.parse(text);
                  
                  // ⚡️ SILENT FAILURE CHECK: Some APIs (like ip-api) return 200 with a "fail" status JSON
                  if (data && (data.status === "fail" || data.error === true)) {
                    throw new Error("API Limit or SSL Error");
                  }
                  
                  return data;
                })
            )
          );

          let country = "Unknown";
          let city = "Unknown";

          if (fastestData.country_name) {
            country = fastestData.country_name;
            city = fastestData.city || "Unknown";
          } else if (fastestData.country) {
            country = fastestData.country;
            city = fastestData.city || "Unknown";
          } else if (fastestData.countryName) {
            country = fastestData.countryName;
            city = fastestData.cityName || "Unknown";
          }

          await trackSession({
            chatbotId: chatbot.chatbotId,
            namespace: chatbot.namespace,
            sessionId: sessionIdRef.current!,
            userCountry: country,
            userCity: city,
          });
        } catch (error) {
          // Final Fallback
          await trackSession({
            chatbotId: chatbot.chatbotId,
            namespace: chatbot.namespace,
            sessionId: sessionIdRef.current!,
            userCountry: "Unknown",
            userCity: "Unknown",
          });
        }
      };

      getGeolocation().catch((error) => {
        console.error("Session tracking failed:", error);
      });
    }
  }, [chatbot, trackSession]);

  // Scroll to bottom on message/step change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingSteps]);

  const handleFeedback = async (
    messageIndex: number,
    feedbackType: "positive" | "negative",
  ) => {
    const message = messages[messageIndex];

    if (!message.messageId || message.feedback) return;

    try {
      setMessages((prev) =>
        prev.map((msg, idx) =>
          idx === messageIndex ? { ...msg, feedback: feedbackType } : msg,
        ),
      );

      await addFeedback({
        messageId: message.messageId as any,
        feedback: feedbackType,
      });
    } catch (error) {
      console.error("Feedback error:", error);
      setMessages((prev) =>
        prev.map((msg, idx) =>
          idx === messageIndex ? { ...msg, feedback: null } : msg,
        ),
      );
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !chatbot || !sessionIdRef.current) return;

    const currentInput = input.trim();
    const userMsgId = `user-${Date.now()}`;
    const streamId = `assistant-${Date.now()}`;

    // UI Updates
    setInput("");
    setIsLoading(true);
    setStreamingSteps({});
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: "user", content: currentInput },
    ]);

    // Reset Stream Refs
    streamTextRef.current = "";
    streamIdRef.current = streamId;
    if (streamRafRef.current) cancelAnimationFrame(streamRafRef.current);
    streamRafRef.current = null;

    const startTime = Date.now();

    try {
      // 1. Track User Message (Async)
      trackMessage({
        chatbotId: chatbot.chatbotId,
        namespace: chatbot.namespace,
        sessionId: sessionIdRef.current,
        role: "user",
        content: currentInput,
      });

      // 2. Start Request
      const response = await fetch("/api/stream/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: currentInput,
          history: messages
            .slice(-5)
            .map((m) => ({ role: m.role, content: m.content })),
          chatbot: chatbot,
          sessionId: sessionIdRef.current,
        }),
      });

      if (!response.ok) throw new Error("Network response was not ok");
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let streamingMessageAdded = false;

      // RAF Loop for smooth text rendering
      const scheduleRafUpdate = () => {
        if (streamRafRef.current) return;
        streamRafRef.current = requestAnimationFrame(() => {
          streamRafRef.current = null;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === streamId ? { ...m, content: streamTextRef.current } : m,
            ),
          );
        });
      };

      // 3. Read Stream
      let leftover = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const allContent = leftover + chunk;
        const parts = allContent.split(/(__PROGRESS__.*?__END__\n)/);
        
        // Only buffer if the last part looks like an incomplete signal
        if (parts[parts.length - 1].includes("__PROGRESS__")) {
          leftover = parts.pop() || "";
        } else {
          leftover = "";
        }

        for (const part of parts) {
          if (!part) continue;

          // Handle Progress Steps
          if (part.startsWith("__PROGRESS__")) {
            const match = part.match(/__PROGRESS__(.+?)__END__/);
            if (match) {
              try {
                const data = JSON.parse(match[1]);
                setStreamingSteps((prev) => ({
                  ...prev,
                  [data.step]: data.status,
                }));
              } catch (e) {
                console.error("Signal parse fail:", e);
              }
            }
            continue;
          }

          // Handle Text Content
          streamTextRef.current += part;

          if (!streamingMessageAdded) {
            // FIRST CHUNK: Flush sync to replace steps with text bubble instantly
            flushSync(() => {
              setMessages((prev) => [
                ...prev,
                {
                  id: streamId,
                  role: "assistant",
                  content: streamTextRef.current,
                  isStreaming: true,
                },
              ]);
              setStreamingSteps({}); // Clear steps immediately
            });
            streamingMessageAdded = true;
          } else {
            scheduleRafUpdate();
          }
        }
      }

      // Handle any leftover text after the stream ends
      if (leftover && !leftover.includes("__PROGRESS__")) {
        streamTextRef.current += leftover;
        flushSync(() => {
          setMessages((prev) =>
            prev.map((m) => (m.id === streamId ? { ...m, content: streamTextRef.current } : m)),
          );
        });
      }

      // 4. Finalize
      if (streamRafRef.current) cancelAnimationFrame(streamRafRef.current);

      const finalContent = streamTextRef.current;
      const totalTime = Date.now() - startTime;

      // Ensure final text is set and streaming is off (Triggers Shimmer effect end)
      flushSync(() => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === streamId
              ? {
                  ...m,
                  content: finalContent,
                  isStreaming: false,
                  latencyMs: totalTime,
                }
              : m,
          ),
        );
      });

      // 5. Track Assistant Response
      const messageId = await trackMessage({
        chatbotId: chatbot.chatbotId,
        namespace: chatbot.namespace,
        sessionId: sessionIdRef.current,
        role: "assistant",
        content: finalContent,
        responseTime: totalTime,
      });

      // Update message with ID for feedback
      setMessages((prev) =>
        prev.map((m) =>
          m.id === streamId ? { ...m, messageId: messageId as string } : m,
        ),
      );
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: chatbot?.errorMessage || "Sorry, something went wrong.",
        },
      ]);
    } finally {
      setIsLoading(false);
      setStreamingSteps({});
      streamIdRef.current = null;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!chatbot || authStatus === "pending") {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F7F4EF]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1A1714]/10 flex items-center justify-center animate-pulse">
            <div className="w-5 h-5 border-2 border-[#1A1714]/30 border-t-[#EAB564] rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (authStatus === "unauthorized") {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F7F4EF] p-8 text-center">
        <div className="max-w-xs space-y-6 animate-slide-up">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive mb-2">
             <Zap size={32} className="fill-current" />
          </div>
          <div className="space-y-2">
            <h2 style={{ fontFamily: 'Georgia, serif' }} className="text-xl font-bold text-[#1A1714]">Unauthorized Access</h2>
            <p className="text-[10px] text-destructive leading-relaxed uppercase tracking-widest font-black bg-destructive/5 py-1 px-3 rounded-full inline-block">Security Protocol: Active</p>
          </div>
          <div className="h-px bg-[#E2D9CC] w-12 mx-auto" />
          <p className="text-sm text-[#8C7B68] font-medium leading-relaxed">
            This intelligence chatbot is locked on this domain. Please list <span className="text-[#1A1714] font-bold">this domain</span> in your <span className="text-[#EAB564] font-bold italic">Settings</span> for access.
          </p>
          <Link href="/dashboard" target="_blank" className="inline-block mt-4 text-[10px] font-black uppercase tracking-widest text-[#1A1714] hover:text-[#EAB564] transition-colors bg-[#EAB564] px-6 py-3 rounded-xl shadow-lg shadow-[#EAB564]/20 font-bold">
             Go to Dashboard Settings →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-[#F7F4EF] text-[#1A1714]">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm px-4 py-3">
        <div className="flex items-center gap-3 max-w-3xl mx-auto">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#EAB564] to-[#1A1714] flex items-center justify-center shadow-sm">
              <Zap className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#F7F4EF] rounded-full" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-foreground truncate">
              {chatbot.name}
            </h3>
            <p className="text-xs text-muted-foreground">Online</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((msg, index) => (
            <div
              key={msg.id}
              className={`flex w-full animate-slide-up ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div className="flex flex-col max-w-[85%] gap-1.5">
                <div
                  className={`px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-2xl rounded-br-sm"
                      : "bg-card text-card-foreground border border-border rounded-2xl rounded-bl-sm"
                  }`}
                >
                  <div className="markdown-content prose prose-sm max-w-none break-words dark:prose-invert">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                        ul: ({children}) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
                        ol: ({children}) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
                        li: ({children}) => <li className="mb-1">{children}</li>,
                        strong: ({children}) => <strong className="font-bold text-foreground">{children}</strong>,
                        code: ({children}) => <code className="bg-muted px-1 rounded text-xs font-mono">{children}</code>
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                  
                  {/* Cursor for streaming */}
                  {msg.isStreaming && (
                    <span className="inline-block w-1.5 h-3.5 ml-1 bg-current opacity-70 animate-pulse align-middle" />
                  )}
                </div>

                {/* Feedback Buttons */}
                {msg.role === "assistant" &&
                  !msg.isStreaming &&
                  msg.id !== "welcome" && (
                    <div className="flex items-center gap-1.5 px-1">
                      {!msg.feedback ? (
                        <>
                          <button
                            onClick={() => handleFeedback(index, "positive")}
                            className="p-1 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10 rounded transition-colors"
                            aria-label="Good response"
                          >
                            <FiThumbsUp size={12} />
                          </button>
                          <button
                            onClick={() => handleFeedback(index, "negative")}
                            className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
                            aria-label="Bad response"
                          >
                            <FiThumbsDown size={12} />
                          </button>
                        </>
                      ) : (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 px-1.5 py-0.5 bg-muted rounded-full">
                          {msg.feedback === "positive" ? (
                            <>
                              <FiThumbsUp
                                size={10}
                                className="text-emerald-600"
                              />
                              Helpful
                            </>
                          ) : (
                            <>
                              <FiThumbsDown
                                size={10}
                                className="text-destructive"
                              />
                              Not helpful
                            </>
                          )}
                        </span>
                      )}
                    </div>
                  )}
              </div>
            </div>
          ))}

          {/* ✅ Step Progress: Replaces static loader */}
          {isLoading && Object.keys(streamingSteps).length > 0 && (
            <div className="animate-fade-in max-w-[85%]">
              <StepProgress currentSteps={streamingSteps} embed={true} />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card/30 backdrop-blur-sm p-3">
        <div className="max-w-3xl mx-auto">
          <div className="relative flex items-center gap-2 bg-background border border-input rounded-2xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-ring transition-all">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              disabled={isLoading}
              className="flex-1 bg-transparent border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none py-1.5"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="p-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-40 transition-all active:scale-95"
            >
              {isLoading ? (
                <FiLoader className="animate-spin" size={16} />
              ) : (
                <FiSend size={16} />
              )}
            </button>
          </div>
          <div className="mt-2 text-center">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 text-[11px] text-[#A6998A] hover:text-[#1A1714] transition-colors"
            >
              <Zap size={11} className="fill-[#EAB564] text-[#EAB564]" />
              Powered by{" "}
              <span style={{ fontFamily: 'Georgia, serif' }} className="font-bold text-[#1A1714]">PluginBase</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
