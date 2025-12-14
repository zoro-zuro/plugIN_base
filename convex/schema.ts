import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  documents: defineTable({
    userId: v.string(),
    fileName: v.string(),
    fileDescription: v.optional(v.string()), // ✅ Added description to document record
    fileSize: v.number(),
    fileType: v.string(),
    storageId: v.id("_storage"),
    chunksCount: v.number(),
    uploadedAt: v.number(),
    namespace: v.string(),
    status: v.union(
      v.literal("uploading"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
    ),
  })
    .index("by_user", ["userId"])
    .index("by_namespace", ["namespace"])
    .index("by_status", ["status"]),

  chatbots: defineTable({
    // Owner info
    userId: v.string(),

    // Chatbot details
    name: v.string(),
    description: v.optional(v.string()),

    // Technical details (generated)
    chatbotId: v.string(),
    namespace: v.string(),

    // Deployment info
    websiteUrl: v.optional(v.string()),

    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),

    // Stats
    totalMessages: v.optional(v.number()),
    totalDocuments: v.optional(v.number()),

    // ✅ UPDATED: Structured array for descriptions
    DocwithDescriptions: v.optional(
      v.array(
        v.object({
          fileName: v.string(),
          fileDescription: v.string(),
        }),
      ),
    ),

    // AI Configuration
    systemPrompt: v.optional(v.string()),
    temperature: v.optional(v.number()),
    modelName: v.optional(v.string()),
    maxTokens: v.optional(v.number()),

    // Conversation Settings
    welcomeMessage: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    responseLanguage: v.optional(v.string()),

    // Advanced Settings
    timezone: v.optional(v.string()),

    // Connection Tracking
    lastActiveAt: v.optional(v.number()),
    isConnected: v.optional(v.boolean()),
  })
    .index("by_userId", ["userId"])
    .index("by_chatbotId", ["chatbotId"])
    .index("by_namespace", ["namespace"]),

  // Chat sessions
  chat_sessions: defineTable({
    chatbotId: v.string(),
    namespace: v.string(),
    sessionId: v.string(),
    startTime: v.number(),
    endTime: v.optional(v.number()),
    messageCount: v.number(),
    userCountry: v.optional(v.string()),
    userCity: v.optional(v.string()),
    userIP: v.optional(v.string()),
  })
    .index("by_chatbot", ["chatbotId"])
    .index("by_chatbot_time", ["chatbotId", "startTime"])
    .index("by_session", ["sessionId"]),

  // Individual messages for logs
  chat_messages: defineTable({
    chatbotId: v.string(),
    namespace: v.string(),
    sessionId: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    timestamp: v.number(),
    responseTime: v.optional(v.number()), // ms to generate response
    sources: v.optional(v.array(v.string())), // documents used
    feedback: v.optional(v.union(v.literal("positive"), v.literal("negative"))),
  })
    .index("by_chatbot", ["chatbotId"])
    .index("by_session", ["sessionId"])
    .index("by_chatbot_time", ["chatbotId", "timestamp"]),
});
