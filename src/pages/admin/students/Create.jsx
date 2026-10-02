import { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Student } from '../../../api/entities';
import { computeOverall, computeResult } from '../../../data/generator';
import { useDatasetStore } from '../../../store/datasetStore';
import Notice from '../../../components/Notice';
const INITIAL = {
  studentId: '',
  name: '',
  gender: 'Male',
  age: '20',
  attendance: '75',
  studyHours: '4',
  mathematics: '',
  physics: '',
  computer: '',
  english: '',
};
export function validateStudentForm(form) {
  const errors = {};
  if (!String(form.studentId).trim()) errors.studentId = 'Student ID is required.';
  if (!String(form.name).trim() || String(form.name).trim().length < 2)
    errors.name = 'Name must be at least 2 characters.';
  const age = Number(form.age);
  if (!Number.isFinite(age) || age < 15 || age > 60) errors.age = 'Age must be between 15 and 60.';
  const att = Number(form.attendance);
  if (!Number.isFinite(att) || att < 0 || att > 100) errors.attendance = 'Attendance must be between 0 and 100.';
  const sh = Number(form.studyHours);
  if (!Number.isFinite(sh) || sh < 0 || sh > 12) errors.studyHours = 'Study hours must be between 0 and 12.';
  ['mathematics', 'physics', 'computer', 'english'].forEach((key) => {
    const value = Number(form[key]);
    if (form[key] === '' || !Number.isFinite(value) || value < 0 || value > 100) {
      errors[key] = 'Enter marks between 0 and 100.';
    }
  });
  return errors;
}
export function StudentForm({ form, setForm, errors }) {
  const set = (key) => (e) => setForm((prev) => Object.assign({}, prev, { [key]: e.target.value }));
  const field = (key, label, props) => (
    <div>
      <label htmlFor={'f-' + key} className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}
      </label>
      <input
        id={'f-' + key}
        value={form[key]}
        onChange={set(key)}
        {...props}
        className={
          'w-full px-4 py-3 text-base rounded-lg border outline-none focus:ring-2 ' +
          (errors[key]
            ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
            : 'border-slate-300 focus:border-[#4338CA] focus:ring-indigo-200')
        }
      />
      {errors[key] ? <p className="mt-1 text-sm text-[#B91C1C]">{errors[key]}</p> : null}
    </div>
  );
  return (
    <div role="form" aria-label="Student record" className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {field('studentId', 'Student ID', { type: 'text', placeholder: 'e.g. STU1008' })}
        {field('name', 'Name', { type: 'text', placeholder: 'Full name' })}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div>
          <label htmlFor="f-gender" className="block text-sm font-medium text-slate-700 mb-1.5">
            Gender
          </label>
          <select
            id="f-gender"
            value={form.gender}
            onChange={set('gender')}
            className="w-full px-4 py-3 text-base rounded-lg border border-slate-300 bg-white focus:border-[#4338CA] focus:ring-2 focus:ring-indigo-200 outline-none"
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>
        {field('age', 'Age', { type: 'number', min: 15, max: 60 })}
        {field('attendance', 'Attendance (%)', { type: 'number', min: 0, max: 100 })}
        {field('studyHours', 'Study hours / day', { type: 'number', min: 0, max: 12, step: '0.5' })}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {field('mathematics', 'Mathematics', { type: 'number', min: 0, max: 100 })}
        {field('physics', 'Physics', { type: 'number', min: 0, max: 100 })}
        {field('computer', 'Computer', { type: 'number', min: 0, max: 100 })}
        {field('english', 'English', { type: 'number', min: 0, max: 100 })}
      </div>
    </div>
  );
}
export default function StudentCreate() {
  const navigate = useNavigate();
  const refreshDb = useDatasetStore((s) => s.refreshDb);
  const [form, setForm] = useState(INITIAL);
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const errors = useMemo(() => validateStudentForm(form), [form]);
  const isValid = Object.keys(errors).length === 0;
  const preview = useMemo(() => {
    const m = Number(form.mathematics) || 0;
    const p = Number(form.physics) || 0;
    const c = Number(form.computer) || 0;
    const e = Number(form.english) || 0;
    const overall = computeOverall(m, p, c, e);
    return { overall, result: computeResult(m, p, c, e, overall) };
  }, [form.mathematics, form.physics, form.computer, form.english]);
  const handleSave = async () => {
    setTouched(true);
    if (!isValid || saving) return;
    setSaving(true);
    try {
      await Student.create({
        studentId: String(form.studentId).trim(),
        name: String(form.name).trim(),
        gender: form.gender,
        age: Number(form.age),
        attendance: Number(form.attendance),
        studyHours: Number(form.studyHours),
        mathematics: Number(form.mathematics),
        physics: Number(form.physics),
        computer: Number(form.computer),
        english: Number(form.english),
        overallMarks: preview.overall,
        result: preview.result,
      });
      refreshDb();
      navigate('/admin/students');
    } catch (err) {
      setNotice({ type: 'error', message: err?.message || 'Could not create the student record.' });
      setSaving(false);
    }
  };
  return (
    <div className="max-w-4xl mx-auto">
      <Notice notice={notice} onClose={() => setNotice(null)} />
      <Link to="/admin/students" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#4338CA]">
        <ArrowLeft className="w-4 h-4" />
        Back to student records
      </Link>
      <header className="mt-4">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Create student record</h2>
        <p className="mt-2 text-sm text-slate-600">
          Overall marks and result are calculated automatically from the four subject marks.
        </p>
      </header>
      <div className="mt-6 bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-6">
        <StudentForm form={form} setForm={setForm} errors={touched ? errors : {}} />
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs text-slate-500">Overall marks</p>
              <p className="text-2xl font-semibold text-slate-900 tabular-nums">{preview.overall}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Result</p>
              <p
                className={
                  'text-2xl font-semibold ' +
                  (preview.result === 'Pass' ? 'text-[#15803D]' : 'text-[#B91C1C]')
                }
              >
                {preview.result}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || (touched && !isValid)}
            className="px-6 py-3 text-base rounded-lg font-semibold bg-[#4338CA] text-white hover:bg-[#3730a3] hover:text-white active:scale-95 transition-all disabled:opacity-50 inline-flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save record
          </button>
        </div>
      </div>
    </div>
  );
}