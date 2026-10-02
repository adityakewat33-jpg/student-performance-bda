import { useEffect, useMemo, useState } from 'react';
import {
  Zap,
  MessageCircle,
  Image as ImageIcon,
  Video,
  Music,
  Loader2,
  Check,
  AlertCircle,
  Save,
} from 'lucide-react';
import { aiflowClients } from '@/lib/aiflow';
const USER_SELECTION = '__user_selection__';
const USER_SELECTION_LABEL = 'User Selection';
function featureIcon(feature) {
  if (feature === 'image') return ImageIcon;
  if (feature === 'video') return Video;
  if (feature === 'audio' || feature === 'sfx') return Music;
  if (feature === 'chat') return MessageCircle;
  return Zap;
}
function formatModelLabel(id) {
  const s = String(id || '');
  const lower = s.toLowerCase();
  const provider = lower.startsWith('claude')
    ? 'Anthropic'
    : /^(gpt|o1|o3|o4)/.test(lower)
    ? 'OpenAI'
    : lower.startsWith('eleven')
    ? 'ElevenLabs'
    : /^(gemini|veo|imagen|lyria)/.test(lower)
    ? 'Google'
    : /^(dreamina|seedance)/.test(lower)
    ? 'BytePlus'
    : 'AI';
  const label = s
    .replace(/(\d)-(\d)/g, '$1.$2')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/Gpt/g, 'GPT')
    .replace(/\bpreview\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return (label || id) + ' (' + provider + ')';
}
export default function AIFlowSettings() {
  const client = aiflowClients[0];
  const [modules, setModules] = useState([]);
  const [activeId, setActiveId] = useState('');
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState('');
  const [status, setStatus] = useState(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError('');
      try {
        client.setAdminToken(localStorage.getItem('access_token'));
        const res = await client.admin.listModules();
        const list = res?.modules || res?.data?.modules || [];
        if (!alive) return;
        setModules(list);
        const next = {};
        list.forEach((m) => {
          const key = String(m.moduleId);
          next[key] = {
            systemPrompt: m.systemPrompt || '',
            model: (m.defaults && m.defaults[m.feature]) || '',
            imageBackground: m.imageBackground || 'auto',
          };
        });
        setDrafts(next);
        if (list.length > 0) setActiveId(String(list[0].moduleId));
      } catch (err) {
        if (alive) {
          if (err?.status === 403) setError('Admin permission required to manage AI settings.');
          else setError(err?.message || 'Could not load the AI module configuration.');
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [client]);
  const active = useMemo(
    () => modules.find((m) => String(m.moduleId) === activeId) || null,
    [modules, activeId]
  );
  const draft = activeId ? drafts[activeId] : null;
  const isUserSelectable = active
    ? !!(active.userSelectable && active.userSelectable[active.feature]) ||
      (active.defaults && active.defaults[active.feature]) === USER_SELECTION
    : false;
  const canBackground =
    active &&
    active.feature === 'image' &&
    Array.isArray(active.imageBackgroundModels) &&
    draft &&
    active.imageBackgroundModels.includes(draft.model);
  const updateDraft = (patch) => {
    setDrafts((prev) =>
      Object.assign({}, prev, { [activeId]: Object.assign({}, prev[activeId], patch) })
    );
  };
  const handleSave = async () => {
    if (!active || !draft || savingId) return;
    setSavingId(activeId);
    setStatus(null);
    try {
      client.setAdminToken(localStorage.getItem('access_token'));
      const payload = {
        moduleId: active.moduleId,
        systemPrompt: draft.systemPrompt,
      };
      if (!isUserSelectable && draft.model) {
        payload.defaults = { [active.feature]: draft.model };
      }
      if (canBackground) payload.imageBackground = draft.imageBackground;
      await client.admin.updateConfig(payload);
      setStatus({ type: 'success', message: 'Saved. Reloading so every page picks up the change…' });
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err) {
      setStatus({ type: 'error', message: err?.message || 'Could not save this module.' });
      setSavingId('');
    }
  };
  if (loading) {
    return (
      <div className="py-24 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
      </div>
    );
  }
  return (
    <div className="w-full">
      <header className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-indigo-50 text-[#4338CA] flex items-center justify-center">
          <Zap className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-indigo-700 font-medium">Settings</p>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">AI Settings</h2>
        </div>
      </header>
      <p className="mt-3 text-sm text-slate-600 max-w-2xl">
        Edit the system prompt and the default model for every AI feature in this app. Changes apply
        immediately after saving — no rebuild needed.
      </p>
      {error ? (
        <div className="mt-6 flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
          <AlertCircle className="w-4 h-4 text-[#B91C1C] mt-0.5 shrink-0" />
          <p className="text-sm text-[#B91C1C]">{error}</p>
        </div>
      ) : null}
      {modules.length === 0 && !error ? (
        <p className="mt-8 text-sm text-slate-500">No AI modules are configured for this project.</p>
      ) : null}
      {modules.length > 0 ? (
        <div className="mt-6">
          <div className="flex flex-wrap gap-2">
            {modules.map((m) => {
              const Icon = featureIcon(m.feature);
              const id = String(m.moduleId);
              const isActive = id === activeId;
              const label = m.useCaseName || m.title || m.feature;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveId(id)}
                  title={m.feature + (m.useCase && m.useCase !== 'default' ? ' · ' + m.useCase : '')}
                  className={
                    'px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors inline-flex items-center gap-2 max-w-[260px] ' +
                    (isActive
                      ? 'border-[#4338CA] bg-indigo-50 text-[#4338CA]'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300')
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{label}</span>
                </button>
              );
            })}
          </div>
          {active && draft ? (
            <div className="mt-5 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 text-[#4338CA] flex items-center justify-center shrink-0">
                  {(() => {
                    const Icon = featureIcon(active.feature);
                    return <Icon className="w-5 h-5" />;
                  })()}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-slate-900 truncate">
                    {active.useCaseName || active.title || active.feature}
                  </h3>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                      {active.feature}
                    </span>
                    {active.useCase && active.useCase !== 'default' ? (
                      <span className="px-2 py-0.5 rounded-full bg-cyan-50 text-[#0E7490] text-xs font-medium">
                        {active.useCase}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="px-6 py-5 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">System prompt</label>
                  <textarea
                    rows={10}
                    value={draft.systemPrompt}
                    onChange={(e) => updateDraft({ systemPrompt: e.target.value })}
                    className="w-full px-4 py-3 text-base rounded-lg border border-slate-300 focus:border-[#4338CA] focus:ring-2 focus:ring-indigo-200 outline-none resize-y"
                  />
                  <p className="mt-1 text-xs text-slate-400 tabular-nums">
                    {draft.systemPrompt.length.toLocaleString('en-US')} characters
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Default model</label>
                    {isUserSelectable ? (
                      <>
                        <select
                          value={USER_SELECTION}
                          disabled
                          className="w-full px-4 py-3 text-base rounded-lg border border-slate-300 bg-slate-50 text-slate-500 outline-none"
                        >
                          <option value={USER_SELECTION}>{USER_SELECTION_LABEL}</option>
                        </select>
                        <p className="mt-1 text-xs text-slate-400">
                          The app shows its own model picker for this feature, so the model is chosen by the end
                          user. Ask the builder to remove the model selection feature to unlock this control.
                        </p>
                      </>
                    ) : (
                      <select
                        value={draft.model}
                        onChange={(e) => updateDraft({ model: e.target.value })}
                        className="w-full px-4 py-3 text-base rounded-lg border border-slate-300 bg-white focus:border-[#4338CA] focus:ring-2 focus:ring-indigo-200 outline-none"
                      >
                        {draft.model &&
                        !(active.models?.[active.feature] || []).includes(draft.model) ? (
                          <option value={draft.model}>{formatModelLabel(draft.model)}</option>
                        ) : null}
                        {(active.models?.[active.feature] || []).map((m) => (
                          <option key={m} value={m}>
                            {formatModelLabel(m)}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  {canBackground ? (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Image background</label>
                      <select
                        value={draft.imageBackground}
                        onChange={(e) => updateDraft({ imageBackground: e.target.value })}
                        className="w-full px-4 py-3 text-base rounded-lg border border-slate-300 bg-white focus:border-[#4338CA] focus:ring-2 focus:ring-indigo-200 outline-none"
                      >
                        <option value="auto">Auto</option>
                        <option value="transparent">Transparent</option>
                        <option value="opaque">Opaque</option>
                      </select>
                    </div>
                  ) : null}
                </div>
                {status ? (
                  <div
                    className={
                      'flex items-start gap-2 rounded-lg px-4 py-3 border ' +
                      (status.type === 'success'
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200')
                    }
                  >
                    {status.type === 'success' ? (
                      <Check className="w-4 h-4 text-[#15803D] mt-0.5 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-[#B91C1C] mt-0.5 shrink-0" />
                    )}
                    <p
                      className={
                        'text-sm ' + (status.type === 'success' ? 'text-[#15803D]' : 'text-[#B91C1C]')
                      }
                    >
                      {status.message}
                    </p>
                  </div>
                ) : null}
              </div>
              <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!!savingId}
                  className="px-6 py-3 text-base rounded-lg font-semibold bg-[#4338CA] text-white hover:bg-[#3730a3] hover:text-white active:scale-95 transition-all disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {savingId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save module
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}