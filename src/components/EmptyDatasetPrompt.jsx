import { Link } from 'react-router-dom';
import { UploadCloud, Sparkles, Database, FileSpreadsheet, ArrowRight } from 'lucide-react';
import { useDatasetStore } from '../store/datasetStore';

export default function EmptyDatasetPrompt({ title = 'Awaiting Dataset Ingestion', pageName = 'this view' }) {
  const loadGeneratedSample = useDatasetStore((s) => s.loadGeneratedSample);

  return (
    <div className="w-full max-w-4xl mx-auto my-12 bg-white rounded-2xl border-2 border-dashed border-indigo-200 p-8 sm:p-12 text-center shadow-sm">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-[#4338CA] border border-indigo-100 flex items-center justify-center mx-auto shadow-inner">
        <UploadCloud className="w-8 h-8" />
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-bold text-indigo-700 mt-5">
        <Database className="w-3.5 h-3.5" />
        Big Data Pipeline · Stage 1
      </div>

      <h3 className="mt-3 text-2xl font-bold text-slate-900 tracking-tight">
        {title}
      </h3>

      <p className="mt-2 text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
        No dataset is currently loaded. Upload a student CSV or JSON file from your machine to trigger
        automated schema cleaning, boundary clamping, and live statistical aggregation for {pageName}.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/upload"
          className="px-6 py-3 rounded-xl bg-[#4338CA] text-white text-sm font-semibold hover:bg-[#3730a3] transition-all shadow-md shadow-indigo-200 inline-flex items-center gap-2 active:scale-95"
        >
          <UploadCloud className="w-4 h-4" />
          Upload Dataset Now
          <ArrowRight className="w-4 h-4" />
        </Link>

        <button
          type="button"
          onClick={() => loadGeneratedSample()}
          className="px-5 py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-100 transition-colors inline-flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          Load Benchmark Sample (1,000 Records)
        </button>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-500">
        <div className="flex items-center justify-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-indigo-500" />
          Step 1: Ingest CSV / JSON
        </div>
        <div className="flex items-center justify-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-500" />
          Step 2: Clean & Validate Boundaries
        </div>
        <div className="flex items-center justify-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          Step 3: Real-Time OLAP Aggregations
        </div>
      </div>
    </div>
  );
}
