import { Zap } from "lucide-react";
import { FaUser } from "react-icons/fa6";
import { convertTOSeconds } from "./Helpers";
import { useEffect, useState, useRef } from "react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  latencyMs?: number;
  isStreaming?: boolean;
};

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const [showShimmer, setShowShimmer] = useState(false);
  const prevStreamingRef = useRef(message.isStreaming);

  // ✅ Trigger shimmer when streaming completes
  useEffect(() => {
    const wasStreaming = prevStreamingRef.current;
    const isNowComplete = wasStreaming === true && message.isStreaming === false;

    if (isNowComplete && message.content && !isUser) {
      setShowShimmer(true);

      const timer = setTimeout(() => {
        setShowShimmer(false);
      }, 1500);

      prevStreamingRef.current = message.isStreaming;

      return () => clearTimeout(timer);
    }

    prevStreamingRef.current = message.isStreaming;
  }, [message.isStreaming, message.content, isUser]);

  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`flex max-w-[85%] md:max-w-[75%] gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
      >
        {/* Avatar - pulsing during stream/shimmer */}
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
            isUser
              ? "bg-muted text-foreground"
              : message.isStreaming || showShimmer
                ? "bg-primary/20 text-primary animate-pulse"
                : "bg-primary/10 text-primary"
          }`}
        >
          {isUser ? (
            <div className="text-xs font-bold">
              <FaUser className="text-md" />
            </div>
          ) : (
            <Zap size={14} className="fill-current" />
          )}
        </div>

        <div
          className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
        >
          {/* Message Bubble */}
          <div
            className={`relative px-5 py-3.5 rounded-2xl shadow-sm text-sm leading-relaxed whitespace-pre-wrap transition-all duration-300 ease-out ${
              isUser
                ? "bg-primary text-primary-foreground rounded-tr-sm"
                : "bg-card border border-border text-foreground rounded-tl-sm overflow-hidden"
            }`}
          >
            {/* Shimmer Effect - plays when streaming completes */}
            {showShimmer && !isUser && (
              <div
                className="absolute inset-0 w-[200%] h-full pointer-events-none z-0"
                style={{
                  background:
                    "linear-gradient(90deg, transparent 0%, rgba(124, 58, 237, 0.4) 20%, rgba(217, 70, 239, 0.5) 50%, rgba(124, 58, 237, 0.4) 80%, transparent 100%)",
                  animation: "shimmerOnce 1.5s ease-out forwards",
                  transform: "translateX(-100%)",
                  left: "-50%",
                }}
              />
            )}

            {/* Content with streaming cursor */}
            <span className="relative z-10">
              {message.content}
              {message.isStreaming && message.content && (
                <span className="inline-block w-0.5 h-4 bg-primary ml-1 animate-pulse" />
              )}
            </span>
          </div>

          {/* Metadata - only show when streaming is complete */}
          {!message.isStreaming && message.content && (
            <div
              className={`flex items-center gap-2 mt-1.5 px-1 animate-fade-in ${isUser ? "flex-row-reverse" : "flex-row"}`}
            >
              <span className="text-[10px] text-muted-foreground font-medium opacity-70">
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              {!isUser && message.latencyMs != null && (
                <span className="text-[10px] text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded font-mono">
                  {convertTOSeconds(message.latencyMs)}s
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { MessageBubble };
