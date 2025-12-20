"use client";

import { useState, use } from "react";
import { FiFile, FiInfo, FiDatabase, FiPlus } from "react-icons/fi";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import toast, { Toaster } from "react-hot-toast";
import { Id } from "@/convex/_generated/dataModel";
import { deletePineconeVectors, resetVectors } from "@/app/actions/delFile";
import { RiResetLeftLine } from "react-icons/ri";
import UploadModal from "@/components/ui/UploadModal";
import FileCard from "@/components/ui/FileCard";

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
          {/* Files List Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-foreground flex items-center justify-center gap-4">
              Uploaded Documents
              <span className="text-xs bg-muted text-center text-muted-foreground px-2 py-0.5 rounded-full font-medium">
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
