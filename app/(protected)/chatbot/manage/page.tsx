"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { FiPlus, FiPlay, FiCode } from "react-icons/fi";

export default function ManageChatbotsPage() {
  const { user } = useUser();
  const chatbots = useQuery(
    api.documents.getChatbotsByUserId,
    user?.id ? { userId: user.id } : "skip",
  );

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen  py-10 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Chatbots</h1>
            <p className="text-gray-600">Manage your AI-powered chatbots</p>
          </div>
          <Link
            href="/chatbots/create"
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2"
          >
            <FiPlus />
            Create New Chatbot
          </Link>
        </div>

        {/* Chatbots List */}
        {!chatbots ? (
          <div className="text-center py-20">
            <p className="text-gray-500">Loading chatbots...</p>
          </div>
        ) : chatbots.length === 0 ? (
          <div className="bg-transparent backdrop:blur-md border-2 rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🤖</div>
            <h2 className="text-2xl font-bold mb-2">No chatbots yet</h2>
            <p className="text-gray-600 mb-6">
              Create your first chatbot to get started
            </p>
            <Link
              href="/chatbot/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              <FiPlus />
              Create Chatbot
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {chatbots.map((chatbot) => (
              <div
                key={chatbot._id}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                {/* Chatbot Info */}
                <div className="mb-4">
                  <h3 className="text-xl font-bold mb-2">{chatbot.name}</h3>
                  {chatbot.description && (
                    <p className="text-sm text-gray-600 mb-3">
                      {chatbot.description}
                    </p>
                  )}
                  <div className="text-xs text-gray-500">
                    <p>
                      ID:{" "}
                      <code className="bg-gray-100 px-1 rounded">
                        {chatbot.chatbotId}
                      </code>
                    </p>
                    <p className="mt-1">
                      Created:{" "}
                      {new Date(chatbot.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {chatbot.totalMessages || 0}
                    </p>
                    <p className="text-xs text-gray-600">Messages</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {chatbot.totalDocuments || 0}
                    </p>
                    <p className="text-xs text-gray-600">Documents</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {/* ✅ Open Dashboard */}
                  <Link
                    href={`/dashboard/${chatbot.chatbotId}/playground`}
                    className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors hover:shadow-lg"
                  >
                    <FiPlay size={14} />
                    Open
                  </Link>

                  {/* ✅ Get Embed Code */}
                  <Link
                    href={`/dashboard/${chatbot.chatbotId}/deploy`}
                    className="flex-1 px-3 py-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-0 border-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors text-white"
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
                    className="mt-3 flex items-center gap-1 text-xs text-blue-600 hover:underline"
                  >
                    🔗 {chatbot.websiteUrl}
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
