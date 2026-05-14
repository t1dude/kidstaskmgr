import { useState, useEffect } from 'react';
import { HomeScreen } from './components/HomeScreen';
import { ChildView } from './components/ChildView';
import { AdminView } from './components/AdminView';
import { PinModal } from './components/PinModal';
import { PWAPrompt } from './components/PWAPrompt';
import { OnboardingFlow } from './components/OnboardingFlow';
import { api } from './lib/api';
import type { Child } from './lib/api';

type View = 'home' | 'child' | 'admin';
type AdminTab = 'settings' | 'tasks' | 'children' | 'calendar' | 'meals';

function App() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [adminInitialTab, setAdminInitialTab] = useState<AdminTab>('settings');
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingTab, setPendingTab] = useState<AdminTab>('settings');
  const [homeUnlocked, setHomeUnlocked] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    Promise.all([
      api.getSettings(),
      api.getChildren(),
      token ? api.validateToken() : Promise.resolve(false),
    ])
      .then(([{ requirePinForHome }, children, tokenValid]) => {
        if (token && !tokenValid) localStorage.removeItem('adminToken');
        setHomeUnlocked(!requirePinForHome || tokenValid);
        setNeedsOnboarding(children.length === 0);
      })
      .catch(() => { setHomeUnlocked(true); setNeedsOnboarding(false); })
      .finally(() => setSettingsLoaded(true));

    const tokenCheckInterval = setInterval(async () => {
      try {
        const [{ requirePinForHome }, tokenValid] = await Promise.all([
          api.getSettings(),
          localStorage.getItem('adminToken') ? api.validateToken() : Promise.resolve(false),
        ]);
        if (!tokenValid) localStorage.removeItem('adminToken');
        setHomeUnlocked(!requirePinForHome || tokenValid);
      } catch {
        // keep current state on network error
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(tokenCheckInterval);
  }, []);

  function handleSelectChild(child: Child) {
    setSelectedChild(child);
    setCurrentView('child');
  }

  function handleBackToHome() {
    setCurrentView('home');
    setSelectedChild(null);
  }

  function handleAdminClick(tab: AdminTab = 'settings') {
    const token = localStorage.getItem('adminToken');
    if (token) {
      setAdminInitialTab(tab);
      setCurrentView('admin');
    } else {
      setPendingTab(tab);
      setShowPinModal(true);
    }
  }

  function handlePinSuccess(token: string) {
    localStorage.setItem('adminToken', token);
    if (!homeUnlocked) {
      setHomeUnlocked(true);
    } else {
      setShowPinModal(false);
      setAdminInitialTab(pendingTab);
      setCurrentView('admin');
    }
  }

  function handleOnboardingComplete() {
    setNeedsOnboarding(false);
    setHomeUnlocked(true);
  }

  if (!settingsLoaded) return null;

  if (needsOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  if (!homeUnlocked) {
    return (
      <PinModal
        onSuccess={handlePinSuccess}
        onCancel={() => {}}
        canCancel={false}
      />
    );
  }

  return (
    <>
      {currentView === 'home' && (
        <HomeScreen
          onSelectChild={handleSelectChild}
          onAdminClick={handleAdminClick}
        />
      )}

      {currentView === 'child' && selectedChild && (
        <ChildView child={selectedChild} onBack={handleBackToHome} />
      )}

      {currentView === 'admin' && (
        <AdminView onBack={handleBackToHome} initialTab={adminInitialTab} />
      )}

      {showPinModal && (
        <PinModal
          onSuccess={handlePinSuccess}
          onCancel={() => setShowPinModal(false)}
        />
      )}

      <PWAPrompt />
    </>
  );
}

export default App;
