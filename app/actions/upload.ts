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
  namespace: string, // ✅ Make this REQUIRED instead of optional
) => {
  const user = await currentUser();
  if (!user) {
    return {
      success: false,
      error: "User not authenticated",
    };
  }

  // ✅ Validate namespace is provided
  if (!namespace) {
    return {
      success: false,
      error: "Namespace is required for upload",
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

    // 2) preprocess -> chunks
    const documents = await preprocessDocument(
      fileBuffer,
      fileName,
      namespace, // ✅ Use namespace instead of user.id
      undefined as any,
    );

    // 3) save Convex document with chunksCount
    const documentId = await fetchMutation(api.documents.saveDocument, {
      userId: user.id,
      fileName,
      fileSize,
      fileType: getFileType(fileName),
      storageId: storageId as Id<"_storage">,
      chunksCount: documents.length,
      namespace: namespace, // ✅ Use the passed namespace
      fileDescription: "no description provided", // No description in this basic upload
    });

    // 4) attach documentId and namespace to each chunk's metadata
    const documentsWithId = documents.map((doc) => ({
      ...doc,
      metadata: {
        ...(doc.metadata || {}),
        documentId, // ✅ For deletion filtering
        userId: user.id,
        namespace: namespace, // ✅ Add namespace to metadata
        fileName,
      },
    }));

    // 5) upsert into Pinecone with correct namespace
    const vectorStore = await getPineconeVectorStore(namespace);
    await vectorStore.addDocuments(documentsWithId);

    console.log(
      `✅ Uploaded ${documents.length} chunks to namespace: ${namespace}`,
    );

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

// ✅ NEW: Main Upload Action accepting File Object & Description
export const uploadDocumentWithDescription = async (
  file: File,
  description: string,
  namespace: string,
) => {
  const user = await currentUser();
  if (!user) {
    return { success: false, error: "User not authenticated" };
  }

  if (!namespace) {
    return { success: false, error: "Namespace is required" };
  }

  if (!description || description.trim().length === 0) {
    return { success: false, error: "File description is required" };
  }

  try {
    const fileName = file.name;
    const fileSize = file.size;
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // 1) Get Upload URL from Convex
    const uploadUrl = await fetchMutation(api.documents.generateUploadUrl);

    // 2) Upload file to Convex Storage
    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": getContentType(fileName) },
      body: fileBuffer,
    });

    if (!uploadResponse.ok) {
      throw new Error("Failed to upload file to Convex storage");
    }

    const { storageId } = await uploadResponse.json();

    // 3) Preprocess -> Chunks (LangChain)
    const documents = await preprocessDocument(
      fileBuffer,
      fileName,
      namespace,
      undefined as any,
    );

    // 4) Save Document Metadata to Convex (WITH DESCRIPTION)
    const documentId = await fetchMutation(api.documents.saveDocument, {
      userId: user.id,
      fileName,
      fileSize,
      fileType: getFileType(fileName),
      storageId: storageId as Id<"_storage">,
      chunksCount: documents.length,
      namespace: namespace,
      fileDescription: description, // ✅ Pass description to mutation
    });

    // 5) Attach Metadata for Pinecone
    const documentsWithId = documents.map((doc) => ({
      ...doc,
      metadata: {
        ...(doc.metadata || {}),
        documentId, // Crucial for deletion
        userId: user.id,
        namespace: namespace,
        fileName,
        fileDescription: description, // Optional: Store in vector metadata too
      },
    }));

    // 6) Upsert into Pinecone
    const vectorStore = await getPineconeVectorStore(namespace);
    await vectorStore.addDocuments(documentsWithId);

    console.log(
      `✅ Uploaded ${documents.length} chunks to namespace: ${namespace} with description`,
    );

    return {
      success: true,
      message: `Successfully uploaded ${fileName}`,
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

// --- HELPERS ---

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

function getFileType(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() || "unknown";
}
