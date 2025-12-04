"use client";

import { useState, use, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import toast, { Toaster } from "react-hot-toast";
import {
  FiSave,
  FiTrash2,
  FiAlertCircle,
  FiInfo,
  FiZap,
  FiMessageSquare,
  FiGlobe,
  FiSettings as FiSettingsIcon,
} from "react-icons/fi";
import { useRouter } from "next/navigation";

export default function SettingsPage({
  params,
}: {
  params: Promise<{ chatbotId: string }>;
}) {
  const { chatbotId } = use(params);
  const router = useRouter();

  // Fetch chatbot details
  const chatbot = useQuery(api.documents.getChatbotById, { chatbotId });
  const updateChatbot = useMutation(api.documents.updateChatbot);
  const deleteChatbot = useMutation(api.documents.deleteChatbot);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    websiteUrl: "",
    systemPrompt: "",
    temperature: 0.5,
    modelName: "llama-3.1-8b-instant",
    maxTokens: 500,
    welcomeMessage: "Hi! How can I help you today?",
    errorMessage: "Sorry, something went wrong. Please try again.",
    responseLanguage: "English",
    timezone: "UTC",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Populate form when chatbot loads
  useEffect(() => {
    if (chatbot) {
      setFormData({
        name: chatbot.name || "",
        description: chatbot.description || "",
        websiteUrl: chatbot.websiteUrl || "",
        systemPrompt: chatbot.systemPrompt || "",
        temperature: chatbot.temperature ?? 0.5,
        modelName: chatbot.modelName || "llama-3.1-8b-instant",
        maxTokens: chatbot.maxTokens ?? 500,
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

    const confirmed = confirm(
      `Are you sure you want to delete "${chatbot.name}"? This action cannot be undone and will delete all associated documents and data.`,
    );

    if (!confirmed) return;

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

  if (!chatbot) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading chatbot settings...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure your chatbot's behavior and appearance
        </p>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Basic Information */}
        <Section
          icon={<FiInfo />}
          title="Basic Information"
          description="General details about your chatbot"
        >
          <div className="space-y-4">
            <InputField
              label="Chatbot Name"
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
              placeholder="Brief description of what this chatbot does"
              multiline
            />

            <InputField
              label="Website URL"
              value={formData.websiteUrl}
              onChange={(value) =>
                setFormData({ ...formData, websiteUrl: value })
              }
              placeholder="https://example.com"
            />

            <div className="bg-muted/50 p-3 rounded-lg text-sm">
              <p className="text-muted-foreground">
                <strong>Chatbot ID:</strong> {chatbot.chatbotId}
              </p>
              <p className="text-muted-foreground mt-1">
                <strong>Namespace:</strong> {chatbot.namespace}
              </p>
            </div>
          </div>
        </Section>

        {/* AI Configuration */}
        <Section
          icon={<FiZap />}
          title="AI Configuration"
          description="Control how your chatbot thinks and responds"
        >
          <div className="space-y-4">
            <InputField
              label="System Prompt"
              value={formData.systemPrompt}
              onChange={(value) =>
                setFormData({ ...formData, systemPrompt: value })
              }
              placeholder="You are a helpful customer support assistant..."
              multiline
              rows={6}
              helperText="Define your chatbot's personality and role"
            />

            <SelectField
              label="AI Model"
              value={formData.modelName}
              onChange={(value) =>
                setFormData({ ...formData, modelName: value })
              }
              options={[
                { value: "llama-3.1-8b-instant", label: "Llama 3.1 8B (Fast)" },
                {
                  value: "llama-3.1-70b-versatile",
                  label: "Llama 3.1 70B (Smart)",
                },
                { value: "mixtral-8x7b-32768", label: "Mixtral 8x7B" },
              ]}
            />

            <SliderField
              label="Temperature"
              value={formData.temperature}
              onChange={(value) =>
                setFormData({ ...formData, temperature: value })
              }
              min={0}
              max={1}
              step={0.1}
              helperText="Lower = more focused, Higher = more creative"
            />

            <InputField
              label="Max Tokens"
              type="number"
              value={formData.maxTokens.toString()}
              onChange={(value) =>
                setFormData({ ...formData, maxTokens: parseInt(value) || 500 })
              }
              helperText="Maximum length of responses (100-2000)"
            />
          </div>
        </Section>

        {/* Conversation Settings */}
        <Section
          icon={<FiMessageSquare />}
          title="Conversation Settings"
          description="Customize messages and conversation flow"
        >
          <div className="space-y-4">
            <InputField
              label="Welcome Message"
              value={formData.welcomeMessage}
              onChange={(value) =>
                setFormData({ ...formData, welcomeMessage: value })
              }
              placeholder="Hi! How can I help you today?"
            />

            <InputField
              label="Error Message"
              value={formData.errorMessage}
              onChange={(value) =>
                setFormData({ ...formData, errorMessage: value })
              }
              placeholder="Sorry, something went wrong..."
            />

            <SelectField
              label="Response Language"
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
              ]}
            />
          </div>
        </Section>

        {/* Advanced Settings */}
        <Section
          icon={<FiSettingsIcon />}
          title="Advanced Settings"
          description="Additional configuration options"
        >
          <div className="space-y-4">
            <SelectField
              label="Timezone"
              value={formData.timezone}
              onChange={(value) =>
                setFormData({ ...formData, timezone: value })
              }
              options={[
                { value: "UTC", label: "UTC" },
                { value: "America/New_York", label: "Eastern Time (US)" },
                { value: "America/Los_Angeles", label: "Pacific Time (US)" },
                { value: "Europe/London", label: "London" },
                { value: "Asia/Kolkata", label: "India (IST)" },
              ]}
            />

            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex gap-3">
              <FiInfo className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900 dark:text-blue-200">
                <p className="font-semibold mb-1">Tips for best results:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Keep temperature at 0-0.3 for factual responses</li>
                  <li>Use detailed system prompts for better accuracy</li>
                  <li>Test changes in Playground before deploying</li>
                </ul>
              </div>
            </div>
          </div>
        </Section>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-border">
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors disabled:opacity-50"
          >
            <FiTrash2 size={16} />
            {isDeleting ? "Deleting..." : "Delete Chatbot"}
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <FiSave size={16} />
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {/* Danger Zone */}
        <div className="border-2 border-red-200 dark:border-red-800 rounded-lg p-4 bg-red-50/50 dark:bg-red-950/20">
          <div className="flex items-start gap-3">
            <FiAlertCircle className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-200">
                Danger Zone
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                Deleting this chatbot will permanently remove all associated
                documents, conversations, and data. This action cannot be
                undone.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Reusable Components
function Section({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="text-primary mt-1">{icon}</div>
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  required,
  multiline,
  rows = 3,
  helperText,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  multiline?: boolean;
  rows?: number;
  helperText?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        />
      )}
      {helperText && (
        <p className="text-xs text-muted-foreground mt-1">{helperText}</p>
      )}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function SliderField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  helperText,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  helperText?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium">{label}</label>
        <span className="text-sm font-mono text-muted-foreground">{value}</span>
      </div>
      <input
        type="range"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        min={min}
        max={max}
        step={step}
        className="w-full"
      />
      {helperText && (
        <p className="text-xs text-muted-foreground mt-1">{helperText}</p>
      )}
    </div>
  );
}
