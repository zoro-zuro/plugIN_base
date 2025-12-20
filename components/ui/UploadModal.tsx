import { uploadDocumentWithDescription } from "@/app/actions/upload";
import { useState } from "react";
import toast from "react-hot-toast";
import { FiLoader, FiUploadCloud, FiX } from "react-icons/fi";

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

export default UploadModal;
