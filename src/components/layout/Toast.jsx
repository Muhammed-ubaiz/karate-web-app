import React from 'react';
import { useDojo } from '../../context/DojoContext';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export const Toast = () => {
  const { toast } = useDojo();
  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100vw-1.5rem)] max-w-md animate-bounce-short">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md ${
        isSuccess
          ? 'bg-emerald-50/95 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-500/40 text-emerald-900 dark:text-emerald-100 shadow-emerald-900/15 dark:shadow-emerald-950/50'
          : isError
          ? 'bg-red-50/95 dark:bg-red-950/90 border-red-200 dark:border-red-500/40 text-red-900 dark:text-red-100 shadow-red-900/15 dark:shadow-red-950/50'
          : 'bg-white/95 dark:bg-zinc-900/90 border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100'
      }`}>
        {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />}
        {isError && <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />}
        {!isSuccess && !isError && <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />}
        
        <p className="text-sm font-medium flex-1 min-w-0 break-words">{toast.message}</p>
      </div>
    </div>
  );
};
