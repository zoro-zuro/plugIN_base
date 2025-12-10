"use client";

import { useState, use } from "react";
import {
  FiPlus,
  FiFile,
  FiTrash2,
  FiInfo,
  FiUploadCloud,
  FiDatabase,
  FiAlertTriangle,
  FiLoader,
} from "react-icons/fi";
import { uploadDocument } from "@/app/actions/upload";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import toast, { Toaster } from "react-hot-toast";
import { Id } from "@/convex/_generated/dataModel";
import { deletePineconeVectors, resetVectors } from "@/app/actions/delFile";
import { RiResetLeftLine } from "react-icons/ri";

export default function SourcesPage({
  params,
}: {
  params: Promise<{ chatbotId: string }>;
}) {
  const { chatbotId } = use(params);

  // ✅ Fetch chatbot details
  const chatbot = useQuery(api.documents.getChatbotById, { chatbotId });

  const [isUploading, setIsUploading] = useState(false);

  // ✅ Fetch documents for this specific chatbot (by namespace)
  const documents = useQuery(
    api.documents.getDocumentsByNamespace,
    chatbot ? { namespace: chatbot.namespace } : "skip",
  );

  const deleteDoc = useMutation(api.documents.deleteDocument);
  const deleteAllNamespaceDocuments = useMutation(
    api.documents.deleteAllNamespaceDocuments,
  );
  const updateChatbotDocCount = useMutation(api.documents.updateChatbot);

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
    if (!chatbot) {
      toast.error("Chatbot not loaded yet");
      return;
    }

    setIsUploading(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      try {
        // Convert file to base64 string
        const arrayBuffer = await file.arrayBuffer();
        const base64String = arrayBufferToBase64(arrayBuffer);

        // ✅ Upload using chatbot's namespace
        const result = await uploadDocument(
          base64String,
          file.name,
          file.size,
          chatbot.namespace, // Use namespace instead of userId
        );

        if (result.success) {
          toast.success(
            `${file.name} uploaded successfully! (${result.chunks} chunks)`,
          );

          // ✅ Update chatbot document count
          const newDocCount = (documents?.length || 0) + 1;
          await updateChatbotDocCount({
            id: chatbot._id,
            totalDocuments: newDocCount,
          });
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
    if (!chatbot) return;

    try {
      const response = await deletePineconeVectors(
        documentId,
        chatbot.namespace,
      );

      if (!response.success) {
        throw new Error(response.error);
      }

      if (response.success) {
        await deleteDoc({ documentId });

        // ✅ Update chatbot document count
        const newDocCount = Math.max((documents?.length || 1) - 1, 0);
        await updateChatbotDocCount({
          id: chatbot._id,
          totalDocuments: newDocCount,
        });

        toast.success(`${fileName} deleted successfully.`);
      }
    } catch (error) {
      console.error("❌ Delete error:", error);
      toast.error(`Failed to delete ${fileName}`);
    }
  };

  const handleResetAll = async () => {
    if (!chatbot) return;
    if (
      !confirm(
        `Reset all files and vectors for chatbot "${chatbot.name}"? This cannot be undone.`,
      )
    )
      return;

    try {
      const vecRes = await resetVectors(chatbot.namespace);
      if (!vecRes.success) throw new Error(vecRes.error);

      if (vecRes.success) {
        const deletedCount = await deleteAllNamespaceDocuments({
          namespace: chatbot.namespace,
        });

        // ✅ Update chatbot document count to 0
        await updateChatbotDocCount({
          id: chatbot._id,
          totalDocuments: 0,
        });

        toast.success(
          `Reset complete: removed ${deletedCount} documents and all vectors.`,
        );
      }
    } catch (err) {
      console.error("❌ Reset error:", err);
      toast.error("Failed to reset all data for this chatbot.");
    }
  };

  if (!chatbot) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="h-12 w-12 bg-primary/20 rounded-xl" />
          <p className="text-muted-foreground font-medium">
            Loading knowledge base...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background relative overflow-hidden">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-md px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <FiDatabase className="text-primary" />
            Knowledge Base
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-lg">
            Manage the documents your agent uses to answer questions.
          </p>
        </div>

        <button
          onClick={handleResetAll}
          className="inline-flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-2.5 text-xs font-semibold text-destructive hover:bg-destructive/20 transition-all hover:shadow-lg hover:shadow-destructive/10"
        >
          <RiResetLeftLine className="h-4 w-4" />
          Reset Knowledge Base
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 animate-fade-in">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Upload Area */}
          <div className="group relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-fuchsia-600 rounded-2xl opacity-20 group-hover:opacity-40 blur transition duration-500" />
            <label
              htmlFor="file-upload"
              className="relative flex flex-col items-center justify-center gap-4 p-12 bg-card border-2 border-dashed border-border rounded-xl hover:border-primary/50 hover:bg-muted/50 transition-all cursor-pointer"
            >
              <div className="p-4 bg-primary/10 rounded-full group-hover:scale-110 transition-transform duration-300">
                <FiUploadCloud size={32} className="text-primary" />
              </div>
              <div className="text-center">
                <span className="text-lg font-bold text-foreground">
                  {isUploading ? "Processing..." : "Click or drag files here"}
                </span>
                <p className="text-sm text-muted-foreground mt-1">
                  PDF, DOCX, TXT, or MD (Max 10MB)
                </p>
              </div>
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
          </div>

          {/* Info Banner */}
          <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/10 rounded-lg text-sm text-muted-foreground">
            <FiInfo className="text-primary mt-0.5 shrink-0" size={16} />
            <p>
              Documents are automatically chunked and vectorized. Changes
              usually take 1-2 minutes to reflect in the chat.
            </p>
          </div>

          {/* Files List */}
          <div>
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              Uploaded Files
              <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium">
                {documents?.length || 0}
              </span>
            </h3>

            <div className="space-y-3">
              {documents && documents.length > 0 ? (
                documents.map((doc) => (
                  <FileCard
                    key={doc._id}
                    document={doc}
                    onDelete={() => handleDelete(doc._id, doc.fileName)}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-16 bg-muted/20 border border-dashed border-border rounded-xl">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <FiFile
                      size={24}
                      className="text-muted-foreground opacity-50"
                    />
                  </div>
                  <p className="text-muted-foreground font-medium">
                    No documents yet
                  </p>
                  <p className="text-xs text-muted-foreground/60">
                    Upload your first file above to start training.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border bg-card/80 backdrop-blur px-8 py-4 flex items-center justify-between sticky bottom-0 z-10">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            Storage Used:{" "}
            <span className="font-mono font-medium text-foreground">
              {totalSizeKB} KB
            </span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div>Limit: {maxSizeKB} KB</div>
        </div>

        {isUploading && (
          <div className="flex items-center gap-2 text-xs font-bold text-primary animate-pulse">
            <FiLoader className="animate-spin" />
            Syncing vectors...
          </div>
        )}
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
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="group flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
          <FiFile size={24} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">
            {document.fileName}
          </h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            <span className="bg-muted px-1.5 rounded font-mono">
              {formatFileSize(document.fileSize)}
            </span>
            <span>•</span>
            <span>{document.chunksCount} chunks</span>
            <span>•</span>
            <span>{formatDate(document.uploadedAt)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="p-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors disabled:opacity-50"
          title="Delete file"
        >
          {isDeleting ? (
            <FiLoader className="animate-spin" />
          ) : (
            <FiTrash2 size={18} />
          )}
        </button>
      </div>
    </div>
  );
}
