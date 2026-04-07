import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  loading?: boolean;
}

export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  loading = false
}: ConfirmModalProps) => {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      button: 'bg-red-600 hover:bg-red-700 shadow-red-200',
      icon: 'bg-red-50 text-red-600',
      border: 'border-red-100'
    },
    warning: {
      button: 'bg-orange-500 hover:bg-orange-600 shadow-orange-200',
      icon: 'bg-orange-50 text-orange-600',
      border: 'border-orange-100'
    },
    primary: {
      button: 'bg-[#3041F5] hover:bg-[#3041F5]/90 shadow-[#3041F5]/20',
      icon: 'bg-indigo-50 text-[#3041F5]',
      border: 'border-indigo-100'
    }
  };

  const style = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        <div className="p-6 md:p-8">
          <div className="flex justify-between items-start mb-6">
            <div className={`p-3 rounded-2xl ${style.icon}`}>
              <AlertTriangle size={24} />
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} strokeWidth={2.5} />
            </button>
          </div>

          <div className="space-y-2 mb-8">
            <h3 className="text-xl font-black text-gray-900 tracking-tight">
              {title}
            </h3>
            <p className="text-gray-500 font-medium leading-relaxed">
              {message}
            </p>
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-center gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="w-full sm:flex-1 px-6 py-3.5 text-sm font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-all active:scale-95 disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`w-full sm:flex-1 px-6 py-3.5 text-sm font-bold text-white rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 ${style.button}`}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
