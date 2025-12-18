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
      DocwithDescriptions: [], // Initialize empty list
      // Initialize new fields with defaults
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

// check ownership of chatbot
export const checkChatbotOwnership = query({
  args: { chatbotId: v.string(), userId: v.string() },
  handler: async (ctx, args) => {
    const chatbotIds = await ctx.db
      .query("chatbots")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    if (!chatbotIds.find((bot) => bot.chatbotId === args.chatbotId)) {
      return false;
    }
    return true;
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

// Update chatbot with ALL new fields
export const updateChatbot = mutation({
  args: {
    id: v.id("chatbots"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    websiteUrl: v.optional(v.string()),
    totalMessages: v.optional(v.number()),
    totalDocuments: v.optional(v.number()),
    // Add all new settings fields
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
    // Also delete associated documents
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

// ✅ UPDATED: Save document metadata AND update chatbot description list
export const saveDocument = mutation({
  args: {
    userId: v.string(),
    fileName: v.string(),
    fileSize: v.number(),
    fileType: v.string(),
    storageId: v.id("_storage"),
    chunksCount: v.number(),
    namespace: v.string(),
    // Made description mandatory for this flow
    fileDescription: v.string(),
  },
  handler: async (ctx, args) => {
    const documentId = await ctx.db.insert("documents", {
      ...args,
      uploadedAt: Date.now(),
      status: "completed",
    });

    // Find the associated chatbot
    const chatbot = await ctx.db
      .query("chatbots")
      .withIndex("by_namespace", (q) => q.eq("namespace", args.namespace))
      .first();

    if (chatbot) {
      // Prepare the new description object
      const newDocEntry = {
        fileName: args.fileName,
        fileDescription: args.fileDescription,
      };

      // Get existing list, or start fresh
      const currentDescriptions = chatbot.DocwithDescriptions || [];

      // Update chatbot with new count and new description list
      await ctx.db.patch(chatbot._id, {
        totalDocuments: (chatbot.totalDocuments || 0) + 1,
        DocwithDescriptions: [...currentDescriptions, newDocEntry],
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

// update document with description
export const updateDocumentDescription = mutation({
  args: {
    documentId: v.id("documents"),
    fileDescription: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.documentId, {
      fileDescription: args.fileDescription,
    });
    return { success: true };
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

// ✅ UPDATED: Delete document AND remove from chatbot description list
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

      // Update chatbot document count and remove from description list
      const chatbot = await ctx.db
        .query("chatbots")
        .withIndex("by_namespace", (q) => q.eq("namespace", doc.namespace))
        .first();

      if (chatbot) {
        // Filter out the deleted file from the list
        const updatedDescriptions = (chatbot.DocwithDescriptions || []).filter(
          (entry) => entry.fileName !== doc.fileName,
        );

        await ctx.db.patch(chatbot._id, {
          totalDocuments: Math.max((chatbot.totalDocuments || 1) - 1, 0),
          DocwithDescriptions: updatedDescriptions,
          updatedAt: Date.now(),
        });
      }

      // Delete document record
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

// ✅ UPDATED: Delete all documents for namespace AND clear description list
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

    // Reset chatbot document stats
    const chatbot = await ctx.db
      .query("chatbots")
      .withIndex("by_namespace", (q) => q.eq("namespace", args.namespace))
      .first();

    if (chatbot) {
      await ctx.db.patch(chatbot._id, {
        totalDocuments: 0,
        DocwithDescriptions: [], // Clear the list
        updatedAt: Date.now(),
      });
    }

    return docs.length;
  },
});

export const updateChunkCount = mutation({
  args: { documentId: v.id("documents"), chunksCount: v.number() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.documentId, { chunksCount: args.chunksCount });
  },
});

// ✅ NEW MUTATION to replace saving to the 'documents' table
export const addDocumentDescriptionToChatbot = mutation({
  args: {
    chatbotId: v.string(),
    fileName: v.string(),
    fileDescription: v.string(),
    fileSize: v.number(),
    chunksCount: v.number(),
  },
  handler: async (ctx, args) => {
    const chatbot = await ctx.db
      .query("chatbots")
      .withIndex("by_chatbotId", (q) => q.eq("chatbotId", args.chatbotId))
      .first();

    if (!chatbot) {
      console.error("Chatbot not found for description update");
      return;
    }

    const newDocEntry = {
      fileName: args.fileName,
      fileDescription: args.fileDescription,
      fileSize: args.fileSize,
      chunksCount: args.chunksCount,
    };

    const currentDescriptions = chatbot.DocwithDescriptions || [];

    // Optional: Prevent duplicates
    const existingIndex = currentDescriptions.findIndex(
      (d) => d.fileName === args.fileName,
    );
    if (existingIndex !== -1) {
      currentDescriptions[existingIndex] = newDocEntry;
    } else {
      currentDescriptions.push(newDocEntry);
    }

    await ctx.db.patch(chatbot._id, {
      totalDocuments: (chatbot.totalDocuments || 0) + 1,
      DocwithDescriptions: currentDescriptions,
      updatedAt: Date.now(),
    });
  },
});
