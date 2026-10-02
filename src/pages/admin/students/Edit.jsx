import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Student } from '../../../api/entities';
import { extractOne } from '../../../data/paging';
import { computeOverall, computeResult } from '../../../data/generator';
import { useDatasetStore } from '../../../store/datasetStore';
import Notice from '../../../components/Notice';
import { StudentForm, validateStudentForm } from './Create';
export default function StudentEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const refreshDb = useDatasetStore((s) => s.refreshDb);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);
  const [notice, setNotice] = useState(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await Student.get(id);
        const row = extractOne(res);
        if (!alive) return;
        setForm({
          studentId: String(row.studentId ?? ''),
          name: String(row.name ?? ''),
          gender: row.gender === 'Female' ? 'Female' : 'Male',
          age: String(row.age ?? 20),
          attendance: String(row.attendance ?? 0),
          studyHours: String(row.studyHours ?? 0),
          mathematics: String(row.mathematics ?? 0),
          physics: String(row.physics ?? 0),
          computer: String(row.computer ?? 0),
          english: String(row.english ?? 0),
        });
      } catch (err) {
        if (alive) setNotice({ type: 'error', message: err?.message || 'Could not load this record.' });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);
  const errors = useMemo(() => (form ? validateStudentForm(form) : {}), [form]);
  const isValid = Object.keys(errors).length === 0;
  const preview = useMemo(() => {
    if (!form) return { overall: 0, result: 'Fail' };
    const m = Number(form.mathematics) || 0;
    const p = Number(form.physics) || 0;
    const c = Number(form.computer) || 0;
    const e = Number(form.english) || 0;
    const overall = computeOverall(m, p, c, e);
    return { overall, result: computeResult(m, p, c, e, overall) };
  }, [form]);
  const handleSave = async () => {
    setTouched(true);
    if (!form || !isValid || saving) return;
    setSaving(true);
    try {
      await Student.update(id, {
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
      setNotice({ type: 'error', message: err?.message || 'Could not save this record.' });
      setSaving(false);
    }
  };
  if (loading) {
    return (
      <div className="py-24 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
      </div>
    );
  }
  if (!form) {
    return (
      <div className="max-w-3xl mx-auto">
        <Notice notice={notice} onClose={() => setNotice(null)} />
        <p className="text-sm text-slate-500">This student record could not be loaded.</p>
        <Link to="/admin/students" className="mt-4 inline-block text-sm font-medium text-[#4338CA]">
          Back to student records
        </Link>
      </div>
    );
  }
  return (
    <div className="max-w-4xl mx-auto">
      <Notice notice={notice} onClose={() => setNotice(null)} />
      <Link to="/admin/students" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#4338CA]">
        <ArrowLeft className="w-4 h-4" />
        Back to student records
      </Link>
      <header className="mt-4">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Edit student record</h2>
        <p className="mt-2 text-sm text-slate-600 tabular-nums">{form.studentId}</p>
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
                  'text-2xl font-semibold ' + (preview.result === 'Pass' ? 'text-[#15803D]' : 'text-[#B91C1C]')
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
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}