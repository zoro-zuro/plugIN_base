"use client";

import { useState, useRef, useEffect, use } from "react";
import { FiSend, FiLoader, FiThumbsUp, FiThumbsDown } from "react-icons/fi";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";

// ✅ Updated Message type to include feedback
type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  messageId?: string | null; // ✅ Allow null
  feedback?: "positive" | "negative" | null;
};

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
  const addFeedback = useMutation(api.analytics.addMessageFeedback); // ✅ Add feedback mutation

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const welcomeInitialized = useRef(false);
  const sessionIdRef = useRef<string | null>(null);

  // Set welcome message ONLY ONCE
  useEffect(() => {
    if (chatbot && !welcomeInitialized.current) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: chatbot.welcomeMessage || "Hi! How can I help you today?",
        },
      ]);
      welcomeInitialized.current = true;
    }
  }, [chatbot]);

  // Get geolocation with multiple fallbacks
  useEffect(() => {
    if (chatbot && !sessionIdRef.current) {
      sessionIdRef.current = `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      const getGeolocation = async () => {
        const apis = [
          "https://ipapi.co/json/",
          "https://ip-api.com/json/",
          "https://freeipapi.com/api/json",
        ];

        for (const apiUrl of apis) {
          try {
            console.log(`🌍 Trying geolocation API: ${apiUrl}`);

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
              console.log(`✅ Geolocation found: ${city}, ${country}`);

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
            console.warn(`❌ ${apiUrl} failed:`, error);
            continue;
          }
        }

        console.log("⚠️ All geolocation APIs failed, using Unknown");
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ✅ Handle feedback click
  const handleFeedback = async (
    messageIndex: number,
    feedbackType: "positive" | "negative",
  ) => {
    const message = messages[messageIndex];

    // ✅ Better null check
    if (!message.messageId || message.feedback !== null) {
      console.log(
        "Cannot add feedback: no messageId or feedback already given",
      );
      return;
    }

    try {
      setMessages((prev) =>
        prev.map((msg, idx) =>
          idx === messageIndex ? { ...msg, feedback: feedbackType } : msg,
        ),
      );

      await addFeedback({
        messageId: message.messageId as any, // ✅ Safe because we checked above
        feedback: feedbackType,
      });

      console.log(`✅ Feedback recorded: ${feedbackType}`);
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

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: currentInput,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    const startTime = Date.now();

    try {
      // Track user message
      await trackMessage({
        chatbotId: chatbot.chatbotId,
        namespace: chatbot.namespace,
        sessionId: sessionIdRef.current,
        role: "user",
        content: currentInput,
      });

      const response = await fetch("/api/embed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: currentInput,
          history: messages.slice(-5),
          chatbot: chatbot,
          sessionId: sessionIdRef.current,
        }),
      });

      const data = await response.json();

      const responseTime = Date.now() - startTime;

      if (data.success) {
        // ✅ Track assistant message and get the message ID back
        const messageId = await trackMessage({
          chatbotId: chatbot.chatbotId,
          namespace: chatbot.namespace,
          sessionId: sessionIdRef.current,
          role: "assistant",
          content: data.answer,
          responseTime,
        });

        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: data.answer,
          messageId: messageId as string | null, // ✅ Now TypeScript is happy
          feedback: null,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content:
          chatbot?.errorMessage ||
          "Sorry, something went wrong. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);

      if (sessionIdRef.current) {
        await trackMessage({
          chatbotId: chatbot.chatbotId,
          namespace: chatbot.namespace,
          sessionId: sessionIdRef.current,
          role: "assistant",
          content: errorMessage.content,
          responseTime: Date.now() - startTime,
        }).catch(console.error);
      }
    } finally {
      setIsLoading(false);
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
        {messages.map((msg, index) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.role === "user" ? "items-end" : "items-start"
            }`}
          >
            {/* Message Bubble */}
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm ${
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-br-sm"
                  : "bg-white text-gray-900 border border-gray-200 rounded-bl-sm"
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {msg.content}
              </p>
            </div>

            {/* ✅ Feedback Buttons (only for assistant messages, not welcome) */}
            {msg.role === "assistant" && msg.id !== "welcome" && (
              <div className="flex items-center gap-2 mt-1.5 ml-2">
                {msg.feedback === null ? (
                  <>
                    <button
                      onClick={() => handleFeedback(index, "positive")}
                      className="p-1.5 hover:bg-gray-200 rounded-full transition-colors group"
                      title="Good response"
                      aria-label="Thumbs up"
                    >
                      <FiThumbsUp
                        className="text-gray-400 group-hover:text-green-600 transition-colors"
                        size={14}
                      />
                    </button>
                    <button
                      onClick={() => handleFeedback(index, "negative")}
                      className="p-1.5 hover:bg-gray-200 rounded-full transition-colors group"
                      title="Bad response"
                      aria-label="Thumbs down"
                    >
                      <FiThumbsDown
                        className="text-gray-400 group-hover:text-red-600 transition-colors"
                        size={14}
                      />
                    </button>
                  </>
                ) : (
                  <span className="text-xs text-gray-500 flex items-center gap-1.5 py-1">
                    {msg.feedback === "positive" ? (
                      <>
                        <FiThumbsUp className="text-green-600" size={14} />
                        <span>Thanks for your feedback!</span>
                      </>
                    ) : (
                      <>
                        <FiThumbsDown className="text-red-600" size={14} />
                        <span>Thanks for your feedback!</span>
                      </>
                    )}
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <FiLoader className="animate-spin text-gray-600" size={18} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t border-slate-100">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={isLoading}
            className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm text-slate-900 transition-all placeholder:text-slate-400"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-all shadow-sm hover:shadow-md active:scale-95"
          >
            {isLoading ? (
              <FiLoader className="animate-spin" size={16} />
            ) : (
              <FiSend size={16} />
            )}
          </button>
        </div>
        <div className="text-[10px] text-slate-400 text-center mt-2 flex items-center justify-center gap-1">
          Powered by{" "}
          <Link href="/" target="_blank">
            <span className="font-semibold gradient-text">PlugIn</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
