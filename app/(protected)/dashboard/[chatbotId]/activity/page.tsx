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
  FiCalendar,
  FiBarChart2,
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
import { IconType } from "react-icons";

type Tab = "chats" | "logs";
type FeedbackFilter = "all" | "positive" | "negative" | "no-feedback";

interface MessageLog {
  _id: string;
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  feedback?: "positive" | "negative";
  responseTime?: number;
}

// ✅ Stat Card Component
function StatCard({
  icon: Icon,
  label,
  value,
  variant = "primary",
}: {
  icon: IconType;
  label: string;
  value: number;
  variant?: "primary" | "secondary" | "accent" | "destructive";
}) {
  const variants = {
    primary: "bg-primary/10 text-primary ring-primary/20",
    secondary: "bg-secondary text-secondary-foreground ring-border",
    accent:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20",
    destructive: "bg-destructive/10 text-destructive ring-destructive/20",
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div
        className={`inline-flex p-3 rounded-xl ring-1 ${variants[variant]} mb-4`}
      >
        <Icon className="text-xl" />
      </div>
      <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
      <p className="text-3xl font-bold text-foreground tracking-tight">
        {value.toLocaleString()}
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
  messages: MessageLog[];
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const startTime = messages[0]?.timestamp;
  const positiveCount = messages.filter(
    (m) => m.feedback === "positive",
  ).length;
  const negativeCount = messages.filter(
    (m) => m.feedback === "negative",
  ).length;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden mb-4 transition-all duration-300 hover:border-primary/30">
      {/* Session Header */}
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div
            className={`p-2 rounded-lg transition-colors ${isExpanded ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
          >
            {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
          </div>
          <div className="text-left">
            <div className="font-semibold text-foreground flex items-center gap-2">
              Session {sessionId.slice(-8)}
              {negativeCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-destructive" />
              )}
            </div>
            <div className="text-xs text-muted-foreground font-mono">
              {sessionId}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="hidden md:flex items-center gap-2 bg-muted/50 px-3 py-1 rounded-lg">
            <FiClock size={14} />
            <span>{new Date(startTime).toLocaleString()}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-medium text-foreground">
              {messages.length} msgs
            </span>

            {(positiveCount > 0 || negativeCount > 0) && (
              <div className="flex items-center gap-2 border-l border-border pl-3">
                {positiveCount > 0 && (
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2 py-1 rounded">
                    <FiThumbsUp size={12} /> {positiveCount}
                  </span>
                )}
                {negativeCount > 0 && (
                  <span className="flex items-center gap-1 text-destructive text-xs font-bold bg-destructive/10 px-2 py-1 rounded">
                    <FiThumbsDown size={12} /> {negativeCount}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </button>

      {/* Session Messages */}
      {isExpanded && (
        <div className="border-t border-border bg-muted/5">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground font-semibold">
                <tr>
                  <th className="px-6 py-3">Time</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3 w-1/2">Message</th>
                  <th className="px-6 py-3">Latency</th>
                  <th className="px-6 py-3">Feedback</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {messages.map((msg, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-muted/30 transition-colors group"
                  >
                    <td className="px-6 py-4 text-sm text-muted-foreground whitespace-nowrap font-mono">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 text-xs font-bold rounded-md uppercase tracking-wide ${
                          msg.role === "user"
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        {msg.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground max-w-lg">
                      <div className="line-clamp-2 group-hover:line-clamp-none transition-all">
                        {msg.content}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground font-mono">
                      {msg.responseTime ? (
                        <span
                          className={`${msg.responseTime > 2000 ? "text-orange-500" : "text-emerald-600"}`}
                        >
                          {msg.responseTime}ms
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {msg.feedback === "positive" && (
                        <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                          <FiThumbsUp size={14} className="fill-current/20" />{" "}
                          Positive
                        </span>
                      )}
                      {msg.feedback === "negative" && (
                        <span className="inline-flex items-center gap-1.5 text-destructive font-medium">
                          <FiThumbsDown size={14} className="fill-current/20" />{" "}
                          Negative
                        </span>
                      )}
                      {!msg.feedback && (
                        <span className="text-muted-foreground/30">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

  // ✅ Fix: Calculate stable dates using useMemo
  // This ensures "now" is calculated once when timeRange changes, not every render
  const { startDate, endDate } = useMemo(() => {
    const now = Date.now();
    const ranges = {
      today: now - 24 * 60 * 60 * 1000,
      week: now - 7 * 24 * 60 * 60 * 1000,
      month: now - 30 * 24 * 60 * 60 * 1000,
    };
    return { startDate: ranges[timeRange], endDate: now };
  }, [timeRange]); // Only recalculate when user changes the filter

  // Use a query hook that matches your backend API types
  const analytics = useQuery(api.analytics.getChatAnalytics, {
    chatbotId,
    startDate, // Uses memoized value
    endDate, // Uses memoized value
  });

  const logs = useQuery(api.analytics.getMessageLogs, {
    chatbotId,
    limit: 1000,
  });

  // ✅ FILTER AND GROUP LOGS BY SESSION
  const groupedLogs = useMemo(() => {
    if (!logs) return null;

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

    if (feedbackFilter !== "all") {
      filtered = filtered.filter((msg) => {
        if (feedbackFilter === "positive") return msg.feedback === "positive";
        if (feedbackFilter === "negative") return msg.feedback === "negative";
        if (feedbackFilter === "no-feedback") return !msg.feedback;
        return true;
      });
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((msg) =>
        msg.content.toLowerCase().includes(query),
      );
    }

    const grouped = filtered.reduce(
      (acc, msg) => {
        if (!acc[msg.sessionId]) {
          acc[msg.sessionId] = [];
        }
        acc[msg.sessionId].push(msg as MessageLog);
        return acc;
      },
      {} as Record<string, MessageLog[]>,
    );

    Object.keys(grouped).forEach((sessionId) => {
      grouped[sessionId].sort((a, b) => a.timestamp - b.timestamp);
    });

    return Object.entries(grouped)
      .map(([sessionId, messages]) => ({
        sessionId,
        messages,
        startTime: messages[0].timestamp,
      }))
      .sort((a, b) => b.startTime - a.startTime);
  }, [logs, logDateFilter, feedbackFilter, searchQuery]);

  const toggleSession = (sessionId: string) => {
    setExpandedSessions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sessionId)) newSet.delete(sessionId);
      else newSet.add(sessionId);
      return newSet;
    });
  };

  const expandAll = () => {
    if (groupedLogs) {
      setExpandedSessions(new Set(groupedLogs.map((s) => s.sessionId)));
    }
  };

  const collapseAll = () => setExpandedSessions(new Set());

  if (!analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="h-12 w-12 rounded-xl bg-primary/20" />
          <p className="text-muted-foreground font-medium">
            Loading activity data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">
            Activity
          </h1>
          <p className="text-muted-foreground">
            Analyze conversation metrics and debug session logs.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="bg-muted p-1 rounded-xl inline-flex">
          {["chats", "logs"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as Tab)}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab
                  ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="flex items-center gap-2 capitalize">
                {tab === "chats" ? <FiBarChart2 /> : <FiList />}
                {tab}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* CHATS TAB (Analytics) */}
      {activeTab === "chats" && (
        <div className="space-y-8 animate-slide-up">
          {/* Time Range Filter */}
          <div className="flex justify-end">
            <div className="inline-flex bg-card border border-border rounded-lg p-1 shadow-sm">
              {(["today", "week", "month"] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    timeRange === range
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {range === "today"
                    ? "24h"
                    : range === "week"
                      ? "7 Days"
                      : "30 Days"}
                </button>
              ))}
            </div>
          </div>

          {!analytics ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-pulse">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-32 bg-card rounded-2xl border border-border"
                />
              ))}
            </div>
          ) : (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  icon={FiMessageSquare}
                  label="Total Chats"
                  value={analytics.totalChats}
                  variant="primary"
                />
                <StatCard
                  icon={FiList}
                  label="Total Messages"
                  value={analytics.totalMessages}
                  variant="secondary"
                />
                <StatCard
                  icon={FiClock}
                  label="Avg. Messages / Chat"
                  value={Math.round(analytics.avgMessages * 10) / 10}
                  variant="accent"
                />
                <StatCard
                  icon={FiThumbsDown}
                  label="Negative Feedback"
                  value={analytics.thumbsDown}
                  variant="destructive"
                />
              </div>

              {/* Chart Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Area Chart */}
                <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                    <FiBarChart2 className="text-primary" /> Volume Trends
                  </h3>
                  {analytics.hourlyChats?.length > 0 ? (
                    <div className="h-[350px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analytics.hourlyChats}>
                          <defs>
                            <linearGradient
                              id="colorChats"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="hsl(var(--primary))"
                                stopOpacity={0.3}
                              />
                              <stop
                                offset="95%"
                                stopColor="hsl(var(--primary))"
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="hsl(var(--border))"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="hour"
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                          />
                          <YAxis
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            dx={-10}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              borderColor: "hsl(var(--border))",
                              borderRadius: "12px",
                              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                              color: "hsl(var(--foreground))",
                            }}
                            cursor={{
                              stroke: "hsl(var(--primary))",
                              strokeWidth: 1,
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="count"
                            stroke="hsl(var(--primary))"
                            strokeWidth={3}
                            fill="url(#colorChats)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-[350px] flex flex-col items-center justify-center text-muted-foreground bg-muted/10 rounded-xl">
                      <FiBarChart2 size={40} className="mb-4 opacity-20" />
                      <p>No traffic data for this period</p>
                    </div>
                  )}
                </div>

                {/* Country List */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-foreground mb-6">
                    Top Locations
                  </h3>
                  {analytics.chatsByCountry?.length > 0 ? (
                    <div className="space-y-5">
                      {analytics.chatsByCountry.slice(0, 8).map((item) => (
                        <div key={item.country} className="group">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-foreground flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-muted-foreground"></span>{" "}
                              {item.country}
                            </span>
                            <span className="text-sm font-bold text-muted-foreground group-hover:text-primary transition-colors">
                              {item.count}
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-primary to-fuchsia-500 h-2 rounded-full transition-all duration-1000 ease-out"
                              style={{
                                width: `${analytics.totalChats > 0 ? (item.count / analytics.totalChats) * 100 : 0}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                      <p>No location data</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* LOGS TAB (Session Debugging) */}
      {activeTab === "logs" && (
        <div className="space-y-6 animate-slide-up">
          {/* Filters Bar */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm sticky top-4 z-20">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              {/* Search */}
              <div className="md:col-span-5 relative">
                <FiSearch className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search message content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-muted/30 border border-input rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
              </div>

              {/* Date Filter */}
              <div className="md:col-span-3">
                <div className="relative">
                  <FiCalendar className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <select
                    value={logDateFilter}
                    onChange={(e) => setLogDateFilter(e.target.value as any)}
                    className="w-full pl-10 pr-4 py-2.5 appearance-none bg-muted/30 border border-input rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <option value="today">Today</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                    <option value="all">All Time</option>
                  </select>
                </div>
              </div>

              {/* Feedback Filter */}
              <div className="md:col-span-4">
                <div className="relative">
                  <FiFilter className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <select
                    value={feedbackFilter}
                    onChange={(e) =>
                      setFeedbackFilter(e.target.value as FeedbackFilter)
                    }
                    className="w-full pl-10 pr-4 py-2.5 appearance-none bg-muted/30 border border-input rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <option value="all">All Feedback</option>
                    <option value="positive">👍 Positive Only</option>
                    <option value="negative">👎 Negative Only</option>
                    <option value="no-feedback">No Feedback</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Bulk Actions */}
            {groupedLogs && groupedLogs.length > 0 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <p className="text-sm font-medium text-muted-foreground">
                  Showing{" "}
                  <span className="text-foreground">{groupedLogs.length}</span>{" "}
                  sessions
                </p>
                <div className="flex gap-4 text-sm font-semibold">
                  <button
                    onClick={expandAll}
                    className="text-primary hover:text-primary/80 transition-colors"
                  >
                    Expand All
                  </button>
                  <button
                    onClick={collapseAll}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Collapse All
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Session List */}
          {!groupedLogs ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-50 animate-pulse">
              <div className="h-10 w-10 bg-primary/20 rounded-full mb-4" />
              <p>Fetching logs...</p>
            </div>
          ) : groupedLogs.length > 0 ? (
            <div className="space-y-4">
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
            <div className="flex flex-col items-center justify-center py-20 bg-card border border-dashed border-border rounded-3xl">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <FiFilter className="text-2xl text-muted-foreground" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">
                No logs found
              </h3>
              <p className="text-muted-foreground">
                Try adjusting your filters to see more results.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
