import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)", "/chatbot(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const path = req.nextUrl.pathname;

  // ✅ ADD THIS LOG
  console.log("🔒 Middleware hit:", path);

  // ✅ Skip embed routes completely
  if (
    path.startsWith("/embed") ||
    path.startsWith("/api/embed") ||
    path.startsWith("/api/chat")
  ) {
    console.log("✅ Skipping auth for:", path);
    return;
  }

  if (isProtectedRoute(req)) {
    console.log("🔐 Protecting route:", path);
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
