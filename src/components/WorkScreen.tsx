import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, AlertTriangle, XCircle, Sparkles, Globe, ShieldAlert } from 'lucide-react';
import { Portal, UserProfile } from '../types';
import { getSavedAiConfig } from '../utils/aiService';

interface WorkScreenProps {
  portal: Portal;
  userProfile: UserProfile;
  onExit: () => void;
  onOpenProfile: () => void;
}

export const WorkScreen: React.FC<WorkScreenProps> = ({
  portal,
  userProfile,
  onExit,
  onOpenProfile
}) => {
  const [status, setStatus] = useState<string>('Taiyar: Button dabayein');
  const [statusLogs, setStatusLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState<number>(0);
  const [isSiteOpen, setIsSiteOpen] = useState<boolean>(false);
  const [hasCompleted, setHasCompleted] = useState<boolean>(false);

  // Check if native Android WebView bridge is available
  const isNative = Boolean(
    typeof window !== 'undefined' &&
    window.NaradNative?.isNative &&
    window.NaradNative.isNative()
  );

  // Setup live status listener
  useEffect(() => {
    window.onNaradStatus = (msg: string) => {
      setStatus(msg);
      setStatusLogs(prev => [...prev.slice(-4), msg]);

      const lower = msg.toLowerCase();
      if (lower.includes('open') || lower.includes('shuru')) setProgress(25);
      else if (lower.includes('scan') || lower.includes('field')) setProgress(60);
      else if (lower.includes('fill') || lower.includes('likh')) setProgress(85);
      else if (lower.includes('complete') || lower.includes('ho gaya') || lower.includes('done')) {
        setProgress(100);
        setHasCompleted(true);
      }
    };

    return () => {
      delete window.onNaradStatus;
    };
  }, []);

  // 1. "Asli Govt Site Kholo"
  const handleOpenSite = () => {
    if (isNative && window.NaradNative) {
      try {
        window.NaradNative.openSite(portal.url);
        setIsSiteOpen(true);
        setStatus('Website app ke andar khol di gayi hai.');
        setStatusLogs(prev => [...prev, `openSite: ${portal.url}`]);
      } catch (err: any) {
        setStatus(`Error opening site: ${err?.message || 'Failed'}`);
      }
    } else {
      // In preview/browser, do not open a new tab or fake anything
      setIsSiteOpen(true);
      setStatus('Preview mode: Android app me website panel neeche khulta hai.');
    }
  };

  // 2. "Band karo"
  const handleCloseSite = () => {
    if (isNative && window.NaradNative) {
      try {
        window.NaradNative.closeSite();
      } catch (err) {
        console.warn('closeSite error:', err);
      }
    }
    setIsSiteOpen(false);
    setStatus('Site band kar di gayi hai.');
    setStatusLogs(prev => [...prev, 'closeSite() call hua']);
  };

  // 3. "AI Auto-Fill Chalao"
  const handleStartAutoFill = () => {
    if (!isNative || !window.NaradNative) return;

    setProgress(15);
    setHasCompleted(false);
    setStatus('AI form inspect aur auto-fill kar raha hai...');

    try {
      // Profile from localStorage 'narad_user_profile'
      const savedProfile = localStorage.getItem('narad_user_profile');
      const profileJson = savedProfile || JSON.stringify(userProfile);

      // Key, Base, Model from localStorage 'narad_ai_cfg'
      const cfg = getSavedAiConfig();
      const key = cfg.key || '';
      const base = cfg.base || 'https://generativelanguage.googleapis.com/v1beta/openai/';
      const model = cfg.model || 'gemini-3.8-flash';

      // Call Native bridge
      window.NaradNative.aiFill(profileJson, key, base, model);
      setStatusLogs(prev => [...prev, `aiFill call hua (Model: ${model})`]);
    } catch (err: any) {
      setStatus(`Auto-fill error: ${err?.message || 'Failed'}`);
    }
  };

  const domain = (() => {
    try {
      return new URL(portal.url).hostname.replace(/^www\./, '');
    } catch {
      return portal.url;
    }
  })();

  return (
    <div className="max-w-[480px] mx-auto w-full px-3 py-3 space-y-3 font-sans">
      {/* Top Header */}
      <div className="flex items-center justify-between bg-[#14213D] text-white p-3.5 rounded-2xl shadow-md border-t-4 border-[#E53935]">
        <button
          onClick={onExit}
          className="min-h-[44px] min-w-[44px] p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl flex items-center justify-center transition-colors"
          title="Wapas Jao"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="text-center flex-1 px-2 min-w-0">
          <h1 className="text-sm font-extrabold text-white truncate">
            {portal.name}
          </h1>
          <p className="text-[11px] text-slate-300 font-mono truncate">
            {domain}
          </p>
        </div>

        <button
          onClick={onOpenProfile}
          className="min-h-[44px] px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold rounded-xl border border-slate-700 transition-colors"
        >
          Profile
        </button>
      </div>

      {/* When window.NaradNative is NOT available: Clear Box (Mandated by Rule) */}
      {!isNative && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-500 text-amber-950 dark:text-amber-200 p-4 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm font-bold leading-relaxed">
              Asli website app ke andar sirf Android app me khulti hai. Is preview me AI form nahi bhar sakta.
            </div>
          </div>
          <p className="text-[11px] text-amber-800 dark:text-amber-300/90 pl-7.5">
            Android app me real website niche panel me khulti hai aur phone ke native bridge se auto-fill hoti hai.
          </p>
        </div>
      )}

      {/* Main Control Panel */}
      <div className="bg-white dark:bg-[#14213D] p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3.5">
        {/* Status Line */}
        <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isNative ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
            <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">
              {status}
            </span>
          </div>
          <span className="font-mono text-xs font-bold text-[#E53935] shrink-0">
            {progress}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
          <div
            className="bg-[#E53935] h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Small Log under the Progress Bar */}
        <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-400 space-y-1">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Live Status Log:
          </div>
          {statusLogs.length === 0 ? (
            <div className="text-slate-400 italic">Abhi koi activity nahi hui.</div>
          ) : (
            statusLogs.map((log, idx) => (
              <div key={idx} className="truncate">
                › {log}
              </div>
            ))
          )}
        </div>

        {/* Action Buttons: Large Tap Targets (min-h-[48px]) */}
        <div className="space-y-2.5 pt-1">
          {/* Button 1: "Asli Govt Site Kholo" */}
          <button
            onClick={handleOpenSite}
            className="w-full min-h-[48px] px-4 py-3 bg-[#14213D] dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-sm rounded-xl shadow-xs flex items-center justify-center gap-2 transition-transform active:scale-98 cursor-pointer"
          >
            <Globe className="w-4 h-4 text-blue-400" />
            <span>Asli Govt Site Kholo</span>
          </button>

          {/* Button 2: "AI Auto-Fill Chalao" (Disabled when window.NaradNative is NOT available) */}
          <button
            onClick={handleStartAutoFill}
            disabled={!isNative}
            title={!isNative ? 'Asli website control sirf Android app me chalta hai' : 'AI Auto-Fill Chalao'}
            className={`w-full min-h-[50px] px-4 py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-md transition-transform active:scale-98 ${
              isNative
                ? 'bg-[#E53935] hover:bg-red-700 text-white shadow-red-900/30 cursor-pointer'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>AI Auto-Fill Chalao</span>
          </button>

          {/* Button 3: "Band karo" */}
          <button
            onClick={handleCloseSite}
            className="w-full min-h-[44px] px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <XCircle className="w-4 h-4 text-slate-400" />
            <span>Band karo</span>
          </button>
        </div>

        {/* After Filling Notice (Mandated by Rule) */}
        {hasCompleted && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-700 rounded-xl text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Ab CAPTCHA/OTP aur Submit aap khud karein.</span>
          </div>
        )}
      </div>

      {/* Security Rule Card */}
      <div className="bg-slate-100 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-400">
        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <span>
          <strong>Suraksha niyam:</strong> Aadhaar, DOB, mobile kabhi AI ko nahi bheja jaata. CAPTCHA, OTP aur password user hamesha khud enter karta hai.
        </span>
      </div>
    </div>
  );
};

export default WorkScreen;
