"use server";

import { currentUser } from "@clerk/nextjs/server";
import { getPineconeVectorStore } from "@/lib/vectorStore";
import { preprocessDocument } from "@/lib/preprocessing";
import { api } from "@/convex/_generated/api";
import { fetchMutation } from "convex/nextjs";
import { Id } from "@/convex/_generated/dataModel";

export const uploadDocument = async (
  fileBase64: string,
  fileName: string,
  fileSize: number,
  namespace?: string,
) => {
  const user = await currentUser();
  if (!user) {
    return {
      success: false,
      error: "User not authenticated",
    };
  }

  try {
    const fileBuffer = Buffer.from(fileBase64, "base64");

    // 1) upload to Convex storage
    const uploadUrl = await fetchMutation(api.documents.generateUploadUrl);

    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": getContentType(fileName) },
      body: fileBuffer,
    });

    if (!uploadResponse.ok) {
      throw new Error("Failed to upload file to Convex");
    }

    const { storageId } = await uploadResponse.json();

    // 2) preprocess -> chunks (no documentId yet)
    const documents = await preprocessDocument(
      fileBuffer,
      fileName,
      user.id,
      undefined as any, // or null
    );

    // 3) save Convex document with chunksCount
    const documentId = await fetchMutation(api.documents.saveDocument, {
      userId: user.id,
      fileName,
      fileSize,
      fileType: getFileType(fileName),
      storageId: storageId as Id<"_storage">,
      chunksCount: documents.length,
      namespace,
    });

    // 4) attach documentId to each chunk’s metadata
    const documentsWithId = documents.map((doc) => ({
      ...doc,
      metadata: {
        ...(doc.metadata || {}),
        documentId, // used later in Pinecone delete filter
        userId: user.id,
        fileName,
      },
    }));

    // 5) upsert into Pinecone
    const vectorStore = await getPineconeVectorStore(namespace || user.id);
    await vectorStore.addDocuments(documentsWithId);

    return {
      success: true,
      message: `Successfully uploaded ${documents.length} chunks from ${fileName}`,
      documentId,
      chunks: documents.length,
    };
  } catch (error) {
    console.error("Upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
};

// Helper: Get MIME type from filename
function getContentType(fileName: string): string {
  const extension = fileName.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "pdf":
      return "application/pdf";
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case "doc":
      return "application/msword";
    case "txt":
      return "text/plain";
    case "md":
      return "text/markdown";
    default:
      return "application/octet-stream";
  }
}

// Helper: Get file type from filename
function getFileType(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() || "unknown";
}
