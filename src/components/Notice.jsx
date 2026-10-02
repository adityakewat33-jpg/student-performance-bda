import { useEffect } from 'react';
import { Check, AlertCircle, X } from 'lucide-react';
export default function Notice({ notice, onClose }) {
  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, 6000);
    return () => clearTimeout(timer);
  }, [notice, onClose]);
  if (!notice) return null;
  const ok = notice.type === 'success';
  return (
    <div className="fixed bottom-4 right-4 z-[70] w-[calc(100vw-2rem)] max-w-sm">
      <div
        className={
          'flex items-start gap-3 rounded-xl border bg-white px-4 py-3 shadow-lg ' +
          (ok ? 'border-green-200' : 'border-red-200')
        }
      >
        {ok ? (
          <Check className="w-5 h-5 text-[#15803D] shrink-0 mt-0.5" />
        ) : (
          <AlertCircle className="w-5 h-5 text-[#B91C1C] shrink-0 mt-0.5" />
        )}
        <p className="text-sm text-slate-700 flex-1 leading-relaxed break-words">{notice.message}</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close notification"
          className="text-slate-400 hover:text-slate-700 shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}