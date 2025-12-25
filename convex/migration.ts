// convex/migrations.ts
import { mutation } from "./_generated/server";

export const migrateDocumentsAddNamespace = mutation({
  handler: async (ctx) => {
    const docs = await ctx.db.query("documents").collect();

    let updated = 0;
    for (const doc of docs) {
      if (!doc.namespace) {
        // Set namespace to userId for old documents
        await ctx.db.patch(doc._id, {
          namespace: doc.userId,
        });
        updated++;
      }
    }

    return { updated };
  },
});

// convex/migration.ts
export const clearAllDocuments = mutation({
  handler: async (ctx) => {
    const docs = await ctx.db.query("documents").collect();

    for (const doc of docs) {
      await ctx.db.delete(doc._id);
    }

    return { deleted: docs.length };
  },
});

// convex/migration.ts
export const checkDocumentsNamespace = mutation({
  handler: async (ctx) => {
    const docs = await ctx.db.query("documents").collect();

    const withNamespace = docs.filter((d) => d.namespace).length;
    const withoutNamespace = docs.filter((d) => !d.namespace).length;

    return {
      total: docs.length,
      withNamespace,
      withoutNamespace,
      needsMigration: withoutNamespace > 0,
    };
  },
});

// convex/migration.ts

export const migrateDocwithDescriptions = mutation({
  args: {},
  handler: async (ctx) => {
    const chatbots = await ctx.db.query("chatbots").collect();
    let migratedCount = 0;

    for (const chatbot of chatbots) {
      if (
        chatbot.DocwithDescriptions &&
        chatbot.DocwithDescriptions.length > 0
      ) {
        const updatedEntries = [];

        for (const entry of chatbot.DocwithDescriptions) {
          // @ts-ignore - old fields
          const oldFileName = entry.fileName;
          // @ts-ignore
          const oldFileDescription = entry.fileDescription;
          // @ts-ignore
          const oldFileId = entry.fileid;

          let documentId = entry.documentId;

          if (!documentId && oldFileId) {
            try {
              const doc = await ctx.db.get(oldFileId as any);
              if (doc) {
                documentId = oldFileId as any;
              }
            } catch {
              const docs = await ctx.db
                .query("documents")
                .withIndex("by_namespace", (q) =>
                  q.eq("namespace", chatbot.namespace),
                )
                .collect();

              const matchingDoc = docs.find((d) => d.fileName === oldFileName);
              if (matchingDoc) {
                documentId = matchingDoc._id;
              }
            }
          }

          // ✅ Add check for undefined
          if (documentId) {
            try {
              const doc = await ctx.db.get(documentId);
              if (doc) {
                updatedEntries.push({
                  documentId: documentId,
                  documentName:
                    oldFileName || entry.documentName || doc.fileName,
                  documentDescription:
                    oldFileDescription ||
                    entry.documentDescription ||
                    doc.fileDescription,
                  documentKeywords:
                    entry.documentKeywords || doc.fileKeywords || [],
                });
              }
            } catch (error) {
              console.log(`Skipping invalid document ID: ${documentId}`);
            }
          }
        }

        await ctx.db.patch(chatbot._id, {
          DocwithDescriptions: updatedEntries,
          totalDocuments: updatedEntries.length,
        });

        migratedCount++;
      }
    }

    return {
      success: true,
      migratedChatbots: migratedCount,
      message: "Migration complete. Now remove optional fields from schema.",
    };
  },
});

// convex/migration.ts

export const clearAllData = mutation({
  args: {},
  handler: async (ctx) => {
    // Clear all documents
    const docs = await ctx.db.query("documents").collect();
    for (const doc of docs) {
      await ctx.db.delete(doc._id);
    }

    // Clear DocwithDescriptions in chatbots
    const chatbots = await ctx.db.query("chatbots").collect();
    for (const chatbot of chatbots) {
      await ctx.db.patch(chatbot._id, {
        DocwithDescriptions: [],
        totalDocuments: 0,
      });
    }

    return { success: true };
  },
});
