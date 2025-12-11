import { auth } from "@clerk/nextjs/server";
import { SignInButton } from "@clerk/nextjs";
import { FiLock, FiArrowRight } from "react-icons/fi";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  // 1. Authentication Check
  if (!userId) {
    return <LoginScreen />;
  }

  return <>{children}</>;
}

// --- UI COMPONENTS ---
function LoginScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]"></div>
      </div>

      <div className="w-full max-w-md bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-8 shadow-2xl relative z-10 text-center">
        <div className="mx-auto mb-6 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
          <FiLock className="w-8 h-8 text-primary" />
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-2">
          Authentication Required
        </h1>

        <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
          You need to be signed in to access this dashboard.
        </p>

        <SignInButton mode="modal">
          <button className="group w-full py-3 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-all shadow-lg hover:shadow-primary/25 flex items-center justify-center gap-2">
            Sign In to Continue
            <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
          </button>
        </SignInButton>
      </div>
    </div>
  );
}
