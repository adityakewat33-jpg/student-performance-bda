import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Zap,
  Loader2,
  Send,
  Image as ImageIcon,
  Download,
  Check,
  BookOpen,
} from 'lucide-react';
import { aiflow4505, aiflow4505ConfigPromise, aiflow4506 } from '@/lib/aiflow';
const FLOW = [
  'Dataset Ingestion (CSV / JSON)',
  'Data Cleaning & Preprocessing',
  'Big Data Processing / Aggregation',
  'Analysis Results',
  'Dashboard Charts',
];
const FEATURES = [
  {
    title: 'CSV & JSON Dataset Loading',
    desc: 'The raw student dataset is read row by row, exactly like a Spark job reading a file from HDFS.',
    img: 'https://cdn.vibe-x.app/apps/d7ae1e35c4e83e7b4f62fe53/assets/original/feature-1-159731.png',
  },
  {
    title: 'Data Cleaning Pipeline',
    desc: 'Empty rows are dropped, duplicate Student_IDs removed, and invalid or missing values repaired.',
    img: 'https://cdn.vibe-x.app/apps/d7ae1e35c4e83e7b4f62fe53/assets/original/feature-2-159731.png',
  },
  {
    title: 'Aggregation & Grouping',
    desc: 'Averages, counts and percentages are computed per subject, per gender, per age and per study range.',
    img: 'https://cdn.vibe-x.app/apps/d7ae1e35c4e83e7b4f62fe53/assets/original/feature-3-159731.png',
  },
  {
    title: 'Student Search Profile',
    desc: 'A single record can be looked up by ID or name and shown with its marks, group and result.',
    img: 'https://cdn.vibe-x.app/apps/d7ae1e35c4e83e7b4f62fe53/assets/original/feature-4-159731.png',
  },
];
const SECTIONS = [
  {
    title: 'Problem Statement',
    body: [
      'Colleges collect a large amount of student data every semester: marks for each subject, attendance registers and the study habits reported by students. This data usually sits in spreadsheets and nobody looks at it as a whole.',
      'Because of this, teachers find out that a student is failing only after the results are published. There is no quick way to see which subject the whole class is weak in, how attendance is affecting marks, or which students need help right now.',
    ],
  },
  {
    title: 'Objectives',
    list: [
      'Load a large student performance dataset and clean it automatically.',
      'Compute subject-wise, gender-wise and group-wise averages from the whole dataset.',
      'Show pass and fail distribution and rank the top performing students.',
      'Show how attendance and study hours relate to overall marks.',
      'Let a teacher search any single student and see a complete profile instantly.',
      'Present everything as simple interactive charts that anyone can read.',
    ],
  },
  {
    title: 'Scope',
    body: [
      'The project covers one academic dataset with four subjects: Mathematics, Physics, Computer and English. It analyses marks, attendance, study hours, gender and age.',
      'It does not predict future results and does not store any personal information beyond what is present in the dataset. It is an analysis and reporting tool, not a grading system.',
    ],
  },
  {
    title: 'Proposed System',
    body: [
      'The proposed system is a web dashboard that takes a student CSV dataset as input and produces a complete analysis as output. The pipeline has five stages: load, clean, aggregate, group and present.',
      'An admin can upload a new CSV at any time. The system cleans it, recomputes every number and refreshes every chart, so the dashboard always reflects the latest dataset.',
    ],
  },
  {
    title: 'Workflow',
    list: [
      'Step 1 — Load: read the dataset file and parse every row into a student record.',
      'Step 2 — Clean: drop empty rows, remove duplicate Student_IDs, repair invalid marks and attendance.',
      'Step 3 — Derive: calculate Overall_Marks as the average of the four subjects and decide Pass or Fail.',
      'Step 4 — Aggregate: compute averages, counts and percentages across the full dataset.',
      'Step 5 — Group: bucket students into performance groups, age groups, study hour ranges and batches.',
      'Step 6 — Rank: sort by overall marks to find the top ten students.',
      'Step 7 — Present: render the results as stat cards, bar, doughnut, line and scatter charts.',
    ],
  },
  {
    title: 'Technologies Used',
    list: [
      'Big Data concepts: HDFS, MapReduce, Apache Spark and PySpark (the processing model this project follows).',
      'Data handling: CSV parsing, data cleaning, aggregation and grouping.',
      'Frontend: React with a component based dashboard layout.',
      'Visualisation: Chart.js for bar, doughnut, line and scatter charts.',
      'Styling: Tailwind CSS for a responsive, card based interface.',
      'Storage: a lightweight database for saved student records and import history.',
    ],
  },
  {
    title: 'Expected Results',
    list: [
      'A single dashboard that summarises a dataset of a thousand or more students in a few seconds.',
      'Clear identification of the weakest subject for the class.',
      'A visible relationship between attendance, study hours and marks.',
      'A ranked list of the top ten students and a count of students in each performance group.',
      'A per-student profile with a clear Pass or Fail verdict.',
    ],
  },
  {
    title: 'Advantages',
    list: [
      'Very fast: a thousand records are analysed instantly, with no manual spreadsheet work.',
      'Easy to read: charts explain the data better than rows of numbers.',
      'Flexible: any CSV with the same columns can be uploaded and analysed.',
      'Early warning: weak students and low attendance are visible before the exams.',
      'Reusable: the same dashboard works for any semester or any department.',
    ],
  },
  {
    title: 'Limitations',
    list: [
      'The Big Data pipeline is simulated in the browser. There is no real Hadoop or Spark cluster behind it.',
      'All processing happens on one machine, so extremely large files (far beyond twenty thousand rows) will be slow.',
      'The system analyses the past. It does not predict future marks using machine learning.',
      'Data quality depends on the uploaded file; cleaning can repair obvious errors but not wrong marks.',
    ],
  },
  {
    title: 'Future Scope',
    list: [
      'Connect a real PySpark backend so the same dashboard can read from HDFS or a data lake.',
      'Add a machine learning model to predict which students are likely to fail.',
      'Add semester-over-semester comparison and attendance trend forecasting.',
      'Add teacher login so each teacher sees only their own subject and class.',
      'Export the complete analysis as a PDF report for the department.',
    ],
  },
  {
    title: 'Conclusion',
    body: [
      'This project shows how the Big Data Analytics pipeline — load, clean, process, group and visualise — can be applied to a very ordinary college problem: understanding student performance.',
      'By turning a plain CSV file into stat cards and charts, it helps teachers see the weakest subject, the effect of attendance, and the students who need help, all in one screen. The same design can scale to a real Spark cluster without changing what the user sees.',
    ],
  },
];
const VIVA = [
  {
    q: 'What is Big Data?',
    a: 'Big Data means data that is too large, too fast or too varied for normal tools like Excel to handle. It is described using the five Vs: Volume (size), Velocity (speed), Variety (different formats), Veracity (trustworthiness) and Value (useful insight).',
  },
  {
    q: 'What is Hadoop?',
    a: 'Hadoop is an open source framework that stores and processes big data across many ordinary computers working together. Its main parts are HDFS for storage, MapReduce for processing and YARN for managing resources.',
  },
  {
    q: 'What is HDFS?',
    a: 'HDFS is the Hadoop Distributed File System. It splits a large file into blocks and keeps copies of each block on several machines, so the data is safe if a machine fails and can be read from many machines at the same time.',
  },
  {
    q: 'What is Apache Spark?',
    a: 'Apache Spark is a fast big data processing engine. It keeps data in memory instead of writing to disk after every step, which makes it much faster than MapReduce for jobs that read the same data again and again.',
  },
  {
    q: 'What is PySpark?',
    a: 'PySpark is the Python interface for Apache Spark. It lets you write Spark jobs in normal Python using DataFrames and SQL, so you get Spark speed without learning Scala or Java.',
  },
  {
    q: 'Why did you use PySpark for this project?',
    a: 'Because a real college dataset can grow to lakhs of rows across many semesters. PySpark can split that work across a cluster and still be written in simple Python, which keeps the code readable for a student project.',
  },
  {
    q: 'What is the difference between Pandas and PySpark?',
    a: 'Pandas runs on one machine and loads the whole dataset into that machine memory, so it is perfect for small or medium data. PySpark spreads the data across many machines and processes the parts in parallel, so it handles data that would not fit in one machine.',
  },
  {
    q: 'What is data preprocessing or data cleaning?',
    a: 'It is the step where messy data is made usable: empty rows are removed, duplicate IDs are dropped, missing values are filled or repaired, out of range values are corrected and text is converted into numbers. Without this step the averages would be wrong.',
  },
  {
    q: 'What is data visualisation and why is it needed?',
    a: 'Data visualisation means showing numbers as charts and graphs. A teacher can stare at a thousand rows and see nothing, but one bar chart immediately shows which subject the class is weak in, so decisions get made faster.',
  },
  {
    q: 'Why is this project useful?',
    a: 'It turns a plain mark sheet into insight. A teacher can see the weakest subject, see that low attendance students rarely cross fifty marks, find the top ten performers, and identify the students who need help, all before the final exams.',
  },
];
function Section({ item }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-5">
      <h3 className="text-lg font-semibold text-slate-900 tracking-tight">{item.title}</h3>
      {item.body
        ? item.body.map((p, i) => (
            <p key={i} className="mt-3 text-sm text-slate-600 leading-relaxed">
              {p}
            </p>
          ))
        : null}
      {item.list ? (
        <ul className="mt-3 space-y-2">
          {item.list.map((li, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600 leading-relaxed">
              <Check className="w-4 h-4 text-[#0E7490] mt-0.5 shrink-0" />
              <span>{li}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
export default function AboutProject() {
  const [open, setOpen] = useState(-1);
  const [simplified, setSimplified] = useState({});
  const [simplifying, setSimplifying] = useState(-1);
  const [question, setQuestion] = useState('');
  const [coachAnswer, setCoachAnswer] = useState('');
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachError, setCoachError] = useState('');
  const [posterPrompt, setPosterPrompt] = useState(
    'A clean academic project poster banner for a Computer Engineering mini-project on Student Performance Analysis Using Big Data Analytics, blueprint style with a faint grid, indigo bar and line charts, a data pipeline arrow flow and plenty of empty space for a title.'
  );
  const [posterUrl, setPosterUrl] = useState('');
  const [posterLoading, setPosterLoading] = useState(false);
  const [posterError, setPosterError] = useState('');
  const askCoach = async (text) => {
    const q = (text || question).trim();
    if (!q || coachLoading) return;
    setCoachLoading(true);
    setCoachError('');
    setCoachAnswer('');
    try {
      const config = await aiflow4505ConfigPromise;
      const res = await aiflow4505.chat({
        system: config?.systemPrompt || '',
        messages: [{ role: 'user', content: q }],
      });
      setCoachAnswer(res?.content || '');
    } catch (err) {
      if (err?.status === 402) setCoachError('AI credits exhausted — please contact the app owner.');
      else setCoachError(err?.message || 'The viva coach is not available right now.');
    } finally {
      setCoachLoading(false);
    }
  };
  const simplify = async (index) => {
    if (simplifying >= 0) return;
    setSimplifying(index);
    setCoachError('');
    try {
      const config = await aiflow4505ConfigPromise;
      const item = VIVA[index];
      const res = await aiflow4505.chat({
        system: config?.systemPrompt || '',
        messages: [
          {
            role: 'user',
            content:
              'Rewrite this viva answer in simpler exam-ready English that a nervous student can say out loud in about thirty seconds.\n\nQuestion: ' +
              item.q +
              '\nCurrent answer: ' +
              item.a,
          },
        ],
      });
      setSimplified((prev) => Object.assign({}, prev, { [index]: res?.content || '' }));
    } catch (err) {
      if (err?.status === 402) setCoachError('AI credits exhausted — please contact the app owner.');
      else setCoachError(err?.message || 'Could not simplify this answer right now.');
    } finally {
      setSimplifying(-1);
    }
  };
  const generatePoster = async () => {
    if (posterLoading || !posterPrompt.trim()) return;
    setPosterLoading(true);
    setPosterError('');
    try {
      const res = await aiflow4506.generateImage({
        prompt: posterPrompt.trim(),
        size: '1792x1024',
        n: 1,
      });
      const url = res?.images?.[0]?.url || '';
      if (url) setPosterUrl(url);
      else setPosterError('The poster could not be generated. Please try again.');
    } catch (err) {
      if (err?.status === 402) setPosterError('AI credits exhausted — please contact the app owner.');
      else setPosterError(err?.message || 'The poster generator is not available right now.');
    } finally {
      setPosterLoading(false);
    }
  };
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 md:pt-10 pb-16">
      <header className="max-w-2xl">
        <p className="text-xs uppercase tracking-widest text-indigo-700 font-medium">Documentation</p>
        <h2 className="mt-2 text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">About the Project</h2>
        <p className="mt-3 text-base text-slate-600 leading-relaxed">
          Everything needed for the report and the viva, written in simple English.
        </p>
      </header>
      {/* Architecture flow — DOMINANT section */}
      <section className="mt-8">
        <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-cyan-50 px-5 py-6 md:px-8 md:py-8">
          <p className="text-xs uppercase tracking-widest text-indigo-700 font-medium">System Architecture</p>
          <h3 className="mt-2 text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            How data flows through the system
          </h3>
          <div className="mt-6 flex flex-col md:flex-row md:items-stretch gap-3">
            {FLOW.map((step, i) => (
              <div key={step} className="flex md:flex-1 items-center gap-3">
                <div className="flex-1 rounded-xl bg-white border border-slate-200 shadow-sm px-4 py-4 text-center">
                  <p className="text-xs text-indigo-700 font-medium tabular-nums">Stage {i + 1}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 leading-snug">{step}</p>
                </div>
                {i < FLOW.length - 1 ? (
                  <>
                    <ChevronRight className="hidden md:block w-5 h-5 text-indigo-400 shrink-0" />
                    <ChevronDown className="md:hidden w-5 h-5 text-indigo-400 shrink-0 mx-auto" />
                  </>
                ) : null}
              </div>
            ))}
          </div>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <img
              src="https://cdn.vibe-x.app/apps/d7ae1e35c4e83e7b4f62fe53/assets/original/diagram-1-159731.png"
              alt="System architecture flow illustration"
              className="w-full h-auto rounded-xl border border-slate-200 bg-white object-cover"
            />
            <img
              src="https://cdn.vibe-x.app/apps/d7ae1e35c4e83e7b4f62fe53/assets/original/diagram-2-159731.png"
              alt="Big data processing layers illustration"
              className="w-full h-auto rounded-xl border border-slate-200 bg-white object-cover"
            />
          </div>
          <div className="mt-6 rounded-xl bg-white/80 border border-indigo-100 px-5 py-4">
            <p className="text-sm text-slate-700 leading-relaxed">
              <span className="font-semibold">Honest note for the viva:</span> this project simulates the Big
              Data pipeline inside the browser. There is no live Hadoop or Spark cluster running behind it.
              Each stage of the dashboard, however, mirrors a real stage: loading the CSV is the ingestion
              step, the cleaning pipeline is data preprocessing, the average and count calculations are the
              map and reduce aggregations, the performance groups are a group-by, and the Top 10 table is a
              sort and limit. Replacing the in-browser stage with a PySpark job would not change a single
              screen the user sees.
            </p>
          </div>
        </div>
      </section>
      {/* Feature strip — image-led, alternating layout */}
      <section className="mt-10">
        <p className="text-xs uppercase tracking-widest text-indigo-700 font-medium">Pipeline Stages</p>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-colors duration-150 hover:border-indigo-300"
            >
              <img src={f.img} alt={f.title} className="w-full h-36 object-cover" />
              <div className="px-5 py-4">
                <h4 className="text-sm font-semibold text-slate-900">{f.title}</h4>
                <p className="mt-2 text-xs text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      {/* Report sections */}
      <section className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {SECTIONS.map((item) => (
          <Section key={item.title} item={item} />
        ))}
      </section>
      {/* Poster generator */}
      <section className="mt-10">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cyan-50 text-[#0E7490] flex items-center justify-center">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-[#0E7490] font-medium">AI Assistant</p>
              <h3 className="text-base font-semibold text-slate-900 tracking-tight">Project Poster Generator</h3>
            </div>
          </div>
          <div className="px-5 py-5 space-y-4">
            <p className="text-sm text-slate-600 leading-relaxed">
              Generate a cover or banner image for the project poster and the title slide of the demo.
            </p>
            <textarea
              value={posterPrompt}
              onChange={(e) => setPosterPrompt(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 text-base rounded-lg border border-slate-300 focus:border-[#4338CA] focus:ring-2 focus:ring-indigo-200 outline-none resize-y"
              placeholder="Describe the poster you want"
            />
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={generatePoster}
                disabled={posterLoading || !posterPrompt.trim()}
                className="px-6 py-3 text-base rounded-lg font-semibold bg-[#4338CA] text-white hover:bg-[#3730a3] hover:text-white active:scale-95 transition-all disabled:opacity-50 inline-flex items-center gap-2"
              >
                {posterLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                Generate poster
              </button>
              {posterUrl ? (
                <a
                  href={posterUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 text-sm rounded-lg font-medium border-2 border-[#0E7490] text-[#0E7490] hover:bg-cyan-50 transition-colors inline-flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Open full size
                </a>
              ) : null}
            </div>
            {posterError ? (
              <p className="text-sm text-[#B91C1C] bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                {posterError}
              </p>
            ) : null}
            {posterUrl ? (
              <img
                src={posterUrl}
                alt="Generated project poster"
                className="w-full h-auto rounded-xl border border-slate-200"
              />
            ) : null}
          </div>
        </div>
      </section>
      {/* Viva Q&A */}
      <section className="mt-10">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#4338CA]" />
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">10 Viva Questions and Answers</h3>
        </div>
        <p className="mt-2 text-sm text-slate-600">
          Tap a question to expand it. Use <span className="font-medium">Simplify</span> to get an easier
          version you can say out loud.
        </p>
        <div className="mt-5 space-y-3">
          {VIVA.map((item, index) => {
            const isOpen = open === index;
            return (
              <div key={item.q} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? -1 : index)}
                  className="w-full text-left px-5 py-4 flex items-start justify-between gap-4 hover:bg-slate-50 transition-colors"
                >
                  <span className="flex items-start gap-3 min-w-0">
                    <span className="text-sm font-semibold text-[#4338CA] tabular-nums shrink-0">
                      Q{index + 1}
                    </span>
                    <span className="text-sm font-semibold text-slate-900 leading-snug">{item.q}</span>
                  </span>
                  <ChevronDown
                    className={
                      'w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ' +
                      (isOpen ? 'rotate-180' : '')
                    }
                  />
                </button>
                {isOpen ? (
                  <div className="px-5 pb-5 pt-1 border-t border-slate-100">
                    <p className="text-sm text-slate-600 leading-relaxed">{item.a}</p>
                    {simplified[index] ? (
                      <div className="mt-4 rounded-lg bg-indigo-50 border border-indigo-100 px-4 py-3">
                        <p className="text-xs uppercase tracking-widest text-indigo-700 font-medium mb-1.5">
                          Simplified
                        </p>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                          {simplified[index]}
                        </p>
                      </div>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => simplify(index)}
                      disabled={simplifying === index}
                      className="mt-4 px-4 py-2 text-sm rounded-lg font-medium text-[#4338CA] hover:bg-indigo-50 transition-colors inline-flex items-center gap-2 disabled:opacity-50"
                    >
                      {simplifying === index ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Zap className="w-4 h-4" />
                      )}
                      Simplify this answer
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>
      {/* Viva coach ask box */}
      <section className="mt-8">
        <div className="rounded-xl border border-slate-200 bg-slate-900 text-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10">
            <p className="text-xs uppercase tracking-widest text-indigo-300 font-medium">AI Assistant</p>
            <h3 className="mt-1 text-base font-semibold tracking-tight">Viva Answer Coach</h3>
            <p className="mt-1 text-sm text-slate-400">
              Ask any follow-up question about Big Data, Hadoop, Spark, PySpark or this project.
            </p>
          </div>
          <div className="px-5 py-5 space-y-4">
            <div role="form" aria-label="Ask the viva coach" className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.nativeEvent.isComposing) askCoach();
                }}
                placeholder="e.g. What is the difference between RDD and DataFrame?"
                className="flex-1 px-4 py-3 text-base rounded-lg bg-white/5 border border-white/15 text-white placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30 outline-none"
              />
              <button
                type="button"
                onClick={() => askCoach()}
                disabled={coachLoading || !question.trim()}
                className="px-6 py-3 text-base rounded-lg font-semibold bg-[#4338CA] text-white hover:bg-[#3730a3] hover:text-white active:scale-95 transition-all disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {coachLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Ask
              </button>
            </div>
            {coachAnswer ? (
              <div className="rounded-lg bg-white/5 border border-white/10 px-4 py-4">
                <p className="text-sm text-slate-100 whitespace-pre-wrap leading-relaxed">{coachAnswer}</p>
              </div>
            ) : null}
            {coachError ? (
              <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
                {coachError}
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}