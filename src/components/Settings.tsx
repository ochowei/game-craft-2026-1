import React, { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';

export default function Settings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    language: 'en',
    theme: 'dark',
    autosave: true,
    gridSnap: true,
    highPerformance: false
  });

  useEffect(() => {
    if (!user) return;

    const settingsRef = doc(db, 'users', user.uid, 'settings', 'preferences');
    const unsubscribe = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data() as any);
      }
    });

    return () => unsubscribe();
  }, [user]);

  const updateSetting = async (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    if (user) {
      const settingsRef = doc(db, 'users', user.uid, 'settings', 'preferences');
      try {
        await setDoc(settingsRef, {
          ...newSettings,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (error) {
        console.error("Error updating settings:", error);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <header className="mb-10">
        <h1 className="text-4xl font-headline font-bold text-on-surface tracking-tight mb-2">Settings</h1>
        <p className="text-on-surface-variant font-medium">Configure your editor preferences and application behavior.</p>
        {!user && (
          <div className="mt-4 p-4 bg-tertiary/10 border border-tertiary/20 rounded-xl flex items-center gap-3">
            <span className="material-symbols-outlined text-tertiary">warning</span>
            <p className="text-sm text-tertiary font-medium">Please login to sync your settings across devices.</p>
          </div>
        )}
      </header>

      <div className="space-y-8">
        {/* General Settings */}
        <section className="p-6 rounded-2xl bg-surface-container border border-outline-variant/10 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">settings</span>
            </div>
            <h3 className="text-lg font-headline font-bold">General</h3>
          </div>
          
          <div className="space-y-6">
            <div className="group">
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Language / 語言</label>
              <select 
                value={settings.language}
                onChange={(e) => updateSetting('language', e.target.value)}
                className="w-full bg-surface-container-high border-none rounded-lg text-sm text-on-surface focus:ring-1 focus:ring-primary"
              >
                <option value="en">English (US)</option>
                <option value="zh-TW">繁體中文 (Taiwan)</option>
                <option value="zh-CN">简体中文 (China)</option>
                <option value="ja">日本語 (Japan)</option>
                <option value="ko">한국어 (Korea)</option>
              </select>
              <p className="mt-2 text-[11px] text-on-surface-variant italic">Changes the interface language. / 更改介面語言。</p>
            </div>

            <div className="group">
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Theme Mode</label>
              <div className="flex gap-2 p-1 bg-surface-container-high rounded-lg w-fit">
                {['dark', 'light', 'system'].map((t) => (
                  <button 
                    key={t}
                    onClick={() => updateSetting('theme', t)}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-colors ${settings.theme === t ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:text-on-surface'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Editor Preferences */}
        <section className="p-6 rounded-2xl bg-surface-container border border-outline-variant/10 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined">edit_note</span>
            </div>
            <h3 className="text-lg font-headline font-bold">Editor Preferences</h3>
          </div>
          
          <div className="space-y-4">
            {[
              { id: 'autosave', title: 'Enable Autosave', desc: 'Automatically save changes every 30 seconds.', key: 'autosave' },
              { id: 'grid-snap', title: 'Snap to Grid', desc: 'Align objects to the grid while dragging in the board editor.', key: 'gridSnap' },
              { id: 'high-perf', title: 'High Performance Mode', desc: 'Prioritize frame rate over visual effects.', key: 'highPerformance' },
            ].map((pref) => (
              <div key={pref.id} className="flex items-center justify-between p-4 rounded-xl bg-surface-container-high/50 hover:bg-surface-container-high transition-colors group">
                <div>
                  <h4 className="text-sm font-bold text-on-surface uppercase tracking-tight">{pref.title}</h4>
                  <p className="text-xs text-on-surface-variant">{pref.desc}</p>
                </div>
                <button 
                  onClick={() => updateSetting(pref.key, !((settings as any)[pref.key]))}
                  className={`w-11 h-6 rounded-full relative transition-colors ${(settings as any)[pref.key] ? 'bg-secondary-container' : 'bg-surface-container-highest'}`}
                >
                  <span className={`absolute top-[2px] w-5 h-5 bg-white rounded-full transition-all ${(settings as any)[pref.key] ? 'left-[24px]' : 'left-[2px]'}`}></span>
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Account & Data */}
        <section className="p-6 rounded-2xl bg-surface-container border border-outline-variant/10 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-error/10 flex items-center justify-center text-error">
              <span className="material-symbols-outlined">person</span>
            </div>
            <h3 className="text-lg font-headline font-bold">Account & Data</h3>
          </div>
          
          <div className="space-y-4">
            <button className="w-full text-left p-4 rounded-xl bg-surface-container-high/50 hover:bg-surface-container-high transition-colors flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-on-surface uppercase tracking-tight">Export Project Data</h4>
                <p className="text-xs text-on-surface-variant">Download all project assets and configurations as a ZIP file.</p>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant">download</span>
            </button>
            <button className="w-full text-left p-4 rounded-xl bg-error/10 hover:bg-error/20 transition-colors flex items-center justify-between group">
              <div>
                <h4 className="text-sm font-bold text-error uppercase tracking-tight">Delete Project</h4>
                <p className="text-xs text-error/70">Permanently remove this project and all associated data.</p>
              </div>
              <span className="material-symbols-outlined text-error">delete</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
