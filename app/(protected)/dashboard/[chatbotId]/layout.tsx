import { auth } from "@clerk/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { FiAlertTriangle } from "react-icons/fi";
import Link from "next/link";
import DashboardClientLayout from "./client-layout"; // Import the client part

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ chatbotId: string }>;
}) {
  // 1. Get Params & User (Server Side)
  const { chatbotId } = await params;
  const { userId } = await auth();

  if (!userId) return null; // Should be caught by root layout, but safe to keep

  // 2. Secure Ownership Check
  const isOwner = await fetchQuery(api.documents.checkChatbotOwnership, {
    chatbotId: chatbotId,
    userId: userId,
  });

  // 3. Handle Unauthorized Access
  if (!isOwner) {
    return <UnauthorizedScreen />;
  }

  // 4. Render the Client UI (Sidebar etc)
  return (
    <DashboardClientLayout chatbotId={chatbotId}>
      {children}
    </DashboardClientLayout>
  );
}

function UnauthorizedScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <div className="w-full max-w-md bg-destructive/5 backdrop-blur-xl border border-destructive/20 rounded-2xl p-8 shadow-2xl relative z-10 text-center">
        <div className="mx-auto mb-6 w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center border border-destructive/20">
          <FiAlertTriangle className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Access Denied
        </h1>
        <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
          You do not have permission to view this chatbot. It belongs to another
          account.
        </p>
        <Link href="/">
          <button className="w-full py-3 px-4 bg-card border border-border hover:bg-muted text-foreground font-semibold rounded-xl transition-all flex items-center justify-center gap-2">
            Return to Home
          </button>
        </Link>
      </div>
    </div>
  );
}
