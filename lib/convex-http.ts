/**
 * Calls a Convex mutation directly via HTTP API without requiring an auth context.
 * This is the correct pattern for background processing (fire & forget) on Vercel
 * where the original request context (auth session) is no longer available.
 */
export async function callConvexMutation(
  functionPath: string,
  args: Record<string, unknown>
): Promise<void> {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
  }

  const response = await fetch(`${convexUrl}/api/mutation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      path: functionPath,
      args,
      format: "json",
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Convex mutation failed [${response.status}]: ${text}`);
  }
}
