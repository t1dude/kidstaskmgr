import { useState } from 'react';
import { HomeScreen } from './components/HomeScreen';
import { ChildView } from './components/ChildView';
import { AdminView } from './components/AdminView';
import type { Database } from './lib/database.types';

type Child = Database['public']['Tables']['children']['Row'];
type View = 'home' | 'child' | 'admin';

function App() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);

  function handleSelectChild(child: Child) {
    setSelectedChild(child);
    setCurrentView('child');
  }

  function handleBackToHome() {
    setCurrentView('home');
    setSelectedChild(null);
  }

  return (
    <>
      {currentView === 'home' && (
        <HomeScreen
          onSelectChild={handleSelectChild}
          onAdminClick={() => setCurrentView('admin')}
        />
      )}

      {currentView === 'child' && selectedChild && (
        <ChildView child={selectedChild} onBack={handleBackToHome} />
      )}

      {currentView === 'admin' && <AdminView onBack={handleBackToHome} />}
    </>
  );
}

export default App;
