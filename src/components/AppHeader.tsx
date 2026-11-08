import React from 'react';
import { Bot, FileText, Search, User, Settings, Sparkles } from 'lucide-react';

interface AppHeaderProps {
  currentTab: 'home' | 'work' | 'chat' | 'profile' | 'settings';
  setCurrentTab: (tab: 'home' | 'work' | 'chat' | 'profile' | 'settings') => void;
  selectedPortalName?: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentTab,
  setCurrentTab,
  selectedPortalName
}) => {
  return (
    <header className="sticky top-0 z-50 bg-[#0B1B3F] text-white shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div
            onClick={() => setCurrentTab('home')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-red-900/30 group-hover:scale-105 transition-transform">
              N
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base sm:text-lg tracking-wider text-white">
                  NARAD AI
                </span>
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-slate-900 uppercase">
                  Auto-Fill Engine
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium hidden sm:block">
                Sarkari Form & Ticket Auto-Filler • Sab Kuchh, Ek Jagah
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => setCurrentTab('home')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                currentTab === 'home'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Search</span>
            </button>

            <button
              onClick={() => setCurrentTab('work')}
              className={`relative flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                currentTab === 'work'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span className="hidden md:inline">Auto-Filler & Ticket</span>
              <span className="md:hidden">Auto-Fill</span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
            </button>

            <button
              onClick={() => setCurrentTab('chat')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                currentTab === 'chat'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span>AI Sahayak</span>
            </button>

            <button
              onClick={() => setCurrentTab('profile')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                currentTab === 'profile'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Profile Locker</span>
            </button>

            <button
              onClick={() => setCurrentTab('settings')}
              title="Settings"
              className={`p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors ${
                currentTab === 'settings' ? 'bg-slate-800 text-white' : ''
              }`}
            >
              <Settings className="w-4 h-4" />
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
