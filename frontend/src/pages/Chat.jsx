import { useEffect, useRef, useState } from 'react';
import { Lock, RefreshCw, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getChatPartners,
  getConversation,
  sendChatMessage,
} from '../services/healthService';

export default function Chat() {
  const { user } = useAuth();
  const [partners, setPartners] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const loadPartners = async () => {
    const { data } = await getChatPartners();
    setPartners(data.partners || []);
    if (data.partners?.[0] && !active) setActive(data.partners[0]);
  };

  const loadMessages = async (partnerId) => {
    if (!partnerId) return;
    const { data } = await getConversation(partnerId);
    setMessages(data.messages || []);
  };

  useEffect(() => {
    loadPartners().catch(console.error);
  }, []);

  useEffect(() => {
    if (!active?._id) return undefined;
    loadMessages(active._id).catch(console.error);
    const id = setInterval(() => loadMessages(active._id).catch(() => {}), 4000);
    return () => clearInterval(id);
  }, [active?._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!text.trim() || !active || sending) return;
    const content = text.trim();
    setText('');
    setSending(true);
    try {
      const { data } = await sendChatMessage(active._id, content);
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.message.id)) return prev;
        return [...prev, data.message];
      });
    } catch (e) {
      console.error(e);
      setText(content);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-4">
      <aside className="lg:w-64 shrink-0 bg-white/70 border border-rose-100 rounded-2xl p-4 overflow-y-auto">
        <h2 className="font-display text-lg mb-3">Conversations</h2>
        {partners.length === 0 ? (
          <p className="text-sm text-ink-500">
            {user?.role === 'patient'
              ? 'Assign a doctor from the dashboard first.'
              : 'No assigned patients yet.'}
          </p>
        ) : (
          partners.map((p) => (
            <button
              key={p._id}
              type="button"
              onClick={() => setActive(p)}
              className={`w-full text-left px-3 py-2 rounded-lg mb-1 transition ${
                active?._id === p._id
                  ? 'bg-rose-600 text-white'
                  : 'hover:bg-rose-50 text-ink-700'
              }`}
            >
              <span className="font-medium text-sm">
                {p.role === 'doctor' ? 'Dr. ' : ''}
                {p.firstName} {p.lastName}
              </span>
            </button>
          ))
        )}
      </aside>

      <section className="flex-1 bg-white/70 border border-rose-100 rounded-2xl flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-rose-100 flex items-center justify-between gap-3">
          <div>
            <p className="font-medium text-ink-900">
              {active
                ? `${active.role === 'doctor' ? 'Dr. ' : ''}${active.firstName} ${active.lastName}`
                : 'Select a contact'}
            </p>
            <p className="text-xs text-ink-500 flex items-center gap-1 mt-0.5">
              <Lock className="w-3 h-3 text-emerald-600" />
              AES-256 encrypted at rest · secure REST channel
            </p>
          </div>
          <button
            type="button"
            onClick={() => active && loadMessages(active._id)}
            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-sand-100 text-ink-700 hover:bg-rose-50"
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m) => {
            const mine =
              String(m.sender) === String(user.id) ||
              String(m.sender?._id) === String(user.id);
            return (
              <div
                key={m.id}
                className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                  mine
                    ? 'ml-auto bg-rose-600 text-white rounded-br-md'
                    : 'bg-sand-100 text-ink-900 rounded-bl-md'
                }`}
              >
                <p>{m.content}</p>
                <p className={`text-[10px] mt-1 ${mine ? 'text-rose-100' : 'text-ink-300'}`}>
                  {new Date(m.createdAt).toLocaleString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: '2-digit',
                    month: 'short',
                  })}
                  {m.encrypted ? ' · 🔒' : ''}
                </p>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div className="p-3 border-t border-rose-100 flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            disabled={!active || sending}
            placeholder="Secure message…"
            className="flex-1 px-3 py-2 rounded-lg border border-rose-200 bg-white disabled:opacity-50"
          />
          <button
            type="button"
            onClick={send}
            disabled={!active || sending || !text.trim()}
            className="bg-rose-600 text-white px-4 rounded-lg hover:bg-rose-700 disabled:opacity-50"
            aria-label="Send"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </section>
    </div>
  );
}
