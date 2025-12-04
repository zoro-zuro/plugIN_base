"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { FiCheck, FiLoader } from "react-icons/fi";

export default function CreateChatbotPage() {
  const { user } = useUser();
  const router = useRouter();
  const createChatbot = useMutation(api.documents.createChatbot);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Chatbot name is required");
      return;
    }

    if (!user?.id) {
      setError("User not authenticated");
      return;
    }

    setIsCreating(true);
    setError("");

    try {
      const result = await createChatbot({
        userId: user.id,
        name: name.trim(),
        description: description.trim() || undefined,
        websiteUrl: websiteUrl.trim() || undefined,
      });

      console.log("✅ Chatbot created:", result);

      // ✅ Get the chatbotId from the returned object
      const chatbot = result.chatbotId;

      // ✅ Redirect to the new chatbot's dashboard
      router.push(`/dashboard/${chatbot}/playground`);
    } catch (err) {
      console.error("❌ Error creating chatbot:", err);
      setError("Failed to create chatbot. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="border-2 rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Create New Chatbot
            </h1>
            <p className="text-gray-600">
              Set up your AI-powered chatbot in minutes
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleCreate} className="space-y-6">
            {/* Chatbot Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Chatbot Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Customer Support Bot"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of your chatbot's purpose..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Website URL */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Website URL (Optional)
              </label>
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://yourwebsite.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Where you'll embed this chatbot
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <FiCheck className="text-blue-600" />
                What happens next?
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Your chatbot will be created with a unique ID</li>
                <li>• You can upload documents to train it</li>
                <li>• Get embed code to add it to your website</li>
                <li>• All infrastructure is managed for you</li>
              </ul>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isCreating || !name.trim()}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isCreating ? (
                <>
                  <FiLoader className="animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <FiCheck />
                  Create Chatbot
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
