import { CloudflareEmbeddings } from "./cloudflare-embeddings"; // Import from your new file

export function getEmbeddings() {
  return new CloudflareEmbeddings({
    model: "@cf/baai/bge-base-en-v1.5",
    apiToken: process.env.CLOUDFLARE_API_KEY!,
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
  });
}
