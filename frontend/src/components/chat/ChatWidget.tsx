import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MessageCircle, X, Send, RotateCcw, FileText, Bot } from 'lucide-react';
import { useChat, ChatMessage, ChatSource } from './useChat';

const SUGGESTION_KEYS = ['s1', 's2', 's3', 's4'] as const;

/** Manba turiga mos ikonka matni — havolasiz manbalar ham ko'rinadi. */
function SourceLink({ source }: { source: ChatSource }) {
  const label = source.title || source.source_table;
  const className =
    'inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-emerald-200 ' +
    'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors max-w-full';

  if (!source.url_path) {
    return (
      <span className={className}>
        <FileText className="w-3 h-3 flex-shrink-0" />
        <span className="truncate">{label}</span>
      </span>
    );
  }

  return (
    <Link to={source.url_path} className={className}>
      <FileText className="w-3 h-3 flex-shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

function Bubble({ message }: { message: ChatMessage }) {
  const { t } = useTranslation();
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] ${isUser ? '' : 'w-full'}`}>
        <div
          className={
            isUser
              ? 'bg-emerald-600 text-white rounded-2xl rounded-br-sm px-3.5 py-2 text-sm whitespace-pre-wrap break-words'
              : `rounded-2xl rounded-bl-sm px-3.5 py-2 text-sm whitespace-pre-wrap break-words ${
                  message.failed
                    ? 'bg-red-50 text-red-800 border border-red-100'
                    : 'bg-gray-100 text-gray-800'
                }`
          }
        >
          {message.text}
        </div>

        {message.sources && message.sources.length > 0 && (
          <div className="mt-1.5">
            <p className="text-[11px] text-gray-400 mb-1">{t('chat.sources')}</p>
            <div className="flex flex-wrap gap-1.5">
              {message.sources.map((s, i) => <SourceLink key={i} source={s} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChatWidget() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const { messages, pending, send, reset } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Yangi xabar kelganda pastga suriladi
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, pending]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Escape bilan yopish
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || pending) return;
    setInput('');
    send(text);
  };

  return (
    <>
      {/* Ochish tugmasi */}
      <button
        onClick={() => setOpen(v => !v)}
        aria-label={open ? t('chat.close') : t('chat.open')}
        className={`fixed bottom-5 right-5 z-[60] w-14 h-14 rounded-full shadow-lg flex items-center
          justify-center transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300
          ${open ? 'bg-gray-700 hover:bg-gray-800 rotate-90' : 'bg-emerald-600 hover:bg-emerald-700'}`}
      >
        {open
          ? <X className="w-6 h-6 text-white" />
          : <MessageCircle className="w-6 h-6 text-white" />}
      </button>

      {/* Panel */}
      {open && (
        <div
          role="dialog"
          aria-label={t('chat.title')}
          className="fixed z-[60] bg-white shadow-2xl border border-gray-200 flex flex-col
            inset-x-0 bottom-0 top-0 rounded-none
            sm:inset-auto sm:bottom-24 sm:right-5 sm:top-auto sm:w-[380px] sm:h-[560px] sm:rounded-2xl"
        >
          {/* Sarlavha */}
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100 flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4.5 h-4.5 text-emerald-700" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm text-gray-900 truncate">{t('chat.title')}</p>
              <p className="text-[11px] text-gray-500 truncate">{t('chat.subtitle')}</p>
            </div>
            {messages.length > 0 && (
              <button
                onClick={reset}
                title={t('chat.reset')}
                aria-label={t('chat.reset')}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setOpen(false)}
              aria-label={t('chat.close')}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 sm:hidden"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Xabarlar */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col justify-center">
                <p className="text-sm text-gray-500 text-center mb-4">{t('chat.emptyState')}</p>
                <div className="space-y-2">
                  {SUGGESTION_KEYS.map(key => {
                    const question = t(`chat.suggestions.${key}`);
                    return (
                      <button
                        key={key}
                        onClick={() => send(question)}
                        className="w-full text-left text-sm px-3 py-2 rounded-xl border border-gray-200
                          text-gray-700 hover:border-emerald-300 hover:bg-emerald-50 transition-colors"
                      >
                        {question}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              messages.map(m => <Bubble key={m.id} message={m} />)
            )}

            {pending && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5">
                  {[0, 150, 300].map(delay => (
                    <span
                      key={delay}
                      className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Kiritish */}
          <form onSubmit={submit} className="p-3 border-t border-gray-100 flex-shrink-0">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                maxLength={500}
                placeholder={t('chat.placeholder')}
                aria-label={t('chat.placeholder')}
                className="flex-1 min-w-0 px-3.5 py-2 text-sm border border-gray-200 rounded-xl
                  focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={pending || !input.trim()}
                aria-label={t('chat.send')}
                className="w-10 h-10 flex-shrink-0 rounded-xl bg-emerald-600 text-white flex items-center
                  justify-center hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5 text-center">{t('chat.disclaimer')}</p>
          </form>
        </div>
      )}
    </>
  );
}
