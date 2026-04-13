import React from 'react';
import { Screen } from '../types';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  activeScreen: Screen;
  onScreenChange: (screen: Screen) => void;
}

export default function Layout({ children, activeScreen, onScreenChange }: LayoutProps) {
  const { user, signOut } = useAuth();
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
          
          <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-on-surface leading-tight">{user?.displayName}</p>
                <button onClick={signOut} className="text-[10px] text-slate-500 hover:text-error transition-colors uppercase tracking-widest font-bold">Logout</button>
              </div>
              <img src={user?.photoURL || ''} alt="Profile" className="w-8 h-8 rounded-full border border-primary/20" referrerPolicy="no-referrer" />
            </div>

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
