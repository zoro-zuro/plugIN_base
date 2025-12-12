"use client";

import { ClerkProvider } from "@clerk/nextjs";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import { usePathname } from "next/navigation";

export function GlobalProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isEmbedPage = pathname?.startsWith("/embed");

  // ✅ CASE 1: Embed Page (Public)
  // No Clerk, and Convex runs in public mode.
  if (isEmbedPage) {
    return (
      <ConvexClientProvider useAuth={false}>{children}</ConvexClientProvider>
    );
  }

  // ✅ CASE 2: Dashboard/Marketing (Protected)
  // Load Clerk, and let Convex use Clerk for auth.
  return (
    <ClerkProvider dynamic>
      <ConvexClientProvider useAuth={true}>{children}</ConvexClientProvider>
    </ClerkProvider>
  );
}
