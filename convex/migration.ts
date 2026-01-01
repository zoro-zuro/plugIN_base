// convex/migration.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";

// 1. Remove fileKeywords from "documents" table
export const removeFileKeyword = mutation({
  handler: async (ctx) => {
    const docs = await ctx.db.query("documents").collect();
    let updated = 0;

    for (const doc of docs) {
      // @ts-ignore Check if field exists at runtime even if TS doesn't know
      if (doc.fileKeywords !== undefined) {
        // To remove a field in Convex, we patch it with `undefined`
        // OR we rewrite the object. Since `fileKeywords` is not optional in old schema
        // but removed in new, we just patch the doc to exclude it.
        // Actually, Convex `patch` merges. To delete, we need to replace OR use `undefined` if schema allows optional.
        // But since it's removed from schema, we must REPLACE the doc content without that field.

        const { fileKeywords, ...cleanDoc } = doc as any; // Destructure to remove
        await ctx.db.replace(doc._id, cleanDoc);
        updated++;
      }
    }
    return { updated };
  },
});

// 2. Remove documentKeywords from "chatbots" DocwithDescriptions
export const migrateDocwithDescriptions = mutation({
  handler: async (ctx) => {
    const chatbots = await ctx.db.query("chatbots").collect();
    let migratedCount = 0;

    for (const chatbot of chatbots) {
      if (
        chatbot.DocwithDescriptions &&
        chatbot.DocwithDescriptions.length > 0
      ) {
        // Map over entries and create NEW objects without documentKeywords
        const cleanedEntries = chatbot.DocwithDescriptions.map((entry: any) => {
          return {
            documentId: entry.documentId,
            documentName: entry.documentName,
            documentDescription: entry.documentDescription,
            // Explicitly do NOT include documentKeywords here
          };
        });

        // Patch the chatbot with the cleaned array
        await ctx.db.patch(chatbot._id, {
          DocwithDescriptions: cleanedEntries,
        });

        migratedCount++;
      }
    }

    return {
      success: true,
      migratedChatbots: migratedCount,
      message: "Successfully removed documentKeywords from all chatbots.",
    };
  },
});
