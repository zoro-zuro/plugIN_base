import { ConvexHttpClient } from "convex/browser";

/**
 * Calls a Convex mutation from a server-side background context (no auth required).
 *
 * WHY THIS INSTEAD OF fetchMutation:
 * - fetchMutation from 'convex/nextjs' requires the original Clerk session/request context.
 * - In fire & forget background functions on Vercel, that request context is gone.
 * - ConvexHttpClient works without auth and crucially goes through the Convex protocol,
 *   so realtime useQuery subscriptions on the client WILL receive the update live.
 *
 * WHY NOT raw fetch('/api/mutation'):
 * - The raw HTTP approach bypasses Convex's realtime notification system,
 *   so the UI only updates on a manual page refresh.
 */
const convexClient = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export { convexClient };
