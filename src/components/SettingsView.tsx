import React, { useState } from 'react';
import { Settings, Save, Key, RotateCcw, CheckCircle2, AlertCircle, ShieldAlert, Cpu, ExternalLink, Globe } from 'lucide-react';
import { AiConfig } from '../types';
import { defaultAiConfig, saveAiConfig } from '../utils/aiService';

interface SettingsViewProps {
  cfg: AiConfig;
  onUpdateConfig: (updated: AiConfig) => void;
  onBack: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  cfg,
  onUpdateConfig,
  onBack
}) => {
  const [key, setKey] = useState(cfg.key || '');
  const [base, setBase] = useState(cfg.base || 'https://generativelanguage.googleapis.com/v1beta/openai/');
  const [model, setModel] = useState(cfg.model || 'gemini-3.8-flash');
  const [saved, setSaved] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; fix?: string } | null>(null);

  // Save Settings
  const handleSave = () => {
    const updated: AiConfig = {
      key: key.trim(),
      base: base.trim() || 'https://generativelanguage.googleapis.com/v1beta/openai/',
      model: model.trim() || 'gemini-3.8-flash',
      autoSpeed: 40
    };
    saveAiConfig(updated);
    onUpdateConfig(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  // Test API Key against the configured OpenAI-compatible endpoint
  const handleTestKey = async () => {
    const k = key.trim();
    const b = (base.trim() || 'https://generativelanguage.googleapis.com/v1beta/openai/').replace(/\/+$/, '');
    const m = model.trim() || 'gemini-3.8-flash';

    if (!k) {
      setTestResult({
        success: false,
        message: 'Key khali hai. Kripya pehle Gemini API Key daalein.',
        fix: 'Fix: aistudio.google.com/apikey par jakar free API key banayein aur yahan paste karein.'
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const endpoint = `${b}/chat/completions`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${k}`
        },
        body: JSON.stringify({
          model: m,
          messages: [{ role: 'user', content: 'Ping' }],
          max_tokens: 5
        })
      });

      if (response.ok) {
        setTestResult({
          success: true,
          message: `API Key bilkul sahi kaam kar rahi hai! (${m} active)`
        });
      } else {
        const errorText = await response.text();
        let shortMsg = `Server ne error code ${response.status} diya.`;
        let fix = 'Fix: aistudio.google.com/apikey se nayi valid API key lein.';

        if (response.status === 401 || response.status === 403) {
          shortMsg = `Authentication error (${response.status}): Key invalid ya expired hai.`;
          fix = 'Fix: aistudio.google.com/apikey se fresh key copy karke paste karein.';
        } else if (response.status === 404) {
          shortMsg = `Model ya URL nahi mila (${response.status}).`;
          fix = 'Fix: Model name ko "gemini-3.8-flash" aur Base URL ko default Google endpoint par reset karein.';
        }

        setTestResult({
          success: false,
          message: shortMsg,
          fix
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Network/CORS error: Endpoint se sampark nahi ho saka (${err?.message || 'Failed to fetch'}).`,
        fix: 'Fix: Internet connection check karein ya Base URL me spelling verify karein.'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleResetDefaults = () => {
    setKey('');
    setBase('https://generativelanguage.googleapis.com/v1beta/openai/');
    setModel('gemini-3.8-flash');
    setTestResult(null);
  };

  return (
    <div className="max-w-[480px] mx-auto w-full px-3 py-3 space-y-3 font-sans">
      {/* Header */}
      <div className="bg-[#14213D] text-white p-4 rounded-2xl shadow-md border-t-4 border-[#E53935] flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-[#E53935] text-white flex items-center justify-center font-bold shadow-md shadow-red-900/30">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white">Narad AI Settings</h1>
            <p className="text-xs text-slate-300">Gemini OpenAI-compatible API configuration</p>
          </div>
        </div>

        <button
          onClick={onBack}
          className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors"
        >
          ← Wapas
        </button>
      </div>

      {saved && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs font-bold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Settings safaltapoorvak aapke phone me save ho gayi hain!</span>
        </div>
      )}

      {/* Main Settings Card */}
      <div className="bg-white dark:bg-[#14213D] p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        {/* 1. AI Key */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              AI API Key
            </label>
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-[#E53935] hover:underline flex items-center gap-0.5 font-semibold"
            >
              <span>Free key lein</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="relative">
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Google Gemini API key paste karein (jaise: AIzaSy...)"
              className="w-full min-h-[44px] pl-3.5 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E53935]"
            />
            <Key className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Aapki key sirf is phone ke localStorage (&apos;narad_ai_cfg&apos;) me save rehti hai.
          </p>
        </div>

        {/* 2. Base URL (default https://generativelanguage.googleapis.com/v1beta/openai/) */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Base URL (OpenAI-Compatible Endpoint)
          </label>
          <div className="relative">
            <input
              type="text"
              value={base}
              onChange={(e) => setBase(e.target.value)}
              placeholder="https://generativelanguage.googleapis.com/v1beta/openai/"
              className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E53935]"
            />
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Default: <span className="font-mono text-[#E53935]">https://generativelanguage.googleapis.com/v1beta/openai/</span>
          </p>
        </div>

        {/* 3. Model Name */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Model Name
          </label>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="gemini-3.8-flash"
            className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E53935]"
          />
        </div>

        {/* TEST BUTTON (Mandated by specification) */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleTestKey}
            disabled={isTesting}
            className="min-h-[44px] px-5 py-2.5 bg-[#14213D] hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs flex items-center gap-2 transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Cpu className="w-4 h-4 text-amber-400" />
            <span>{isTesting ? 'Key Test Ho Rahi Hai...' : 'Test AI Key'}</span>
          </button>

          <button
            type="button"
            onClick={handleResetDefaults}
            className="min-h-[44px] px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Default Reset</span>
          </button>
        </div>

        {/* Test Result Message (Honest, with short fix if error) */}
        {testResult && (
          <div
            className={`p-3.5 rounded-xl border text-xs ${
              testResult.success
                ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-300 text-emerald-800 dark:text-emerald-200'
                : 'bg-red-50 dark:bg-red-950 border-red-300 text-red-800 dark:text-red-200'
            }`}
          >
            <div className="flex items-start gap-2">
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-[#E53935] shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <p className="font-bold">{testResult.message}</p>
                {testResult.fix && <p className="text-[11px] opacity-90">{testResult.fix}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Save Settings Button */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            className="min-h-[48px] px-6 py-2.5 rounded-xl bg-[#E53935] hover:bg-red-700 text-white font-bold text-xs sm:text-sm shadow-md flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Settings Save Karein</span>
          </button>
        </div>
      </div>

      {/* Safety Notice */}
      <div className="bg-[#14213D] text-white p-4 rounded-xl flex items-start space-x-3 text-xs">
        <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed text-slate-300">
          <strong>Suraksha niyam:</strong> Kabhi kisi ke saath apni API key ya OTP share na karein. Narad AI aapki key ko sirf phone ke browser storage me encrypt/local rakhta hai.
        </p>
      </div>
    </div>
  );
};

export default SettingsView;
