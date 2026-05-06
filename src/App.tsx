import { useState, useEffect } from 'react';
import { HomeScreen } from './components/HomeScreen';
import { ChildView } from './components/ChildView';
import { AdminView } from './components/AdminView';
import { PinModal } from './components/PinModal';
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

  useEffect(() => {
    api.getSettings()
      .then(({ requirePinForHome }) => {
        const hasToken = !!sessionStorage.getItem('adminToken');
        setHomeUnlocked(!requirePinForHome || hasToken);
      })
      .catch(() => setHomeUnlocked(true))
      .finally(() => setSettingsLoaded(true));
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
    const token = sessionStorage.getItem('adminToken');
    if (token) {
      setAdminInitialTab(tab);
      setCurrentView('admin');
    } else {
      setPendingTab(tab);
      setShowPinModal(true);
    }
  }

  function handlePinSuccess(token: string) {
    sessionStorage.setItem('adminToken', token);
    if (!homeUnlocked) {
      setHomeUnlocked(true);
    } else {
      setShowPinModal(false);
      setAdminInitialTab(pendingTab);
      setCurrentView('admin');
    }
  }

  if (!settingsLoaded) return null;

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
    </>
  );
}

export default App;
