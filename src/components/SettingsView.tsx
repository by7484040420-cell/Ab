import React, { useState } from 'react';
import { Settings, Save, Key, RotateCcw, CheckCircle2, ShieldAlert } from 'lucide-react';
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
  const [key, setKey] = useState(cfg.key);
  const [base, setBase] = useState(cfg.base);
  const [model, setModel] = useState(cfg.model);
  const [autoSpeed, setAutoSpeed] = useState(cfg.autoSpeed || 40);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    const updated: AiConfig = {
      key: key.trim(),
      base: base.trim(),
      model: model.trim(),
      autoSpeed: Number(autoSpeed)
    };
    saveAiConfig(updated);
    onUpdateConfig(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const setGeminiPreset = () => {
    setBase('https://generativelanguage.googleapis.com/v1beta/openai/');
    setModel('gemini-3.8-flash');
  };

  const setGroqPreset = () => {
    setBase('https://api.groq.com/openai/v1');
    setModel('llama-3.3-70b-versatile');
  };

  const handleReset = () => {
    setKey('');
    setBase(defaultAiConfig.base);
    setModel(defaultAiConfig.model);
    setAutoSpeed(40);
  };

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">AI & Auto-Fill Settings</h1>
            <p className="text-xs text-slate-500">API keys aur auto-filling speed configure karein</p>
          </div>
        </div>

        <button
          onClick={onBack}
          className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
        >
          ← Wapas
        </button>
      </div>

      {saved && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Settings safaltapoorvak save ho gayi hain!</span>
        </div>
      )}

      {/* Configuration Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700">
            One-Click Provider Presets
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={setGeminiPreset}
              className="flex-1 py-2 px-3 rounded-xl border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold text-center cursor-pointer transition-colors"
            >
              Google Gemini (Free)
            </button>
            <button
              type="button"
              onClick={setGroqPreset}
              className="flex-1 py-2 px-3 rounded-xl border border-purple-300 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold text-center cursor-pointer transition-colors"
            >
              Groq Cloud (Free)
            </button>
          </div>
        </div>

        {/* API Key */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700">
              AI API Key (Optional)
            </label>
            <span className="text-[11px] text-slate-500">
              Free key: <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="text-blue-600 underline">aistudio.google.com</a>
            </span>
          </div>
          <div className="relative">
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="AI API key paste karein (AI key ke bina bhi intelligent mode chalta hai)"
              className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <Key className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <p className="text-[11px] text-slate-500">
            Aapki key sirf aapke is browser ke localStorage me save hoti hai, kahin bahar nahi jaati.
          </p>
        </div>

        {/* Base URL */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">
            Base API URL
          </label>
          <input
            type="text"
            value={base}
            onChange={(e) => setBase(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        {/* Model Name */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">
            Model Name
          </label>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="gemini-3.8-flash"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        {/* Typing Speed */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label className="font-bold text-slate-700">
              Auto-Fill Typing Speed
            </label>
            <span className="font-mono text-slate-500 font-bold">{autoSpeed} ms/field</span>
          </div>
          <input
            type="range"
            min="10"
            max="150"
            step="10"
            value={autoSpeed}
            onChange={(e) => setAutoSpeed(Number(e.target.value))}
            className="w-full accent-blue-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-medium">
            <span>Fast (10ms)</span>
            <span>Normal (40ms)</span>
            <span>Human-like (150ms)</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-semibold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Default Reset</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center space-x-1.5 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>

      {/* Safety Notice */}
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start space-x-3 text-xs text-amber-900">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Suraksha Notice:</strong> Kabhi bhi AI chat me apna Bank Account Password, ATM PIN, ya Aadhaar OTP mat likhein. Narad AI form auto-fill karta hai lekin final OTP/Captcha hamesha user khud enter karta hai.
        </p>
      </div>
    </div>
  );
};
