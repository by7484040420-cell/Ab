import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Settings, ExternalLink, RefreshCw, AlertCircle, ShieldAlert } from 'lucide-react';
import { Portal, AiConfig, AiMessage } from '../types';
import { askNaradAi, getSavedAiConfig } from '../utils/aiService';

interface ChatViewProps {
  cfg?: AiConfig;
  onOpenPortal: (portal: Portal) => void;
  onOpenSettings: () => void;
  initialQuery?: string;
}

export const ChatView: React.FC<ChatViewProps> = ({
  onOpenPortal,
  onOpenSettings,
  initialQuery
}) => {
  // Reads {key, base, model} directly from localStorage 'narad_ai_cfg' (never hardcoded)
  const [activeCfg, setActiveCfg] = useState<AiConfig>(getSavedAiConfig);

  const [messages, setMessages] = useState<AiMessage[]>([
    {
      id: '1',
      role: 'assistant',
      text: 'Namaste! Mai Narad AI hoon. Aapka personal sarkari form aur ticket sahayak.\n\nBataiye kaun sa sarkari form bharna hai (AFMS, IRCTC, PAN, SSC, UPSC)? AI saari details auto-fill karega, aur aapko sirf CAPTCHA aur OTP enter karna hoga.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState(initialQuery || '');
  const [busy, setBusy] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveCfg(getSavedAiConfig());
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, busy]);

  const handleSend = async (textToSend?: string) => {
    const q = (textToSend || input).trim();
    if (!q || busy) return;

    const userMsg: AiMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setBusy(true);

    try {
      // Re-read latest config from localStorage 'narad_ai_cfg'
      const currentCfg = getSavedAiConfig();
      const history = [...messages, userMsg].map(m => ({ role: m.role, text: m.text }));
      const result = await askNaradAi(currentCfg, history);

      const aiMsg: AiMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: result.text.replace(/\[OPEN:[^\]]+\]/g, '').trim(),
        portal: result.portal,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: `Error: AI request execute nahi ho saki (${err?.message || 'Network error'}). Fix: Settings me jakar Gemini API Key check karein ya Internet connect karein.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setBusy(false);
    }
  };

  const quickPrompts = [
    'AFMS Join form ki yogyata aur link bataiye',
    'IRCTC Tatkal train ticket auto-fill kaise hoga?',
    'Instant free e-PAN 10 minute me kaise lein?',
    'SSC CGL / GD ka form kaise bharein?',
    'UPSC Civil Services OTR kaise bharein?'
  ];

  return (
    <div className="max-w-[480px] mx-auto w-full px-3 py-3 flex flex-col h-[calc(100vh-80px)] font-sans">
      {/* Header bar with Red & Navy Theme */}
      <div className="flex items-center justify-between p-3.5 bg-white dark:bg-[#14213D] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xs mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-[#E53935] text-white flex items-center justify-center font-bold shadow-md shadow-red-900/30">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base">
              Narad AI Chat
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Model: <span className="font-mono text-[#E53935]">{activeCfg.model || 'gemini-3.8-flash'}</span>
              {!activeCfg.key && ' • (Key nahi hai: Settings me add karein)'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setMessages([messages[0]])}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 text-xs font-semibold min-h-[44px]"
            title="Chat reset karein"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenSettings}
            className="flex items-center space-x-1.5 px-3 py-2 min-h-[44px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </div>

      {/* Security Rule Banner */}
      <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-2.5 rounded-xl mb-3 flex items-center gap-2 text-xs text-amber-900 dark:text-amber-200">
        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
        <span className="text-[11px]">
          <strong>Suraksha niyam:</strong> AI ko kabhi OTP, Password ya personal details mat bhejiye. AI sirf official rules aur portal links batata hai.
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-3.5 p-4 bg-white dark:bg-[#14213D] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xs">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start space-x-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.role === 'assistant' && (
              <div className="w-8 h-8 rounded-lg bg-[#E53935] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs mt-1">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[85%] sm:max-w-[75%] p-3.5 sm:p-4 rounded-2xl whitespace-pre-line leading-relaxed text-xs sm:text-sm shadow-xs ${
                m.role === 'user'
                  ? 'bg-[#14213D] text-white rounded-tr-none font-medium'
                  : 'bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200/80 dark:border-slate-700 font-medium'
              }`}
            >
              <div>{m.text}</div>

              {/* Explicit "Open" Button when AI suggests a portal */}
              {m.portal && (
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => onOpenPortal(m.portal!)}
                    className="min-h-[44px] inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#E53935] hover:bg-red-700 text-white font-bold text-xs shadow-md transition-transform active:scale-95"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open {m.portal.name}</span>
                  </button>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    ({new URL(m.portal.url).hostname})
                  </span>
                </div>
              )}

              <div
                className={`text-[10px] mt-2 text-right ${
                  m.role === 'user' ? 'text-slate-300' : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {m.timestamp}
              </div>
            </div>

            {m.role === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-[#14213D] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs mt-1">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {busy && (
          <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 text-xs p-2">
            <div className="w-2 h-2 rounded-full bg-[#E53935] animate-ping"></div>
            <span>Narad AI soch raha hai...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      <div className="py-2 overflow-x-auto scrollbar-none flex items-center space-x-2">
        {quickPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(p)}
            className="shrink-0 px-3 py-1.5 min-h-[38px] bg-white dark:bg-[#14213D] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium transition-colors"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input box */}
      <div className="flex items-center space-x-2 bg-white dark:bg-[#14213D] p-2 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xs">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Kuch bhi poochhein (jaise: AFMS medical entry, IRCTC tatkal, SSC registration)..."
          className="flex-1 min-h-[44px] px-3.5 py-2 text-xs sm:text-sm bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
        />
        <button
          onClick={() => handleSend()}
          disabled={busy || !input.trim()}
          className="min-h-[44px] px-4 py-2 bg-[#E53935] hover:bg-red-700 disabled:opacity-50 text-white rounded-xl font-bold flex items-center justify-center transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ChatView;
