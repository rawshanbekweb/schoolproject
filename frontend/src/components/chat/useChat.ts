import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../api/client';

const SESSION_STORAGE_KEY = 'chatbot_session_key';

export interface ChatSource {
  title: string | null;
  url_path: string | null;
  source_table: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  sources?: ChatSource[];
  /** Kontekst topilmagan javob — interfeysda boshqacha ko'rsatiladi. */
  ungrounded?: boolean;
  failed?: boolean;
}

interface AskResponse {
  success: boolean;
  data: {
    session_key: string;
    answer: string;
    grounded: boolean;
    sources: ChatSource[];
  };
}

let idCounter = 0;
const nextId = () => `m${++idCounter}`;

export function useChat() {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pending, setPending] = useState(false);
  const sessionKey = useRef<string | null>(null);

  useEffect(() => {
    try {
      sessionKey.current = localStorage.getItem(SESSION_STORAGE_KEY);
    } catch {
      // localStorage mavjud bo'lmasa (maxfiy rejim) sessiyasiz ishlaymiz
      sessionKey.current = null;
    }
  }, []);

  const send = useCallback(async (text: string) => {
    const question = text.trim();
    if (!question || pending) return;

    setMessages(prev => [...prev, { id: nextId(), role: 'user', text: question }]);
    setPending(true);

    try {
      const { data } = await apiClient.post<AskResponse>('/chatbot/ask', {
        session_key: sessionKey.current,
        message: question,
        lang: i18n.language,
      });

      sessionKey.current = data.data.session_key;
      try {
        localStorage.setItem(SESSION_STORAGE_KEY, data.data.session_key);
      } catch {
        // saqlab bo'lmasa ham suhbat joriy sahifada davom etaveradi
      }

      setMessages(prev => [...prev, {
        id: nextId(),
        role: 'assistant',
        text: data.data.answer,
        sources: data.data.sources,
        ungrounded: !data.data.grounded,
      }]);
    } catch (err: any) {
      const status = err?.response?.status;
      const text = status === 429
        ? t('chat.errorRateLimit')
        : status === 503
          ? t('chat.errorUnavailable')
          : t('chat.errorGeneric');
      setMessages(prev => [...prev, { id: nextId(), role: 'assistant', text, failed: true }]);
    } finally {
      setPending(false);
    }
  }, [pending, i18n.language, t]);

  const reset = useCallback(() => {
    setMessages([]);
    sessionKey.current = null;
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      /* e'tiborsiz */
    }
  }, []);

  return { messages, pending, send, reset };
}
