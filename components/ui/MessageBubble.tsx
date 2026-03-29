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
        {/* Assistant Avatar - Atmospheric pulse during deployment */}
        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${
            isUser
              ? "bg-[#F7F4EF] border border-[#E2D9CC] text-[#8C7B68]"
              : message.isStreaming || showShimmer
                ? "bg-[#1A1714] text-[#EAB564] shadow-lg shadow-[#EAB564]/10 animate-pulse scale-110"
                : "bg-[#1A1714] text-[#EAB564] shadow-sm"
          }`}
        >
          {isUser ? (
            <div className="text-[10px] font-black uppercase tracking-tighter">U</div>
          ) : (
            <div className="w-4 h-4 rounded-full bg-[#EAB564] flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-[#1A1714] rounded-full" />
            </div>
          )}
        </div>

        <div
          className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
        >
          {/* High-Fidelity Message Bubble */}
          <div
            className={`relative px-5 py-3.5 rounded-2xl shadow-sm text-sm leading-relaxed whitespace-pre-wrap transition-all duration-500 ease-out ${
              isUser
                ? "bg-[#1A1714] text-[#F7F4EF] rounded-tr-sm"
                : "bg-white border border-[#E2D9CC] text-[#1A1714] rounded-tl-sm overflow-hidden"
            }`}
          >
            {/* Intelligence Shimmer - Golden Sweep on Completion */}
            {showShimmer && !isUser && (
              <div
                className="absolute inset-0 w-[200%] h-full pointer-events-none z-[1]"
                style={{
                  background:
                    "linear-gradient(90deg, transparent 0%, rgba(234, 181, 100, 0.15) 30%, rgba(234, 181, 100, 0.4) 50%, rgba(234, 181, 100, 0.15) 70%, transparent 100%)",
                  animation: "shimmerOnce 1.5s cubic-bezier(0.22, 1, 0.36, 1) forwards",
                  transform: "translateX(-100%)",
                  left: "-50%",
                }}
              />
            )}

            {/* Content Layer */}
            <span className="relative z-10 block">
              {message.content}
              {message.isStreaming && message.content && (
                <span className="inline-block w-1 h-3.5 bg-[#EAB564] ml-1.5 align-middle rounded-[1px] animate-pulse" />
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
