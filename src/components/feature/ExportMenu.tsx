import { useState, useRef, useEffect } from 'react';

type ExportMenuProps = {
  onExportCSV: () => void;
  onExportPDF: () => void;
  disabled?: boolean;
};

export default function ExportMenu({ onExportCSV, onExportPDF, disabled }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        aria-label="Download report"
        aria-expanded={open}
        className={`btn-press fleet-module-action-btn transition-all duration-200 ${
          disabled
            ? 'cursor-not-allowed border-slate-200/50 bg-slate-50 text-slate-300 shadow-none dark:border-slate-700/70 dark:bg-slate-900 dark:text-slate-600'
            : 'active:scale-95'
        }`}
      >
        <i className="ph ph-download text-lg" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-36 origin-top-right overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.12)] animate-in fade-in zoom-in-95 duration-150 dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_18px_50px_rgba(2,6,23,0.55)]">
          <button
            onClick={() => { onExportCSV(); setOpen(false); }}
            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-caption-sm font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <i className="ph ph-file-csv text-emerald-500 text-base" />
            Export CSV
          </button>
          <button
            onClick={() => { onExportPDF(); setOpen(false); }}
            className="flex w-full items-center gap-2.5 border-t border-slate-100 px-3.5 py-2.5 text-caption-sm font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <i className="ph ph-file-pdf text-red-500 text-base" />
            Export PDF
          </button>
        </div>
      )}
    </div>
  );
}
