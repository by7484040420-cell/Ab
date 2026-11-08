import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, User, Settings, ExternalLink, RefreshCw, Volume2 } from 'lucide-react';
import { Portal, AiConfig, AiMessage } from '../types';
import { askNaradAi } from '../utils/aiService';

interface ChatViewProps {
  cfg: AiConfig;
  onOpenPortal: (portal: Portal) => void;
  onOpenSettings: () => void;
  initialQuery?: string;
}

export const ChatView: React.FC<ChatViewProps> = ({
  cfg,
  onOpenPortal,
  onOpenSettings,
  initialQuery
}) => {
  const [messages, setMessages] = useState<AiMessage[]>([
    {
      id: '1',
      role: 'assistant',
      text: 'Namaste! Mai Narad AI hoon. Aapka personal sarkari sahayak.\n\nBataiye kaun sa sarkari form bharna hai ya IRCTC train ticket book karni hai? AI saara form khud bharega, aapko bas CAPTCHA aur OTP enter karna hoga.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState(initialQuery || '');
  const [busy, setBusy] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      const history = [...messages, userMsg].map(m => ({ role: m.role, text: m.text }));
      const result = await askNaradAi(cfg, history);

      const aiMsg: AiMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: result.text.replace(/\[OPEN:[^\]]+\]/g, '').trim(),
        portal: result.portal,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: 'Net ya AI me dikkat aayi. Kripya thodi der baad dobara koshish karein.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setBusy(false);
    }
  };

  const quickPrompts = [
    'IRCTC Tatkal train ticket auto-fill kaise hoga?',
    'SSC CGL / GD ka form kaise bharein?',
    'Instant free e-PAN 10 minute me kaise lein?',
    'Bihar RTPS Aay aur Jaati certificate kaise apply karein?'
  ];

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 flex flex-col h-[calc(100vh-80px)]">
      {/* Header bar */}
      <div className="flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-2xl shadow-xs mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-900/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-extrabold text-slate-900 text-sm sm:text-base">
              Narad AI Assistant
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              Sarkari Form & Ticket Advisor • Powered by AI
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setMessages([messages[0]])}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 text-xs font-semibold"
            title="Chat reset karein"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenSettings}
            className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">AI Settings</span>
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-3.5 p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start space-x-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.role === 'assistant' && (
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs mt-1">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl whitespace-pre-line leading-relaxed text-xs sm:text-sm shadow-xs ${
                m.role === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none font-medium'
                  : 'bg-slate-50 text-slate-800 rounded-tl-none border border-slate-200/80 font-medium'
              }`}
            >
              <div>{m.text}</div>

              {/* Portal Launch Button if detected */}
              {m.portal && (
                <div className="mt-3 pt-3 border-t border-slate-200/60">
                  <button
                    onClick={() => onOpenPortal(m.portal!)}
                    className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs shadow-md shadow-red-900/30 transition-all hover:scale-102"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Kholo & Auto-Fill Karein: {m.portal.name} →</span>
                  </button>
                </div>
              )}

              <div
                className={`text-[10px] mt-2 text-right ${
                  m.role === 'user' ? 'text-blue-200' : 'text-slate-400'
                }`}
              >
                {m.timestamp}
              </div>
            </div>

            {m.role === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs mt-1">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {busy && (
          <div className="flex items-center space-x-2 text-xs text-slate-500 p-2">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping"></span>
            <span>Narad AI soch raha hai...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Strip */}
      <div className="flex items-center space-x-2 overflow-x-auto py-2 scrollbar-none">
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(qp)}
            className="shrink-0 px-3 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 rounded-full text-xs font-semibold transition-colors"
          >
            {qp}
          </button>
        ))}
      </div>

      {/* Input box */}
      <div className="flex items-center space-x-2 bg-white p-2 border border-slate-200 rounded-2xl shadow-sm">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Jaise: IRCTC ticket tatkal rules, SSC GD form kaise bharein..."
          className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || busy}
          className={`p-3 rounded-xl font-bold transition-all ${
            input.trim() && !busy
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
