"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  FiMessageSquare,
  FiDatabase,
  FiBarChart2,
  FiSettings,
  FiActivity,
  FiUsers,
  FiMenu,
  FiX,
} from "react-icons/fi";
import { GrDocumentTest } from "react-icons/gr";
import { RxRocket as FiRocket } from "react-icons/rx";

const sidebarItems = [
  { name: "Playground", icon: FiMessageSquare, path: "/dashboard/playground" },
  { name: "Sources", icon: FiDatabase, path: "/dashboard/sources" },
  { name: "Evaluation", icon: GrDocumentTest, path: "/dashboard/eval" },
  { name: "Activity", icon: FiActivity, path: "/dashboard/activity" },
  { name: "Contacts", icon: FiUsers, path: "/dashboard/contacts" },
  { name: "Deploy", icon: FiRocket, path: "/dashboard/deploy" },
  { name: "Settings", icon: FiSettings, path: "/dashboard/settings" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

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
        } md:translate-x-0 fixed md:static inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transition-transform duration-300 ease-in-out`}
      >
        {/* Logo/Brand */}
        <div className="h-16 flex items-center px-6 border-b border-border">
          <h1 className="text-xl font-bold">PlugIN</h1>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-4rem)]">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;

            return (
              <button
                key={item.path}
                onClick={() => {
                  router.push(item.path);
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

        {/* Footer - Training Status */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-card">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-muted-foreground">Trained</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Last trained 1 month ago • 1 KB
          </p>
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
