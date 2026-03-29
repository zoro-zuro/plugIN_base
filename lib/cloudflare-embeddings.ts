import { Embeddings, EmbeddingsParams } from "@langchain/core/embeddings";

export interface CloudflareEmbeddingsParams extends EmbeddingsParams {
  accountId: string;
  apiToken: string;
  model: string;
}

export class CloudflareEmbeddings extends Embeddings {
  accountId: string;
  apiToken: string;
  model: string;

  constructor(fields: CloudflareEmbeddingsParams) {
    super(fields);
    this.accountId = fields.accountId;
    this.apiToken = fields.apiToken;
    this.model = fields.model;
  }

  async embedDocuments(documents: string[]): Promise<number[][]> {
    const url = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/ai/run/${this.model}`;
    const BATCH_SIZE = 50; // Maximize Cloudflare batch capacity
    const MAX_RETRIES = 3;

    const batches: string[][] = [];
    for (let i = 0; i < documents.length; i += BATCH_SIZE) {
      batches.push(documents.slice(i, i + BATCH_SIZE));
    }

    console.log(`[Cloudflare] Processing ${documents.length} chunks in ${batches.length} batches...`);
    const startTime = Date.now();

    const fetchWithRetry = async (batch: string[], attempt = 1): Promise<number[][]> => {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: batch }),
          // High-performance timeout
          signal: AbortSignal.timeout(30000), 
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`CF Error ${response.status}: ${errorText}`);
        }

        const res = await response.json();
        if (!res.success || !res.result?.data) throw new Error("Invalid CF Response");
        return res.result.data;
      } catch (error) {
        if (attempt < MAX_RETRIES) {
          console.warn(`⚠️ Batch attempt ${attempt} failed, retrying...`);
          // Exponential backoff
          await new Promise(r => setTimeout(r, 1000 * attempt));
          return fetchWithRetry(batch, attempt + 1);
        }
        throw error;
      }
    };

    // Parallel processing with all batches at once (Cloudflare handles its own queueing well)
    const results = await Promise.all(batches.map(batch => fetchWithRetry(batch)));
    
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ [Cloudflare] All ${batches.length} batches completed in ${totalTime}s`);

    return results.flat();
  }

  async embedQuery(document: string): Promise<number[]> {
    const docs = await this.embedDocuments([document]);
    return docs[0];
  }
}
