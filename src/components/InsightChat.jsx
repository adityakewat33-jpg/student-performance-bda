import { useState } from 'react';
import { Zap, Send, Loader2, MessageCircle } from 'lucide-react';
import { aiflow4504, aiflow4504ConfigPromise } from '@/lib/aiflow';
import { buildInsightContext } from '../data/analytics';
const SUGGESTIONS = [
  'Which subject is the weakest and what should we do about it?',
  'How does attendance affect the marks in this dataset?',
  'Compare the performance of male and female students.',
  'How many students need urgent help and why?',
];
export default function InsightChat({ analytics }) {
  const [summary, setSummary] = useState('');
  const [answer, setAnswer] = useState('');
  const [question, setQuestion] = useState('');
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingAnswer, setLoadingAnswer] = useState(false);
  const [error, setError] = useState('');
  const callModel = async (prompt) => {
    const config = await aiflow4504ConfigPromise;
    const systemPrompt = config?.systemPrompt || '';
    const context = buildInsightContext(analytics);
    const res = await aiflow4504.chat({
      system: systemPrompt,
      messages: [{ role: 'user', content: 'Current dataset statistics:\n' + context + '\n\n' + prompt }],
    });
    return res?.content || '';
  };
  const handleSummary = async () => {
    if (loadingSummary || !analytics.total) return;
    setLoadingSummary(true);
    setError('');
    try {
      const text = await callModel(
        'Write a short plain-English insight summary of this dataset in 4 to 6 bullet points for a teacher watching a live demo. End with one line naming the group of students that needs the most help.'
      );
      setSummary(text);
    } catch (err) {
      if (err?.status === 402) setError('AI credits exhausted — please contact the app owner.');
      else setError(err?.message || 'The insight assistant is not available right now.');
    } finally {
      setLoadingSummary(false);
    }
  };
  const handleAsk = async (text) => {
    const q = (text || question).trim();
    if (!q || loadingAnswer || !analytics.total) return;
    setLoadingAnswer(true);
    setError('');
    setAnswer('');
    try {
      const reply = await callModel('Question from the audience: ' + q);
      setAnswer(reply);
    } catch (err) {
      if (err?.status === 402) setError('AI credits exhausted — please contact the app owner.');
      else setError(err?.message || 'The insight assistant is not available right now.');
    } finally {
      setLoadingAnswer(false);
    }
  };
  return (
    <section className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-cyan-50 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-indigo-100 flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 text-[#4338CA] flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-indigo-700 font-medium">AI Assistant</p>
            <h3 className="text-base font-semibold text-slate-900 tracking-tight">Dataset Insight Summary</h3>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSummary}
          disabled={loadingSummary || !analytics.total}
          className="px-4 py-2 text-sm rounded-lg font-semibold bg-[#4338CA] text-white hover:bg-[#3730a3] hover:text-white active:scale-95 transition-all disabled:opacity-50 inline-flex items-center gap-2"
        >
          {loadingSummary ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          Generate summary
        </button>
      </div>
      <div className="px-5 py-5 space-y-5">
        {summary ? (
          <div className="rounded-lg bg-white border border-slate-200 px-4 py-4">
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{summary}</p>
          </div>
        ) : (
          <p className="text-sm text-slate-600 leading-relaxed">
            Ask the assistant anything about the numbers currently shown on this dashboard. It only answers
            from the aggregates computed on the loaded dataset, so the figures always match the charts.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setQuestion(s);
                handleAsk(s);
              }}
              disabled={loadingAnswer}
              className="px-3 py-1.5 text-xs rounded-full border border-indigo-200 bg-white text-[#4338CA] hover:bg-indigo-50 transition-colors disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
        <div role="form" aria-label="Ask the dataset insight assistant" className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleAsk();
            }}
            placeholder="Ask about marks, attendance, pass rate..."
            className="flex-1 px-4 py-3 text-base rounded-lg border border-slate-300 bg-white focus:border-[#4338CA] focus:ring-2 focus:ring-indigo-200 outline-none"
          />
          <button
            type="button"
            onClick={() => handleAsk()}
            disabled={loadingAnswer || !question.trim()}
            className="px-6 py-3 text-base rounded-lg font-semibold bg-[#0E7490] text-white hover:bg-[#0b5e74] hover:text-white active:scale-95 transition-all disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            {loadingAnswer ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Ask
          </button>
        </div>
        {answer ? (
          <div className="rounded-lg bg-white border border-cyan-200 px-4 py-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle className="w-4 h-4 text-[#0E7490]" />
              <span className="text-xs uppercase tracking-widest text-[#0E7490] font-medium">Answer</span>
            </div>
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{answer}</p>
          </div>
        ) : null}
        {error ? (
          <p className="text-sm text-[#B91C1C] bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>
        ) : null}
      </div>
    </section>
  );
}