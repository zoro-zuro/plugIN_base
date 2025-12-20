import { Zap } from "lucide-react";
import { FaUser } from "react-icons/fa6";
import { convertTOSeconds } from "./Helpers";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  latencyMs?: number;
};

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex w-full ${isUser ? "justify-end" : "justify-start"} animate-slide-up`}
    >
      <div
        className={`flex max-w-[85%] md:max-w-[75%] gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
      >
        {/* Avatar */}
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isUser ? "bg-muted text-foreground" : "bg-primary/10 text-primary"}`}
        >
          {isUser ? (
            <div className="text-xs font-bold">
              <FaUser className="text-md" />
            </div>
          ) : (
            <Zap size={14} className="fill-current" />
          )}
        </div>

        {/* Bubble */}
        <div
          className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
        >
          <div
            className={`px-5 py-3.5 rounded-2xl shadow-sm text-sm leading-relaxed whitespace-pre-wrap ${
              isUser
                ? "bg-primary text-primary-foreground rounded-tr-sm"
                : "bg-card border border-border text-foreground rounded-tl-sm"
            }`}
          >
            {message.content}
          </div>

          {/* Metadata */}
          <div
            className={`flex items-center gap-2 mt-1.5 px-1 ${isUser ? "flex-row-reverse" : "flex-row"}`}
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
        </div>
      </div>
    </div>
  );
}

export default MessageBubble;
