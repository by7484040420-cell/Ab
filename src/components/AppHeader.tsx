import React, { useState, useEffect } from 'react';
import { Bot, Search, User, Settings, Globe, Smartphone, Moon, Sun, Layers } from 'lucide-react';

interface AppHeaderProps {
  currentTab: 'home' | 'work' | 'chat' | 'profile' | 'settings';
  setCurrentTab: (tab: 'home' | 'work' | 'chat' | 'profile' | 'settings') => void;
  selectedPortalName?: string;
  onOpenInstallModal: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentTab,
  setCurrentTab,
  selectedPortalName,
  onOpenInstallModal
}) => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      return localStorage.getItem('narad_theme') === 'dark' ||
        window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      try { localStorage.setItem('narad_theme', 'dark'); } catch {}
    } else {
      document.documentElement.classList.remove('dark');
      try { localStorage.setItem('narad_theme', 'light'); } catch {}
    }
  }, [isDark]);

  return (
    <header className="sticky top-0 z-50 bg-[#14213D] text-white shadow-lg border-b border-slate-800">
      <div className="max-w-[480px] mx-auto w-full px-2 sm:px-3">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div
            onClick={() => setCurrentTab('home')}
            className="flex items-center space-x-2.5 cursor-pointer group shrink-0 min-h-[44px]"
          >
            <div className="w-9 h-9 rounded-xl bg-[#E53935] flex items-center justify-center font-black text-xl text-white shadow-md shadow-red-900/40 group-hover:scale-105 transition-transform">
              N
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base tracking-wider text-white">
                  NARAD AI
                </span>
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#E53935] text-white uppercase">
                  Govt Assistant
                </span>
              </div>
              <p className="text-[10px] text-slate-300 font-medium hidden md:block">
                Sarkari Form & Ticket Auto-Filler
              </p>
            </div>
          </div>

          {/* Navigation Tabs (Large Tap Targets) */}
          <nav className="flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto scrollbar-none py-1">
            {/* 1. Home */}
            <button
              onClick={() => setCurrentTab('home')}
              className={`min-h-[44px] flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                currentTab === 'home'
                  ? 'bg-[#E53935] text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Home</span>
            </button>

            {/* 2. Work Screen */}
            <button
              onClick={() => setCurrentTab('work')}
              className={`min-h-[44px] flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                currentTab === 'work'
                  ? 'bg-[#E53935] text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Work</span>
              {selectedPortalName && (
                <span className="hidden lg:inline text-[10px] max-w-[90px] truncate opacity-80">
                  ({selectedPortalName.split(' ')[0]})
                </span>
              )}
            </button>

            {/* 3. AI Chat */}
            <button
              onClick={() => setCurrentTab('chat')}
              className={`min-h-[44px] flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                currentTab === 'chat'
                  ? 'bg-[#E53935] text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span>AI Chat</span>
            </button>

            {/* 4. Profile */}
            <button
              onClick={() => setCurrentTab('profile')}
              className={`min-h-[44px] flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                currentTab === 'profile'
                  ? 'bg-[#E53935] text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <User className="w-4 h-4" />
              <span className="hidden xs:inline">Profile</span>
            </button>

            {/* 5. Settings */}
            <button
              onClick={() => setCurrentTab('settings')}
              title="Settings"
              className={`min-h-[44px] min-w-[44px] p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors ${
                currentTab === 'settings' ? 'bg-slate-800 text-white' : ''
              }`}
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setIsDark(!isDark)}
              title={isDark ? 'Light Mode Karein' : 'Dark Mode Karein'}
              className="min-h-[44px] min-w-[44px] p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-slate-300" />}
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
