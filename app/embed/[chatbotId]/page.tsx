"use client";

import { useState, useRef, useEffect, use } from "react";
import { FiSend, FiLoader, FiThumbsUp, FiThumbsDown } from "react-icons/fi";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { Zap } from "lucide-react";
import { flushSync } from "react-dom";
import { StepProgress } from "@/components/ui/StepProgress";

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

  // 1. Initialize & Warmup
  useEffect(() => {
    if (chatbot && !welcomeInitialized.current) {
      // Set Welcome Message
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: chatbot.welcomeMessage || "Hi! How can I help you today?",
        },
      ]);
      welcomeInitialized.current = true;

      // ✅ FIRE WARMUP REQUEST (Makes first interaction faster)
      fetch("/api/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          warmup: true,
          chatbot: chatbot,
        }),
      }).catch((err) => console.log("Warmup failed silently", err));
    }
  }, [chatbot]);

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

        for (const apiUrl of apis) {
          try {
            const response = await fetch(apiUrl, {
              signal: AbortSignal.timeout(5000),
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();

            let country = "Unknown";
            let city = "Unknown";

            if (data.country_name) {
              country = data.country_name;
              city = data.city || "Unknown";
            } else if (data.country) {
              country = data.country;
              city = data.city || "Unknown";
            } else if (data.countryName) {
              country = data.countryName;
              city = data.cityName || "Unknown";
            }

            if (country !== "Unknown") {
              await trackSession({
                chatbotId: chatbot.chatbotId,
                namespace: chatbot.namespace,
                sessionId: sessionIdRef.current!,
                userCountry: country,
                userCity: city,
              });
              return;
            }
          } catch (error) {
            continue;
          }
        }

        await trackSession({
          chatbotId: chatbot.chatbotId,
          namespace: chatbot.namespace,
          sessionId: sessionIdRef.current!,
          userCountry: "Unknown",
          userCity: "Unknown",
        });
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

    if (!message.messageId || message.feedback !== null) return;

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
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const parts = chunk.split(/(__PROGRESS__.*?__END__\n)/);

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
                console.error(e);
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

  if (!chatbot) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm px-4 py-3">
        <div className="flex items-center gap-3 max-w-3xl mx-auto">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-fuchsia-500 flex items-center justify-center shadow-sm">
              <Zap className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-background rounded-full" />
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
                  <p className="whitespace-pre-wrap">{msg.content}</p>
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
              <StepProgress currentSteps={streamingSteps} />
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
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <Zap size={11} />
              Powered by{" "}
              <span className="gradient-text font-semibold">PlugIn</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
