import { useState } from 'react';
import { HomeScreen } from './components/HomeScreen';
import { ChildView } from './components/ChildView';
import { AdminView } from './components/AdminView';
import type { Child } from './lib/api';

type View = 'home' | 'child' | 'admin';
type AdminTab = 'settings' | 'tasks' | 'children' | 'calendar' | 'meals';

function App() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [adminInitialTab, setAdminInitialTab] = useState<AdminTab>('settings');

  function handleSelectChild(child: Child) {
    setSelectedChild(child);
    setCurrentView('child');
  }

  function handleBackToHome() {
    setCurrentView('home');
    setSelectedChild(null);
  }

  function handleAdminClick(tab: AdminTab = 'settings') {
    setAdminInitialTab(tab);
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
    </>
  );
}

export default App;
