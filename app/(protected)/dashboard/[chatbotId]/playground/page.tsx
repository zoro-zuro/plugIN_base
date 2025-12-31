"use client";

import { useState, useRef, useEffect, use } from "react";
import { FiSend, FiRefreshCw, FiCpu } from "react-icons/fi";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Zap } from "lucide-react";
import { MessageBubble } from "@/components/ui/MessageBubble";
import { StepProgress } from "@/components/ui/StepProgress";
import { flushSync } from "react-dom";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  latencyMs?: number;
};

type StepStatus = "pending" | "active" | "complete" | "error";

export default function PlaygroundPage({
  params,
}: {
  params: Promise<{ chatbotId: string }>;
}) {
  const { chatbotId } = use(params);
  const chatbot = useQuery(api.documents.getChatbotById, { chatbotId });

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingSteps, setStreamingSteps] = useState<
    Record<string, StepStatus>
  >({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [streamingId, setStreamingId] = useState<string | null>(null);

  // Refs for streaming state management
  const streamIdRef = useRef<string | null>(null);
  const streamTextRef = useRef("");
  const streamRafRef = useRef<number | null>(null);

  useEffect(() => {
    if (chatbot) {
      fetch("/api/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "HI",
          history: [],
          chatbot,
          warmup: true,
        }),
      }).catch(() => {
        console.log("Error in warmup");
      });
    }
  }, [chatbot]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !chatbot) return;

    const currentInput = input;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "52px";

    setIsLoading(true);
    setStreamingSteps({});

    const streamId = `assistant-${Date.now()}`;
    const streamStart = new Date();
    setStreamingId(streamId);

    // Reset refs
    streamIdRef.current = streamId;
    streamTextRef.current = "";
    if (streamRafRef.current) cancelAnimationFrame(streamRafRef.current);
    streamRafRef.current = null;

    const startTime = performance.now();

    const historyForServer = messages.slice(-10).map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: currentInput,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await fetch("/api/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: currentInput,
          history: historyForServer,
          chatbot,
        }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body stream");

      const decoder = new TextDecoder();
      let firstTokenTime = 0;
      let hasReceivedFirstToken = false;
      let streamingMessageAdded = false;

      // Efficient update function using RAF
      const scheduleRafUpdate = () => {
        if (streamRafRef.current != null) return;
        streamRafRef.current = requestAnimationFrame(() => {
          streamRafRef.current = null;
          const id = streamIdRef.current;
          if (!id) return;

          const contentNow = streamTextRef.current;
          setMessages((prev) =>
            prev.map((m) => (m.id === id ? { ...m, content: contentNow } : m)),
          );
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const parts = chunk.split(/(__PROGRESS__.*?__END__\n)/);

        for (const part of parts) {
          if (!part) continue;

          if (part.startsWith("__PROGRESS__")) {
            const jsonMatch = part.match(/__PROGRESS__(.+?)__END__/);
            if (jsonMatch) {
              try {
                const progressData = JSON.parse(jsonMatch[1]);
                setStreamingSteps((prev) => ({
                  ...prev,
                  [progressData.step]: progressData.status,
                }));
              } catch (e) {
                console.error("Failed to parse progress:", e);
              }
            }
            continue;
          }

          if (!hasReceivedFirstToken) {
            firstTokenTime = performance.now();
            hasReceivedFirstToken = true;
            const ttft = firstTokenTime - startTime;
            console.log(`⚡ TTFT: ${ttft.toFixed(0)}ms`);
          }

          streamTextRef.current += part;

          if (!streamingMessageAdded) {
            const initialText = streamTextRef.current;

            // Immediate update for first chunk
            flushSync(() => {
              setMessages((prev) => [
                ...prev,
                {
                  id: streamId,
                  role: "assistant",
                  content: initialText,
                  timestamp: streamStart,
                  isStreaming: true,
                },
              ]);
            });

            streamingMessageAdded = true;

            // Clear steps immediately
            flushSync(() => setStreamingSteps({}));
          } else {
            // Smooth RAF updates for subsequent chunks
            scheduleRafUpdate();
          }
        }
      }

      // Ensure final content is painted
      if (streamRafRef.current != null) {
        cancelAnimationFrame(streamRafRef.current);
        streamRafRef.current = null;
      }

      const finalText = streamTextRef.current;

      // Final update with correct content
      flushSync(() => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === streamId ? { ...m, content: finalText } : m,
          ),
        );
      });

      const ttft = hasReceivedFirstToken
        ? firstTokenTime - startTime
        : performance.now() - startTime;

      // Mark streaming complete
      flushSync(() => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === streamId
              ? { ...m, isStreaming: false, latencyMs: ttft }
              : m,
          ),
        );
      });

      setStreamingId(null);
      streamIdRef.current = null;
    } catch (error) {
      console.error("=== FRONTEND: Chat error ===", error);

      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant" as const,
          content: "Sorry, something went wrong. Please try again.",
          timestamp: new Date(),
        },
      ]);

      setStreamingSteps({});
      setStreamingId(null);
      streamIdRef.current = null;
      setInput(currentInput);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([]);
    setStreamingId(null);
    setStreamingSteps({});
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!chatbot) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="h-12 w-12 bg-primary/20 rounded-xl" />
          <p className="text-muted-foreground font-medium">
            Connecting to Agent...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background relative">
      <div className="h-16 border-b border-border bg-card/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-fuchsia-600 flex items-center justify-center text-white shadow-sm">
            <Zap size={16} className="fill-current" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">
              {chatbot.name}
            </h2>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-muted-foreground font-medium">
                Test Mode
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all border border-transparent hover:border-border"
          title="Clear conversation"
        >
          <FiRefreshCw size={14} />
          Reset Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scroll-smooth">
        <div className="max-w-3xl mx-auto px-4 py-8">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center mt-20 text-center animate-slide-up">
              <div className="w-20 h-20 bg-primary/5 rounded-3xl flex items-center justify-center mb-6 ring-1 ring-primary/20">
                <FiCpu className="text-4xl text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                Testing <span className="text-primary">{chatbot.name}</span>
              </h3>
              <p className="text-muted-foreground max-w-sm mx-auto text-sm leading-relaxed mb-8">
                {chatbot.description ||
                  "Start chatting to test your agent's responses and accuracy."}
              </p>
            </div>
          )}

          <div className="space-y-6">
            {messages.map((message) => (
              <div key={message.id}>
                <MessageBubble message={message} />
              </div>
            ))}

            {streamingId && Object.keys(streamingSteps).length > 0 && (
              <div className="animate-fade-in">
                <StepProgress currentSteps={streamingSteps} />
              </div>
            )}
          </div>

          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      <div className="border-t border-border bg-background/80 backdrop-blur-md p-4 sticky bottom-0 z-20">
        <div className="max-w-3xl mx-auto relative">
          <div className="flex justify-between items-center">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={`Message ${chatbot.name}...`}
              className="w-full resize-none rounded-2xl border border-input bg-muted/30 px-5 py-4 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm placeholder:text-muted-foreground"
              rows={1}
              style={{ minHeight: "56px", maxHeight: "200px" }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="absolute right-2 bottom-2.5 p-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-0 disabled:pointer-events-none transition-all shadow-md shadow-primary/20"
            >
              <FiSend size={16} className={isLoading ? "animate-pulse" : ""} />
            </button>
          </div>
        </div>
        <p className="text-[10px] text-center text-muted-foreground mt-3">
          AI responses can be inaccurate. Check important info.
        </p>
      </div>
    </div>
  );
}
