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
import TokensEditor from './components/TokensEditor';
import ProjectListScreen from './components/ProjectListScreen';
import ActiveProjectRoot from './components/ActiveProjectRoot';
import { RulesProvider } from './contexts/RulesContext';
import { CardsProvider } from './contexts/CardsContext';
import { BoardProvider } from './contexts/BoardContext';
import { LibraryProvider } from './contexts/LibraryContext';
import { TokensProvider } from './contexts/TokensContext';
import { ProjectProvider, useProjects } from './contexts/ProjectContext';
import { SyncStatusProvider } from './contexts/SyncStatusContext';

function AuthedApp() {
  const [activeScreen, setActiveScreen] = useState<Screen>('rules');
  const { projects, activeProjectId, loading, createProject, renameProject, deleteProject, openProject, closeActive } = useProjects();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface-container-lowest">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const showList = activeProjectId === null || activeScreen === 'projects';

  const handleScreenChange = (s: Screen) => {
    if (s === 'projects') {
      closeActive();
      setActiveScreen('projects');
    } else {
      setActiveScreen(s);
    }
  };

  if (showList) {
    return (
      <Layout activeScreen="projects" onScreenChange={handleScreenChange}>
        <ProjectListScreen
          projects={projects}
          createProject={async (n) => {
            const id = await createProject(n);
            await openProject(id);
            setActiveScreen('rules');
            return id;
          }}
          renameProject={renameProject}
          deleteProject={deleteProject}
          openProject={async (id) => {
            await openProject(id);
            setActiveScreen('rules');
          }}
        />
      </Layout>
    );
  }

  const renderScreen = () => {
    switch (activeScreen) {
      case 'board': return <BoardEditor />;
      case 'cards': return <CardDesigner />;
      case 'rules': return <RulesEditor />;
      case 'library': return <Library />;
      case 'settings': return <Settings />;
      case 'tokens': return <TokensEditor />;
      default: return <RulesEditor />;
    }
  };

  return (
    <ActiveProjectRoot projectKey={activeProjectId!}>
      <RulesProvider activeProjectId={activeProjectId!}>
        <CardsProvider activeProjectId={activeProjectId!}>
          <BoardProvider activeProjectId={activeProjectId!}>
            <TokensProvider activeProjectId={activeProjectId!}>
              <Layout activeScreen={activeScreen} onScreenChange={handleScreenChange}>
                {renderScreen()}
              </Layout>
            </TokensProvider>
          </BoardProvider>
        </CardsProvider>
      </RulesProvider>
    </ActiveProjectRoot>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface-container-lowest">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  if (!user) return <LoginScreen />;

  return (
    <LibraryProvider>
      <SyncStatusProvider>
        <ProjectProvider>
          <AuthedApp />
        </ProjectProvider>
      </SyncStatusProvider>
    </LibraryProvider>
  );
}
