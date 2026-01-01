import { generateKeywords } from "@/app/actions/generateKeywords";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useState } from "react";
import toast from "react-hot-toast";
import { FiLoader, FiX, FiTag, FiFileText } from "react-icons/fi";

function EditModal({
  isOpen,
  onClose,
  documentId,
  currentDescription,
  currentKeywords = [],
}: {
  isOpen: boolean;
  onClose: () => void;
  documentId: Id<"documents">;
  currentDescription: string;
  currentKeywords?: string[];
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
      toast.success("Description and keywords updated!");
      onClose();
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update description.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  // const keywordCount = keywords
  //   .split(",")
  //   .map((k) => k.trim())
  //   .filter((k) => k.length > 0).length;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-card border border-border rounded-xl w-full max-w-lg p-6 relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors"
          aria-label="Close"
        >
          <FiX size={20} />
        </button>

        <h3 className="text-xl font-bold text-foreground mb-1">
          Edit Document Metadata
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          Update description and keywords to improve AI routing and retrieval.
        </p>

        {/* Description Section */}
        <div className="mb-5">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
            <FiFileText className="text-primary" size={16} />
            Description
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what this file contains..."
            className="w-full p-3 bg-muted border border-border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none transition-all text-sm resize-none"
          />
          <p className="text-xs text-muted-foreground mt-1.5">
            A clear description helps the AI understand the file's purpose and
            content.
          </p>
        </div>

        {/* Keywords Section
        <div className="mb-6">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
            <FiTag className="text-primary" size={16} />
            Keywords
            <span className="ml-auto text-xs text-muted-foreground font-normal">
              {keywordCount} keyword{keywordCount !== 1 ? "s" : ""}
            </span>
          </label>
          <textarea
            rows={3}
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="keyword1, keyword2, keyword3..."
            className="w-full p-3 bg-muted border border-border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none transition-all text-sm resize-none"
          />
          <p className="text-xs text-muted-foreground mt-1.5">
            Comma-separated keywords for routing queries to this document. Edit
            to improve accuracy.
          </p>
        </div> */}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 py-2.5 px-4 bg-muted text-foreground font-medium rounded-lg hover:bg-muted/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !description.trim()}
            className="flex-1 py-2.5 px-4 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving && <FiLoader className="animate-spin" size={16} />}
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditModal;
