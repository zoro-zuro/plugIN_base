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
    timezone: v.string(),
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

    // Group chats by country & generate globe markers
    const chatsByCountry: Record<string, number> = {};
    
    // Static mapping for common countries to enable the 3D globe without external geocoders
    const COUNTRY_COORDS: Record<string, [number, number]> = {
      "India": [20.5937, 78.9629],
      "United States": [37.0902, -95.7129],
      "United Kingdom": [55.3781, -3.436],
      "Germany": [51.1657, 10.4515],
      "France": [46.2276, 2.2137],
      "Canada": [56.1304, -106.3468],
      "Australia": [-25.2744, 133.7751],
      "Brazil": [-14.235, -51.9253],
      "Japan": [36.2048, 138.2529],
      "China": [35.8617, 104.1954],
      "Russia": [61.524, 105.3188],
      "Spain": [40.4637, -3.7492],
      "Italy": [41.8719, 12.5674],
      "Singapore": [1.3521, 103.8198],
      "United Arab Emirates": [23.4241, 53.8478],
    };

    sessionCount.forEach((session) => {
      const country = session.userCountry || "Unknown";
      chatsByCountry[country] = (chatsByCountry[country] || 0) + 1;
    });

    // Create markers for COBE globe
    const locationMarkers = Object.entries(chatsByCountry)
      .filter(([country]) => COUNTRY_COORDS[country])
      .map(([country, count]) => ({
        location: COUNTRY_COORDS[country],
        size: Math.min(0.1, 0.02 + (count / totalChats) * 0.08),
        label: country, // We can also aggregate city names here if needed
      }));

    // Hourly distribution
    const hourlyData: Record<string, number> = {};
    const hourFormatter = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: args.timezone || "UTC",
    });

    messages.forEach((msg) => {
      const hourStr = hourFormatter.format(new Date(msg.timestamp));
      let hour = parseInt(hourStr);
      if (hour === 24) hour = 0;
      const key = `${hour}:00`;
      hourlyData[key] = (hourlyData[key] || 0) + 1;
    });

    const hourlyChats = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}:00`,
      count: hourlyData[`${i}:00`] || 0,
    }));

    // Daily distribution
    const dailyData: Record<string, number> = {};
    messages.forEach((msg) => {
      const date = new Date(msg.timestamp).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        timeZone: args.timezone || "UTC",
      });
      dailyData[date] = (dailyData[date] || 0) + 1;
    });

    // FILL GAPS
    const dailyChats = [];
    let current = new Date(args.startDate);
    const end = new Date(args.endDate);
    while (current <= end) {
      const dateStr = current.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        timeZone: args.timezone || "UTC",
      });
      dailyChats.push({
        date: dateStr,
        count: dailyData[dateStr] || 0,
      });
      current.setDate(current.getDate() + 1);
    }

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
      locationMarkers,
      hourlyChats,
      dailyChats,
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

// ── Real-time active sessions (messages in the last 5 minutes) ──────────────
const COUNTRY_COORDS_LIVE: Record<string, [number, number]> = {
  "India": [20.5937, 78.9629],
  "United States": [37.0902, -95.7129],
  "United Kingdom": [55.3781, -3.436],
  "Germany": [51.1657, 10.4515],
  "France": [46.2276, 2.2137],
  "Canada": [56.1304, -106.3468],
  "Australia": [-25.2744, 133.7751],
  "Brazil": [-14.235, -51.9253],
  "Japan": [36.2048, 138.2529],
  "China": [35.8617, 104.1954],
  "Russia": [61.524, 105.3188],
  "Spain": [40.4637, -3.7492],
  "Italy": [41.8719, 12.5674],
  "Singapore": [1.3521, 103.8198],
  "United Arab Emirates": [23.4241, 53.8478],
};

export const getActiveSessionMarkers = query({
  args: { chatbotId: v.string() },
  handler: async (ctx, args) => {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

    // Find messages sent in the last 5 minutes
    const recentMessages = await ctx.db
      .query("chat_messages")
      .withIndex("by_chatbot_time", (q) => q.eq("chatbotId", args.chatbotId))
      .filter((q) => q.gte(q.field("timestamp"), fiveMinutesAgo))
      .collect();

    // Get unique active session IDs
    const activeSessionIds = [...new Set(recentMessages.map((m) => m.sessionId))];

    if (activeSessionIds.length === 0) return { markers: [], activeCount: 0 };

    // Fetch session details for those sessions
    const allSessions = await ctx.db
      .query("chat_sessions")
      .withIndex("by_chatbot", (q) => q.eq("chatbotId", args.chatbotId))
      .collect();

    const activeSessions = allSessions.filter((s) =>
      activeSessionIds.includes(s.sessionId)
    );

    // Group by country
    const byCountry: Record<string, number> = {};
    activeSessions.forEach((s) => {
      const country = s.userCountry || "Unknown";
      byCountry[country] = (byCountry[country] || 0) + 1;
    });

    const total = activeSessions.length;

    const markers = Object.entries(byCountry)
      .filter(([c]) => COUNTRY_COORDS_LIVE[c])
      .map(([country, count]) => ({
        location: COUNTRY_COORDS_LIVE[country],
        size: Math.min(0.12, 0.04 + (count / total) * 0.08),
        label: `${country} · ${count} active`,
      }));

    const chatsByCountryArray = Object.entries(byCountry).map(([country, count]) => ({
      country,
      count
    }));

    return { 
      markers, 
      activeCount: total,
      chatsByCountry: chatsByCountryArray
    };
  },
});
