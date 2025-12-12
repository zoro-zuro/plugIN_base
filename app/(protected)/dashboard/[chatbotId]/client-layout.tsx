"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  FiMessageSquare,
  FiDatabase,
  FiActivity,
  FiSettings,
  FiMenu,
  FiX,
  FiLogOut,
  FiSun,
  FiMoon,
  FiChevronDown,
  FiPlus,
  FiCheck,
} from "react-icons/fi";
import { LiaRocketSolid } from "react-icons/lia";
import { GrDocumentTest } from "react-icons/gr";
import { UserButton, useUser, SignOutButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useTheme } from "@/components/hooks/useTheme";

const sidebarItems = [
  { name: "Playground", icon: FiMessageSquare, path: "playground" },
  { name: "Sources", icon: FiDatabase, path: "sources" },
  { name: "Evaluation", icon: GrDocumentTest, path: "eval" },
  { name: "Activity", icon: FiActivity, path: "activity" },
  { name: "Deploy", icon: LiaRocketSolid, path: "deploy" },
  { name: "Settings", icon: FiSettings, path: "settings" },
];

export default function DashboardClientLayout({
  children,
  chatbotId,
}: {
  children: React.ReactNode;
  chatbotId: string;
}) {
  const { theme, toggleTheme } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoaded } = useUser();

  const chatbot = useQuery(api.documents.getChatbotById, { chatbotId });
  const allChatbots = useQuery(
    api.documents.getChatbotsByUserId,
    user?.id ? { userId: user.id } : "skip",
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChatbotChange = (botId: string) => {
    if (botId === "create_new") {
      router.push("/chatbot/create");
    } else {
      const currentSection = pathname?.split("/").pop() || "playground";
      router.push(`/dashboard/${botId}/${currentSection}`);
    }
    setIsDropdownOpen(false);
    setIsSidebarOpen(false); // Close mobile sidebar on selection
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden relative font-sans">
      {/* ✅ NEW: Sticky Mobile Header */}
      <div className="md:hidden fixed top-0 inset-x-0 h-16 bg-card border-b border-border flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-3 overflow-hidden">
          <button onClick={() => router.push("/")} className="shrink-0">
            <span className="text-xl font-bold tracking-tight text-primary">
              PlugIN
            </span>
          </button>
          <div className="h-6 w-px bg-border"></div>
          <span className="text-sm font-medium text-foreground truncate">
            {chatbot?.name || "Dashboard"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-muted-foreground hover:bg-muted transition-colors"
          >
            {theme === "dark" ? <FiSun size={18} /> : <FiMoon size={18} />}
          </button>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-lg text-foreground hover:bg-muted transition-colors"
          >
            <FiMenu size={24} />
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="md:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-50 animate-fade-in"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        } md:translate-x-0 fixed md:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transition-transform duration-300 ease-in-out flex flex-col`}
      >
        {/* Header */}
        <div className="h-20 flex justify-between items-center px-6 border-b border-border bg-card/50 backdrop-blur-xl">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 group w-full outline-none"
          >
            <span className="text-xl font-bold tracking-tight gradient-text group-hover:text-primary transition-colors">
              PlugIN
            </span>
          </button>

          <div className="flex items-center gap-1">
            {/* Desktop Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="hidden md:flex items-center p-2 rounded-full text-sm font-medium text-muted-foreground bg-muted hover:text-foreground hover:bg-muted/80 transition-all active:scale-95"
            >
              {theme === "dark" ? <FiSun size={16} /> : <FiMoon size={16} />}
            </button>

            {/* ✅ Close Button (Mobile Only) */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-hide">
          {/* Custom Dropdown */}
          <div className="relative mb-6" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-border bg-card hover:bg-accent/50 transition-all duration-200 group ${isDropdownOpen ? "ring-2 ring-primary/20 border-primary" : ""}`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center text-white font-bold shadow-md shrink-0">
                  {chatbot?.name?.charAt(0).toUpperCase() || "B"}
                </div>
                <div className="text-left truncate">
                  <p className="text-sm font-semibold text-foreground truncate max-w-[120px]">
                    {chatbot?.name || "Select Bot"}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                    {allChatbots?.length || 0} Bots
                  </p>
                </div>
              </div>
              <FiChevronDown
                className={`text-muted-foreground transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* Dropdown Menu */}
            <div
              className={`absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-xl shadow-xl z-50 overflow-hidden transition-all duration-200 glass-effect origin-top ${
                isDropdownOpen
                  ? "opacity-100 scale-100 translate-y-0"
                  : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
              }`}
            >
              <div className="max-h-[240px] overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar">
                {allChatbots?.map((bot) => (
                  <button
                    key={bot.chatbotId}
                    onClick={() => handleChatbotChange(bot.chatbotId)}
                    className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg text-sm transition-colors ${
                      bot.chatbotId === chatbotId
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${bot.chatbotId === chatbotId ? "bg-primary" : "bg-muted-foreground/30"}`}
                    />
                    <span className="truncate flex-1 text-left">
                      {bot.name}
                    </span>
                    {bot.chatbotId === chatbotId && <FiCheck size={14} />}
                  </button>
                ))}
              </div>

              <div className="p-1.5 border-t border-border bg-muted/30">
                <button
                  onClick={() => handleChatbotChange("create_new")}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
                >
                  <FiPlus size={16} /> Create New Chatbot
                </button>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const fullPath = `/dashboard/${chatbotId}/${item.path}`;
              const isActive = pathname === fullPath;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    router.push(fullPath);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 font-medium group relative overflow-hidden ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon
                    size={18}
                    className={`transition-transform duration-300 group-hover:scale-110 ${isActive ? "stroke-[2.5]" : "stroke-2"}`}
                  />
                  <span className="relative z-10">{item.name}</span>
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/10 space-y-4">
          {/* User Profile */}
          <div className="flex items-center justify-between gap-2 pl-1">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="transition-transform hover:scale-105 cursor-pointer">
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: { avatarBox: "w-8 h-8" },
                  }}
                />
              </div>
              {isLoaded && user ? (
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-foreground truncate leading-tight">
                    {user.fullName?.split(" ")[0] || "User"}
                  </span>
                  {/* <span className="text-[10px] text-muted-foreground truncate leading-tight">
                    Free Plan
                  </span> */}
                </div>
              ) : (
                <div className="w-20 h-8 bg-muted rounded animate-pulse" />
              )}
            </div>

            <SignOutButton>
              <button
                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all active:scale-95"
                title="Sign out"
              >
                <FiLogOut size={16} />
              </button>
            </SignOutButton>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-y-auto bg-background relative selection:bg-primary/20">
        {/* ✅ Pushes content down on mobile so it's not hidden by fixed header */}
        <div className="h-16 md:hidden" />

        <div className="sticky top-0 h-6 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none hidden md:block" />
        <div className="px-4 md:px-8 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
