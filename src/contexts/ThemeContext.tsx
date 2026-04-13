import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import type { User } from '../lib/firebase';

type ThemePreference = 'dark' | 'light' | 'system';
type ResolvedTheme = 'dark' | 'light';

interface ThemeContextValue {
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
}

const ThemeContext = createContext<ThemeContextValue>({ theme: 'dark', resolvedTheme: 'dark' });

function resolveTheme(preference: ThemePreference, osDark: boolean): ResolvedTheme {
  if (preference === 'system') return osDark ? 'dark' : 'light';
  return preference;
}

export function ThemeProvider({ children, user }: { children: React.ReactNode; user: User | null }) {
  const [theme, setTheme] = useState<ThemePreference>('dark');
  const [osDark, setOsDark] = useState(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  // Subscribe to Firestore settings
  useEffect(() => {
    if (!user) {
      setTheme('dark');
      return;
    }
    const settingsRef = doc(db, 'users', user.uid, 'settings', 'preferences');
    const unsubscribe = onSnapshot(settingsRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as { theme?: string };
        if (data.theme === 'dark' || data.theme === 'light' || data.theme === 'system') {
          setTheme(data.theme);
        }
      }
    });
    return () => unsubscribe();
  }, [user]);

  // Listen for OS preference changes
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent | { matches: boolean }) => setOsDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Apply resolved theme to <html>
  const resolved = resolveTheme(theme, osDark);
  useEffect(() => {
    document.documentElement.className = resolved;
  }, [resolved]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme: resolved }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
