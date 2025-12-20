import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useState } from "react";
import toast from "react-hot-toast";
import { FiLoader, FiX } from "react-icons/fi";

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

export default EditModal;
