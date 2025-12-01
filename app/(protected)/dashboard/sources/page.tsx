"use client";

import { useState } from "react";
import { FiPlus, FiFile, FiTrash2, FiInfo } from "react-icons/fi";
import { uploadDocument } from "@/app/actions/upload";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import toast, { Toaster } from "react-hot-toast";
import { Id } from "@/convex/_generated/dataModel";
import { deletePineconeVectors, resetVectors } from "@/app/actions/delFile";
import { RiResetLeftLine } from "react-icons/ri";

export default function SourcesPage() {
  const { user } = useUser();
  const [isUploading, setIsUploading] = useState(false);

  // Fetch user's documents from Convex
  const documents = useQuery(
    api.documents.getUserDocuments,
    user?.id ? { userId: user.id } : "skip",
  );

  const deleteDoc = useMutation(api.documents.deleteDocument);
  const deleteAllUserDocuments = useMutation(
    api.documents.deleteAllUserDocuments,
  );
  // Calculate total size
  const totalSize = documents?.reduce((sum, doc) => sum + doc.fileSize, 0) || 0;
  const totalSizeKB = (totalSize / 1024).toFixed(2);
  const maxSizeKB = 10240; // Example: 10 MB limit

  // Helper function to convert ArrayBuffer to base64
  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleUpload(files);
    }
  };

  // Handle file upload
  const handleUpload = async (files: FileList) => {
    setIsUploading(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      try {
        // Convert file to base64 string
        const arrayBuffer = await file.arrayBuffer();
        const base64String = arrayBufferToBase64(arrayBuffer);

        // Upload using your action
        const result = await uploadDocument(
          base64String,
          file.name,
          file.size,
          user?.id,
        );

        if (result.success) {
          toast.success(
            `${file.name} uploaded successfully! (${result.chunks} chunks)`,
          );
        } else {
          toast.error(`Failed to upload ${file.name}: ${result.error}`);
        }
      } catch (error) {
        console.error("Upload error:", error);
        toast.error(`Error uploading ${file.name}`);
      }
    }

    setIsUploading(false);
  };

  const handleDelete = async (
    documentId: Id<"documents">,
    fileName: string,
  ) => {
    console.log("🧹 handleDelete called", {
      documentId,
      fileName,
      userId: user?.id,
    });

    try {
      console.log("➡️ Calling deletePineconeVectors first...", {
        namespace: user?.id,
        documentId,
      });

      const response = await deletePineconeVectors(documentId, user!.id);
      console.log("✅ deletePineconeVectors response:", response);

      if (!response.success) {
        throw new Error(response.error);
      }

      console.log("➡️ Deleting from Convex...");
      if (response.success) {
        await deleteDoc({ documentId });
        console.log("✅ Convex delete done");
        toast.success(
          response.message ||
            `${fileName} deleted successfully with vectors for documentId ${documentId.toString()}`,
        );
      }
    } catch (error) {
      console.error("❌ Delete error:", error);
      toast.error(
        `Failed to delete ${fileName} with documentId ${documentId.toString()}`,
      );
    }
  };

  const handleResetAll = async () => {
    if (!user?.id) return;
    if (!confirm("Reset all files and vectors for this user?")) return;

    try {
      console.log("➡️ Reset: deleting all vectors for namespace", user.id);
      const vecRes = await resetVectors(user.id);
      console.log("✅ resetVectors response:", vecRes);
      if (!vecRes.success) throw new Error(vecRes.error);

      console.log("➡️ Reset: deleting all Convex documents for user", user.id);
      if (vecRes.success) {
        const deletedCount = await deleteAllUserDocuments({ userId: user.id });
        console.log("✅ deleteAllUserDocuments deleted:", deletedCount);

        toast.success(
          `Reset complete: removed ${deletedCount} documents and all vectors.`,
        );
      }
    } catch (err) {
      console.error("❌ Reset error:", err);
      toast.error("Failed to reset all data for this user.");
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="border-b border-border bg-card px-6 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Files</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload documents to train your AI. Extract text from PDFs, DOCX, and
            TXT files.
          </p>
        </div>

        <button
          onClick={handleResetAll}
          className="inline-flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-100 hover:text-red-700 transition-colors"
        >
          <RiResetLeftLine className="h-4 w-4" />
          Reset all data
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          {/* Upload Area */}
          <div className="flex items-center gap-4 mb-6">
            <label
              htmlFor="file-upload"
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer"
            >
              <FiPlus size={20} />
              <span className="font-medium">
                {isUploading ? "Uploading..." : "Add files"}
              </span>
              <input
                id="file-upload"
                type="file"
                multiple
                accept=".pdf,.docx,.doc,.txt,.md"
                onChange={handleFileSelect}
                disabled={isUploading}
                className="hidden"
              />
            </label>

            <button className="p-3 rounded-lg hover:bg-muted transition-colors">
              <FiInfo size={20} className="text-muted-foreground" />
            </button>
          </div>

          {/* Files List */}
          <div className="space-y-2">
            {documents && documents.length > 0 ? (
              documents.map((doc) => (
                <FileCard
                  key={doc._id}
                  document={doc}
                  onDelete={() => handleDelete(doc._id, doc.fileName)}
                />
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FiFile size={48} className="mx-auto mb-4 opacity-50" />
                <p>No files uploaded yet</p>
                <p className="text-sm">
                  Upload your first document to get started
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border bg-card px-6 py-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Total size: <span className="font-semibold">{totalSizeKB} KB</span> /{" "}
          {maxSizeKB} KB
        </div>
        <button className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
          View all sources
        </button>
      </div>
    </div>
  );
}

// File Card Component
function FileCard({
  document,
  onDelete,
}: {
  document: any;
  onDelete: () => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    console.log("🧹 FileCard delete clicked for", document.fileName);
    if (confirm(`Delete ${document.fileName}?`)) {
      setIsDeleting(true);
      await onDelete();
      setIsDeleting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors">
      <div className="flex items-center gap-3 flex-1">
        <div className="p-2 bg-primary/10 rounded">
          <FiFile size={20} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate">{document.fileName}</h3>
          <p className="text-sm text-muted-foreground">
            {formatFileSize(document.fileSize)} • {document.chunksCount} chunks
            • {formatDate(document.uploadedAt)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
        >
          <FiTrash2 size={18} />
        </button>
      </div>
    </div>
  );
}
