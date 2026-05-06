import { useState } from 'react';
import { HomeScreen } from './components/HomeScreen';
import { ChildView } from './components/ChildView';
import { AdminView } from './components/AdminView';
import { PinModal } from './components/PinModal';
import type { Child } from './lib/api';

type View = 'home' | 'child' | 'admin';
type AdminTab = 'settings' | 'tasks' | 'children' | 'calendar' | 'meals';

function App() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [adminInitialTab, setAdminInitialTab] = useState<AdminTab>('settings');
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingTab, setPendingTab] = useState<AdminTab>('settings');

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
    setShowPinModal(false);
    setAdminInitialTab(pendingTab);
    setCurrentView('admin');
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
