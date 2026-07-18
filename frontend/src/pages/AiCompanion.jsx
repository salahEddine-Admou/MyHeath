import { useEffect, useRef, useState } from 'react';
import {
  Sparkles,
  Send,
  FileText,
  ClipboardList,
  Heart,
  MessageSquareQuote,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  aiChat,
  aiDoctorBrief,
  aiWellnessPlan,
  aiAskDoctor,
  aiExplainInsights,
  aiParseSymptoms,
  aiCoachPlan,
} from '../services/aiService';
import { logSymptom } from '../services/healthService';

export default function AiCompanion() {
  const { user } = useAuth();
  const isMan = user?.gender === 'man';

  const QUICK = isMan
    ? [
        { label: 'Coach day plan', action: 'coach' },
        { label: 'Explain my scores', action: 'explain' },
        { label: 'Recovery tips', action: 'wellness' },
        { label: 'Doctor brief', action: 'brief' },
      ]
    : [
        { label: 'Coach day plan', action: 'coach' },
        { label: 'Explain my cycle', action: 'explain' },
        { label: 'Today wellness plan', action: 'wellness' },
        { label: 'Doctor brief', action: 'brief' },
      ];

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: isMan
        ? "Hi, I'm **Heath** — your MyHeath AI Coach for men. I can use your daily suivi, training/recovery and diabetes logs to guide habits (not diagnose).\n\nHow can I help?"
        : "Hi, I'm **Heath** — your MyHeath AI Coach for women. I can use your cycle, daily suivi and diabetes context to guide habits (not diagnose).\n\nHow can I help?",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [panel, setPanel] = useState(null);
  const [nlText, setNlText] = useState('');
  const [parsed, setParsed] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const push = (role, content) => setMessages((m) => [...m, { role, content }]);

  const historyForApi = () =>
    messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role, content: m.content.replace(/\*\*/g, '') }));

  const sendChat = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    push('user', msg);
    setLoading(true);
    try {
      const { data } = await aiChat(msg, historyForApi());
      push('assistant', data.reply);
    } catch (e) {
      push(
        'assistant',
        `I couldn't reply (${e.response?.data?.message || e.message}). Try again in a moment.`
      );
    } finally {
      setLoading(false);
    }
  };

  const runQuick = async (action) => {
    setLoading(true);
    setPanel(null);
    try {
      if (action === 'explain') {
        push('user', isMan ? 'Explain my recent health scores.' : 'Explain my cycle insights.');
        const { data } = await aiExplainInsights();
        push('assistant', data.explanation);
      } else if (action === 'coach') {
        push('user', 'Build my AI Coach plan for today.');
        const { data } = await aiCoachPlan();
        setPanel({ type: 'coach', data: data.plan });
        push(
          'assistant',
          `Coach plan ready: **${data.plan.headline}** (${data.plan.healthVerdict}). See the side panel.`
        );
      } else if (action === 'wellness') {
        push('user', 'Create my wellness plan for today.');
        const { data } = await aiWellnessPlan();
        setPanel({ type: 'wellness', data: data.plan });
        push(
          'assistant',
          `Here is your plan **${data.plan.headline}** (phase ${data.plan.phase}). Check the side panel — and listen to your body.`
        );
      } else if (action === 'prep') {
        push('user', 'Help me prepare for my medical visit.');
        const { data } = await aiAskDoctor('gynecological follow-up and cycle');
        setPanel({ type: 'prep', data: data.prep });
        push(
          'assistant',
          `I prepared **${data.prep.title}**. Key questions are in the side panel.`
        );
      } else if (action === 'brief') {
        push('user', 'Generate a brief for my doctor.');
        const { data } = await aiDoctorBrief();
        setPanel({ type: 'brief', data: data.brief });
        push(
          'assistant',
          'Medical brief generated. You can copy it and send it to your doctor in MyHeath chat.'
        );
      }
    } catch (e) {
      push('assistant', `AI action failed: ${e.response?.data?.message || e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const parseNl = async () => {
    if (!nlText.trim() || loading) return;
    setLoading(true);
    try {
      const { data } = await aiParseSymptoms(nlText);
      setParsed(data.parsed);
      push('user', `Log: ${nlText}`);
      push(
        'assistant',
        `${data.parsed.aiSummary}\n\nEstimated urgency: **${data.parsed.urgency}**. Confirm below to save.`
      );
    } catch (e) {
      push('assistant', `Parse failed: ${e.response?.data?.message || e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const saveParsed = async () => {
    if (!parsed) return;
    setLoading(true);
    try {
      await logSymptom({
        entryType: parsed.entryType || 'symptom',
        symptoms: parsed.symptoms || [],
        painLevel: parsed.painLevel ?? 0,
        mood: parsed.mood || '',
        flow: parsed.flow || '',
        notes: parsed.notes || nlText,
      });
      push('assistant', 'Entry saved to your secure journal. Insights will update.');
      setParsed(null);
      setNlText('');
    } catch {
      push('assistant', 'Save failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-rose-600 font-semibold mb-1">
            Claude intelligence
          </p>
          <h1 className="font-display text-3xl md:text-4xl text-ink-900 flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-rose-600" />
            MyHeath AI
          </h1>
          <p className="text-ink-500 mt-1 max-w-xl">
            Conversational assistant, insight narration, natural-language journal, doctor brief and
            wellness plan — contextualized to your tracking.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-ink-500 bg-white/70 border border-rose-100 px-3 py-2 rounded-lg">
          <ShieldAlert className="w-4 h-4 text-rose-600" />
          Not a medical diagnosis
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {QUICK.map((q) => (
          <button
            key={q.action}
            type="button"
            disabled={loading}
            onClick={() => runQuick(q.action)}
            className="text-sm px-3 py-1.5 rounded-lg border border-rose-200 bg-white/80 hover:bg-rose-50 text-ink-700 disabled:opacity-50"
          >
            {q.label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-5">
        <section className="bg-white/80 border border-rose-100 rounded-2xl flex flex-col min-h-[520px] overflow-hidden shadow-sm">
          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[520px]">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'ml-auto bg-rose-600 text-white rounded-br-md'
                    : 'bg-sand-100 text-ink-900 rounded-bl-md border border-rose-50'
                }`}
              >
                {formatMdLite(m.content)}
              </div>
            ))}
            {loading && (
              <div className="inline-flex items-center gap-2 text-sm text-ink-500 px-3 py-2">
                <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                Heath is thinking…
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="p-3 border-t border-rose-100 space-y-2 bg-white/90">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendChat()}
                placeholder="e.g. Strong cramps for 3 days…"
                className="flex-1 px-3 py-2.5 rounded-xl border border-rose-200 bg-white"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => sendChat()}
                disabled={loading || !input.trim()}
                className="bg-rose-600 text-white px-4 rounded-xl hover:bg-rose-700 disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="bg-white/80 border border-rose-100 rounded-2xl p-4">
            <h2 className="font-display text-lg mb-2 flex items-center gap-2">
              <MessageSquareQuote className="w-5 h-5 text-rose-600" />
              Natural-language journal
            </h2>
            <p className="text-xs text-ink-500 mb-3">
              Describe how you feel — Claude structures it for saving.
            </p>
            <textarea
              value={nlText}
              onChange={(e) => setNlText(e.target.value)}
              rows={4}
              placeholder="Period started yesterday, pain 8/10, fatigue and some acne…"
              className="w-full px-3 py-2 rounded-xl border border-rose-200 text-sm mb-2"
            />
            <button
              type="button"
              onClick={parseNl}
              disabled={loading || !nlText.trim()}
              className="w-full bg-ink-900 text-white py-2 rounded-xl text-sm font-medium hover:bg-ink-700 disabled:opacity-50"
            >
              Analyze with AI
            </button>
            {parsed && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-100 text-sm space-y-2">
                <p>
                  <strong>Type:</strong> {parsed.entryType} · <strong>Pain:</strong>{' '}
                  {parsed.painLevel}/10
                </p>
                <p>
                  <strong>Symptoms:</strong> {(parsed.symptoms || []).join(', ') || '—'}
                </p>
                <p className="text-ink-500">{parsed.aiSummary}</p>
                <button
                  type="button"
                  onClick={saveParsed}
                  className="w-full bg-rose-600 text-white py-2 rounded-lg text-sm"
                >
                  Save to journal
                </button>
              </div>
            )}
          </div>

          {panel?.type === 'wellness' && <WellnessCard plan={panel.data} />}
          {panel?.type === 'prep' && <PrepCard prep={panel.data} />}
          {panel?.type === 'brief' && <BriefCard brief={panel.data} />}
          {panel?.type === 'coach' && <CoachCard plan={panel.data} />}

          {!panel && (
            <div className="bg-gradient-to-br from-rose-600 to-rose-800 text-white rounded-2xl p-5">
              <Heart className="w-6 h-6 mb-2 opacity-90" />
              <p className="font-display text-xl mb-1">Wow mode on</p>
              <p className="text-sm text-rose-100 leading-relaxed">
                Narrative insights, doctor briefs, visit prep and daily plans — generated by Claude
                from your encrypted history.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function formatMdLite(text) {
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold">
          {p.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{p}</span>;
  });
}

function CoachCard({ plan }) {
  return (
    <div className="bg-white/80 border border-rose-100 rounded-2xl p-4 space-y-3">
      <h3 className="font-display text-lg flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-rose-600" /> {plan.headline}
      </h3>
      <p className="text-xs uppercase text-rose-600">Verdict: {plan.healthVerdict}</p>
      <List title="Focus" items={plan.focus} />
      <List title="Morning" items={plan.morning} />
      <List title="Afternoon" items={plan.afternoon} />
      <List title="Evening" items={plan.evening} />
      <List title="Diabetes tips" items={plan.diabetesTips} />
      <List title="For you" items={plan.genderTips} />
      <p className="text-sm italic text-ink-500 border-t border-rose-100 pt-2">
        “{plan.motivation}”
      </p>
    </div>
  );
}

function WellnessCard({ plan }) {
  return (
    <div className="bg-white/80 border border-rose-100 rounded-2xl p-4 space-y-3">
      <h3 className="font-display text-lg flex items-center gap-2">
        <Heart className="w-5 h-5 text-rose-600" /> {plan.headline}
      </h3>
      <p className="text-xs uppercase text-rose-600">Phase {plan.phase}</p>
      <p className="text-sm text-ink-700">{plan.energyTip}</p>
      <List title="Nutrition" items={plan.nutrition} />
      <List title="Movement" items={plan.movement} />
      <List title="Self-care" items={plan.selfCare} />
      <p className="text-sm italic text-ink-500 border-t border-rose-100 pt-2">
        “{plan.affirmation}”
      </p>
    </div>
  );
}

function PrepCard({ prep }) {
  return (
    <div className="bg-white/80 border border-rose-100 rounded-2xl p-4 space-y-3">
      <h3 className="font-display text-lg flex items-center gap-2">
        <ClipboardList className="w-5 h-5 text-rose-600" /> {prep.title}
      </h3>
      <ul className="space-y-2">
        {(prep.questions || []).map((q, i) => (
          <li key={i} className="text-sm">
            <p className="font-medium text-ink-900">{q.q}</p>
            <p className="text-xs text-ink-500">{q.why}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BriefCard({ brief }) {
  const copy = () => navigator.clipboard?.writeText(brief);
  return (
    <div className="bg-white/80 border border-rose-100 rounded-2xl p-4 space-y-3">
      <h3 className="font-display text-lg flex items-center gap-2">
        <FileText className="w-5 h-5 text-rose-600" /> Doctor brief
      </h3>
      <pre className="text-xs whitespace-pre-wrap max-h-64 overflow-y-auto text-ink-700 font-sans">
        {brief}
      </pre>
      <button
        type="button"
        onClick={copy}
        className="w-full border border-rose-300 text-rose-800 py-2 rounded-lg text-sm hover:bg-rose-50"
      >
        Copy brief
      </button>
    </div>
  );
}

function List({ title, items }) {
  if (!items?.length) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-ink-500 mb-1">{title}</p>
      <ul className="text-sm text-ink-700 list-disc pl-4 space-y-0.5">
        {items.map((x, i) => (
          <li key={i}>{x}</li>
        ))}
      </ul>
    </div>
  );
}
