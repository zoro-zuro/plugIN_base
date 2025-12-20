"use client";

import { ClerkProvider } from "@clerk/nextjs";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import { usePathname } from "next/navigation";
import { ThemeProvider } from "next-themes"; // ✅ Import

export function GlobalProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isEmbedPage = pathname?.startsWith("/embed");

  const AuthWrapper = isEmbedPage
    ? ({ children }: { children: React.ReactNode }) => (
        <ConvexClientProvider useAuth={false}>{children}</ConvexClientProvider>
      )
    : ({ children }: { children: React.ReactNode }) => (
        <ClerkProvider dynamic>
          <ConvexClientProvider useAuth={true}>{children}</ConvexClientProvider>
        </ClerkProvider>
      );

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="plugin-theme"
    >
      <AuthWrapper>{children}</AuthWrapper>
    </ThemeProvider>
  );
}
