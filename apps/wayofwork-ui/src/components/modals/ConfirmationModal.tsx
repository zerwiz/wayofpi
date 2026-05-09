import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-[#252526] p-6 rounded-lg max-w-md w-full">
        <h2 className="text-xl font-bold text-[#cccccc] mb-4">{title}</h2>
        <p className="text-[#858585] mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-[#858585] hover:bg-[#3c3c3c] rounded"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-[#ea580c] text-white rounded hover:bg-[#c2410c]"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};
