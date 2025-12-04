"use client";

import { useState } from "react";
import { usePathname, useRouter, useParams } from "next/navigation";
import {
  FiMessageSquare,
  FiDatabase,
  FiBarChart2,
  FiSettings,
  FiActivity,
  FiUsers,
  FiMenu,
  FiX,
  FiLogOut,
  FiZap,
  FiZapOff,
} from "react-icons/fi";
import { GrDocumentTest } from "react-icons/gr";
import { RxRocket as FiRocket } from "react-icons/rx";
import { UserButton, useUser, SignOutButton } from "@clerk/nextjs";

const sidebarItems = [
  { name: "Playground", icon: FiMessageSquare, path: "playground" },
  { name: "Sources", icon: FiDatabase, path: "sources" },
  { name: "Evaluation", icon: GrDocumentTest, path: "eval" },
  { name: "Activity", icon: FiActivity, path: "activity" },
  // { name: "Contacts", icon: FiUsers, path: "contacts" },
  { name: "Deploy", icon: FiRocket, path: "deploy" },
  { name: "Settings", icon: FiSettings, path: "settings" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ✅ Use useParams hook instead of params prop
  const params = useParams();
  const chatbotId = params.chatbotId as string;

  console.log("Current chatbotId:", chatbotId);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();

  // TODO: Replace with actual connection check from settings/Convex
  const isConnected = false; // Placeholder - check if chatbot is embedded and active

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile Menu Toggle */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-card rounded-lg shadow-lg"
      >
        {isSidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 fixed md:static inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transition-transform duration-300 ease-in-out flex flex-col`}
      >
        {/* Logo/Brand */}
        <div className="h-16 flex items-center px-6 border-b border-border">
          <button
            onClick={() => router.push("/chatbots/manage")}
            className="text-xl font-bold hover:text-primary transition-colors"
          >
            PlugIN
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
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
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors cursor-pointer ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer Section */}
        <div className="border-t border-border bg-card">
          {/* Connection Status */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              {isConnected ? (
                <>
                  <FiZap size={20} className="text-green-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      Plugged In
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Connected to website
                    </p>
                  </div>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </>
              ) : (
                <>
                  <FiZapOff size={20} className="text-orange-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      Not Plugged
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Deploy to connect
                    </p>
                  </div>
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                </>
              )}
            </div>
          </div>

          {/* User Profile & Logout */}
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-10 h-10",
                  },
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.firstName || user?.username || "User"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.emailAddresses[0]?.emailAddress}
                </p>
              </div>
            </div>

            <SignOutButton>
              <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                <FiLogOut size={16} />
                <span>Logout</span>
              </button>
            </SignOutButton>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto">{children}</main>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="md:hidden fixed inset-0 bg-black/50 z-30"
        />
      )}
    </div>
  );
}
