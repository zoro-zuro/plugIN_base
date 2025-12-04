"use client";

import { useState, useRef, useEffect, use } from "react";
import { FiSend, FiLoader, FiRefreshCw } from "react-icons/fi";
import { generateResponse } from "@/app/actions/message";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

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
  const [mounted, setMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !chatbot) return;

    const currentInput = input;
    setInput("");
    setIsLoading(true);
    const startTime = performance.now();

    let historyForServer: { role: "user" | "assistant"; content: string }[] =
      [];

    setMessages((prev) => {
      console.log(
        "🔵 CLIENT: prev.length BEFORE adding user message:",
        prev.length,
      );

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

      console.log(
        "🔵 CLIENT: historyForServer.length:",
        historyForServer.length,
      );
      console.log("🔵 CLIENT: historyForServer:", historyForServer);

      return updated;
    });

    try {
      const sessionId = `playground-${chatbotId}`;

      console.log(
        "🔵 CLIENT: About to call generateResponse with history length:",
        historyForServer.length,
      );

      // ✅ Use chatbot namespace
      const response = await generateResponse(currentInput, {
        namespace: chatbot.namespace,
        sessionId,
        evalMode: false,
        chatHistory: historyForServer,
      });

      const endTime = performance.now();
      const latency = endTime - startTime;

      console.log("🟢 CLIENT: Response received, adding assistant message");

      if (!response.success) {
        throw new Error(response.error || "Failed to get response");
      }

      if (response.memory && Array.isArray(response.memory)) {
        const last = response.memory[response.memory.length - 1];

        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: last?.content || response.answer || "",
          timestamp: new Date(),
          latencyMs: latency,
        };

        setMessages((prev) => {
          console.log(
            "🔵 CLIENT: prev.length BEFORE adding assistant:",
            prev.length,
          );
          const result = [...prev, assistantMessage];
          console.log(
            "🔵 CLIENT: messages.length AFTER adding assistant:",
            result.length,
          );
          return result;
        });
      } else {
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: response.answer || "",
          timestamp: new Date(),
          latencyMs: latency,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error("=== FRONTEND: Chat error ===", error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "Sorry, something went wrong. Please try again.",
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
    console.log("=== FRONTEND: Resetting conversation ===");
    setMessages([]);
  };

  if (!chatbot) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-500">Loading chatbot...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top Bar with Chatbot Info */}
      <div className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">{chatbot.name}</h2>
          <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded">
            {chatbot.chatbotId}
          </span>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
        >
          <FiRefreshCw size={16} />
          Reset
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-black">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="bg-white/10 px-6 py-4 rounded-2xl mb-6">
                <p className="text-white text-sm">
                  Hi! What can I help you with?
                </p>
                <p className="text-white/60 text-xs mt-2">
                  Chatbot: {chatbot.name}
                </p>
                {chatbot.description && (
                  <p className="text-white/40 text-xs mt-1">
                    {chatbot.description}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="space-y-4">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}

            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="bg-white/10 px-4 py-3 rounded-2xl rounded-tl-sm">
                  <FiLoader className="animate-spin text-white" size={16} />
                </div>
              </div>
            )}
          </div>

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-black">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex gap-3 items-end">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              rows={1}
              style={{ minHeight: "52px", maxHeight: "200px" }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="px-5 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{ height: "52px" }}
            >
              <FiSend size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] px-4 py-3 rounded-2xl ${
          isUser
            ? "bg-purple-600 text-white rounded-tr-sm"
            : "bg-white/10 text-white rounded-tl-sm"
        }`}
      >
        <div className="text-xs font-semibold mb-1">
          {isUser ? "You" : "Agent"}{" "}
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
          <br />
          {!isUser && message.latencyMs != null && (
            <span className="mt-2 text-[10px] opacity-70 bg-white/10 px-1 rounded">
              {convertTOSeconds(message.latencyMs)} seconds
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

const convertTOSeconds = (ms: number) => {
  return (ms / 1000).toFixed(2);
};
