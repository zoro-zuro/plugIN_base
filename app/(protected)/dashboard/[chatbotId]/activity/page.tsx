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
  FiCalendar,
  FiBarChart2,
} from "react-icons/fi";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { CustomSelect } from "@/components/ui/Field";
import SessionGroup from "@/components/ui/SessionGroup";
import StatCard from "@/components/ui/StateCard";
import WorldGlobe from "@/components/ui/WorldGlobe";

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

export default function ActivityPage({
  params,
}: {
  params: Promise<{ chatbotId: string }>;
}) {
  const { chatbotId } = use(params);
  const [activeTab, setActiveTab] = useState<Tab>("chats");
  const [isGlobeLive, setIsGlobeLive] = useState(true);
  const [timeRange, setTimeRange] = useState<"today" | "week" | "month" | "custom">(
    "today",
  );
  const [customRange, setCustomRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

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
    if (timeRange === "custom") {
       return {
         startDate: new Date(customRange.start).getTime(),
         endDate: new Date(customRange.end).getTime() + 24 * 60 * 60 * 1000 - 1
       };
    }
    const now = Date.now();
    const ranges = {
      today: now - 24 * 60 * 60 * 1000,
      week: now - 7 * 24 * 60 * 60 * 1000,
      month: now - 30 * 24 * 60 * 60 * 1000,
    };
    return { startDate: ranges[timeRange], endDate: now };
  }, [timeRange, customRange]); 

  // Use a query hook that matches your backend API types
  const analytics = useQuery(api.analytics.getChatAnalytics, {
    chatbotId,
    startDate,
    endDate,
    timezone: userTimeZone,
  });

  // ✅ Real-time live session markers (last 5 min) — Convex auto-updates this reactively
  const liveData = useQuery(api.analytics.getActiveSessionMarkers, { chatbotId });

  const logs = useQuery(api.analytics.getMessageLogs, {
    chatbotId,
    limit: 1000,
  });

  // Pick markers: if Live mode → real-time active sessions; if Static → historical period
  const globeMarkers = isGlobeLive
    ? (liveData?.markers ?? [])
    : (analytics?.locationMarkers ?? []);

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
    <div className="md:pb-8 pb-8 pt-8 px-6 md:px-10 animate-fade-in max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 border-b border-border pb-6">
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
          <div className="flex flex-col md:flex-row items-center justify-end gap-4">
            {timeRange === "custom" && (
                <div className="flex items-center gap-2 bg-card border border-border px-4 py-1.5 rounded-xl shadow-sm animate-fade-in">
                   <input 
                    type="date" 
                    value={customRange.start}
                    onChange={(e) => setCustomRange({...customRange, start: e.target.value})}
                    className="bg-transparent border-none text-xs text-foreground focus:ring-0" 
                   />
                   <span className="text-muted-foreground">→</span>
                   <input 
                    type="date" 
                    value={customRange.end}
                    onChange={(e) => setCustomRange({...customRange, end: e.target.value})}
                    className="bg-transparent border-none text-xs text-foreground focus:ring-0" 
                   />
                </div>
            )}
            <div className="inline-flex bg-card border border-border rounded-lg p-1 shadow-sm">
              {(["today", "week", "month", "custom"] as const).map((range) => (
                <button
                  type="button"
                  key={range}
                  onClick={(e) => { e.preventDefault(); setTimeRange(range); }}
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
                      : range === "month"
                        ? "30 Days"
                        : "Custom"}
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
                {/* ... inside the Chart Grid div ... */}
                <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                      <FiBarChart2 className="text-primary" /> Volume Trends
                    </h3>
                    {/* Add a simple legend/context if needed */}
                    <span className="text-xs text-muted-foreground">
                      {timeRange === "today" ? "Messages per hour" : "Messages per day"} (
                      {timeRange === "today" ? "24h" : timeRange})
                    </span>
                  </div>

                  {analytics.hourlyChats?.length > 0 ? (
                    <div className="h-[350px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={timeRange === "today" ? analytics.hourlyChats : analytics.dailyChats}
                          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="hsl(var(--border))"
                            vertical={false}
                            opacity={0.4}
                          />
                          <XAxis
                            dataKey={timeRange === "today" ? "hour" : "date"}
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                            tickFormatter={(value) => {
                              if (timeRange !== "today") return value;
                              const hour = parseInt(value.split(":")[0]);
                              if (isNaN(hour)) return value;
                              const ampm = hour >= 12 ? "PM" : "AM";
                              const h = hour % 12 || 12;
                              return `${h} ${ampm}`;
                            }}
                            interval={timeRange === "today" ? 3 : "preserveStartEnd"}
                          />
                          <YAxis
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            dx={-10}
                            allowDecimals={false}
                          />
                          <Tooltip
                            contentStyle={{
                                backgroundColor: "hsl(var(--card))",
                                borderColor: "hsl(var(--border))",
                                borderRadius: "12px",
                                padding: "12px",
                                color: "hsl(var(--foreground))",
                            }}
                            cursor={{ fill: "hsl(var(--primary))", opacity: 0.1 }}
                            formatter={(value: number) => [`${value} msg`, "Volume"]}
                            labelFormatter={(label) => {
                                if (timeRange !== "today") return label;
                                const hour = parseInt(label.split(":")[0]);
                                if (isNaN(hour)) return label;
                                const ampm = hour >= 12 ? "PM" : "AM";
                                const h = hour % 12 || 12;
                                return `${h}:00 ${ampm}`;
                            }}
                          />
                          <Bar
                            dataKey="count"
                            radius={[6, 6, 0, 0]}
                            animationDuration={1500}
                          >
                            {(timeRange === "today" ? analytics.hourlyChats : analytics.dailyChats).map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.count > 0 ? "hsl(var(--primary))" : "transparent"} 
                                fillOpacity={0.8}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-[350px] flex flex-col items-center justify-center text-muted-foreground bg-muted/10 rounded-xl">
                      <FiBarChart2 size={40} className="mb-4 opacity-20" />
                      <p>No traffic data for this period</p>
                    </div>
                  )}
                </div>

                {/* Global Presence — Light Horizon Mode with Gradient Corners */}
                <div className="relative bg-card border border-border rounded-xl p-6 shadow-sm overflow-hidden h-fit group transition-all duration-300">
                  {/* High-Fidelity Corner Gradients */}
                  <div className="absolute top-0 left-0 w-32 h-32 bg-radial from-[#EAB564]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                  <div className="absolute bottom-0 right-0 w-32 h-32 bg-radial from-[#EAB564]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                  {/* Card Header with Live/Static Toggle */}
                  <div className="flex items-start justify-between mb-4 relative z-10">
                    <div>
                      <h3 className="text-lg font-bold text-foreground">Global Presence</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {isGlobeLive
                          ? liveData?.activeCount
                            ? `${liveData.activeCount} user${liveData.activeCount !== 1 ? "s" : ""} active now`
                            : "No active sessions right now"
                          : "Showing sessions for selected period"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsGlobeLive((v) => !v)}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all shrink-0 ${isGlobeLive
                        ? "bg-primary/20 text-primary border-primary/30"
                        : "bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full inline-block ${isGlobeLive ? "bg-primary animate-ping" : "bg-muted-foreground"}`} />
                      {isGlobeLive ? "Live" : "Static"}
                    </button>
                  </div>

                  {/* Globe — Using Light-Ink mode for Parchment blending */}
                  <WorldGlobe markers={globeMarkers} isLive={isGlobeLive} lightMode={true} />

                  {/* Country List — scrollable, fixed height */}
                  <div className="mt-4 space-y-2 max-h-[120px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                     {(isGlobeLive ? (liveData?.chatsByCountry ?? []) : (analytics?.chatsByCountry ?? [])).map(item => (
                         <div key={item.country} className="flex items-center justify-between text-xs animate-in fade-in duration-300">
                             <span className="text-muted-foreground font-medium flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary" /> {item.country}
                             </span>
                             <span className="text-foreground font-bold">{item.count} {isGlobeLive ? "active" : "sessions"}</span>
                         </div>
                     ))}
                     {isGlobeLive && (!liveData?.chatsByCountry || liveData.chatsByCountry.length === 0) && (
                         <div className="text-[10px] text-muted-foreground italic text-center py-4">
                            Waiting for active sessions...
                         </div>
                     )}
                  </div>
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
                <CustomSelect
                  value={logDateFilter}
                  onChange={(val) => setLogDateFilter(val as any)}
                  icon={FiCalendar}
                  options={[
                    { value: "today", label: "Today" },
                    { value: "week", label: "Last 7 Days" },
                    { value: "month", label: "Last 30 Days" },
                    { value: "all", label: "All Time" },
                  ]}
                />
              </div>

              {/* Feedback Filter */}
              <div className="md:col-span-4">
                <CustomSelect
                  value={feedbackFilter}
                  onChange={(val) => setFeedbackFilter(val as any)}
                  icon={FiFilter}
                  options={[
                    { value: "all", label: "All Feedback" },
                    {
                      value: "positive",
                      label: "Positive Only",
                      icon: FiThumbsUp,
                    },
                    {
                      value: "negative",
                      label: "Negative Only",
                      icon: FiThumbsDown,
                    },
                    { value: "no-feedback", label: "No Feedback" },
                  ]}
                />
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
