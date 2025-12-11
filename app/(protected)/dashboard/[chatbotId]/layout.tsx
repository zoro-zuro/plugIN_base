"use client";

import { useState } from "react";
import { usePathname, useRouter, useParams } from "next/navigation";
import {
  FiMessageSquare,
  FiDatabase,
  FiActivity,
  FiSettings,
  FiMenu,
  FiX,
  FiLogOut,
  FiZap,
  FiZapOff,
  FiSun,
  FiMoon,
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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const chatbotId = params.chatbotId as string;
  const { theme, toggleTheme } = useTheme();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();

  const chatbot = useQuery(api.documents.getChatbotById, { chatbotId });

  // Calculate connection status based on last activity
  const isConnected = chatbot?.lastActiveAt
    ? Date.now() - chatbot.lastActiveAt < 5 * 60 * 1000
    : false;

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      {/* Mobile Menu Toggle */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="md:hidden fixed top-4 right-4 z-50 p-2.5 bg-card border border-border rounded-xl shadow-lg hover:bg-muted transition-colors"
      >
        {isSidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
      </button>

      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="md:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-30 animate-fade-in"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 fixed md:static inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transition-transform duration-300 ease-in-out flex flex-col shadow-2xl md:shadow-none`}
      >
        {/* Logo/Brand Header */}
        <div className="h-20 flex justify-between items-center px-6 border-b border-border">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 group w-full"
          >
            {/* <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-fuchsia-600 text-white font-bold shadow-md group-hover:shadow-primary/25 transition-all">
              P
            </div> */}
            <span className="text-xl font-bold tracking-tight gradient-text group-hover:text-primary transition-colors">
              PlugIN
            </span>
          </button>
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="flex items-center p-2 rounded-full text-sm font-medium text-muted-foreground bg-muted hover:text-foreground transition-colors"
          >
            {theme === "dark" ? <FiSun size={16} /> : <FiMoon size={16} />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {/* Chatbot Name Header (Optional Context) */}
          {chatbot && (
            <div className="px-3 mb-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground truncate">
                <div className="w-2 h-2 rounded-full bg-primary" />
                {chatbot.name}
              </div>
            </div>
          )}

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
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon
                  size={18}
                  className={isActive ? "stroke-[2.5]" : "stroke-2"}
                />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer Section */}
        <div className="border-t border-border bg-muted/20">
          {/* Connection Status */}
          <div className="p-4">
            <div
              className={`flex items-center gap-3 p-3 rounded-xl border ${isConnected ? "bg-emerald-500/5 border-emerald-500/20" : "bg-orange-500/5 border-orange-500/20"}`}
            >
              {isConnected ? (
                <>
                  <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <FiZap size={16} className="fill-current" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                      Plugged In
                    </p>
                    <p className="text-xs text-emerald-600/80 dark:text-emerald-500/80 truncate">
                      System Online
                    </p>
                  </div>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                </>
              ) : (
                <>
                  <div className="h-8 w-8 rounded-lg bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center text-orange-600 dark:text-orange-400">
                    <FiZapOff size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-orange-700 dark:text-orange-400">
                      Disconnected
                    </p>
                    <p className="text-xs text-orange-600/80 dark:text-orange-500/80 truncate">
                      Waiting for data
                    </p>
                  </div>
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                </>
              )}
            </div>
          </div>

          {/* User Profile, Theme & Logout */}
          <div className="p-4 pt-0 space-y-2">
            <div className="flex items-center gap-3 px-1 py-2">
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-9 h-9 ring-2 ring-primary/20",
                  },
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {user?.firstName || user?.username || "User"}
                </p>
                <p className="text-xs text-muted-foreground truncate opacity-80">
                  {user?.emailAddresses[0]?.emailAddress}
                </p>
              </div>

              <SignOutButton>
                <button
                  className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors bg-muted"
                  title="Logout"
                >
                  <FiLogOut size={16} />
                </button>
              </SignOutButton>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-y-auto bg-background/50 relative">
        {/* Top fade for scroll indication */}
        <div className="sticky top-0 h-8 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />

        <div className="px-4 md:px-8 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
