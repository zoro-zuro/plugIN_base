"use client";

import { use, useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  FiMessageSquare,
  FiList,
  FiThumbsDown,
  FiClock,
  FiSearch,
  FiThumbsUp,
  FiFilter,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Tab = "chats" | "logs";
type FeedbackFilter = "all" | "positive" | "negative" | "no-feedback";

// ✅ Stat Card Component
function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: number;
  color: string;
}) {
  const colorClasses = {
    blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600",
    purple: "bg-purple-50 dark:bg-purple-900/20 text-purple-600",
    green: "bg-green-50 dark:bg-green-900/20 text-green-600",
    red: "bg-red-50 dark:bg-red-900/20 text-red-600",
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
      <div
        className={`inline-flex p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]} mb-4`}
      >
        <Icon className="text-2xl" />
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900 dark:text-white">
        {value}
      </p>
    </div>
  );
}

// ✅ Session Group Component
function SessionGroup({
  sessionId,
  messages,
  isExpanded,
  onToggle,
}: {
  sessionId: string;
  messages: any[];
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const userMessages = messages.filter((m) => m.role === "user").length;
  const aiMessages = messages.filter((m) => m.role === "assistant").length;
  const startTime = messages[0]?.timestamp;
  const positiveCount = messages.filter(
    (m) => m.feedback === "positive",
  ).length;
  const negativeCount = messages.filter(
    (m) => m.feedback === "negative",
  ).length;

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden mb-4">
      {/* Session Header */}
      <button
        onClick={onToggle}
        className="w-full bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 px-6 py-4 flex items-center justify-between transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
            <span className="font-medium text-gray-900 dark:text-white">
              Session {sessionId.slice(-8)}
            </span>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span>{new Date(startTime).toLocaleString()}</span>
            <span>•</span>
            <span>{messages.length} messages</span>
            {positiveCount > 0 && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1 text-green-600">
                  <FiThumbsUp size={14} /> {positiveCount}
                </span>
              </>
            )}
            {negativeCount > 0 && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1 text-red-600">
                  <FiThumbsDown size={14} /> {negativeCount}
                </span>
              </>
            )}
          </div>
        </div>
      </button>

      {/* Session Messages */}
      {isExpanded && (
        <div className="bg-white dark:bg-gray-800">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Message
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Response Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Feedback
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {messages.map((msg, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        msg.role === "user"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                      }`}
                    >
                      {msg.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white max-w-md">
                    <div className="line-clamp-2">{msg.content}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {msg.responseTime ? `${msg.responseTime}ms` : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {msg.feedback === "positive" && (
                      <span className="flex items-center gap-1 text-green-600">
                        <FiThumbsUp size={16} /> Positive
                      </span>
                    )}
                    {msg.feedback === "negative" && (
                      <span className="flex items-center gap-1 text-red-600">
                        <FiThumbsDown size={16} /> Negative
                      </span>
                    )}
                    {!msg.feedback && <span className="text-gray-400">-</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function ActivityPage({
  params,
}: {
  params: Promise<{ chatbotId: string }>;
}) {
  const { chatbotId } = use(params);
  const [activeTab, setActiveTab] = useState<Tab>("chats");
  const [timeRange, setTimeRange] = useState<"today" | "week" | "month">(
    "week",
  );

  // ✅ Logs filters
  const [logDateFilter, setLogDateFilter] = useState<
    "today" | "week" | "month" | "all"
  >("today");
  const [feedbackFilter, setFeedbackFilter] = useState<FeedbackFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(
    new Set(),
  );

  const chatbot = useQuery(api.documents.getChatbotById, { chatbotId });

  // Calculate date range for chats tab
  const { startDate, endDate } = useMemo(() => {
    const now = Date.now();
    const ranges = {
      today: now - 24 * 60 * 60 * 1000,
      week: now - 7 * 24 * 60 * 60 * 1000,
      month: now - 30 * 24 * 60 * 60 * 1000,
    };
    return { startDate: ranges[timeRange], endDate: now };
  }, [timeRange]);

  const analytics = useQuery(api.analytics.getChatAnalytics, {
    chatbotId,
    startDate,
    endDate,
  });

  const logs = useQuery(api.analytics.getMessageLogs, {
    chatbotId,
    limit: 1000,
  });

  // ✅ FILTER AND GROUP LOGS BY SESSION
  const groupedLogs = useMemo(() => {
    if (!logs) return null;

    // 1️⃣ FILTER BY DATE
    const now = Date.now();
    const dateRanges = {
      today: now - 24 * 60 * 60 * 1000,
      week: now - 7 * 24 * 60 * 60 * 1000,
      month: now - 30 * 24 * 60 * 60 * 1000,
      all: 0,
    };

    let filtered = logs.messages.filter(
      (msg) => msg.timestamp >= dateRanges[logDateFilter],
    );

    // 2️⃣ FILTER BY FEEDBACK
    if (feedbackFilter !== "all") {
      filtered = filtered.filter((msg) => {
        if (feedbackFilter === "positive") return msg.feedback === "positive";
        if (feedbackFilter === "negative") return msg.feedback === "negative";
        if (feedbackFilter === "no-feedback") return !msg.feedback;
        return true;
      });
    }

    // 3️⃣ FILTER BY SEARCH
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((msg) =>
        msg.content.toLowerCase().includes(query),
      );
    }

    // 4️⃣ GROUP BY SESSION ID
    const grouped = filtered.reduce(
      (acc, msg) => {
        if (!acc[msg.sessionId]) {
          acc[msg.sessionId] = [];
        }
        acc[msg.sessionId].push(msg);
        return acc;
      },
      {} as Record<string, any[]>,
    );

    // 5️⃣ SORT MESSAGES IN EACH SESSION BY TIMESTAMP
    Object.keys(grouped).forEach((sessionId) => {
      grouped[sessionId].sort((a, b) => a.timestamp - b.timestamp);
    });

    // 6️⃣ CONVERT TO ARRAY AND SORT SESSIONS BY MOST RECENT
    const sessions = Object.entries(grouped)
      .map(([sessionId, messages]) => ({
        sessionId,
        messages,
        startTime: messages[0].timestamp,
      }))
      .sort((a, b) => b.startTime - a.startTime);

    return sessions;
  }, [logs, logDateFilter, feedbackFilter, searchQuery]);

  const toggleSession = (sessionId: string) => {
    setExpandedSessions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId);
      } else {
        newSet.add(sessionId);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    if (groupedLogs) {
      setExpandedSessions(new Set(groupedLogs.map((s) => s.sessionId)));
    }
  };

  const collapseAll = () => {
    setExpandedSessions(new Set());
  };

  if (!chatbot) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading chatbot...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Activity
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor conversations and message logs
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab("chats")}
            className={`pb-3 px-4 font-medium transition-all ${
              activeTab === "chats"
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2">
              <FiMessageSquare />
              Chats
            </div>
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`pb-3 px-4 font-medium transition-all ${
              activeTab === "logs"
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2">
              <FiList />
              Logs
            </div>
          </button>
        </div>

        {/* Chats Tab */}
        {activeTab === "chats" && (
          <div className="space-y-6">
            {/* Time Range Selector */}
            <div className="flex gap-2">
              {(["today", "week", "month"] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-lg font-medium capitalize transition-all ${
                    timeRange === range
                      ? "bg-indigo-600 text-white"
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  {range === "today"
                    ? "Today"
                    : range === "week"
                      ? "Last 7 Days"
                      : "Last 30 Days"}
                </button>
              ))}
            </div>

            {!analytics ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">
                  Loading analytics...
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard
                    icon={FiMessageSquare}
                    label="Total chats"
                    value={analytics.totalChats}
                    color="blue"
                  />
                  <StatCard
                    icon={FiMessageSquare}
                    label="Total messages"
                    value={analytics.totalMessages}
                    color="purple"
                  />
                  <StatCard
                    icon={FiClock}
                    label="Average messages"
                    value={analytics.avgMessages}
                    color="green"
                  />
                  <StatCard
                    icon={FiThumbsDown}
                    label="Messages with thumbs down"
                    value={analytics.thumbsDown}
                    color="red"
                  />
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                    Chats by Hour
                  </h3>
                  {analytics.hourlyChats && analytics.hourlyChats.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={analytics.hourlyChats}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis
                          dataKey="hour"
                          stroke="#9CA3AF"
                          style={{ fontSize: "12px" }}
                        />
                        <YAxis stroke="#9CA3AF" style={{ fontSize: "12px" }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1F2937",
                            border: "none",
                            borderRadius: "8px",
                            color: "#fff",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="count"
                          stroke="#8B5CF6"
                          fill="#8B5CF6"
                          fillOpacity={0.6}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                      No hourly data available yet
                    </p>
                  )}
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                    Chats by Country
                  </h3>
                  {analytics.chatsByCountry &&
                  analytics.chatsByCountry.length > 0 ? (
                    <div className="space-y-3">
                      {analytics.chatsByCountry.slice(0, 10).map((item) => (
                        <div
                          key={item.country}
                          className="flex items-center justify-between"
                        >
                          <span className="text-gray-700 dark:text-gray-300">
                            {item.country}
                          </span>
                          <div className="flex items-center gap-3">
                            <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-indigo-600 h-2 rounded-full"
                                style={{
                                  width: `${analytics.totalChats > 0 ? (item.count / analytics.totalChats) * 100 : 0}%`,
                                }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white w-8 text-right">
                              {item.count}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                      No geographic data available yet
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ✅ LOGS TAB WITH SESSION GROUPING */}
        {activeTab === "logs" && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search messages..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <select
                    value={logDateFilter}
                    onChange={(e) => setLogDateFilter(e.target.value as any)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="today">Today</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                    <option value="all">All Time</option>
                  </select>
                </div>

                <div>
                  <select
                    value={feedbackFilter}
                    onChange={(e) =>
                      setFeedbackFilter(e.target.value as FeedbackFilter)
                    }
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="all">All Feedback</option>
                    <option value="positive">👍 Positive Only</option>
                    <option value="negative">👎 Negative Only</option>
                    <option value="no-feedback">No Feedback</option>
                  </select>
                </div>
              </div>

              {groupedLogs && (
                <div className="flex items-center justify-between mt-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Showing {groupedLogs.length} session(s)
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={expandAll}
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      Expand All
                    </button>
                    <span className="text-gray-400">|</span>
                    <button
                      onClick={collapseAll}
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      Collapse All
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Session Groups */}
            {!groupedLogs ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">
                  Loading logs...
                </p>
              </div>
            ) : groupedLogs.length > 0 ? (
              <div>
                {groupedLogs.map((session) => (
                  <SessionGroup
                    key={session.sessionId}
                    sessionId={session.sessionId}
                    messages={session.messages}
                    isExpanded={expandedSessions.has(session.sessionId)}
                    onToggle={() => toggleSession(session.sessionId)}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
                <FiFilter className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-lg">
                  No messages found
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                  Try adjusting your filters
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
