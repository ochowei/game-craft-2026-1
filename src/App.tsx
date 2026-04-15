import React, { useState } from 'react';
import { Screen } from './types';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import LoginScreen from './components/LoginScreen';
import RulesEditor from './components/RulesEditor';
import Library from './components/Library';
import BoardEditor from './components/BoardEditor';
import CardDesigner from './components/CardDesigner';
import Settings from './components/Settings';
import { RulesProvider } from './contexts/RulesContext';
import { CardsProvider } from './contexts/CardsContext';
import { BoardProvider } from './contexts/BoardContext';
import { LibraryProvider } from './contexts/LibraryContext';
import TokensEditor from './components/TokensEditor';
import { TokensProvider } from './contexts/TokensContext';

export default function App() {
  const { user, loading } = useAuth();
  const [activeScreen, setActiveScreen] = useState<Screen>('rules');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface-container-lowest">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  const renderScreen = () => {
    switch (activeScreen) {
      case 'board':
        return <BoardEditor />;
      case 'cards':
        return <CardDesigner />;
      case 'rules':
        return <RulesEditor />;
      case 'library':
        return <Library />;
      case 'settings':
        return <Settings />;
      case 'tokens':
        return <TokensEditor />;
      default:
        return <RulesEditor />;
    }
  };

  return (
    <RulesProvider>
      <CardsProvider>
        <BoardProvider>
          <LibraryProvider>
            <TokensProvider>
              <Layout activeScreen={activeScreen} onScreenChange={setActiveScreen}>
                {renderScreen()}
              </Layout>
            </TokensProvider>
          </LibraryProvider>
        </BoardProvider>
      </CardsProvider>
    </RulesProvider>
  );
}
