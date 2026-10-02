import { create } from 'zustand';
import { Student } from '../api/entities';
import { generateStudents, generateCohortPreset, normalizeStudent } from '../data/generator';
import { extractPage } from '../data/paging';

const STORAGE_KEY = 'spa_imported_dataset_v1';
const HISTORY_KEY = 'spa_import_history_v1';
const GENERATED_COUNT = 1000;
const GENERATED_SEED = 20260114;

function mergeDatasets(base, overrides) {
  const map = new Map();
  for (let i = 0; i < base.length; i += 1) {
    map.set(String(base[i].studentId).toUpperCase(), base[i]);
  }
  for (let i = 0; i < overrides.length; i += 1) {
    const key = String(overrides[i].studentId).toUpperCase();
    if (!key) continue;
    map.set(key, overrides[i]);
  }
  return Array.from(map.values());
}

function readStoredImport() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.rows) || parsed.rows.length === 0) return null;
    return parsed;
  } catch (err) {
    return null;
  }
}

export function readLocalImportHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (err) {
    return [];
  }
}

export function saveLocalImportHistory(logItem) {
  try {
    const existing = readLocalImportHistory();
    const item = {
      id: logItem.id || 'log_' + Date.now(),
      created_at: logItem.created_at || new Date().toISOString(),
      fileName: logItem.fileName,
      totalRows: logItem.totalRows,
      importedRows: logItem.importedRows,
      cleanedRows: logItem.cleanedRows,
      skippedRows: logItem.skippedRows,
      duplicateRows: logItem.duplicateRows,
      note: logItem.note || '',
    };
    const updated = [item, ...existing.filter((e) => e.id !== item.id)].slice(0, 30);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    return [];
  }
}

export function clearLocalImportHistory() {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (err) {
    /* ignore */
  }
}

export const useDatasetStore = create((set, get) => ({
  generated: [],
  imported: null,
  importMeta: null,
  dbRecords: [],
  students: [],
  loading: true,
  refreshing: false,
  initialized: false,
  dbError: null,

  recompute: () => {
    const { generated, imported, dbRecords } = get();
    const base = imported && imported.length ? imported : generated;
    set({ students: mergeDatasets(base, dbRecords) });
  },

  refreshDb: async () => {
    set({ refreshing: true, dbError: null });
    const all = [];
    try {
      let page = 1;
      while (page <= 60) {
        const res = await Student.paging({ page, limit: 100, sort: 'studentId', filter: { search: '' } });
        const { rows, totalPages } = extractPage(res);
        for (let i = 0; i < rows.length; i += 1) {
          const normalized = normalizeStudent(rows[i]);
          if (normalized.studentId) all.push(normalized);
        }
        if (rows.length === 0 || page >= totalPages) break;
        page += 1;
      }
      set({ dbRecords: all, dbError: null });
    } catch (err) {
      set({ dbRecords: all, dbError: err?.message || 'Could not load saved records' });
    } finally {
      set({ refreshing: false });
      get().recompute();
    }
  },

  init: async () => {
    if (get().initialized) return;
    set({ initialized: true, loading: true });
    // Empty dataset by default so the upload process can be demonstrated live in front of faculty
    const stored = readStoredImport();
    set({
      generated: [],
      imported: stored ? stored.rows : null,
      importMeta: stored ? stored.meta : null,
    });
    get().recompute();
    set({ loading: false });
  },

  loadGeneratedSample: () => {
    const generated = generateStudents(GENERATED_COUNT, GENERATED_SEED);
    const meta = {
      fileName: 'Benchmark Dataset (1,000 students)',
      totalRows: generated.length,
      importedRows: generated.length,
      cleanedRows: 0,
      skippedRows: 0,
      duplicateRows: 0,
      isPreset: true,
      persisted: true,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ rows: generated, meta }));
    } catch (err) {
      meta.persisted = false;
    }
    set({ imported: generated, importMeta: meta });
    get().recompute();
    return meta;
  },

  applyImport: (rows, meta) => {
    let persisted = true;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ rows, meta }));
    } catch (err) {
      persisted = false;
    }
    set({ imported: rows, importMeta: Object.assign({}, meta, { persisted }) });
    get().recompute();
    return persisted;
  },

  loadCohortPreset: (type, title) => {
    const rows = generateCohortPreset(type, 500);
    const meta = {
      fileName: `Preset: ${title}`,
      totalRows: rows.length,
      importedRows: rows.length,
      cleanedRows: 0,
      skippedRows: 0,
      duplicateRows: 0,
      isPreset: true,
      persisted: true,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ rows, meta }));
    } catch (err) {
      meta.persisted = false;
    }
    set({ imported: rows, importMeta: meta });
    get().recompute();
    return meta;
  },

  clearImport: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      /* ignore */
    }
    set({ imported: null, importMeta: null, generated: [] });
    get().recompute();
  },

  clearAllData: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(HISTORY_KEY);
    } catch (err) {
      /* ignore */
    }
    set({ imported: null, importMeta: null, generated: [], students: [], dbRecords: [] });
  },
}));