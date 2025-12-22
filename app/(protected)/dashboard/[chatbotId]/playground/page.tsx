"use client";

import { useState, useRef, useEffect, use } from "react";
import { FiSend, FiRefreshCw, FiCpu } from "react-icons/fi";
import { generateResponse } from "@/app/actions/message";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Zap } from "lucide-react";
import MessageBubble from "@/components/ui/MessageBubble";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  latencyMs?: number;
};

export default function PlaygroundPage({
  params,
}: {
  params: Promise<{ chatbotId: string }>;
}) {
  const { chatbotId } = use(params);

  // ✅ Fetch chatbot details
  const chatbot = useQuery(api.documents.getChatbotById, { chatbotId });

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    const startTime = performance.now();

    let historyForServer: { role: "user" | "assistant"; content: string }[] =
      [];

    setMessages((prev) => {
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: currentInput,
        timestamp: new Date(),
      };
      const updated = [...prev, userMessage];
      historyForServer = updated.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      return updated;
    });

    try {
      const sessionId = `playground-${chatbotId}`;

      const response = await generateResponse(currentInput, {
        chatbot,
        sessionId,
        evalMode: false,
        chatHistory: historyForServer,
      });

      const endTime = performance.now();
      const latency = endTime - startTime;

      if (!response.success) {
        throw new Error(response.error || "Failed to get response");
      }

      // Handle memory/history logic if present
      const answerContent =
        response.memory && response.memory.length > 0
          ? response.memory[response.memory.length - 1]?.content ||
            response.answer ||
            ""
          : response.answer || "";

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: answerContent,
        timestamp: new Date(),
        latencyMs: latency,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("=== FRONTEND: Chat error ===", error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content:
          "Sorry, something went wrong. Please check your connection and try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setInput(currentInput);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReset = () => {
    setMessages([]);
    if (textareaRef.current) {
      textareaRef.current.focus();
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
      {/* Top Bar with Chatbot Info */}
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

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto scroll-smooth">
        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* Welcome State */}
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
                  "Start chatting to test your agent&apos;s responses and accuracy."}
              </p>

              {/* <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                {[
                  "What is this document about?",
                  "Summarize the key points",
                  "Who is the author?",
                  "Explain like Im 5",
                ].map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInput(suggestion);
                      if (textareaRef.current) textareaRef.current.focus();
                    }}
                    className="text-xs text-muted-foreground bg-card border border-border hover:border-primary/50 hover:text-primary px-4 py-3 rounded-xl transition-all text-left"
                  >
                    {suggestion}
                  </button>
                ))}
              </div> */}
            </div>
          )}

          <div className="space-y-6">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}

            {isLoading && (
              <div className="flex items-start gap-3 animate-fade-in">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Zap size={14} className="text-primary fill-current" />
                </div>
                <div className="bg-muted/50 px-4 py-3 rounded-2xl rounded-tl-none">
                  <div className="flex gap-1.5">
                    <span
                      className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      {/* Input Area */}
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
