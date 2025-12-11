import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Track new chat session
export const startChatSession = mutation({
  args: {
    chatbotId: v.string(),
    namespace: v.string(),
    sessionId: v.string(),
    userCountry: v.optional(v.string()),
    userCity: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("chat_sessions", {
      chatbotId: args.chatbotId,
      namespace: args.namespace,
      sessionId: args.sessionId,
      startTime: Date.now(),
      messageCount: 0,
      userCountry: args.userCountry,
      userCity: args.userCity,
    });
  },
});

// Track message
export const trackMessage = mutation({
  args: {
    chatbotId: v.string(),
    namespace: v.string(),
    sessionId: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    responseTime: v.optional(v.number()),
    sources: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // Insert message
    const messageId = await ctx.db.insert("chat_messages", {
      chatbotId: args.chatbotId,
      namespace: args.namespace,
      sessionId: args.sessionId,
      role: args.role,
      content: args.content,
      timestamp: Date.now(),
      responseTime: args.responseTime,
      sources: args.sources,
    });

    // Update session message count
    const session = await ctx.db
      .query("chat_sessions")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (session) {
      await ctx.db.patch(session._id, {
        messageCount: session.messageCount + 1,
        endTime: Date.now(),
      });
    }

    return messageId;
  },
});

// Get chat analytics (for Chats tab)
export const getChatAnalytics = query({
  args: {
    chatbotId: v.string(),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    // Get all sessions in date range
    const sessions = await ctx.db
      .query("chat_sessions")
      .withIndex("by_chatbot_time", (q) => q.eq("chatbotId", args.chatbotId))
      .filter((q) =>
        q.and(
          q.gte(q.field("startTime"), args.startDate),
          q.lte(q.field("startTime"), args.endDate),
        ),
      )
      .collect();

    const sessionCount = sessions.filter((s) => {
      return s.messageCount > 0;
    });

    // Get all messages in date range
    const messages = await ctx.db
      .query("chat_messages")
      .withIndex("by_chatbot_time", (q) => q.eq("chatbotId", args.chatbotId))
      .filter((q) =>
        q.and(
          q.gte(q.field("timestamp"), args.startDate),
          q.lte(q.field("timestamp"), args.endDate),
        ),
      )
      .collect();

    // Calculate metrics
    const totalChats = sessionCount.length;
    const totalMessages = messages.length;
    const receivedMessages = messages.filter((m) => m.role === "user").length;
    const sentMessages = messages.filter((m) => m.role === "assistant").length;

    // Average messages per chat
    const avgMessages = totalChats > 0 ? totalMessages / totalChats : 0;

    // Calculate messages with thumbs down
    const thumbsDown = messages.filter((m) => m.feedback === "negative").length;

    // Group chats by country
    const chatsByCountry: Record<string, number> = {};
    sessionCount.forEach((session) => {
      const country = session.userCountry || "Unknown";
      chatsByCountry[country] = (chatsByCountry[country] || 0) + 1;
    });

    // Hourly distribution (for wave chart)
    const hourlyData: Record<string, number> = {};
    messages.forEach((msg) => {
      const hour = new Date(msg.timestamp).getHours();
      const key = `${hour}:00`;
      hourlyData[key] = (hourlyData[key] || 0) + 1;
    });

    // Convert to array for chart
    const hourlyChats = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}:00`,
      count: hourlyData[`${i}:00`] || 0,
    }));

    return {
      totalChats,
      totalMessages,
      receivedMessages,
      sentMessages,
      avgMessages: parseFloat(avgMessages.toFixed(2)),
      thumbsDown,
      chatsByCountry: Object.entries(chatsByCountry)
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count),
      hourlyChats,
    };
  },
});

// Get message logs (for Logs tab)
export const getMessageLogs = query({
  args: {
    chatbotId: v.string(),
    limit: v.optional(v.number()),
    cursor: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    let query = ctx.db
      .query("chat_messages")
      .withIndex("by_chatbot_time", (q) => q.eq("chatbotId", args.chatbotId))
      .order("desc");

    if (args.cursor) {
      query = query.filter((q) => q.lt(q.field("timestamp"), args.cursor || 0));
    }

    const messages = await query.take(limit);

    return {
      messages,
      hasMore: messages.length === limit,
      nextCursor:
        messages.length > 0 ? messages[messages.length - 1].timestamp : null,
    };
  },
});

// Add feedback to message
export const addMessageFeedback = mutation({
  args: {
    messageId: v.id("chat_messages"),
    feedback: v.union(v.literal("positive"), v.literal("negative")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.messageId, {
      feedback: args.feedback,
    });
  },
});

// Get total chats for dashboard
export const getTotalChats = query({
  args: {
    chatbotId: v.string(),
  },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("chat_sessions")
      .withIndex("by_chatbot", (q) => q.eq("chatbotId", args.chatbotId))
      .collect();

    const sessionCount = sessions.filter((s) => {
      return s.messageCount > 0;
    });
    return sessionCount.length;
  },
});
