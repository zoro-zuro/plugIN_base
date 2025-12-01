import { auth } from "@clerk/nextjs/server";
import { NavbarButton } from "@/components/ui/resizable-navbar";
import { SignInButton } from "@clerk/nextjs";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth(); // ✅ await auth()

  const isSignedIn = !!userId;

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-sm w-full bg-card border border-border rounded-xl p-6 text-center space-y-4">
          <h1 className="text-lg font-semibold">Login required</h1>
          <p className="text-sm text-muted-foreground">
            Please sign in to access PlugIN RAG.
          </p>

          <SignInButton>
            <NavbarButton variant="primary">Login</NavbarButton>

          </SignInButton>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
