import React from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-[#252526] border border-[#3c3c3c] rounded-lg max-w-lg w-full mx-4 p-6">
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#cccccc]">{title}</h2>
            <button onClick={onClose} className="text-[#858585] hover:text-[#cccccc]">
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
