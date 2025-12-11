"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { FiCheck, FiLoader, FiCpu, FiGlobe, FiType } from "react-icons/fi";
import { Zap } from "lucide-react";

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

      // ✅ Redirect to the new chatbot&apos;s dashboard
      router.push(`/dashboard/${chatbot}/playground`);
    } catch (err) {
      console.error("❌ Error creating chatbot:", err);
      setError("Failed to create chatbot. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen mt-15 flex items-center justify-center py-10 px-4 bg-background relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-2xl w-full mx-auto relative z-10">
        <div className="bg-card border border-border rounded-3xl shadow-2xl shadow-primary/5 p-8 md:p-10 animate-slide-up">
          {/* Header */}
          <div className="mb-10 text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 text-primary mb-6 ring-1 ring-primary/20 shadow-lg shadow-primary/10">
              <Zap className="h-8 w-8" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3 text-foreground tracking-tight">
              Create New Agent
            </h1>
            <p className="text-muted-foreground text-lg">
              Give your new AI assistant an identity.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleCreate} className="space-y-8">
            {/* Chatbot Name */}
            <div className="group">
              <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <FiType className="text-primary" /> Chatbot Name{" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Support Genius"
                  className="w-full px-5 py-4 bg-muted/30 border border-input rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm group-hover:bg-muted/50"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div className="group">
              <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <FiCpu className="text-primary" /> Description{" "}
                <span className="text-muted-foreground font-normal text-xs">
                  (Optional)
                </span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly describe what this bot does..."
                rows={3}
                className="w-full px-5 py-4 bg-muted/30 border border-input rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm resize-none group-hover:bg-muted/50"
              />
            </div>

            {/* Website URL */}
            <div className="group">
              <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <FiGlobe className="text-primary" /> Website URL{" "}
                <span className="text-muted-foreground font-normal text-xs">
                  (Optional)
                </span>
              </label>
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://yourwebsite.com"
                className="w-full px-5 py-4 bg-muted/30 border border-input rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm group-hover:bg-muted/50"
              />
              <p className="text-xs text-muted-foreground mt-2 ml-1">
                This helps us customize the initial greeting.
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-primary/5 border border-primary/10 rounded-xl p-5">
              <h3 className="font-semibold text-primary mb-3 flex items-center gap-2">
                <FiCheck className="h-5 w-5" />
                Next Steps
              </h3>
              <ul className="text-sm text-muted-foreground space-y-2 pl-1">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  Your bot will be assigned a unique ID.
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  You&apos;ll be redirected to the Training Dashboard.
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  Simply upload a PDF to start chatting instantly.
                </li>
              </ul>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center gap-3 text-destructive text-sm animate-shake">
                <div className="w-2 h-2 rounded-full bg-destructive shrink-0" />
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isCreating || !name.trim()}
              className="w-full py-4 rounded-xl font-bold text-lg text-primary-foreground bg-primary hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/25 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {isCreating ? (
                <>
                  <FiLoader className="animate-spin h-5 w-5" />
                  Initializing Agent...
                </>
              ) : (
                <>
                  Create Agent <FiCheck className="h-5 w-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
