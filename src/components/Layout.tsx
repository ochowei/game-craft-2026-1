import React from 'react';
import { Screen } from '../types';
import { motion } from 'motion/react';

import { User, signInWithGoogle, logout } from '../lib/firebase';

interface LayoutProps {
  children: React.ReactNode;
  activeScreen: Screen;
  onScreenChange: (screen: Screen) => void;
  user: User | null;
}

export default function Layout({ children, activeScreen, onScreenChange, user }: LayoutProps) {
  const navItems: { id: Screen; icon: string; label: string }[] = [
    { id: 'board', icon: 'grid_view', label: 'Board' },
    { id: 'cards', icon: 'style', label: 'Cards' },
    { id: 'rules', icon: 'gavel', label: 'Rules' },
    { id: 'tokens', icon: 'token', label: 'Tokens' },
    { id: 'library', icon: 'layers', label: 'Library' },
  ];

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-slate-900/80 backdrop-blur-xl shadow-xl shadow-black/20 flex justify-between items-center px-6 h-16 border-b border-slate-800/50">
        <div className="flex items-center gap-8">
          <span className="text-xl font-bold text-blue-300 tracking-wider font-headline">GameCraft Editor</span>
          <div className="hidden md:flex items-center gap-6 font-headline tracking-tight">
            <button className="text-slate-400 hover:text-white transition-colors">Project</button>
            <button className="text-slate-400 hover:text-white transition-colors">Assets</button>
            <button className="text-blue-400 border-b-2 border-blue-400 pb-1">History</button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-2 mr-4 border-r border-slate-800 pr-4">
            <button className="text-slate-400 hover:text-white transition-colors">
              <span className="material-symbols-outlined">save</span>
            </button>
            <button className="text-slate-400 hover:text-white transition-colors">
              <span className="material-symbols-outlined">cloud_upload</span>
            </button>
            <button 
              onClick={() => onScreenChange('settings')}
              className={`text-slate-400 hover:text-white transition-colors ${activeScreen === 'settings' ? 'text-blue-400' : ''}`}
            >
              <span className="material-symbols-outlined">settings</span>
            </button>
          </div>
          <button className="px-4 py-1.5 rounded text-slate-400 font-medium hover:text-white transition-colors">Export</button>
          
          {user ? (
            <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-on-surface leading-tight">{user.displayName}</p>
                <button onClick={logout} className="text-[10px] text-slate-500 hover:text-error transition-colors uppercase tracking-widest font-bold">Logout</button>
              </div>
              <img src={user.photoURL || ''} alt="Profile" className="w-8 h-8 rounded-full border border-primary/20" referrerPolicy="no-referrer" />
            </div>
          ) : (
            <button 
              onClick={async () => {
                try {
                  await signInWithGoogle();
                } catch (e) {
                  // Error is already handled/logged in firebase.ts
                }
              }}
              className="flex items-center gap-2 bg-surface-container-high hover:bg-surface-bright text-on-surface px-4 py-1.5 rounded-xl font-bold text-sm transition-all border border-outline-variant/20 shadow-lg active:scale-95"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Login
            </button>
          )}

          <button className="bg-gradient-to-br from-primary-container to-primary px-5 py-1.5 rounded-xl text-on-primary-container font-bold text-sm uppercase tracking-wider active:scale-95 duration-200 shadow-lg shadow-primary-container/20">
            Playtest
          </button>
        </div>
      </nav>

      <div className="flex flex-1 pt-16 min-h-0">
        {/* Side Navigation */}
        <aside className="w-20 md:w-64 bg-slate-900 flex flex-col py-4 border-r border-slate-800/50 min-h-0">
          <div className="px-6 mb-8 hidden md:block">
            <h2 className="text-lg font-black text-blue-400 font-headline">Monopoly Revive</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Draft v1.2</p>
          </div>
          <nav className="flex-1 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onScreenChange(item.id)}
                className={`w-full flex items-center gap-4 py-3 px-4 transition-all ease-in-out duration-300 font-body text-sm font-semibold uppercase tracking-widest ${
                  activeScreen === item.id
                    ? 'bg-gradient-to-br from-blue-600 to-blue-400 text-white rounded-lg mx-2 w-[calc(100%-16px)]'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span className="hidden md:inline">{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="mt-auto px-4 space-y-4">
            <button className="w-full py-3 bg-slate-800 rounded-xl text-primary font-bold text-xs uppercase tracking-widest hover:bg-slate-700 transition-colors">
              New Object
            </button>
            <div className="pt-4 border-t border-slate-800 space-y-1">
              <button className="w-full flex items-center gap-4 py-2 text-slate-500 hover:text-slate-300 px-2 transition-all">
                <span className="material-symbols-outlined">help_outline</span>
                <span className="hidden md:inline text-xs font-semibold uppercase tracking-widest">Help</span>
              </button>
              <button className="w-full flex items-center gap-4 py-2 text-slate-500 hover:text-slate-300 px-2 transition-all">
                <span className="material-symbols-outlined">chat_bubble_outline</span>
                <span className="hidden md:inline text-xs font-semibold uppercase tracking-widest">Feedback</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-surface-container-lowest custom-scrollbar min-h-0">
          <motion.div
            key={activeScreen}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="min-h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
