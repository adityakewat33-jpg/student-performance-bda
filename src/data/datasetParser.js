import Papa from 'papaparse';
import { clamp, computeOverall, computeResult } from './generator';

export const MAX_IMPORT_ROWS = 25000;

export const COLUMN_SYNONYMS = {
  studentId: [
    'student_id', 'studentid', 'id', 'roll_no', 'rollno', 'roll_number', 'roll',
    'usn', 'reg_no', 'regno', 'registration_no', 'registration_number', 'enrollment_no'
  ],
  name: [
    'name', 'student_name', 'studentname', 'fullname', 'full_name',
    'candidate_name', 'first_name'
  ],
  gender: ['gender', 'sex'],
  age: ['age', 'student_age'],
  attendance: [
    'attendance', 'attendance_percentage', 'attendance_pct', 'attendance_percent',
    'att', 'attendance_rate'
  ],
  studyHours: [
    'study_hours', 'studyhours', 'study_hour', 'studyhour', 'hours_studied',
    'study_time', 'weekly_study_hours', 'daily_study_hours'
  ],
  mathematics: [
    'mathematics', 'maths', 'math', 'math_marks', 'm1', 'math_score'
  ],
  physics: [
    'physics', 'phy', 'physics_marks', 'phy_score'
  ],
  computer: [
    'computer', 'computer_science', 'computerscience', 'cs', 'comp',
    'cse', 'it', 'programming', 'cs_marks'
  ],
  english: [
    'english', 'eng', 'english_marks', 'eng_score', 'comm', 'communication'
  ],
  overallMarks: [
    'overall_marks', 'overallmarks', 'overall', 'total', 'total_marks',
    'percentage', 'aggregate', 'score', 'final_marks', 'avg_marks'
  ],
  result: [
    'result', 'status', 'grade', 'outcome', 'pass_fail', 'performance'
  ],
};

// Build inverted map for fast lookup
export const COLUMN_MAP = {};
Object.entries(COLUMN_SYNONYMS).forEach(([standardKey, aliases]) => {
  COLUMN_MAP[standardKey.toLowerCase()] = standardKey;
  aliases.forEach((alias) => {
    COLUMN_MAP[alias.toLowerCase()] = standardKey;
  });
});

