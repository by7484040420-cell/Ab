import React, { useState, useEffect } from 'react';
import {
  X, Download, Smartphone, Check, ShieldCheck, Sparkles, HelpCircle,
  Cpu, Globe, ArrowDownToLine
} from 'lucide-react';
import { UserProfile } from '../types';

interface AppInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
}

export const AppInstallModal: React.FC<AppInstallModalProps> = ({
  isOpen,
  onClose,
  userProfile
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  // Capture PWA install prompt
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert(
        'Android Phone me Install karne ke liye:\n' +
        '1. Browser ke upar 3 dots (⋮) par click karein.\n' +
        '2. "Install app" ya "Add to Home screen" par dabayein.\n' +
        'Narad AI aapke phone me bilkul native Android App ki tarah save ho jayega!'
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#14213D] text-white px-5 py-4 flex items-center justify-between border-t-4 border-[#E53935]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#E53935] flex items-center justify-center font-black text-xl text-white shadow-lg shadow-red-900/40">
              N
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
                <span>Narad AI Android App</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E53935] text-white uppercase">
                  Native Bridge
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                Phone me install karein aur direct original websites par auto-fill chalayein
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Download APK / Source File Section */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-300 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <ArrowDownToLine className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                  Download Android App Package
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  App wala zip/apk package file direct apne phone ya PC me download karein.
                </p>
              </div>
            </div>

            <a
              href="/api/download-apk"
              download
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 shrink-0 transition-transform active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Download File</span>
            </a>
          </div>

          {/* WebAPK Home Screen Install */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                  {isInstalled ? 'App Phone Me Installed Hai ✅' : 'Phone Me Direct Install Karein'}
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Play Store ke bina standalone full-screen Android app ban jayega.
                </p>
              </div>
            </div>

            <button
              onClick={handleInstallApp}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 shrink-0 transition-transform active:scale-95"
            >
              <Smartphone className="w-4 h-4" />
              <span>{isInstalled ? 'Installed' : 'Phone Me Install'}</span>
            </button>
          </div>

          {/* AI API Engine Info */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 space-y-2">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-600" />
              <h5 className="font-bold text-xs text-purple-900 uppercase tracking-wider">
                Gemini AI API Engine
              </h5>
            </div>
            <p className="text-xs text-purple-800 leading-relaxed">
              Narad AI koi manual bookmark script use nahi karta. Asli website ke form fields ko <strong>Gemini AI API</strong> analyze karta hai aur aapke Profile Locker data ko exact match karke original site par auto-fill karta hai!
            </p>
          </div>

          {/* Manual Install Instructions */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5 text-xs text-slate-700">
            <h5 className="font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
              <span>Android Chrome me Kaise Install Karein?</span>
            </h5>
            <ol className="space-y-1.5 list-decimal list-inside pl-1 text-slate-600">
              <li>Chrome me upar <strong>3 dots (⋮)</strong> menu par click karein.</li>
              <li><strong>"Install app"</strong> ya <strong>"Add to Home screen"</strong> chunein.</li>
              <li>App aapke phone ke app drawer me real Android App ban jayegi!</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 border-t border-slate-200 px-5 py-3 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">
            Active: {userProfile.naam} ({userProfile.category.toUpperCase()})
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 text-white hover:bg-slate-700 text-xs font-semibold"
          >
            Band Karein
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppInstallModal;
