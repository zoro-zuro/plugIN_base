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

    // Cloudflare AI API expects: { "text": ["string1", "string2"] }
    // It returns: { result: { data: [[0.1, ...], [0.2, ...]] } }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: documents }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Cloudflare AI API Error (${response.status}): ${errorText}`,
        );
      }

      const result = await response.json();

      if (!result.success || !result.result || !result.result.data) {
        throw new Error("Invalid response format from Cloudflare AI");
      }

      return result.result.data;
    } catch (error) {
      console.error("Cloudflare Embedding Error:", error);
      throw error;
    }
  }

  async embedQuery(document: string): Promise<number[]> {
    const docs = await this.embedDocuments([document]);
    return docs[0];
  }
}