export function normalizeHeader(header) {
  return String(header || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

export function toNumber(value) {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const n = Number(String(value).replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(n) ? n : null;
}

export const SAMPLE_CSV = [
  'Student_ID,Name,Gender,Age,Attendance,Study_Hours,Mathematics,Physics,Computer,English,Overall_Marks,Result',
  'STU2001,Ananya Sharma,Female,20,92,6.5,88,82,94,86,87.5,Pass',
  'STU2002,Rohan Verma,Male,21,74,4.0,65,58,72,61,64.0,Pass',
  'STU2003,Meera Nair,Female,19,58,2.0,41,36,48,39,41.0,Pass',
  'STU2004,Karthik Reddy,Male,22,51,1.5,32,28,38,30,32.0,Fail',
  'STU2005,Divya Pillai,Female,20,85,5.0,76,71,83,79,77.3,Pass',
  'STU2006,Arjun Malhotra,Male,20,96,7.5,95,91,98,90,93.5,Pass',
  'STU2007,Pooja Joshi,Female,21,68,3.5,54,49,60,52,53.8,Pass',
  'STU2008,Vihaan Kulkarni,Male,19,45,1.0,28,32,35,31,31.5,Fail',
].join('\n');

export const SAMPLE_JSON = JSON.stringify(
  [
    {
      studentId: 'STU2001',
      name: 'Ananya Sharma',
      gender: 'Female',
      age: 20,
      attendance: 92,
      studyHours: 6.5,
      mathematics: 88,
      physics: 82,
      computer: 94,
      english: 86,
      overallMarks: 87.5,
      result: 'Pass',
    },
    {
      studentId: 'STU2002',
      name: 'Rohan Verma',
      gender: 'Male',
      age: 21,
      attendance: 74,
      studyHours: 4.0,
      mathematics: 65,
      physics: 58,
      computer: 72,
      english: 61,
      overallMarks: 64.0,
      result: 'Pass',
    },
    {
      studentId: 'STU2003',
      name: 'Meera Nair',
      gender: 'Female',
      age: 19,
      attendance: 58,
      studyHours: 2.0,
      mathematics: 41,
      physics: 36,
      computer: 48,
      english: 39,
      overallMarks: 41.0,
      result: 'Pass',
    },
    {
      studentId: 'STU2004',
      name: 'Karthik Reddy',
      gender: 'Male',
      age: 22,
      attendance: 51,
      studyHours: 1.5,
      mathematics: 32,
      physics: 28,
      computer: 38,
      english: 30,
      overallMarks: 32.0,
      result: 'Fail',
    },
  ],
  null,
  2
);

/**
 * Clean and normalize a single student row according to BDA rules
 */
export function cleanRawRow(rawRow, index, seenIds, counters) {
  counters.totalRows += 1;

  if (counters.cleanedLength >= MAX_IMPORT_ROWS) {
    counters.truncated = true;
    counters.skippedRows += 1;
    return null;
  }

  const mapped = {};
  let hasAnyValue = false;

  Object.keys(rawRow || {}).forEach((key) => {
    const normalized = normalizeHeader(key);
    const target = COLUMN_MAP[normalized];
    const value = rawRow[key];
    if (value !== null && value !== undefined && String(value).trim() !== '') {
      hasAnyValue = true;
    }
    if (target) {
      mapped[target] = value;
    }
  });

  if (!hasAnyValue) {
    counters.emptyRows += 1;
    counters.skippedRows += 1;
    return null;
  }

  let studentId = String(mapped.studentId ?? '').trim();
  let name = String(mapped.name ?? '').trim();

  // If no ID but name exists, assign auto ID
  if (!studentId && name) {
    studentId = 'STU-' + String(counters.totalRows).padStart(4, '0');
    counters.recomputed += 1;
  } else if (!studentId && !name) {
    counters.missingId += 1;
    counters.skippedRows += 1;
    return null;
  }

  if (!name && studentId) {
    name = 'Student ' + studentId;
    counters.cleanedRows += 1;
  }

  const key = studentId.toUpperCase();
  if (seenIds.has(key)) {
    counters.duplicateRows += 1;
    counters.skippedRows += 1;
    return null;
  }
  seenIds.add(key);

  let repaired = false;

  // Gender
  const genderRaw = String(mapped.gender ?? '').trim().toLowerCase();
  let gender = 'Male';
  if (genderRaw.startsWith('f') || genderRaw === 'woman' || genderRaw === 'girl') {
    gender = 'Female';
  } else if (genderRaw.startsWith('m') || genderRaw === 'man' || genderRaw === 'boy') {
    gender = 'Male';
  } else {
    repaired = true;
  }

  // Age
  let age = toNumber(mapped.age);
  if (age === null || age < 15 || age > 60) {
    age = 20;
    repaired = true;
  }

  // Attendance
  let attendance = toNumber(mapped.attendance);
  if (attendance === null) {
    attendance = 70;
    repaired = true;
  } else if (attendance < 0 || attendance > 100) {
    attendance = clamp(attendance, 0, 100);
    repaired = true;
  }

  // Study hours
  let studyHours = toNumber(mapped.studyHours);
  if (studyHours === null) {
    studyHours = 3.5;
    repaired = true;
  } else if (studyHours < 0 || studyHours > 12) {
    studyHours = clamp(studyHours, 0, 12);
    repaired = true;
  }

  // Subject marks
  const subjectKeys = ['mathematics', 'physics', 'computer', 'english'];
  const marks = {};
  let anySubjectMissing = false;

  for (let s = 0; s < subjectKeys.length; s += 1) {
    const k = subjectKeys[s];
    let val = toNumber(mapped[k]);
    if (val === null) {
      anySubjectMissing = true;
      marks[k] = null;
    } else {
      if (val < 0 || val > 100) {
        val = clamp(val, 0, 100);
        repaired = true;
        counters.clampedMarks += 1;
      }
      marks[k] = Math.round(val);
    }
  }

  let overallMarks = toNumber(mapped.overallMarks);

  // If subjects were missing, but overallMarks was given:
  if (anySubjectMissing && overallMarks !== null) {
    const boundedOverall = clamp(Math.round(overallMarks * 10) / 10, 0, 100);
    overallMarks = boundedOverall;
    subjectKeys.forEach((k) => {
      if (marks[k] === null) {
        marks[k] = Math.round(boundedOverall);
        repaired = true;
      }
    });
  } else if (anySubjectMissing && overallMarks === null) {
    // Generate marks from attendance/study hours heuristic
    const baseEst = clamp(Math.round(30 + (attendance / 100) * 40 + (studyHours / 10) * 20), 20, 95);
    subjectKeys.forEach((k) => {
      if (marks[k] === null) {
        marks[k] = baseEst;
        repaired = true;
      }
    });
    overallMarks = baseEst;
    repaired = true;
  } else {
    // All 4 subjects present
    const calculatedOverall = computeOverall(marks.mathematics, marks.physics, marks.computer, marks.english);
    if (overallMarks === null || Math.abs(overallMarks - calculatedOverall) > 0.6) {
      overallMarks = calculatedOverall;
      repaired = true;
      counters.recomputed += 1;
    }
  }

  const result = computeResult(
    marks.mathematics,
    marks.physics,
    marks.computer,
    marks.english,
    overallMarks
  );

  const providedResult = String(mapped.result ?? '').trim().toLowerCase();
  if (providedResult !== result.toLowerCase()) {
    repaired = true;
  }

  counters.cleanedLength += 1;
  counters.importedRows += 1;
  if (repaired) counters.cleanedRows += 1;

  return {
    id: 'import-' + key,
    studentId,
    name,
    gender,
    age: Math.round(age),
    attendance: Math.round(attendance),
    studyHours: Math.round(studyHours * 10) / 10,
    mathematics: marks.mathematics,
    physics: marks.physics,
    computer: marks.computer,
    english: marks.english,
    overallMarks,
    result,
    source: 'imported',
  };
}

/**
 * Parse CSV or JSON file / text
 */
export function parseDatasetFile(file, { onProgress, onComplete, onError }) {
  const fileName = file.name || 'uploaded_dataset';
  const fileExtension = fileName.split('.').pop().toLowerCase();

  const seenIds = new Set();
  const cleaned = [];
  const counters = {
    totalRows: 0,
    importedRows: 0,
    cleanedRows: 0,
    skippedRows: 0,
    duplicateRows: 0,
    emptyRows: 0,
    missingId: 0,
    clampedMarks: 0,
    recomputed: 0,
    truncated: false,
    cleanedLength: 0,
  };

  // If JSON format
  if (fileExtension === 'json' || file.type === 'application/json') {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const parsed = JSON.parse(text);
        let rawList = [];
        if (Array.isArray(parsed)) {
          rawList = parsed;
        } else if (parsed && Array.isArray(parsed.students)) {
          rawList = parsed.students;
        } else if (parsed && Array.isArray(parsed.data)) {
          rawList = parsed.data;
        } else if (parsed && Array.isArray(parsed.records)) {
          rawList = parsed.records;
        } else if (parsed && Array.isArray(parsed.rows)) {
          rawList = parsed.rows;
        } else {
          throw new Error('JSON must contain an array of student objects, or a property named "students" or "data".');
        }

        for (let i = 0; i < rawList.length; i += 1) {
          const row = cleanRawRow(rawList[i], i, seenIds, counters);
          if (row) cleaned.push(row);
          if (i % 200 === 0 && onProgress) {
            onProgress(counters.totalRows);
          }
        }

        onComplete({
          fileName,
          rows: cleaned,
          summary: Object.assign({ fileName, format: 'json' }, counters),
        });
      } catch (err) {
        onError(err);
      }
    };
    reader.onerror = () => onError(new Error('Failed to read JSON file.'));
    reader.readAsText(file);
    return;
  }

  // Otherwise assume CSV / delimited text
  Papa.parse(file, {
    header: true,
    skipEmptyLines: 'greedy',
    chunkSize: 1024 * 512,
    chunk: (results) => {
      const chunkRows = results.data || [];
      for (let i = 0; i < chunkRows.length; i += 1) {
        const row = cleanRawRow(chunkRows[i], i, seenIds, counters);
        if (row) cleaned.push(row);
      }
      if (onProgress) onProgress(counters.totalRows);
    },
    complete: () => {
      if (cleaned.length === 0) {
        onError(new Error('No usable student rows found. Please check column headers.'));
        return;
      }
      onComplete({
        fileName,
        rows: cleaned,
        summary: Object.assign({ fileName, format: 'csv' }, counters),
      });
    },
    error: (err) => {
      onError(err);
    },
  });
}

/**
 * Export students array to CSV file download
 */
export function exportToCsv(students, filename = 'student_dataset_export.csv') {
  if (!students || !students.length) return;
  const headers = [
    'Student_ID', 'Name', 'Gender', 'Age', 'Attendance', 'Study_Hours',
    'Mathematics', 'Physics', 'Computer', 'English', 'Overall_Marks', 'Result'
  ];
  const rows = students.map((s) => [
    s.studentId,
    `"${String(s.name || '').replace(/"/g, '""')}"`,
    s.gender,
    s.age,
    s.attendance,
    s.studyHours,
    s.mathematics,
    s.physics,
    s.computer,
    s.english,
    s.overallMarks,
    s.result,
  ].join(','));

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, filename);
}

/**
 * Export students array to JSON file download
 */
export function exportToJson(students, filename = 'student_dataset_export.json') {
  if (!students || !students.length) return;
  const cleanList = students.map((s) => ({
    studentId: s.studentId,
    name: s.name,
    gender: s.gender,
    age: s.age,
    attendance: s.attendance,
    studyHours: s.studyHours,
    mathematics: s.mathematics,
    physics: s.physics,
    computer: s.computer,
    english: s.english,
    overallMarks: s.overallMarks,
    result: s.result,
  }));
  const jsonContent = JSON.stringify(cleanList, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  triggerDownload(blob, filename);
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
