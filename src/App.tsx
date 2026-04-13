import React, { useState, useEffect } from 'react';
import { Screen } from './types';
import Layout from './components/Layout';
import RulesEditor from './components/RulesEditor';
import TemplateLibrary from './components/TemplateLibrary';
import BoardEditor from './components/BoardEditor';
import CardDesigner from './components/CardDesigner';
import Settings from './components/Settings';
import { auth, onAuthStateChanged, User, db } from './lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

export default function App() {
  const [activeScreen, setActiveScreen] = useState<Screen>('rules');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const renderScreen = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }

    switch (activeScreen) {
      case 'board':
        return <BoardEditor />;
      case 'cards':
        return <CardDesigner />;
      case 'rules':
        return <RulesEditor />;
      case 'library':
        return <TemplateLibrary />;
      case 'settings':
        return <Settings user={user} />;
      case 'tokens':
        return (
          <div className="flex items-center justify-center h-full text-on-surface-variant font-headline text-2xl opacity-50">
            Tokens Editor Coming Soon
          </div>
        );
      default:
        return <RulesEditor />;
    }
  };

  return (
    <Layout activeScreen={activeScreen} onScreenChange={setActiveScreen} user={user}>
      {renderScreen()}
    </Layout>
  );
}
