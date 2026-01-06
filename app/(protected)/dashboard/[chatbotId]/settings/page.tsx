"use client";

import { useState, use, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import toast, { Toaster } from "react-hot-toast";
import {
  FiSave,
  FiAlertTriangle,
  FiSettings as FiSettingsIcon,
  FiLoader,
  FiTrash2,
} from "react-icons/fi";
import { useRouter } from "next/navigation";

import { InputField, SelectField, SliderField } from "@/components/ui/Field";

export default function SettingsPage({
  params,
}: {
  params: Promise<{ chatbotId: string }>;
}) {
  const { chatbotId } = use(params);
  const router = useRouter();

  const chatbot = useQuery(api.documents.getChatbotById, { chatbotId });
  const updateChatbot = useMutation(api.documents.updateChatbot);
  const deleteChatbot = useMutation(api.documents.deleteChatbot);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    systemPrompt: "",
    temperature: 0.5,
    modelName: "llama-3.1-8b",
    maxTokens: 1000,
    welcomeMessage: "Hi! How can I help you today?",
    errorMessage: "Sorry, something went wrong. Please try again.",
    responseLanguage: "English",
    timezone: "UTC",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (chatbot) {
      setFormData({
        name: chatbot.name || "",
        description: chatbot.description || "",
        systemPrompt: chatbot.systemPrompt || "",
        temperature: chatbot.temperature ?? 0.5,
        modelName: chatbot.modelName || "llama-3.1-8b",
        maxTokens: chatbot.maxTokens ?? 1000,
        welcomeMessage:
          chatbot.welcomeMessage || "Hi! How can I help you today?",
        errorMessage:
          chatbot.errorMessage ||
          "Sorry, something went wrong. Please try again.",
        responseLanguage: chatbot.responseLanguage || "English",
        timezone: chatbot.timezone || "UTC",
      });
    }
  }, [chatbot]);

  const handleSave = async () => {
    if (!chatbot) return;

    setIsSaving(true);
    try {
      await updateChatbot({
        id: chatbot._id,
        ...formData,
      });
      toast.success("Settings saved successfully!");
    } catch (error) {
      toast.error("Failed to save settings");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!chatbot) return;
    setIsDeleting(true);
    try {
      await deleteChatbot({ id: chatbot._id });
      toast.success("Chatbot deleted successfully");
      router.push("/chatbots/manage");
    } catch (error) {
      toast.error("Failed to delete chatbot");
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Track if the form has been modified
  const [hasChanges, setHasChanges] = useState(false);

  // ⚡️ Effect: Check for changes whenever formData updates
  useEffect(() => {
    if (!chatbot) return;

    // Create a clean object of original values to compare against
    const originalValues = {
      name: chatbot.name || "",
      description: chatbot.description || "",
      systemPrompt: chatbot.systemPrompt || "",
      temperature: chatbot.temperature ?? 0.5,
      modelName: chatbot.modelName || "llama-3.1-8b",
      maxTokens: chatbot.maxTokens ?? 1000,
      welcomeMessage: chatbot.welcomeMessage || "Hi! How can I help you today?",
      errorMessage:
        chatbot.errorMessage ||
        "Sorry, something went wrong. Please try again.",
      responseLanguage: chatbot.responseLanguage || "English",
      timezone: chatbot.timezone || "UTC",
    };

    // Compare strictly using JSON string (deep equality check)
    const isDifferent =
      JSON.stringify(formData) !== JSON.stringify(originalValues);

    setHasChanges(isDifferent);
  }, [formData, chatbot]);

  if (!chatbot) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <FiLoader className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background relative overflow-hidden">
      <Toaster position="top-right" />

      {/* HEADER: Title Left, Actions Right */}
      <div className="border-b border-border bg-card/80 backdrop-blur-md px-6 py-4 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <FiSettingsIcon size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">
              Configuration
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-destructive/10"
            title="Delete Agent"
          >
            <FiTrash2 size={20} />
          </button>
          <div className="h-6 w-px bg-border mx-1" />
          <button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition-all duration-300 shadow-sm ${
              hasChanges
                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20 scale-105" // 🟢 Active: Visual Pop!
                : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed" // ⚪️ Inactive: Muted
            }`}
          >
            {isSaving ? <FiLoader className="animate-spin" /> : <FiSave />}
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* SINGLE SCROLLABLE CONTAINER */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
        <div className="max-w-3xl mx-auto space-y-10 pb-20">
          {/* 1. IDENTITY SECTION */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">
              General Information
            </h2>
            <div className="grid grid-cols-1 gap-6">
              <InputField
                label="Agent Name"
                value={formData.name}
                onChange={(value) => setFormData({ ...formData, name: value })}
                placeholder="My Support Bot"
                required
              />
              <InputField
                label="Description"
                value={formData.description}
                onChange={(value) =>
                  setFormData({ ...formData, description: value })
                }
                placeholder="What is the primary purpose of this agent?"
                multiline
                rows={2}
              />
            </div>
          </div>

          {/* 2. INTELLIGENCE SECTION */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">
              Model & Intelligence
            </h2>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SelectField
                  label="Model Engine"
                  value={formData.modelName}
                  onChange={(value) =>
                    setFormData({ ...formData, modelName: value })
                  }
                  options={[
                    { value: "llama-3.1-8b", label: "Llama 3.1 8B (Fast)" },
                    { value: "llama-3.3-70b", label: "Llama 3.3 70B (Smart)" },
                    { value: "gpt-oss-120b", label: "GPT-OSS-120B (Pro)" },
                  ]}
                />
                <SliderField
                  label="Creativity (Temperature)"
                  value={formData.temperature}
                  onChange={(value) =>
                    setFormData({ ...formData, temperature: value })
                  }
                  min={0}
                  max={1}
                  step={0.1}
                />
              </div>

              <InputField
                label="System Prompt"
                value={formData.systemPrompt}
                onChange={(value) =>
                  setFormData({ ...formData, systemPrompt: value })
                }
                placeholder="You are a helpful assistant..."
                multiline
                rows={6}
                helperText="Define the core personality and rules for the AI."
              />

              <div className="max-w-xs">
                <InputField
                  label="Max Tokens"
                  type="number"
                  value={formData.maxTokens.toString()}
                  onChange={(value) =>
                    setFormData({
                      ...formData,
                      maxTokens: parseInt(value) || 500,
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* 3. CHAT EXPERIENCE SECTION */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">
              Chat Interface
            </h2>
            <div className="space-y-6">
              <InputField
                label="Welcome Greeting"
                value={formData.welcomeMessage}
                onChange={(value) =>
                  setFormData({ ...formData, welcomeMessage: value })
                }
                placeholder="Hi! How can I help you today?"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SelectField
                  label="Primary Language"
                  value={formData.responseLanguage}
                  onChange={(value) =>
                    setFormData({ ...formData, responseLanguage: value })
                  }
                  options={[
                    { value: "English", label: "English" },
                    { value: "Spanish", label: "Spanish" },
                    { value: "French", label: "French" },
                    { value: "German", label: "German" },
                    { value: "Hindi", label: "Hindi" },
                    { value: "Japanese", label: "Japanese" },
                  ]}
                />
                <SelectField
                  label="Timezone"
                  value={formData.timezone}
                  onChange={(value) =>
                    setFormData({ ...formData, timezone: value })
                  }
                  options={[
                    { value: "UTC", label: "UTC" },
                    { value: "America/New_York", label: "New York (EST)" },
                    { value: "Europe/London", label: "London (GMT)" },
                    { value: "Asia/Kolkata", label: "India (IST)" },
                    { value: "Asia/Tokyo", label: "Tokyo (JST)" },
                  ]}
                />
              </div>

              <InputField
                label="Fallback Error Message"
                value={formData.errorMessage}
                onChange={(value) =>
                  setFormData({ ...formData, errorMessage: value })
                }
                placeholder="Sorry, I encountered an issue..."
              />
            </div>
          </div>

          {/* DELETE MODAL (Overlay) */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="bg-background border border-border rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center gap-3 text-destructive mb-4">
                    <div className="p-2 bg-destructive/10 rounded-full">
                      <FiAlertTriangle size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">
                      Delete Chatbot?
                    </h3>
                  </div>

                  <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                    This action cannot be undone. This will permanently delete
                    <span className="font-semibold text-foreground mx-1">
                      {chatbot.name}
                    </span>
                    and remove all associated data and conversation history.
                  </p>

                  <div className="flex items-center gap-3 justify-end">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="px-4 py-2 text-sm font-semibold bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 flex items-center gap-2"
                    >
                      {isDeleting && <FiLoader className="animate-spin" />}
                      Delete Forever
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
