"use client";

import { useState, use } from "react";
import {
  FiFile,
  FiTrash2,
  FiInfo,
  FiUploadCloud,
  FiDatabase,
  FiLoader,
  FiX,
  FiPlus,
  FiEdit2,
} from "react-icons/fi";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import toast, { Toaster } from "react-hot-toast";
import { Id } from "@/convex/_generated/dataModel";
import { deletePineconeVectors, resetVectors } from "@/app/actions/delFile";
import { RiResetLeftLine } from "react-icons/ri";
import { uploadDocumentWithDescription } from "@/app/actions/upload";

// --- UPLOAD MODAL ---
function UploadModal({
  isOpen,
  onClose,
  chatbot,
}: {
  isOpen: boolean;
  onClose: () => void;
  chatbot: any;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !description.trim() || !chatbot) {
      toast.error("Please select a file and provide a description.");
      return;
    }
    setIsUploading(true);
    const toastId = toast.loading(`Uploading ${file.name}...`);

    try {
      const result = await uploadDocumentWithDescription(
        file,
        description,
        chatbot.namespace,
      );

      if (result.success) {
        toast.success(`${file.name} uploaded!`, { id: toastId });
        setFile(null);
        setDescription("");
        onClose();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(
        `Failed: ${error instanceof Error ? error.message : "Error"}`,
        {
          id: toastId,
        },
      );
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-card border border-border rounded-xl w-full max-w-lg p-6 relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-muted-foreground hover:bg-muted rounded-full"
        >
          <FiX size={20} />
        </button>
        <h3 className="text-xl font-bold text-foreground mb-6">
          Upload New Document
        </h3>

        {/* File Input */}
        <label
          htmlFor="file-input"
          className={`flex flex-col items-center justify-center w-full p-8 mb-6 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
            file
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-muted/50"
          }`}
        >
          <FiUploadCloud size={32} className="text-primary mb-3" />
          <span className="font-semibold text-foreground">
            {file ? file.name : "Click to select a file"}
          </span>
          <span className="text-xs text-muted-foreground mt-1">
            PDF, DOCX, TXT, or MD (Max 10MB)
          </span>
          <input
            id="file-input"
            type="file"
            accept=".pdf,.docx,.doc,.txt,.md"
            className="hidden"
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </label>

        {/* Description */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-foreground mb-2">
            File Description <span className="text-destructive">*</span>
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. 'Product Manual v2.0'"
            className="w-full p-3 bg-muted border border-border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none transition-shadow text-sm"
            disabled={isUploading}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isUploading}
            className="flex-1 py-2.5 px-4 bg-muted text-muted-foreground font-medium rounded-lg hover:bg-muted/80 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={isUploading || !file || !description}
            className="flex-1 py-2.5 px-4 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            {isUploading && <FiLoader className="animate-spin" />}
            {isUploading ? "Uploading..." : "Upload & Train"}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- EDIT DESCRIPTION MODAL ---
function EditModal({
  isOpen,
  onClose,
  documentId,
  currentDescription,
}: {
  isOpen: boolean;
  onClose: () => void;
  documentId: Id<"documents">;
  currentDescription: string;
}) {
  const [description, setDescription] = useState(currentDescription);
  const [isSaving, setIsSaving] = useState(false);
  const updateDescription = useMutation(
    api.documents.updateDocumentDescription,
  );

  const handleSave = async () => {
    if (!description.trim()) {
      toast.error("Description cannot be empty.");
      return;
    }
    setIsSaving(true);
    try {
      await updateDescription({
        documentId,
        fileDescription: description,
      });
      toast.success("Description updated!");
      onClose();
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update description.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-card border border-border rounded-xl w-full max-w-md p-6 relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-muted-foreground hover:bg-muted rounded-full"
        >
          <FiX size={20} />
        </button>
        <h3 className="text-xl font-bold text-foreground mb-4">
          Edit Description
        </h3>

        <div className="mb-6">
          <label className="block text-sm font-medium text-foreground mb-2">
            Description
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-3 bg-muted border border-border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none transition-shadow text-sm"
          />
          <p className="text-xs text-muted-foreground mt-2">
            This helps the AI understand the file content.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 bg-muted text-muted-foreground font-medium rounded-lg hover:bg-muted/80 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 py-2.5 px-4 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            {isSaving && <FiLoader className="animate-spin" />}
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- MAIN PAGE ---
export default function SourcesPage({
  params,
}: {
  params: Promise<{ chatbotId: string }>;
}) {
  const { chatbotId } = use(params);
  const chatbot = useQuery(api.documents.getChatbotById, { chatbotId });
  const [isModalOpen, setIsModalOpen] = useState(false);

  const documents = useQuery(
    api.documents.getDocumentsByNamespace,
    chatbot ? { namespace: chatbot.namespace } : "skip",
  );

  const deleteDoc = useMutation(api.documents.deleteDocument);
  const deleteAllNamespaceDocuments = useMutation(
    api.documents.deleteAllNamespaceDocuments,
  );

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
      if (response.success) {
        await deleteDoc({ documentId });
        toast.success(`${fileName} deleted successfully.`);
      } else {
        throw new Error(response.error);
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
        `Reset all files for chatbot "${chatbot.name}"? This cannot be undone.`,
      )
    )
      return;

    const toastId = toast.loading("Resetting knowledge base...");
    try {
      const vecRes = await resetVectors(chatbot.namespace);
      if (!vecRes.success) throw new Error(vecRes.error);
      const deletedCount = await deleteAllNamespaceDocuments({
        namespace: chatbot.namespace,
      });
      toast.success(`Reset complete: removed ${deletedCount} documents.`, {
        id: toastId,
      });
    } catch (err) {
      console.error("❌ Reset error:", err);
      toast.error("Failed to reset knowledge base.", { id: toastId });
    }
  };

  if (!chatbot) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="h-12 w-12 bg-primary/20 rounded-xl" />
          <p className="text-muted-foreground font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background relative overflow-hidden">
      <Toaster position="top-right" />
      <UploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        chatbot={chatbot}
      />

      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-md px-4 md:px-8 py-6 flex  md:flex-row md:items-center justify-between gap-4 sticky top-0 z-10">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <FiDatabase className="text-primary" />
            Knowledge Base
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1 max-w-lg">
            Manage the documents your agent uses.
          </p>
        </div>
        <button
          onClick={handleResetAll}
          className="inline-flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/20 transition-all"
        >
          <RiResetLeftLine className="h-4 w-4" />
          <span className="hidden md:inline">Reset All</span>
          <span className="md:hidden">Reset</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 animate-fade-in">
        <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">
          {/* Info Banner */}
          <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs md:text-sm text-blue-600 dark:text-blue-400">
            <FiInfo className="mt-0.5 shrink-0" size={16} />
            <p>Adding descriptions helps the AI find the right file faster.</p>
          </div>

          {/* Files List Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-4">
              Uploaded Documents
              <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium">
                {documents?.length || 0}
              </span>
            </h3>
            <button
              className="inline-flex items-center gap-2 text-sm font-semibold bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
              onClick={() => setIsModalOpen(true)}
            >
              <FiPlus className="h-4 w-4" />{" "}
              <span className="hidden sm:inline">Upload File</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>

          {/* Files List */}
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
                  Upload a file to start training.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- FILE CARD COMPONENT (Mobile Optimized) ---
function FileCard({
  document,
  onDelete,
}: {
  document: any;
  onDelete: () => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

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

  return (
    <>
      <EditModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        documentId={document._id}
        currentDescription={document.fileDescription || ""}
      />

      <div className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-card border border-border rounded-xl hover:border-primary/40 hover:shadow-lg transition-all duration-300 gap-4 sm:gap-0">
        {/* File Info */}
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <FiFile size={20} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate text-sm sm:text-base">
              {document.fileName}
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
              <span className="bg-muted px-1.5 rounded font-mono">
                {formatFileSize(document.fileSize)}
              </span>
              <span className="hidden sm:inline">•</span>
              <span>{document.chunksCount} chunks</span>
            </div>
            {/* Description Preview */}
            {document.fileDescription && (
              <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 italic border-l-2 border-primary/20 pl-2">
                {document.fileDescription}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 sm:pl-4 sm:border-l sm:border-border/50 w-full sm:w-auto mt-2 sm:mt-0">
          <button
            onClick={() => setIsEditOpen(true)}
            className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
            title="Edit Description"
          >
            <FiEdit2 size={18} />
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors disabled:opacity-50"
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
    </>
  );
}
