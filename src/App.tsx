import React, { useState, useEffect } from 'react';
import { AppHeader } from './components/AppHeader';
import { HomeView } from './components/HomeView';
import { WorkScreen } from './components/WorkScreen';
import { ChatView } from './components/ChatView';
import { ProfileView } from './components/ProfileView';
import { SettingsView } from './components/SettingsView';
import { Portal, UserProfile, AiConfig } from './types';
import { pIrctc } from './data/portals';
import { defaultProfile } from './utils/formFillEngine';
import { getSavedAiConfig, defaultAiConfig } from './utils/aiService';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'home' | 'work' | 'chat' | 'profile' | 'settings'>('home');
  const [selectedPortal, setSelectedPortal] = useState<Portal>(pIrctc);
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('narad_user_profile');
      return saved ? JSON.parse(saved) : defaultProfile;
    } catch {
      return defaultProfile;
    }
  });
  const [aiConfig, setAiConfig] = useState<AiConfig>(getSavedAiConfig);
  const [chatInitialQuery, setChatInitialQuery] = useState<string>('');

  // Persist profile
  const handleSaveProfile = (updated: UserProfile) => {
    setUserProfile(updated);
    try {
      localStorage.setItem('narad_user_profile', JSON.stringify(updated));
    } catch {
      // storage quota or private mode
    }
  };

  // Launch Work Screen with a selected portal
  const handleSelectPortal = (portal: Portal) => {
    setSelectedPortal(portal);
    setCurrentTab('work');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Open chat with initial query
  const handleOpenChat = (query?: string) => {
    if (query) setChatInitialQuery(query);
    setCurrentTab('chat');
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb] flex flex-col font-sans">
      <AppHeader
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        selectedPortalName={selectedPortal?.name}
      />

      <main className="flex-1 pb-10">
        {currentTab === 'home' && (
          <HomeView
            onSelectPortal={handleSelectPortal}
            onOpenChat={handleOpenChat}
            onOpenProfile={() => setCurrentTab('profile')}
          />
        )}

        {currentTab === 'work' && (
          <WorkScreen
            portal={selectedPortal}
            userProfile={userProfile}
            onExit={() => setCurrentTab('home')}
            onOpenProfile={() => setCurrentTab('profile')}
          />
        )}

        {currentTab === 'chat' && (
          <ChatView
            cfg={aiConfig}
            onOpenPortal={handleSelectPortal}
            onOpenSettings={() => setCurrentTab('settings')}
            initialQuery={chatInitialQuery}
          />
        )}

        {currentTab === 'profile' && (
          <ProfileView
            profile={userProfile}
            onSaveProfile={handleSaveProfile}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsView
            cfg={aiConfig}
            onUpdateConfig={setAiConfig}
            onBack={() => setCurrentTab('home')}
          />
        )}
      </main>
    </div>
  );
};

export default App;
