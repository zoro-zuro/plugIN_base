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
