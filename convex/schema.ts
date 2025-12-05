import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  documents: defineTable({
    userId: v.string(),
    fileName: v.string(),
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
});
