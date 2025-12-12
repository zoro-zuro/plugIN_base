"use client";

import { ReactNode } from "react";
import { ConvexReactClient, ConvexProvider } from "convex/react"; // Import basic provider
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth } from "@clerk/nextjs";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default function ConvexClientProvider({
  children,
  useAuth: shouldUseAuth = true, // Default to true (for Dashboard)
}: {
  children: ReactNode;
  useAuth?: boolean;
}) {
  // ✅ If we don't want auth (Embed Page), use the basic ConvexProvider
  if (!shouldUseAuth) {
    return <ConvexProvider client={convex}>{children}</ConvexProvider>;
  }

  // ✅ Otherwise, use the Auth-enabled provider (Dashboard)
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}
