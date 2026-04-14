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

function getCachedTheme(): ThemePreference {
  try {
    const cached = localStorage.getItem('theme-resolved');
    if (cached === 'dark' || cached === 'light') return cached;
  } catch {}
  return 'dark';
}

export function ThemeProvider({ children, user }: { children: React.ReactNode; user: User | null }) {
  const [theme, setTheme] = useState<ThemePreference>(getCachedTheme);
  const [osDark, setOsDark] = useState(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  // Subscribe to Firestore settings
  useEffect(() => {
    if (!user) {
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

  // Apply resolved theme to <html> and cache in localStorage
  const resolved = resolveTheme(theme, osDark);
  useEffect(() => {
    document.documentElement.className = resolved;
    try { localStorage.setItem('theme-resolved', resolved); } catch {}
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
