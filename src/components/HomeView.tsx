import React, { useState, useMemo } from 'react';
import { Search, Sparkles, ExternalLink, Calendar, Building2, ShieldCheck, ArrowRight, CheckCircle2, ChevronRight, Zap } from 'lucide-react';
import { Portal, JobItem, Category } from '../types';
import { categories, popularPortals, allPortals, stateRecruit, initialLiveJobs } from '../data/portals';
import { searchPortals, searchJobs, norm } from '../utils/search';

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
  const [activeTab, setActiveTab] = useState<'all' | 'job' | 'admit' | 'result' | 'ticket'>('all');
  const [showStatePortals, setShowStatePortals] = useState(false);

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const portalHits = searchPortals(allPortals, searchQuery);
    const jobHits = searchJobs(initialLiveJobs, searchQuery, activeTab === 'ticket' ? 'all' : activeTab);
    return {
      portals: portalHits,
      jobs: jobHits
    };
  }, [searchQuery, activeTab]);

  // Filtered live jobs for feed
  const displayedJobs = useMemo(() => {
    if (activeTab === 'all') return initialLiveJobs;
    if (activeTab === 'ticket') {
      return initialLiveJobs.filter(j => j.title.toLowerCase().includes('railway') || j.title.toLowerCase().includes('rrb'));
    }
    return initialLiveJobs.filter(j => j.kind === activeTab);
  }, [activeTab]);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-6">
      {/* Hero Banner with Auto-Fill Promise */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0B1B3F] via-[#162a5c] to-[#1e4fb3] text-white p-5 sm:p-7 shadow-xl">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-64 h-64 bg-red-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-400/30 text-red-200 text-xs font-semibold mb-3">
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>AI Auto-Form & Ticket Engine Ready</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2 leading-tight">
            Sarkari Form & Train Ticket <span className="text-amber-300">AI Khud Bharega</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-200 mb-5 leading-relaxed">
            Name, Parents, DOB, Address, Category sab AI auto-fill karega. 
            <strong className="text-white"> User ko sirf CAPTCHA aur Mobile OTP enter karna hai!</strong>
          </p>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => onSelectPortal({ name: 'IRCTC (Train Ticket Booking)', url: 'https://www.irctc.co.in', keys: ['irctc', 'train'], note: 'Tatkal & General Ticket' })}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-red-900/40 transition-all hover:scale-102"
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>IRCTC Ticket Auto-Fill</span>
            </button>
            <button
              onClick={() => onSelectPortal({ name: 'SSC (Staff Selection Commission)', url: 'https://ssc.gov.in', keys: ['ssc'], note: 'Central' })}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs sm:text-sm transition-all"
            >
              <span>SSC CGL / GD Form</span>
            </button>
            <button
              onClick={onOpenProfile}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm shadow-md transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Mera Profile Locker</span>
            </button>
          </div>
        </div>
      </div>

      {/* Global Search Bar */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Jaise: railway rrb, bihar police, irctc tatkal, pan card, ssc result, aay praman..."
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent shadow-sm text-sm sm:text-base"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-md text-slate-600"
            >
              Hatao
            </button>
          )}
        </div>

        {/* Quick Launcher Strip */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="shrink-0 font-bold px-2.5 py-1 bg-red-600 text-white rounded-md uppercase tracking-wider text-[11px]">
            QUICK:
          </span>
          {[
            { name: 'IRCTC Ticket', url: 'https://www.irctc.co.in' },
            { name: 'RRB Railway', url: 'https://www.rrbapply.gov.in' },
            { name: 'SSC GD/CGL', url: 'https://ssc.gov.in' },
            { name: 'Bihar Police CSBC', url: 'https://csbc.bihar.gov.in' },
            { name: 'Instant e-PAN', url: 'https://eportal.incometax.gov.in' },
            { name: 'Bihar RTPS Aay/Jaati', url: 'https://serviceonline.bihar.gov.in' },
            { name: 'Voter ID Form 6', url: 'https://voters.eci.gov.in' },
            { name: 'Aadhaar UIDAI', url: 'https://myaadhaar.uidai.gov.in' }
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={() => onSelectPortal({ name: item.name, url: item.url, keys: [], note: 'Official' })}
              className="shrink-0 px-3 py-1 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-400 rounded-full font-medium text-slate-700 hover:text-blue-700 transition-colors"
            >
              • {item.name}
            </button>
          ))}
        </div>
      </div>

      {/* SEARCH RESULTS (IF SEARCHING) */}
      {searchResults ? (
        <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-bold text-slate-900 text-base sm:text-lg">
              Khoj Nateeje: &quot;{searchQuery}&quot;
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              {searchResults.portals.length} Portals • {searchResults.jobs.length} Notifications
            </span>
          </div>

          {searchResults.portals.length === 0 && searchResults.jobs.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <p className="text-slate-500 text-sm">
                Kuch nahi mila. Narad AI Assistant se poochhiye:
              </p>
              <button
                onClick={() => onOpenChat(`Mujhe ${searchQuery} ke baare me bataiye aur form kaise bharein?`)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow"
              >
                AI se Poochho →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {searchResults.portals.map((p, idx) => (
                <div
                  key={idx}
                  onClick={() => onSelectPortal(p)}
                  className="group p-3.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-400 rounded-xl cursor-pointer transition-all flex items-start justify-between"
                >
                  <div className="space-y-1">
                    <div className="font-bold text-slate-900 group-hover:text-blue-700 text-sm">
                      {p.name}
                    </div>
                    <div className="text-xs text-slate-500">{p.note || 'Official Govt Portal'}</div>
                    <div className="text-[11px] font-mono text-emerald-600">
                      {new URL(p.url).hostname}
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center space-x-1 text-xs font-bold text-blue-600 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-xs">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Auto-Fill</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Filter Pills */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: 'Sabhi (All)' },
              { id: 'ticket', label: '🚂 IRCTC & Tickets' },
              { id: 'job', label: '💼 Sarkari Bharti' },
              { id: 'admit', label: '🎟 Admit Card' },
              { id: 'result', label: '📊 Results & Merit' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`shrink-0 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 13 Categories Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Seva Category (13 Vibhag)
              </h2>
              <span className="text-xs text-slate-500 font-medium">Har kaam ke liye official portal</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {categories.map((c, idx) => (
                <div
                  key={idx}
                  onClick={() => onSelectPortal(c.links[0])}
                  className="group bg-white p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between"
                >
                  <div>
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm mb-2 text-white shadow-xs"
                      style={{ backgroundColor: c.color }}
                    >
                      {c.tag}
                    </div>
                    <h3 className="font-bold text-slate-900 group-hover:text-blue-700 text-sm leading-snug">
                      {c.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{c.sub}</p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
                    <span style={{ color: c.color }}>{c.links.length} Portals</span>
                    <span className="text-slate-400 group-hover:text-blue-600 transition-colors">
                      Kholo →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Bharti, Admit Cards & Results Feed */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Taaza Sarkari Bharti & Updates
                </h2>
                <p className="text-xs text-slate-500">Official portals se taaza link</p>
              </div>
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                ● Live & Verified
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {displayedJobs.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-300 shadow-xs hover:shadow transition-all space-y-2.5 flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-700">
                        NAYA
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
                        {item.kind}
                      </span>
                      {item.vacancies && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                          {item.vacancies} Posts
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm leading-snug">
                      {item.title}
                    </h3>

                    {item.posts && (
                      <p className="text-xs text-slate-600 line-clamp-1">
                        <strong>Post:</strong> {item.posts}
                      </p>
                    )}

                    {item.qualification && (
                      <p className="text-xs text-slate-500">
                        <strong>Yogyata:</strong> {item.qualification}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-[11px] text-slate-500 flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Last date: {item.last_date ? item.last_date.split('-').reverse().join('/') : 'Jaldi dekhein'}</span>
                    </div>

                    <button
                      onClick={() => onSelectPortal({ name: item.title, url: item.url, keys: [], note: item.source })}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>AI Auto-Fill</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Popular Services Direct Grid */}
          <div className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Lokpriya Sarkari Sevaayein
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
              {popularPortals.map((p, idx) => (
                <div
                  key={idx}
                  onClick={() => onSelectPortal(p)}
                  className="p-3 bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-400 rounded-xl cursor-pointer transition-all flex flex-col justify-between"
                >
                  <div className="font-semibold text-slate-900 text-xs sm:text-sm line-clamp-2">
                    {p.name}
                  </div>
                  <div className="mt-2 text-[10px] font-bold text-blue-600 flex items-center space-x-1">
                    <span>Apply / Download →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Verified State Portals Drawer Trigger */}
          <div
            onClick={() => setShowStatePortals(!showStatePortals)}
            className="p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-400 cursor-pointer shadow-xs transition-all flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Verified State Recruitment Portals ({stateRecruit.length} Rajya)
                </h3>
                <p className="text-xs text-slate-500">
                  Bihar BPSC/CSBC, UP Police, Rajasthan RSMSSB, MP ESB, WBSSC aur sabhi rajya
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-blue-600">
              {showStatePortals ? 'Chhupao ▲' : 'Dekho →'}
            </span>
          </div>

          {showStatePortals && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 p-4 bg-slate-50 rounded-xl border border-slate-200">
              {stateRecruit.map((p, idx) => (
                <div
                  key={idx}
                  onClick={() => onSelectPortal(p)}
                  className="p-3 bg-white hover:bg-blue-50 border border-slate-200 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="font-bold text-slate-900 text-xs">{p.name}</div>
                  <div className="text-[11px] text-purple-700 font-medium">{p.note}</div>
                </div>
              ))}
            </div>
          )}

          {/* Security & Trust Footer */}
          <div className="bg-[#0B1B3F] text-white p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between text-xs space-y-2 sm:space-y-0">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold">100% Client-Side Privacy: Koi data server par save nahi hota</span>
            </div>
            <div className="text-slate-300">
              Sirf verified official government (.gov.in / .nic.in) portals
            </div>
          </div>
        </>
      )}
    </div>
  );
};
