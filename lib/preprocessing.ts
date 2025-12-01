import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { Id } from "@/convex/_generated/dataModel";

/**
 * Load document based on file type and extract text only (images removed)
 */
type PageChunk = {
  text: string;
  pageNumber: number;
};

async function loadDocument(
  buffer: Buffer,
  fileName: string,
): Promise<PageChunk[]> {
  const extension = fileName.split(".").pop()?.toLowerCase();

  switch (extension) {
    case "pdf": {
      const uint8 = new Uint8Array(buffer);
      const blob = new Blob([uint8], { type: "application/pdf" });
      const loader = new PDFLoader(blob, { splitPages: true }); // keep per-page
      const docs = await loader.load();

      return docs.map((doc, idx) => ({
        text: doc.pageContent ?? "",
        pageNumber: (doc.metadata?.page as number) ?? idx + 1,
      }));
    }
    case "docx":
    case "doc": {
      const uint8 = new Uint8Array(buffer);
      const blob = new Blob([uint8], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      const loader = new DocxLoader(blob);
      const docs = await loader.load();

      // DocxLoader doesn’t have real page numbers, so approximate by order
      return docs.map((doc, idx) => ({
        text: doc.pageContent ?? "",
        pageNumber: idx + 1,
      }));
    }
    case "txt":
    case "md": {
      return [
        {
          text: buffer.toString("utf-8"),
          pageNumber: 1,
        },
      ];
    }
    default:
      throw new Error(`Unsupported file format: ${extension}`);
  }
}

/**
 * Clean text: light normalization, keep most semantics
 */
function cleanText(text: string): string {
  let cleaned = text;

  // Remove null bytes / control chars (keep \n and \t)
  cleaned = cleaned.replace(/\0/g, "");
  cleaned = cleaned.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g, "");

  // Normalize Windows/Mac line endings
  cleaned = cleaned.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Collapse excessive blank lines (but keep paragraph breaks)
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

  // Collapse long runs of spaces / tabs
  cleaned = cleaned.replace(/[ \t]+/g, " ");

  return cleaned.trim();
}

/**
 * Split text into chunks for RAG
 * - Slightly smaller chunks + less overlap for faster retrieval
 * - Paragraph‑aware splitting
 */
async function splitIntoChunks(pages: PageChunk[]): Promise<Document[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 800,
    chunkOverlap: 120,
    separators: ["\n\n", "\n", ". ", " "],
  });

  const allChunks: Document[] = [];

  for (const page of pages) {
    const cleaned = cleanText(page.text);
    if (!cleaned.trim()) continue;

    const docs = await splitter.createDocuments([cleaned]);

    for (const d of docs) {
      if (!d.pageContent || d.pageContent.trim().length < 80) continue;
      // attach pageNumber now; other metadata later
      allChunks.push(
        new Document({
          pageContent: d.pageContent,
          metadata: {
            ...(d.metadata ?? {}),
            pageNumber: page.pageNumber,
          },
        }),
      );
    }
  }

  return allChunks;
}

/**
 * Main preprocessing function: load → clean → chunk → add metadata
 */
export async function preprocessDocument(
  fileBuffer: Buffer,
  fileName: string,
  userId: string,
  documentId: Id<"documents">,
): Promise<Document[]> {
  // 1. Load raw pages
  const pages = await loadDocument(fileBuffer, fileName);
  if (!pages.length) {
    throw new Error("Could not extract text from document");
  }

  // 2–3. Clean + chunk per page
  const chunks = await splitIntoChunks(pages);
  if (!chunks.length) {
    throw new Error("No valid chunks created");
  }

  const totalChunks = chunks.length;
  const uploadedAt = new Date().toISOString();

  const documentsWithMetadata: Document[] = chunks.map((doc, index) => {
    const text = doc.pageContent ?? "";
    const pageNumber = (doc.metadata as any)?.pageNumber ?? 1;

    return new Document({
      pageContent: text,
      metadata: {
        ...(doc.metadata ?? {}),
        userId,
        fileName,
        pageNumber, // <- where in the file
        chunkIndex: index,
        totalChunks,
        uploadedAt,
        characterCount: text.length,
        wordCount: text.split(/\s+/).filter(Boolean).length,
        documentId: documentId?.toString() || "",
      },
    });
  });

  return documentsWithMetadata;
}
