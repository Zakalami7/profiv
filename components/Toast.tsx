
import React, { useEffect, useState } from 'react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

const ToastItem: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const bgColors = {
    success: 'bg-white border-l-4 border-emerald-500',
    error: 'bg-white border-l-4 border-red-500',
    info: 'bg-white border-l-4 border-indigo-500',
  };

  const icons = {
    success: (
      <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    info: (
      <svg className="w-6 h-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <div className={`flex items-start gap-4 p-4 rounded-lg shadow-xl mb-3 transform transition-all duration-300 hover:scale-102 ${bgColors[toast.type]} animate-fade-in-up min-w-[320px] pointer-events-auto`}>
      <div className="shrink-0 pt-0.5">{icons[toast.type]}</div>
      <div className="flex-1">
        <p className="font-medium text-slate-800 text-sm leading-relaxed">{toast.message}</p>
      </div>
      <button onClick={() => onClose(toast.id)} className="text-slate-400 hover:text-slate-600">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export const ToastContainer: React.FC<{ toasts: ToastMessage[]; removeToast: (id: string) => void }> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col items-end pointer-events-none">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onClose={removeToast} />
      ))}
    </div>
  );
};
