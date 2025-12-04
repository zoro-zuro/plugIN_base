"use client";

import { useState, useRef, useEffect, use } from "react";
import { FiSend, FiLoader } from "react-icons/fi";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export default function EmbedChatWidget({
  params,
}: {
  params: Promise<{ chatbotId: string }>;
}) {
  // ✅ Use chatbotId instead of userid
  const { chatbotId } = use(params);
  console.log("EmbedChatWidget chatbotId:", chatbotId);
  // const chatbotIdStr = chatbotId.toString();
  // console.log("EmbedChatWidget chatbotIdStr:", chatbotIdStr);
  // ✅ Fetch chatbot details for branding and settings
  const chatbot = useQuery(api.documents.getChatbotById, {
    chatbotId: chatbotId,
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ✅ Set welcome message from chatbot settings
  useEffect(() => {
    if (chatbot) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: chatbot.welcomeMessage || "Hi! How can I help you today?",
        },
      ]);
    }
  }, [chatbot]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !chatbot) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      console.log("Sending message with chatbotId:", chatbotId);
      console.log("Using namespace:", chatbot.namespace);

      const response = await fetch("/api/embed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          history: messages.slice(-5),
          chatbotId: chatbotId, // ✅ Send chatbotId
          namespace: chatbot.namespace, // ✅ Send namespace
        }),
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: data.answer,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      // ✅ Use error message from settings
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content:
          chatbot?.errorMessage ||
          "Sorry, something went wrong. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!chatbot) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading chatbot...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white font-sans">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl">
            🤖
          </div>
          <div>
            <h3 className="font-semibold text-base">{chatbot.name}</h3>
            <p className="text-xs opacity-90">Online</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm ${
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-900 border border-gray-200"
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {msg.content}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
              <FiLoader className="animate-spin text-gray-600" size={18} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
          >
            <FiSend size={18} />
          </button>
        </div>
        <p className="text-xs text-gray-500 text-center mt-2">
          Powered by {chatbot.name}
        </p>
      </div>
    </div>
  );
}
