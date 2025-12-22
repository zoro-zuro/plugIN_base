import { useState } from "react";
import { FiEdit2, FiFile, FiLoader, FiTrash2 } from "react-icons/fi";
import EditModal from "./EditModal";
import { BsThreeDotsVertical } from "react-icons/bs";
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

      <div className="group flex flex-col sm:flex-row justify-center  sm:items-center sm:justify-between p-4 bg-card border border-border rounded-xl hover:border-primary/40 hover:shadow-lg transition-all duration-300 gap-4 sm:gap-0">
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
              <p className="text-xs w-full text-muted-foreground mt-1.5 line-clamp-4 italic border-l-2 border-primary/20 pl-2">
                {document.fileDescription.slice(0, 100)}..
              </p>
            )}
          </div>

          {/* Action Buttons Mobile threedots */}
          <div className="relative sm:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
              title="Edit Description"
            >
              <BsThreeDotsVertical size={18} />
            </button>
            {isMobileMenuOpen && (
              <div className="absolute top-10 right-0 bg-card border border-border rounded-lg shadow-lg z-10 flex flex-col">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsEditOpen(true);
                  }}
                  className="p-2 flex items-center gap-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors border-border-b border-border/50"
                  title="Edit Description"
                >
                  <FiEdit2 size={18} />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleDelete();
                  }}
                  disabled={isDeleting}
                  className="p-2 flex items-center gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors disabled:opacity-50"
                  title="Delete file"
                >
                  {isDeleting ? (
                    <FiLoader className="animate-spin" />
                  ) : (
                    <FiTrash2 size={18} />
                  )}
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="hidden sm:flex items-center justify-end gap-2 sm:pl-4 sm:border-l sm:border-border/50 w-full sm:w-auto mt-2 sm:mt-0">
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

export default FileCard;
