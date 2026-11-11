import React, { useState } from 'react';
import { AppHeader } from './components/AppHeader';
import { HomeView } from './components/HomeView';
import { WorkScreen } from './components/WorkScreen';
import { ChatView } from './components/ChatView';
import { ProfileView } from './components/ProfileView';
import { SettingsView } from './components/SettingsView';
import { AppInstallModal } from './components/AppInstallModal';
import { Portal, UserProfile, AiConfig } from './types';
import { pAfms, pIrctc, pPan, pSsc, pUpsc, pDl } from './data/portals';
import { defaultProfile } from './utils/formFillEngine';
import { getSavedAiConfig } from './utils/aiService';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'home' | 'work' | 'chat' | 'profile' | 'settings'>('home');
  const [selectedPortal, setSelectedPortal] = useState<Portal>(pAfms);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
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

  // Persist profile to localStorage only
  const handleSaveProfile = (updated: UserProfile) => {
    setUserProfile(updated);
    try {
      localStorage.setItem('narad_user_profile', JSON.stringify(updated));
    } catch {
      // safe fallback
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
    <div className="min-h-screen bg-[#f5f7fb] dark:bg-[#0b1324] text-[#14213d] dark:text-[#f5f7fb] flex flex-col font-sans transition-colors duration-200">
      <AppHeader
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        selectedPortalName={selectedPortal?.name}
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
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

      {/* Android Native APK Package Download & Install Modal */}
      <AppInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        userProfile={userProfile}
      />
    </div>
  );
};

export default App;
