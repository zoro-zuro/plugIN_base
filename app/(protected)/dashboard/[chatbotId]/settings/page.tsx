"use client";

import { useState, use, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import toast, { Toaster } from "react-hot-toast";
import {
  FiSave,
  FiAlertTriangle,
  FiInfo,
  FiZap,
  FiMessageSquare,
  FiGlobe,
  FiSettings as FiSettingsIcon,
  FiCpu,
  FiSliders,
  FiLoader,
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
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="h-12 w-12 bg-primary/20 rounded-xl" />
          <p className="text-muted-foreground font-medium">
            Loading settings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background relative overflow-hidden">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="border-b border-border bg-card/80 backdrop-blur-md px-8 py-6 sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <FiSettingsIcon className="text-primary" />
          Configuration
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Customize how <strong>{chatbot.name}</strong> behaves, responds, and
          interacts.
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 scroll-smooth animate-fade-in">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Basic Information */}
          <Section
            icon={<FiInfo />}
            title="General Info"
            description="Basic identity and deployment details."
          >
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField
                  label="Agent Name"
                  value={formData.name}
                  onChange={(value) =>
                    setFormData({ ...formData, name: value })
                  }
                  placeholder="My Support Bot"
                  required
                  icon={
                    <span className="text-xs font-bold text-muted-foreground">
                      TXT
                    </span>
                  }
                />

                <InputField
                  label="Website URL"
                  value={formData.websiteUrl}
                  onChange={(value) =>
                    setFormData({ ...formData, websiteUrl: value })
                  }
                  placeholder="https://example.com"
                  icon={<FiGlobe size={14} />}
                />
              </div>

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

              <div className="bg-muted/50 border border-border rounded-xl p-4 text-xs font-mono space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Agent ID</span>
                  <span className="text-foreground select-all">
                    {chatbot.chatbotId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Namespace</span>
                  <span className="text-foreground select-all">
                    {chatbot.namespace}
                  </span>
                </div>
              </div>
            </div>
          </Section>

          {/* AI Configuration */}
          <Section
            icon={<FiZap />}
            title="Model & Intelligence"
            description="Fine-tune the AI's personality and cognitive parameters."
          >
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SelectField
                  label="Model Engine"
                  value={formData.modelName}
                  onChange={(value) =>
                    setFormData({ ...formData, modelName: value })
                  }
                  icon={<FiCpu size={14} />}
                  options={[
                    {
                      value: "llama-3.1-8b-instant",
                      label: "Llama 3.1 8B (Fastest)",
                    },
                    {
                      value: "llama-3.1-70b-versatile",
                      label: "Llama 3.1 70B (Balanced)",
                    },
                    {
                      value: "mixtral-8x7b-32768",
                      label: "Mixtral 8x7B (Long Context)",
                    },
                  ]}
                />

                <InputField
                  label="Max Output Tokens"
                  type="number"
                  value={formData.maxTokens.toString()}
                  onChange={(value) =>
                    setFormData({
                      ...formData,
                      maxTokens: parseInt(value) || 500,
                    })
                  }
                  helperText="Max length of response (100-2000)"
                />
              </div>

              <SliderField
                label="Creativity (Temperature)"
                value={formData.temperature}
                onChange={(value) =>
                  setFormData({ ...formData, temperature: value })
                }
                min={0}
                max={1}
                step={0.1}
                helperText="0 = Factual & Precise, 1 = Creative & Unpredictable"
              />

              <InputField
                label="System Prompt"
                value={formData.systemPrompt}
                onChange={(value) =>
                  setFormData({ ...formData, systemPrompt: value })
                }
                placeholder="You are a helpful customer support assistant for [Company Name]..."
                multiline
                rows={6}
                helperText="The core instructions that define your agent's persona."
              />
            </div>
          </Section>

          {/* Conversation Settings */}
          <Section
            icon={<FiMessageSquare />}
            title="Chat Experience"
            description="Customize the user-facing messages and localization."
          >
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SelectField
                  label="Primary Language"
                  value={formData.responseLanguage}
                  onChange={(value) =>
                    setFormData({ ...formData, responseLanguage: value })
                  }
                  icon={<FiGlobe size={14} />}
                  options={[
                    { value: "English", label: "English" },
                    { value: "Spanish", label: "Spanish" },
                    { value: "French", label: "French" },
                    { value: "German", label: "German" },
                    { value: "Hindi", label: "Hindi" },
                  ]}
                />

                <SelectField
                  label="Timezone"
                  value={formData.timezone}
                  onChange={(value) =>
                    setFormData({ ...formData, timezone: value })
                  }
                  icon={<FiGlobe size={14} />}
                  options={[
                    { value: "UTC", label: "UTC" },
                    { value: "America/New_York", label: "New York (EST)" },
                    {
                      value: "America/Los_Angeles",
                      label: "Los Angeles (PST)",
                    },
                    { value: "Europe/London", label: "London (GMT)" },
                    { value: "Asia/Kolkata", label: "India (IST)" },
                  ]}
                />
              </div>

              <InputField
                label="Welcome Greeting"
                value={formData.welcomeMessage}
                onChange={(value) =>
                  setFormData({ ...formData, welcomeMessage: value })
                }
                placeholder="Hi! How can I help you today?"
              />

              <InputField
                label="Fallback Error Message"
                value={formData.errorMessage}
                onChange={(value) =>
                  setFormData({ ...formData, errorMessage: value })
                }
                placeholder="Sorry, I encountered an issue..."
              />
            </div>
          </Section>

          {/* Tips Box */}
          <div className="bg-primary/5 border border-primary/10 rounded-xl p-5 flex gap-4">
            <div className="p-2 bg-primary/10 rounded-lg h-fit text-primary">
              <FiZap size={20} />
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">
                Pro Tips for Accuracy
              </h4>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>
                  Set temperature to <strong>0.1 - 0.3</strong> for customer
                  support bots to reduce hallucinations.
                </li>
                <li>
                  Include "If unsure, say you don&apos;t know" in your System
                  Prompt.
                </li>
                <li>Test changes in the Playground before saving.</li>
              </ul>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="border border-destructive/20 bg-destructive/5 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-destructive/10 rounded-lg text-destructive">
                <FiAlertTriangle size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-destructive">Danger Zone</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  Deleting this agent will permanently remove all training data,
                  conversation history, and analytics.
                </p>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-card border border-destructive/30 text-destructive text-sm font-semibold rounded-lg hover:bg-destructive hover:text-white transition-all disabled:opacity-50"
                >
                  {isDeleting ? "Deleting..." : "Delete Agent Forever"}
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Padding for Sticky Footer */}
          <div className="h-12" />
        </div>
      </div>

      {/* Sticky Action Footer */}
      <div className="border-t border-border bg-card/80 backdrop-blur-xl p-4 sticky bottom-0 z-20">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span className="text-sm text-muted-foreground hidden sm:block">
            Unsaved changes will be lost.
          </span>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 sm:flex-none px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-70"
            >
              {isSaving ? <FiLoader className="animate-spin" /> : <FiSave />}
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
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
    <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
      <div className="flex items-start gap-4 mb-8 border-b border-border pb-6">
        <div className="p-2.5 bg-primary/10 rounded-xl text-primary text-xl">
          {icon}
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">{title}</h2>
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
  icon,
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
  icon?: React.ReactNode;
}) {
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-foreground mb-2 flex justify-between">
        <span>
          {label} {required && <span className="text-primary">*</span>}
        </span>
        {icon && (
          <span className="text-muted-foreground opacity-50">{icon}</span>
        )}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="w-full px-4 py-3 bg-muted/30 border border-input rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-y min-h-[100px]"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 bg-muted/30 border border-input rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
        />
      )}
      {helperText && (
        <p className="text-xs text-muted-foreground mt-1.5 ml-1 opacity-80">
          {helperText}
        </p>
      )}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  icon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  icon?: React.ReactNode;
}) {
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-foreground mb-2 flex justify-between">
        <span>{label}</span>
        {icon && (
          <span className="text-muted-foreground opacity-50">{icon}</span>
        )}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-4 pr-10 py-3 appearance-none bg-muted/30 border border-input rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all cursor-pointer hover:bg-muted/50"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
          <FiSliders size={14} />
        </div>
      </div>
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
    <div className="bg-muted/30 border border-input rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <label className="text-sm font-medium text-foreground">{label}</label>
        <span className="text-xs font-mono font-bold bg-primary/10 text-primary px-2 py-1 rounded">
          {value}
        </span>
      </div>
      <input
        type="range"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        min={min}
        max={max}
        step={step}
        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
      />
      {helperText && (
        <div className="flex justify-between mt-2 text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
          <span>Precise</span>
          <span>Creative</span>
        </div>
      )}
    </div>
  );
}
