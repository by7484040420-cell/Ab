import React, { useState, useMemo } from 'react';
import { Search, ArrowRight, CheckCircle2, Zap, Globe } from 'lucide-react';
import { Portal } from '../types';
import { verifiedOfficialPortals, allPortals, pAfms, pIrctc, pPan, pSsc, pUpsc } from '../data/portals';

interface HomeViewProps {
  onSelectPortal: (portal: Portal) => void;
  onOpenChat: (initialMsg?: string) => void;
  onOpenProfile: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onSelectPortal,
  onOpenChat,
  onOpenProfile
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Extract clean hostname helper
  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return url;
    }
  };

  // Filtered portals based on search query
  const filteredPortals = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return verifiedOfficialPortals;
    return allPortals.filter(p => {
      const matchName = p.name.toLowerCase().includes(q);
      const matchKey = p.keys && p.keys.some(k => k.toLowerCase().includes(q));
      const matchNote = p.note && p.note.toLowerCase().includes(q);
      const matchHost = p.url.toLowerCase().includes(q);
      return matchName || matchKey || matchNote || matchHost;
    });
  }, [searchQuery]);

  return (
    <div className="max-w-[480px] mx-auto w-full px-3 py-3 space-y-3 font-sans">
      {/* Hero Banner with Red & Navy Theme */}
      <div className="rounded-2xl bg-[#14213D] text-white p-4 shadow-xl border-t-4 border-[#E53935] space-y-2.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E53935]/20 border border-[#E53935]/40 text-red-200 text-xs font-semibold">
          <Zap className="w-3.5 h-3.5 text-amber-300" />
          <span>Sarkari Form & Ticket Assistant</span>
        </div>

        <h1 className="text-lg font-extrabold text-white leading-snug">
          Narad AI: Sarkari Form <span className="text-[#E53935]">Auto-Fill</span>
        </h1>

        <p className="text-xs text-slate-300 leading-relaxed">
          Name, Parents, DOB, Address, Category sab AI auto-fill karega.
          <strong className="text-white block mt-0.5">User ko sirf CAPTCHA aur OTP enter karna hai!</strong>
        </p>

        {/* Quick Portal Pills (Min 44px tap targets) */}
        <div className="flex flex-wrap gap-1.5 pt-1 text-xs">
          {[pAfms, pIrctc, pPan, pSsc, pUpsc].map((p, idx) => (
            <button
              key={idx}
              onClick={() => onSelectPortal(p)}
              className="px-3 py-2 min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold flex items-center gap-1 transition-colors"
            >
              <span>{p.name.split(' ')[0]}</span>
            </button>
          ))}
          <button
            onClick={onOpenProfile}
            className="px-3 py-2 min-h-[44px] rounded-xl bg-[#E53935] hover:bg-red-700 text-white font-bold flex items-center gap-1 transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Mera Profile</span>
          </button>
        </div>
      </div>

      {/* Search Box (Min 48px height) */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Official portal khojein (AFMS, IRCTC, PAN, SSC, UPSC)..."
          className="w-full min-h-[48px] pl-11 pr-14 py-3 bg-white dark:bg-[#14213D] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E53935] text-xs sm:text-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md"
          >
            Hatao
          </button>
        )}
      </div>

      {/* Official Portals List Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E53935]"></span>
            <span>Verified Official Portals</span>
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Real official government domains
          </p>
        </div>
        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          {filteredPortals.length}
        </span>
      </div>

      {/* Portals List (One Column, Mobile-First, Large Tap Targets) */}
      <div className="space-y-2.5">
        {filteredPortals.map((portal, idx) => {
          const domain = getDomain(portal.url);
          return (
            <div
              key={idx}
              className="bg-white dark:bg-[#14213D] p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-[#E53935] dark:hover:border-[#E53935] shadow-xs space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug truncate">
                    {portal.name}
                  </h3>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    <Globe className="w-3 h-3 text-blue-500 shrink-0" />
                    <span className="truncate">{domain}</span>
                  </div>
                </div>

                <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Official
                </span>
              </div>

              {portal.note && (
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1">
                  {portal.note}
                </p>
              )}

              {/* The "Kaam shuru karo" button opens website inside the app via WorkScreen */}
              <button
                onClick={() => onSelectPortal(portal)}
                className="w-full min-h-[48px] px-4 py-2.5 bg-[#E53935] hover:bg-red-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-red-900/20 flex items-center justify-center gap-1.5 transition-transform active:scale-98 cursor-pointer"
              >
                <span>Kaam shuru karo</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          );
        })}

        {filteredPortals.length === 0 && (
          <div className="text-center py-8 bg-white dark:bg-[#14213D] rounded-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-2.5">
            <p className="text-slate-500 dark:text-slate-400 text-xs">
              &quot;{searchQuery}&quot; ke liye koi portal nahi mila.
            </p>
            <button
              onClick={() => onOpenChat(`Mujhe ${searchQuery} form bharno ke baare me bataiye.`)}
              className="min-h-[44px] px-4 py-2 bg-[#14213D] dark:bg-slate-700 text-white text-xs font-bold rounded-xl"
            >
              Narad AI se poochho →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeView;
