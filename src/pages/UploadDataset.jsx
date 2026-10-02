import { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  FileCode,
  Download,
  Check,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Save,
  Trash2,
  RefreshCw,
  Loader2,
  ExternalLink,
  Table as TableIcon,
  ChevronRight,
  Database,
  Info,
} from 'lucide-react';
import { useDatasetStore, readLocalImportHistory, saveLocalImportHistory, clearLocalImportHistory } from '../store/datasetStore';
import { generateStudents } from '../data/generator';
import {
  parseDatasetFile,
  SAMPLE_CSV,
  SAMPLE_JSON,
  exportToCsv,
  exportToJson,
} from '../data/datasetParser';
import Notice from '../components/Notice';
import { ImportLog } from '../api/entities';
import { extractPage, formatDate, rowTimestamp, rowId } from '../data/paging';
import { aiflow4507, aiflow4507ConfigPromise } from '@/lib/aiflow';

export default function UploadDataset() {
  const students = useDatasetStore((s) => s.students);
  const importedRows = useDatasetStore((s) => s.imported);
  const importMeta = useDatasetStore((s) => s.importMeta);
  const applyImport = useDatasetStore((s) => s.applyImport);
  const clearImport = useDatasetStore((s) => s.clearImport);
  const loadCohortPreset = useDatasetStore((s) => s.loadCohortPreset);

  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [progressRows, setProgressRows] = useState(0);
  const [notice, setNotice] = useState(null);
  const [summary, setSummary] = useState(null);
  const [previewRows, setPreviewRows] = useState([]);

  // Quality report & logs
  const [report, setReport] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const [savingLog, setSavingLog] = useState(false);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Initialize preview if dataset is already imported
  useEffect(() => {
    if (importedRows && importedRows.length > 0) {
      setPreviewRows(importedRows.slice(0, 10));
      if (importMeta) {
        setSummary(importMeta);
      }
    } else if (students && students.length > 0) {
      setPreviewRows(students.slice(0, 10));
    }
  }, [importedRows, importMeta, students]);

  // Load import logs from backend or local storage
  const fetchLogs = async () => {
    setLogsLoading(true);
    let remoteLoaded = false;
    try {
      const res = await ImportLog.paging({ page: 1, limit: 10, sort: '-created_at', filter: { search: '' } });
      const rows = extractPage(res).rows;
      if (Array.isArray(rows) && rows.length > 0) {
        setLogs(rows);
        remoteLoaded = true;
      }
    } catch (err) {
      // Backend not accessible, fall back to local storage
    }

    if (!remoteLoaded) {
      const local = readLocalImportHistory();
      setLogs(local);
    }
    setLogsLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelected(files[0]);
    }
  };

  const handleFileSelected = (file) => {
    if (!file) return;

    setParsing(true);
    setProgressRows(0);
    setNotice(null);
    setSummary(null);
    setReport('');

    parseDatasetFile(file, {
      onProgress: (count) => {
        setProgressRows(count);
      },
      onComplete: ({ fileName, rows, summary: parseSummary }) => {
        setParsing(false);
        const persisted = applyImport(rows, parseSummary);
        const finalSummary = Object.assign({}, parseSummary, { persisted });
        setSummary(finalSummary);
        setPreviewRows(rows.slice(0, 10));

        // Save entry into local import log history
        saveLocalImportHistory({
          fileName,
          totalRows: parseSummary.totalRows,
          importedRows: parseSummary.importedRows,
          cleanedRows: parseSummary.cleanedRows,
          skippedRows: parseSummary.skippedRows,
          duplicateRows: parseSummary.duplicateRows,
          note: `Imported ${rows.length} rows (${parseSummary.format?.toUpperCase() || 'CSV'}).`,
        });
        fetchLogs();

        setNotice({
          type: 'success',
          message: `Successfully loaded & cleaned ${rows.length.toLocaleString()} student records from "${fileName}". All dashboard charts, analytics, and rankings have updated!`,
        });
      },
      onError: (err) => {
        setParsing(false);
        setNotice({
          type: 'error',
          message: err?.message || 'Error processing the dataset file.',
        });
      },
    });
  };

  const handlePreset = (type, title) => {
    const meta = loadCohortPreset(type, title);
    setSummary(meta);
    setPreviewRows(useDatasetStore.getState().students.slice(0, 10));
    setNotice({
      type: 'success',
      message: `Loaded "${title}" preset dataset (${meta.totalRows} records). All metrics recalculated.`,
    });
  };

  const handleDownloadFull1000Dataset = () => {
    const rows = generateStudents(1000, 20260114);
    exportToCsv(rows, 'students_dataset_1000.csv');
  };

  const handleDownloadSampleCsv = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_performance_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadSampleJson = () => {
    const blob = new Blob([SAMPLE_JSON], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_performance_template.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDraftReport = async () => {
    if (!summary || reportLoading) return;
    setReportLoading(true);
    try {
      const config = await aiflow4507ConfigPromise;
      const facts = [
        'File name: ' + summary.fileName,
        'Rows found in file: ' + summary.totalRows,
        'Rows imported: ' + summary.importedRows,
        'Rows repaired during cleaning: ' + summary.cleanedRows,
        'Rows skipped: ' + summary.skippedRows,
        'Skipped because Student_ID repeated: ' + summary.duplicateRows,
        'Subject marks clamped into 0–100: ' + (summary.clampedMarks || 0),
        'Overall_Marks recalculated: ' + (summary.recomputed || 0),
        summary.truncated ? 'Dataset exceeded row cap and was safely bounded.' : '',
      ]
        .filter(Boolean)
        .join('\n');

      const res = await aiflow4507.chat({
        system: config?.systemPrompt || 'You are an expert Big Data Quality Analyst.',
        messages: [
          {
            role: 'user',
            content: 'Draft a professional Big Data pre-processing and data quality audit for this student dataset:\n\n' + facts,
          },
        ],
      });
      setReport(res?.content || '');
    } catch (err) {
      if (err?.status === 402) {
        setNotice({ type: 'error', message: 'AI credits exhausted or not configured.' });
      } else {
        setNotice({ type: 'error', message: 'AI report generation currently unavailable.' });
      }
    } finally {
      setReportLoading(false);
    }
  };

  const handleSaveLog = async () => {
    if (!summary || savingLog) return;
    setSavingLog(true);
    const logData = {
      fileName: summary.fileName,
      totalRows: summary.totalRows,
      importedRows: summary.importedRows,
      cleanedRows: summary.cleanedRows,
      skippedRows: summary.skippedRows,
      duplicateRows: summary.duplicateRows,
      note: report || 'Dataset ingestion completed and verified.',
    };

    saveLocalImportHistory(logData);

    try {
      await ImportLog.create(logData);
    } catch (err) {
      // Backend write optional
    }

    setSavingLog(false);
    setNotice({ type: 'success', message: 'Ingestion audit logged to history.' });
    fetchLogs();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
      <Notice notice={notice} onClose={() => setNotice(null)} />

      {/* Page Header */}
      <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest text-indigo-700 font-bold bg-indigo-50 px-2.5 py-1 rounded">
              Big Data Pipeline · Stage 1 & 2
            </span>
            <span className="text-xs text-slate-500">Ingestion & Preprocessing</span>
          </div>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Upload Student Datasets
          </h2>
          <p className="mt-1 text-sm text-slate-600 max-w-3xl">
            Upload any student performance dataset in <strong>CSV</strong> or <strong>JSON</strong> format.
            Our automated Big Data cleaning pipeline normalizes column headers, repairs missing values, validates mark boundaries,
            and dynamically recomputes all analytics, graphs, and rankings.
          </p>
        </div>

        {/* Template Downloads & Active Export */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleDownloadFull1000Dataset}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition-colors inline-flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            Download 1,000 Students (.csv)
          </button>
          <button
            type="button"
            onClick={handleDownloadSampleCsv}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-colors inline-flex items-center gap-1.5 shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Sample CSV
          </button>
          <button
            type="button"
            onClick={handleDownloadSampleJson}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-colors inline-flex items-center gap-1.5 shadow-sm"
          >
            <FileCode className="w-3.5 h-3.5 text-amber-600" />
            Sample JSON
          </button>
          <button
            type="button"
            onClick={() => exportToCsv(students, `student_dataset_${Date.now()}.csv`)}
            disabled={!students.length}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-50 text-[#4338CA] border border-indigo-200 hover:bg-indigo-100 transition-colors inline-flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            Export Active ({students.length})
          </button>
        </div>
      </header>

      {/* Preset Cohort Selector Bar */}
      <section className="mt-6 bg-gradient-to-r from-indigo-50/70 via-cyan-50/50 to-slate-50 rounded-xl border border-indigo-100 p-4 sm:p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-indigo-600 text-white shrink-0 mt-0.5">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Want to test immediately? Try preset benchmark cohorts
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Load specialized synthetic cohorts with 1-click to see how statistical distributions and charts react.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handlePreset('high_performers', 'Honors / High Performers')}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50 transition-all shadow-sm flex items-center gap-1.5"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              High Performers (500)
            </button>
            <button
              type="button"
              onClick={() => handlePreset('at_risk', 'At-Risk / Low Attendance')}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-rose-300 text-rose-800 hover:bg-rose-50 transition-all shadow-sm flex items-center gap-1.5"
            >
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              At-Risk Cohort (500)
            </button>
            <button
              type="button"
              onClick={() => {
                clearImport();
                setNotice({ type: 'success', message: 'Reverted to default generated baseline (1,000 students).' });
              }}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-all shadow-sm flex items-center gap-1.5"
            >
              <RotateCcw className="w-3 h-3 text-slate-500" />
              Reset Baseline (1,000)
            </button>
          </div>
        </div>
      </section>

      {/* Main Upload Dropzone */}
      <section className="mt-6 bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center transition-all ${
            isDragging
              ? 'border-indigo-600 bg-indigo-50/60 scale-[1.01]'
              : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50/60'
          }`}
        >
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-[#4338CA] border border-indigo-100 flex items-center justify-center mx-auto shadow-inner">
            <UploadCloud className="w-8 h-8" />
          </div>

          <h3 className="mt-4 text-lg font-bold text-slate-900">
            Drag & drop your student dataset here, or <span className="text-[#4338CA] underline decoration-indigo-300">browse</span>
          </h3>

          <p className="mt-2 text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
            Supports <strong>.csv</strong>, <strong>.json</strong>, and <strong>.tsv</strong> formats up to 25,000 records.
            Flexible headers: <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">Student_ID</code>,{' '}
            <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">Name</code>,{' '}
            <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">Attendance</code>,{' '}
            <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">Study_Hours</code>,{' '}
            <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">Marks</code>.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.json,.tsv,.txt,text/csv,application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files && e.target.files[0];
              if (file) handleFileSelected(file);
              e.target.value = '';
            }}
          />

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              disabled={parsing}
              className="px-6 py-2.5 text-sm rounded-lg font-semibold bg-[#4338CA] text-white hover:bg-[#3730a3] shadow transition-all disabled:opacity-50 inline-flex items-center gap-2"
            >
              {parsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
              {parsing ? `Parsing & Cleaning ${progressRows.toLocaleString()} rows…` : 'Select File from Device'}
            </button>
          </div>
        </div>

        {/* Current Active Dataset Status */}
        {importMeta ? (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-indigo-50/80 border border-indigo-200 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <p className="text-sm text-slate-800">
                Active dataset:{' '}
                <strong className="text-indigo-900 font-semibold">{importMeta.fileName || 'Imported Dataset'}</strong>
                {importedRows ? ` (${importedRows.length.toLocaleString()} records loaded)` : ''}
                {importMeta.persisted === false && (
                  <span className="text-amber-700 font-medium"> · In-memory (storage limit exceeded)</span>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                clearImport();
                setSummary(null);
                setReport('');
                setNotice({ type: 'success', message: 'Reverted to the generated baseline dataset.' });
              }}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg text-rose-700 bg-white border border-rose-200 hover:bg-rose-50 transition-colors inline-flex items-center gap-1.5 shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Revert to Baseline (1,000)
            </button>
          </div>
        ) : null}
      </section>

      {/* Data Cleaning & Preprocessing Summary */}
      {summary && (
        <section className="mt-8 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-indigo-700 font-bold">BDA Pipeline Stage 2</p>
              <h3 className="mt-0.5 text-base font-bold text-slate-900">
                Data Cleaning & Preprocessing Summary: {summary.fileName}
              </h3>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-emerald-100 text-emerald-800">
              Pipeline Complete
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 bg-slate-50/50">
            <div className="p-4 sm:p-5">
              <p className="text-xs font-medium text-slate-500">Total Rows Found</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">
                {Number(summary.totalRows || 0).toLocaleString()}
              </p>
            </div>
            <div className="p-4 sm:p-5">
              <p className="text-xs font-medium text-slate-500">Successfully Ingested</p>
              <p className="mt-1 text-2xl font-bold text-emerald-600 tabular-nums">
                {Number(summary.importedRows || 0).toLocaleString()}
              </p>
            </div>
            <div className="p-4 sm:p-5">
              <p className="text-xs font-medium text-slate-500">Repaired / Imputed</p>
              <p className="mt-1 text-2xl font-bold text-cyan-600 tabular-nums">
                {Number(summary.cleanedRows || 0).toLocaleString()}
              </p>
            </div>
            <div className="p-4 sm:p-5">
              <p className="text-xs font-medium text-slate-500">Skipped (Invalid)</p>
              <p className="mt-1 text-2xl font-bold text-rose-600 tabular-nums">
                {Number(summary.skippedRows || 0).toLocaleString()}
              </p>
            </div>
            <div className="p-4 sm:p-5">
              <p className="text-xs font-medium text-slate-500">Duplicate IDs</p>
              <p className="mt-1 text-2xl font-bold text-amber-600 tabular-nums">
                {Number(summary.duplicateRows || 0).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="p-5 border-t border-slate-100 bg-white">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Automated Transformations Applied:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Empty rows dropped: {Number(summary.emptyRows || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Rows with missing ID/Name fixed: {Number(summary.missingId || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Marks bounded to 0–100 scale: {Number(summary.clampedMarks || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Overall marks & Pass/Fail recalculated: {Number(summary.recomputed || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* AI Quality Audit Draft */}
          <div className="p-5 border-t border-slate-100 bg-slate-50/70 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDraftReport}
                  disabled={reportLoading}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors inline-flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {reportLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  {reportLoading ? 'Generating AI audit…' : 'Generate AI Quality Report'}
                </button>
                <button
                  type="button"
                  onClick={handleSaveLog}
                  disabled={savingLog}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {savingLog ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-indigo-600" />}
                  Save Ingestion Record
                </button>
              </div>
              <span className="text-xs text-slate-500">Record verification note</span>
            </div>

            <textarea
              value={report}
              onChange={(e) => setReport(e.target.value)}
              rows={3}
              placeholder="Audit log comments or AI data quality report will appear here. You can add your own notes before saving."
              className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none resize-y"
            />
          </div>
        </section>
      )}

      {/* Live Data Preview Table (First 10 records) */}
      <section className="mt-8 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TableIcon className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Live Ingested Data Preview
            </h3>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
              showing first {previewRows.length} of {students.length.toLocaleString()} rows
            </span>
          </div>
          <p className="text-xs text-slate-500">Verify column mapping & cleaned values</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                <th className="px-4 py-3">Student ID</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Gender</th>
                <th className="px-4 py-3">Age</th>
                <th className="px-4 py-3">Att. %</th>
                <th className="px-4 py-3">Study Hrs</th>
                <th className="px-4 py-3">Math</th>
                <th className="px-4 py-3">Phy</th>
                <th className="px-4 py-3">Comp</th>
                <th className="px-4 py-3">Eng</th>
                <th className="px-4 py-3 text-right">Overall</th>
                <th className="px-4 py-3 text-center">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {previewRows.map((row) => (
                <tr key={row.studentId} className="hover:bg-indigo-50/30 transition-colors">
                  <td className="px-4 py-2.5 font-mono text-indigo-700">{row.studentId}</td>
                  <td className="px-4 py-2.5 text-slate-900 font-semibold">{row.name}</td>
                  <td className="px-4 py-2.5 text-slate-600">{row.gender}</td>
                  <td className="px-4 py-2.5 tabular-nums text-slate-600">{row.age}</td>
                  <td className="px-4 py-2.5 tabular-nums text-slate-600">{row.attendance}%</td>
                  <td className="px-4 py-2.5 tabular-nums text-slate-600">{row.studyHours}h</td>
                  <td className="px-4 py-2.5 tabular-nums text-slate-600">{row.mathematics}</td>
                  <td className="px-4 py-2.5 tabular-nums text-slate-600">{row.physics}</td>
                  <td className="px-4 py-2.5 tabular-nums text-slate-600">{row.computer}</td>
                  <td className="px-4 py-2.5 tabular-nums text-slate-600">{row.english}</td>
                  <td className="px-4 py-2.5 text-right font-bold text-slate-900 tabular-nums">
                    {row.overallMarks}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        row.result === 'Pass'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {row.result}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Ingestion & Import History */}
      <section className="mt-8 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Dataset Ingestion History</h3>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
              {logs.length} logged records
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchLogs}
              disabled={logsLoading}
              title="Refresh logs"
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${logsLoading ? 'animate-spin' : ''}`} />
            </button>
            {logs.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  clearLocalImportHistory();
                  setLogs([]);
                  setNotice({ type: 'success', message: 'Import history cleared.' });
                }}
                className="text-xs text-rose-600 hover:text-rose-800 font-medium px-2 py-1"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {logs.length === 0 ? (
          <p className="px-6 py-8 text-xs text-slate-500 text-center">No dataset ingestion runs recorded yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100 text-xs">
            {logs.map((log) => (
              <li key={log.id || rowId(log)} className="px-6 py-3.5 hover:bg-slate-50/50 transition-colors">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-slate-900">{log.fileName}</span>
                  <span className="text-slate-400">{formatDate(log.created_at || rowTimestamp(log))}</span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-slate-500">
                  <span>Imported: <strong className="text-emerald-700">{Number(log.importedRows || 0).toLocaleString()}</strong></span>
                  <span>Cleaned: <strong className="text-cyan-700">{Number(log.cleanedRows || 0).toLocaleString()}</strong></span>
                  <span>Skipped: <strong className="text-rose-700">{Number(log.skippedRows || 0).toLocaleString()}</strong></span>
                </div>
                {log.note && (
                  <p className="mt-1.5 text-slate-600 italic bg-slate-50 p-2 rounded border border-slate-100">
                    {log.note}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* BDA Pipeline Educational Note */}
      <footer className="mt-8 rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 text-xs text-slate-600 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Big Data Analytics Architecture:</strong> In high-throughput educational data warehousing, raw records
          arrive from disparate sources (LMS logs, registrar CSVs, biometric attendance). Stage 1 & 2 handle
          ETL (Extract, Transform, Load), outlier suppression, and automated grading heuristics before persisting to in-memory OLAP cubes for instant visualization.
        </p>
      </footer>
    </div>
  );
}
