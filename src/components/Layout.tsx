import React, { useState, useRef, useEffect } from 'react';
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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

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
      <nav className="fixed top-0 w-full z-50 bg-surface-container/80 backdrop-blur-xl shadow-xl shadow-surface-dim/20 flex justify-between items-center px-6 h-16 border-b border-outline-variant/50">
        <div className="flex items-center gap-8">
          <span className="text-xl font-bold text-primary tracking-wider font-headline">GameCraft Editor</span>
          <div className="hidden md:flex items-center gap-6 font-headline tracking-tight">
            <button className="text-on-surface-variant hover:text-on-surface transition-colors">Project</button>
            <button className="text-on-surface-variant hover:text-on-surface transition-colors">Assets</button>
            <button className="text-primary border-b-2 border-primary pb-1">History</button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex gap-2 mr-4 border-r border-outline-variant pr-4">
            <button className="text-on-surface-variant hover:text-on-surface transition-colors">
              <span className="material-symbols-outlined">save</span>
            </button>
            <button className="text-on-surface-variant hover:text-on-surface transition-colors">
              <span className="material-symbols-outlined">cloud_upload</span>
            </button>
            <button
              onClick={() => onScreenChange('settings')}
              className={`text-on-surface-variant hover:text-on-surface transition-colors ${activeScreen === 'settings' ? 'text-primary' : ''}`}
            >
              <span className="material-symbols-outlined">settings</span>
            </button>
          </div>
          <button className="hidden md:block px-4 py-1.5 rounded text-on-surface-variant font-medium hover:text-on-surface transition-colors">Export</button>

          <div className="flex items-center gap-3 md:pl-4 md:border-l border-outline-variant">
              <div className="text-right hidden md:block">
                <p className="text-xs font-bold text-on-surface leading-tight">{user?.displayName}</p>
                <button onClick={signOut} className="text-[10px] text-on-surface-variant hover:text-error transition-colors uppercase tracking-widest font-bold">Logout</button>
              </div>
              <img src={user?.photoURL || ''} alt="Profile" className="w-8 h-8 rounded-full border border-primary/20 shrink-0" referrerPolicy="no-referrer" />
            </div>

          <button className="hidden md:inline-flex bg-gradient-to-br from-primary-container to-primary px-5 py-1.5 rounded-xl text-on-primary-container font-bold text-sm uppercase tracking-wider active:scale-95 duration-200 shadow-lg shadow-primary-container/20">
            Playtest
          </button>

          <div className="relative md:hidden" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined">{menuOpen ? 'close' : 'menu'}</span>
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-surface-container rounded-xl shadow-xl shadow-surface-dim/30 border border-outline-variant/50 py-2 z-50">
                <button onClick={() => { setMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors text-sm">
                  <span className="material-symbols-outlined text-[20px]">save</span>
                  Save
                </button>
                <button onClick={() => { setMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors text-sm">
                  <span className="material-symbols-outlined text-[20px]">cloud_upload</span>
                  Cloud Upload
                </button>
                <button onClick={() => { onScreenChange('settings'); setMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface-container-high transition-colors text-sm ${activeScreen === 'settings' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}>
                  <span className="material-symbols-outlined text-[20px]">settings</span>
                  Settings
                </button>
                <div className="my-1 border-t border-outline-variant/50" />
                <button onClick={() => { setMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors text-sm">
                  <span className="material-symbols-outlined text-[20px]">ios_share</span>
                  Export
                </button>
                <button onClick={() => { setMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-primary hover:bg-surface-container-high transition-colors text-sm font-bold">
                  <span className="material-symbols-outlined text-[20px]">play_arrow</span>
                  Playtest
                </button>
                <div className="my-1 border-t border-outline-variant/50" />
                <button onClick={() => { signOut(); setMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-on-surface-variant hover:text-error hover:bg-surface-container-high transition-colors text-sm">
                  <span className="material-symbols-outlined text-[20px]">logout</span>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="flex flex-1 pt-16 min-h-0">
        {/* Side Navigation */}
        <aside className="w-20 md:w-64 bg-surface-container flex flex-col py-4 border-r border-outline-variant/50 min-h-0">
          <div className="px-6 mb-8 hidden md:block">
            <h2 className="text-lg font-black text-primary font-headline">Monopoly Revive</h2>
            <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">Draft v1.2</p>
          </div>
          <nav className="flex-1 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onScreenChange(item.id)}
                className={`w-full flex items-center gap-4 py-3 px-4 transition-all ease-in-out duration-300 font-body text-sm font-semibold uppercase tracking-widest ${
                  activeScreen === item.id
                    ? 'bg-primary text-on-primary-container rounded-lg mx-2 w-[calc(100%-16px)]'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span className="hidden md:inline">{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="mt-auto px-4 space-y-4">
            <button className="w-full py-3 bg-surface-container-high rounded-xl text-primary font-bold text-xs uppercase tracking-widest hover:bg-surface-bright transition-colors">
              New Object
            </button>
            <div className="pt-4 border-t border-outline-variant space-y-1">
              <button className="w-full flex items-center gap-4 py-2 text-on-surface-variant hover:text-on-surface px-2 transition-all">
                <span className="material-symbols-outlined">help_outline</span>
                <span className="hidden md:inline text-xs font-semibold uppercase tracking-widest">Help</span>
              </button>
              <button className="w-full flex items-center gap-4 py-2 text-on-surface-variant hover:text-on-surface px-2 transition-all">
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
