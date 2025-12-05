import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Generate unique chatbot ID
function generateChatbotId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return `bot_${timestamp}_${random}`;
}

// Create new chatbot
export const createChatbot = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    websiteUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const chatbotId = generateChatbotId();
    const namespace = `${args.userId}_${chatbotId}`;

    const id = await ctx.db.insert("chatbots", {
      userId: args.userId,
      name: args.name,
      description: args.description,
      chatbotId,
      namespace,
      websiteUrl: args.websiteUrl,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      totalMessages: 0,
      totalDocuments: 0,
      // ✅ Initialize new fields with defaults
      systemPrompt: undefined,
      temperature: 0.5,
      modelName: "llama-3.1-8b-instant",
      maxTokens: 500,
      welcomeMessage: "Hi! How can I help you today?",
      errorMessage: "Sorry, something went wrong. Please try again.",
      responseLanguage: "English",
      timezone: "UTC",
      lastActiveAt: undefined,
      isConnected: false,
    });

    return {
      success: true,
      chatbotId: chatbotId,
      namespace,
    };
  },
});

// Get all chatbots for a user
export const getChatbotsByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("chatbots")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

// Get single chatbot by ID
export const getChatbotById = query({
  args: { chatbotId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("chatbots")
      .withIndex("by_chatbotId", (q) => q.eq("chatbotId", args.chatbotId))
      .first();
  },
});

// Get single chatbot by namespace
export const getChatbotByNamespace = query({
  args: { namespace: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("chatbots")
      .withIndex("by_namespace", (q) => q.eq("namespace", args.namespace))
      .first();
  },
});

// ✅ FIXED: Update chatbot with ALL new fields
export const updateChatbot = mutation({
  args: {
    id: v.id("chatbots"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    websiteUrl: v.optional(v.string()),
    totalMessages: v.optional(v.number()),
    totalDocuments: v.optional(v.number()),
    // ✅ Add all new settings fields
    systemPrompt: v.optional(v.string()),
    temperature: v.optional(v.number()),
    modelName: v.optional(v.string()),
    maxTokens: v.optional(v.number()),
    welcomeMessage: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    responseLanguage: v.optional(v.string()),
    timezone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Delete chatbot
export const deleteChatbot = mutation({
  args: { id: v.id("chatbots") },
  handler: async (ctx, args) => {
    // ✅ Also delete associated documents
    const chatbot = await ctx.db.get(args.id);
    if (chatbot) {
      // Delete all documents for this chatbot
      const docs = await ctx.db
        .query("documents")
        .withIndex("by_namespace", (q) => q.eq("namespace", chatbot.namespace))
        .collect();

      for (const doc of docs) {
        if (doc.storageId) {
          await ctx.storage.delete(doc.storageId);
        }
        await ctx.db.delete(doc._id);
      }
    }

    // Delete chatbot
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// Increment message count
export const incrementMessageCount = mutation({
  args: { chatbotId: v.string() },
  handler: async (ctx, args) => {
    const chatbot = await ctx.db
      .query("chatbots")
      .withIndex("by_chatbotId", (q) => q.eq("chatbotId", args.chatbotId))
      .first();

    if (chatbot) {
      await ctx.db.patch(chatbot._id, {
        totalMessages: (chatbot.totalMessages || 0) + 1,
        updatedAt: Date.now(),
      });
    }
  },
});

// Update last active timestamp
export const updateLastActive = mutation({
  args: { chatbotId: v.string() },
  handler: async (ctx, args) => {
    const chatbot = await ctx.db
      .query("chatbots")
      .withIndex("by_chatbotId", (q) => q.eq("chatbotId", args.chatbotId))
      .first();

    if (chatbot) {
      await ctx.db.patch(chatbot._id, {
        lastActiveAt: Date.now(),
        isConnected: true,
        updatedAt: Date.now(),
      });
    }
  },
});

// Store file in Convex storage
export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

// Save document metadata after upload
export const saveDocument = mutation({
  args: {
    userId: v.string(),
    fileName: v.string(),
    fileSize: v.number(),
    fileType: v.string(),
    storageId: v.id("_storage"),
    chunksCount: v.number(),
    namespace: v.string(),
  },
  handler: async (ctx, args) => {
    const documentId = await ctx.db.insert("documents", {
      ...args,
      uploadedAt: Date.now(),
      status: "completed",
    });

    // ✅ Update chatbot document count
    const chatbot = await ctx.db
      .query("chatbots")
      .withIndex("by_namespace", (q) => q.eq("namespace", args.namespace))
      .first();

    if (chatbot) {
      await ctx.db.patch(chatbot._id, {
        totalDocuments: (chatbot.totalDocuments || 0) + 1,
        updatedAt: Date.now(),
      });
    }

    return documentId;
  },
});

// Get user's documents (legacy - for backward compatibility)
export const getUserDocuments = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("documents")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

// Get documents by namespace (for specific chatbot)
export const getDocumentsByNamespace = query({
  args: { namespace: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("documents")
      .withIndex("by_namespace", (q) => q.eq("namespace", args.namespace))
      .order("desc")
      .collect();
  },
});

// Get file URL from storage
export const getFileUrl = query({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

// Delete document
export const deleteDocument = mutation({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.documentId);

    if (doc) {
      // Delete from storage
      if (doc.storageId) {
        await ctx.storage.delete(doc.storageId);
      }

      // ✅ Update chatbot document count
      const chatbot = await ctx.db
        .query("chatbots")
        .withIndex("by_namespace", (q) => q.eq("namespace", doc.namespace))
        .first();

      if (chatbot && chatbot.totalDocuments && chatbot.totalDocuments > 0) {
        await ctx.db.patch(chatbot._id, {
          totalDocuments: chatbot.totalDocuments - 1,
          updatedAt: Date.now(),
        });
      }

      // Delete document
      await ctx.db.delete(args.documentId);
    }

    return true;
  },
});

// Delete all documents for a user (legacy)
export const deleteAllUserDocuments = mutation({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const docs = await ctx.db
      .query("documents")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const doc of docs) {
      if (doc.storageId) {
        await ctx.storage.delete(doc.storageId);
      }
      await ctx.db.delete(doc._id);
    }

    return docs.length;
  },
});

// Delete all documents for a namespace (for specific chatbot)
export const deleteAllNamespaceDocuments = mutation({
  args: { namespace: v.string() },
  handler: async (ctx, args) => {
    const docs = await ctx.db
      .query("documents")
      .withIndex("by_namespace", (q) => q.eq("namespace", args.namespace))
      .collect();

    for (const doc of docs) {
      if (doc.storageId) {
        await ctx.storage.delete(doc.storageId);
      }
      await ctx.db.delete(doc._id);
    }

    // ✅ Update chatbot document count
    const chatbot = await ctx.db
      .query("chatbots")
      .withIndex("by_namespace", (q) => q.eq("namespace", args.namespace))
      .first();

    if (chatbot) {
      await ctx.db.patch(chatbot._id, {
        totalDocuments: 0,
        updatedAt: Date.now(),
      });
    }

    return docs.length;
  },
});
