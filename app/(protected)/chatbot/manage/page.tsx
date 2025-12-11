"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import {
  FiPlus,
  FiPlay,
  FiCode,
  FiMessageSquare,
  FiFileText,
} from "react-icons/fi";
import { Zap } from "lucide-react";

function ChatbotTotalChats({ chatId }: { chatId: string }) {
  const total = useQuery(api.analytics.getTotalChats, {
    chatbotId: chatId,
  });

  // render whatever you need using total
  return <span>{total ?? 0}</span>;
}

export default function ManageChatbotsPage() {
  const { user } = useUser();
  const chatbots = useQuery(
    api.documents.getChatbotsByUserId,
    user?.id ? { userId: user.id } : "skip",
  );

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="w-12 h-12 rounded-xl bg-muted" />
          <p>Authenticating...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen mt-15 py-10 px-4 bg-background relative overflow-hidden">
      {/* Background Decor */}
      <div className="fixed top-20 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-6">
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold mb-2 text-foreground tracking-tight">
              My Chatbots
            </h1>
            <p className="text-muted-foreground">
              Manage and monitor your AI chatbots.
            </p>
          </div>
          <Link
            href="/chatbot/create"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center gap-2 group"
          >
            <FiPlus className="group-hover:rotate-90 transition-transform" />
            Create New chatbot
          </Link>
        </div>

        {/* Chatbots List */}
        {chatbots === undefined ? (
          // SKELETON LOADING STATE
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-card border border-border rounded-2xl p-6 h-64 animate-pulse"
              >
                <div className="h-6 w-1/2 bg-muted rounded mb-4" />
                <div className="h-4 w-3/4 bg-muted rounded mb-8 opacity-50" />
                <div className="grid grid-cols-2 gap-3 mt-auto">
                  <div className="h-20 bg-muted rounded-lg opacity-50" />
                  <div className="h-20 bg-muted rounded-lg opacity-50" />
                </div>
              </div>
            ))}
          </div>
        ) : chatbots.length === 0 ? (
          // EMPTY STATE
          <div className="bg-card border border-border border-dashed rounded-3xl p-16 text-center animate-fade-in relative overflow-hidden group">
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-muted mb-6 text-4xl animate-float">
                🤖
              </div>
              <h2 className="text-2xl font-bold mb-3 text-foreground">
                No agents found
              </h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                You haven&apos;t created any chatbots yet. Build your first
                custom AI agent in seconds.
              </p>
              <Link
                href="/chatbot/create"
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-full font-bold hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/25 transition-all"
              >
                <Zap className="h-5 w-5 fill-current" />
                Create Your First Agent
              </Link>
            </div>
          </div>
        ) : (
          // GRID STATE
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up">
            {chatbots.map((chatbot) => (
              <div
                key={chatbot._id}
                className="group bg-card border border-border rounded-2xl p-6 hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300 flex flex-col h-full"
              >
                {/* Chatbot Info */}
                <div className="mb-6 flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-fuchsia-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                      {chatbot.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground bg-muted px-2 py-1 rounded">
                      {chatbot.chatbotId.slice(0, 8)}
                    </span>
                  </div>

                  <h3
                    className="text-xl font-bold mb-2 text-foreground truncate"
                    title={chatbot.name}
                  >
                    {chatbot.name}
                  </h3>

                  <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                    {chatbot.description || "No description provided."}
                  </p>

                  <div className="mt-4 text-xs text-muted-foreground flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Created {new Date(chatbot.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-primary/5 rounded-xl p-3 text-center border border-primary/10 group-hover:bg-primary/10 transition-colors">
                    <p className="text-2xl font-bold text-primary">
                      <ChatbotTotalChats chatId={chatbot.chatbotId} />
                    </p>
                    <p className="text-xs text-muted-foreground font-medium flex items-center justify-center gap-1">
                      <FiMessageSquare className="h-3 w-3" /> Messages
                    </p>
                  </div>
                  <div className="bg-secondary rounded-xl p-3 text-center border border-border">
                    <p className="text-2xl font-bold text-foreground">
                      {chatbot.totalDocuments || 0}
                    </p>
                    <p className="text-xs text-muted-foreground font-medium flex items-center justify-center gap-1">
                      <FiFileText className="h-3 w-3" /> Sources
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-auto">
                  {/* ✅ Open Dashboard */}
                  <Link
                    href={`/dashboard/${chatbot.chatbotId}/playground`}
                    className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20"
                  >
                    <FiPlay size={14} className="fill-current" />
                    Open
                  </Link>

                  {/* ✅ Get Embed Code */}
                  <Link
                    href={`/dashboard/${chatbot.chatbotId}/deploy`}
                    className="flex-1 px-4 py-2.5 bg-card border border-border text-foreground hover:bg-secondary rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:border-primary/30"
                  >
                    <FiCode size={14} />
                    Embed
                  </Link>
                </div>

                {/* Website URL */}
                {chatbot.websiteUrl && (
                  <a
                    href={chatbot.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 block text-center text-xs text-muted-foreground hover:text-primary transition-colors truncate px-2"
                  >
                    {chatbot.websiteUrl}
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
