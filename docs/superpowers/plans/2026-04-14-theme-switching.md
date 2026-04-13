# Theme Switching Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing dark/light/system theme toggle in Settings actually apply to the UI, and clean up all hardcoded colors to use semantic tokens.

**Architecture:** Define light-mode CSS custom properties in a `.light` selector in `index.css`. A new `ThemeProvider` context reads the user's theme preference from Firestore, resolves `system` via `matchMedia`, and sets the appropriate class on `<html>`. All hardcoded Tailwind colors (`slate-*`, `blue-*`, etc.) are replaced with semantic tokens.

**Tech Stack:** React 19, Tailwind CSS v4, Firebase Firestore, Vitest + Testing Library

---

### Task 1: Add Light Theme CSS Tokens

**Files:**
- Modify: `src/index.css`
- Modify: `index.html`

- [ ] **Step 1: Add the `.light` CSS selector with light-mode token overrides**

In `src/index.css`, add this block after the closing `}` of the existing `@theme` block (before `@layer base`):

```css
.light {
  --color-surface: #f8f9fc;
  --color-surface-container: #eef0f4;
  --color-surface-container-low: #f3f4f8;
  --color-surface-container-high: #e4e6ea;
  --color-surface-container-highest: #d8dadf;
  --color-surface-container-lowest: #ffffff;
  --color-surface-bright: #d0d2d7;
  --color-surface-dim: #d8dadf;

  --color-on-surface: #1a1c1e;
  --color-on-surface-variant: #44474f;

  --color-primary: #2b5cd6;
  --color-primary-container: #d8e2ff;
  --color-on-primary-container: #001a41;

  --color-secondary: #006d3a;
  --color-secondary-container: #9cf5b7;
  --color-on-secondary-container: #00210e;

  --color-tertiary: #7c5800;
  --color-tertiary-container: #ffdeaa;

  --color-error: #ba1a1a;
  --color-outline: #74777f;
  --color-outline-variant: #c4c6d0;
}
```

- [ ] **Step 2: Remove hardcoded colors from `index.html`**

In `index.html`, change the `<body>` tag from:
```html
<body class="bg-[#121416] text-[#e2e2e5]">
```
to:
```html
<body>
```

The `@layer base` rule in `index.css` already applies `bg-surface text-on-surface` to `body`.

- [ ] **Step 3: Verify dark theme still looks correct**

Run: `npm run dev`

Open the app in a browser. Everything should look identical to before since dark is the default and `.light` is not applied yet.

- [ ] **Step 4: Manually test light theme in browser devtools**

In browser devtools, add class `light` to the `<html>` element. Verify:
- Background changes to light gray/white
- Text changes to dark
- Accent colors (primary blue, secondary green) are visible and have good contrast

- [ ] **Step 5: Commit**

```bash
git add src/index.css index.html
git commit -m "feat: add light theme CSS tokens and remove hardcoded body colors"
```

---

### Task 2: Create ThemeProvider Context

**Files:**
- Create: `src/contexts/ThemeContext.tsx`
- Modify: `src/main.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/contexts/ThemeContext.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import { ThemeProvider, useTheme } from './ThemeContext';
import { mockOnSnapshot, mockDoc, resetAllMocks, mockOnAuthStateChanged, emitAuthState, createMockUser, mockDocSnapshot } from '../test/firebase-mocks';

vi.mock('../lib/firebase', () => ({
  db: {},
  auth: {},
  onAuthStateChanged: (...args: any[]) => mockOnAuthStateChanged(...args),
}));

vi.mock('firebase/firestore', () => ({
  doc: (...args: any[]) => mockDoc(...args),
  onSnapshot: (...args: any[]) => mockOnSnapshot(...args),
}));

function TestConsumer() {
  const { theme, resolvedTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
    </div>
  );
}

describe('ThemeProvider', () => {
  let matchMediaListeners: Array<(e: { matches: boolean }) => void> = [];
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    resetAllMocks();
    matchMediaListeners = [];
    originalMatchMedia = window.matchMedia;
    document.documentElement.className = '';

    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: (_event: string, listener: (e: { matches: boolean }) => void) => {
        matchMediaListeners.push(listener);
      },
      removeEventListener: (_event: string, listener: (e: { matches: boolean }) => void) => {
        matchMediaListeners = matchMediaListeners.filter(l => l !== listener);
      },
    })) as any;
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('defaults to dark theme when no user is logged in', () => {
    render(
      <ThemeProvider user={null}>
        <TestConsumer />
      </ThemeProvider>
    );
    expect(screen.getByTestId('theme').textContent).toBe('dark');
    expect(screen.getByTestId('resolved').textContent).toBe('dark');
    expect(document.documentElement.className).toBe('dark');
  });

  it('applies theme from Firestore when user is logged in', () => {
    mockOnSnapshot.mockImplementation((_ref: any, callback: any) => {
      callback(mockDocSnapshot(true, { theme: 'light' }));
      return vi.fn();
    });

    const user = createMockUser();
    render(
      <ThemeProvider user={user as any}>
        <TestConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme').textContent).toBe('light');
    expect(screen.getByTestId('resolved').textContent).toBe('light');
    expect(document.documentElement.className).toBe('light');
  });

  it('resolves system theme to dark when OS prefers dark', () => {
    (window.matchMedia as any).mockImplementation((query: string) => ({
      matches: true,
      media: query,
      addEventListener: (_event: string, listener: any) => { matchMediaListeners.push(listener); },
      removeEventListener: (_event: string, listener: any) => { matchMediaListeners = matchMediaListeners.filter(l => l !== listener); },
    }));

    mockOnSnapshot.mockImplementation((_ref: any, callback: any) => {
      callback(mockDocSnapshot(true, { theme: 'system' }));
      return vi.fn();
    });

    const user = createMockUser();
    render(
      <ThemeProvider user={user as any}>
        <TestConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme').textContent).toBe('system');
    expect(screen.getByTestId('resolved').textContent).toBe('dark');
    expect(document.documentElement.className).toBe('dark');
  });

  it('reacts to OS preference change when in system mode', () => {
    (window.matchMedia as any).mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: (_event: string, listener: any) => { matchMediaListeners.push(listener); },
      removeEventListener: (_event: string, listener: any) => { matchMediaListeners = matchMediaListeners.filter(l => l !== listener); },
    }));

    mockOnSnapshot.mockImplementation((_ref: any, callback: any) => {
      callback(mockDocSnapshot(true, { theme: 'system' }));
      return vi.fn();
    });

    const user = createMockUser();
    render(
      <ThemeProvider user={user as any}>
        <TestConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('resolved').textContent).toBe('light');

    act(() => {
      matchMediaListeners.forEach(l => l({ matches: true }));
    });

    expect(screen.getByTestId('resolved').textContent).toBe('dark');
    expect(document.documentElement.className).toBe('dark');
  });

  it('defaults to dark when Firestore doc does not exist', () => {
    mockOnSnapshot.mockImplementation((_ref: any, callback: any) => {
      callback(mockDocSnapshot(false));
      return vi.fn();
    });

    const user = createMockUser();
    render(
      <ThemeProvider user={user as any}>
        <TestConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme').textContent).toBe('dark');
    expect(document.documentElement.className).toBe('dark');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/contexts/ThemeContext.test.tsx`

Expected: FAIL — `ThemeContext` module does not exist.

- [ ] **Step 3: Write the ThemeProvider implementation**

Create `src/contexts/ThemeContext.tsx`:

```tsx
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/contexts/ThemeContext.test.tsx`

Expected: All 5 tests PASS.

- [ ] **Step 5: Wire ThemeProvider into main.tsx**

In `src/main.tsx`, change the content to:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import App from './App.tsx';
import './index.css';

function ThemedApp() {
  const { user } = useAuth();
  return (
    <ThemeProvider user={user}>
      <App />
    </ThemeProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ThemedApp />
    </AuthProvider>
  </StrictMode>,
);
```

- [ ] **Step 6: Run all tests**

Run: `npx vitest run`

Expected: All tests pass (existing auth tests + new theme tests).

- [ ] **Step 7: Commit**

```bash
git add src/contexts/ThemeContext.tsx src/contexts/ThemeContext.test.tsx src/main.tsx
git commit -m "feat: add ThemeProvider that reads Firestore settings and applies theme to DOM"
```

---

### Task 3: Clean Up Hardcoded Colors in Layout.tsx

**Files:**
- Modify: `src/components/Layout.tsx`

- [ ] **Step 1: Replace all hardcoded colors**

Apply these replacements in `src/components/Layout.tsx`:

| Line(s) | Old | New |
|---|---|---|
| 25 | `bg-slate-900/80` | `bg-surface-container/80` |
| 25 | `shadow-black/20` | `shadow-surface-dim/20` |
| 25 | `border-slate-800/50` | `border-outline-variant/50` |
| 27 | `text-blue-300` | `text-primary` |
| 29 | `text-slate-400 hover:text-white` | `text-on-surface-variant hover:text-on-surface` |
| 30 | `text-slate-400 hover:text-white` | `text-on-surface-variant hover:text-on-surface` |
| 31 | `text-blue-400 border-b-2 border-blue-400` | `text-primary border-b-2 border-primary` |
| 36 | `border-slate-800` | `border-outline-variant` |
| 37 | `text-slate-400 hover:text-white` | `text-on-surface-variant hover:text-on-surface` |
| 39 | `text-slate-400 hover:text-white` | `text-on-surface-variant hover:text-on-surface` |
| 43 | `text-slate-400 hover:text-white` | `text-on-surface-variant hover:text-on-surface` |
| 44 | `text-blue-400` | `text-primary` |
| 49 | `text-slate-400 hover:text-white` | `text-on-surface-variant hover:text-on-surface` |
| 52 | `border-slate-800` | `border-outline-variant` |
| 67 | `bg-slate-900` | `bg-surface-container` |
| 67 | `border-slate-800/50` | `border-outline-variant/50` |
| 69 | `text-blue-400` | `text-primary` |
| 70 | `text-slate-500` | `text-on-surface-variant` |
| 78 | `text-slate-500 hover:text-slate-300` | `text-on-surface-variant hover:text-on-surface` |
| 79 | Lines with active state gradient `bg-gradient-to-br from-blue-600 to-blue-400 text-white` | `bg-primary text-on-surface` (Note: replace the gradient with a solid `bg-primary` for theme compatibility) |
| 89 | `bg-slate-800` | `bg-surface-container-high` |
| 93 | `text-slate-500 hover:text-slate-300` | `text-on-surface-variant hover:text-on-surface` |
| 97 | `text-slate-500 hover:text-slate-300` | `text-on-surface-variant hover:text-on-surface` |
| 88 | `border-slate-800` | `border-outline-variant` |

The full updated file:

```tsx
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
          <div className="flex gap-2 mr-4 border-r border-outline-variant pr-4">
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
          <button className="px-4 py-1.5 rounded text-on-surface-variant font-medium hover:text-on-surface transition-colors">Export</button>
          
          <div className="flex items-center gap-3 pl-4 border-l border-outline-variant">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-on-surface leading-tight">{user?.displayName}</p>
                <button onClick={signOut} className="text-[10px] text-on-surface-variant hover:text-error transition-colors uppercase tracking-widest font-bold">Logout</button>
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
```

- [ ] **Step 2: Verify no hardcoded colors remain**

Run: `grep -nE 'slate-|blue-[0-9]' src/components/Layout.tsx`

Expected: No matches.

- [ ] **Step 3: Run all tests**

Run: `npx vitest run`

Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/Layout.tsx
git commit -m "refactor: replace hardcoded colors with semantic tokens in Layout"
```

---

### Task 4: Clean Up Hardcoded Colors in BoardEditor.tsx

**Files:**
- Modify: `src/components/BoardEditor.tsx`

- [ ] **Step 1: Replace all hardcoded colors**

Full updated file:

```tsx
import React from 'react';

export default function BoardEditor() {
  return (
    <div className="flex h-full overflow-hidden">
      {/* Center Canvas */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-surface-container-lowest">
        {/* Grid Background Overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #b7c4ff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        
        {/* Canvas Controls */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 glass-panel px-4 py-2 rounded-full flex items-center gap-4 z-10 shadow-2xl">
          <button className="p-2 hover:bg-on-surface/10 rounded-full transition-colors"><span className="material-symbols-outlined text-on-surface-variant">zoom_in</span></button>
          <span className="text-xs font-bold text-on-surface">85%</span>
          <button className="p-2 hover:bg-on-surface/10 rounded-full transition-colors"><span className="material-symbols-outlined text-on-surface-variant">zoom_out</span></button>
          <div className="w-px h-4 bg-outline-variant/30"></div>
          <button className="p-2 hover:bg-on-surface/10 rounded-full transition-colors"><span className="material-symbols-outlined text-on-surface-variant">grid_on</span></button>
          <button className="p-2 hover:bg-on-surface/10 rounded-full transition-colors"><span className="material-symbols-outlined text-on-surface-variant">layers</span></button>
        </div>

        {/* The Board Canvas */}
        <div className="relative w-[600px] h-[600px] bg-surface-container-high rounded-lg shadow-[0_40px_100px_rgba(0,0,0,0.6)] p-2">
          <div className="grid grid-cols-11 grid-rows-11 w-full h-full gap-1">
            {/* Top Row */}
            <div className="bg-surface-container-high rounded-sm flex items-center justify-center border border-primary/20">
              <span className="material-symbols-outlined text-primary text-3xl">local_parking</span>
            </div>
            {[...Array(9)].map((_, i) => (
              <div key={i} className={`bg-surface-container-high rounded-sm flex flex-col ${i === 8 ? 'border-2 border-primary ring-4 ring-primary/20 z-10' : ''}`}>
                <div className={`h-1/4 rounded-t-sm ${i < 4 ? 'bg-red-500' : i < 6 ? 'bg-yellow-500' : 'bg-yellow-500'}`}></div>
                <div className="flex-1 p-1 text-[8px] flex flex-col justify-center items-center">
                  {i === 8 && (
                    <>
                      <span className="font-bold">VENTNOR</span>
                      <span>$260</span>
                    </>
                  )}
                </div>
              </div>
            ))}
            <div className="bg-surface-container-high rounded-sm flex items-center justify-center">
              <span className="material-symbols-outlined text-error text-3xl">gavel</span>
            </div>

            {/* Center Area */}
            <div className="col-start-2 col-end-11 row-start-2 row-end-11 bg-surface-container/50 rounded-lg flex items-center justify-center overflow-hidden relative">
              <div className="relative text-center opacity-20 transform -rotate-45 scale-150 select-none">
                <h1 className="text-8xl font-black tracking-tighter text-primary">MONOPOLY</h1>
                <p className="text-2xl font-bold tracking-widest text-secondary">REVIVE EDITOR</p>
              </div>
              <img 
                src="https://picsum.photos/seed/blueprint/800/800?blur=10" 
                alt="Blueprint background" 
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-10 pointer-events-none" 
              />
            </div>

            {/* Bottom Right Corner (GO) */}
            <div className="col-start-11 row-start-11 bg-surface-container-high rounded-sm flex flex-col items-center justify-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-secondary/5 group-hover:bg-secondary/10 transition-colors"></div>
              <span className="text-secondary font-black text-2xl z-10 tracking-tighter">GO</span>
              <span className="material-symbols-outlined text-secondary z-10" style={{ fontVariationSettings: "'FILL' 1" }}>arrow_back</span>
            </div>
          </div>
        </div>
      </div>

      {/* Inspector (Right Sidebar) */}
      <aside className="w-72 bg-surface-container flex flex-col border-l border-outline-variant/50 shadow-2xl shadow-surface-dim/40 font-body text-xs font-medium">
        <div className="p-4 border-b border-outline-variant/50">
          <h3 className="text-sm font-bold text-on-surface font-headline uppercase tracking-widest">Inspector</h3>
          <p className="text-secondary font-medium">Property Editor</p>
        </div>
        <div className="flex border-b border-outline-variant/50">
          <button className="flex-1 py-3 text-secondary border-r-4 border-secondary bg-secondary/10">Appearance</button>
          <button className="flex-1 py-3 text-on-surface-variant hover:bg-surface-container-high transition-all">Physics</button>
          <button className="flex-1 py-3 text-on-surface-variant hover:bg-surface-container-high transition-all">Logic</button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
          <div className="bg-surface-container-high rounded-xl p-4 shadow-inner">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-yellow-500 shadow-lg shadow-yellow-900/20"></div>
              <div>
                <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Selected Tile</p>
                <h4 className="text-sm font-bold text-on-surface">Ventnor Avenue</h4>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] text-on-surface-variant mb-1">Display Name</label>
                <input className="w-full bg-surface-container text-on-surface px-3 py-2 rounded border-none focus:ring-1 focus:ring-primary-container text-xs" type="text" defaultValue="Ventnor Avenue" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-on-surface-variant mb-1">Buy Price</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-on-surface-variant">$</span>
                    <input className="w-full bg-surface-container text-on-surface pl-6 pr-2 py-2 rounded border-none focus:ring-1 focus:ring-primary-container text-xs" type="number" defaultValue="260" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-on-surface-variant mb-1">Mortgage</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-on-surface-variant">$</span>
                    <input className="w-full bg-surface-container text-on-surface pl-6 pr-2 py-2 rounded border-none focus:ring-1 focus:ring-primary-container text-xs" type="number" defaultValue="130" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Rent Structure</h5>
              <button className="text-primary hover:text-on-surface transition-colors"><span className="material-symbols-outlined text-base">auto_fix</span></button>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Base Rent', value: '$22', color: 'text-secondary' },
                { label: '1 House', value: '$110', icon: 'home' },
                { label: '2 Houses', value: '$330', icon: 'home' },
                { label: 'Hotel', value: '$1150', icon: 'domain', color: 'text-error' },
              ].map((rent) => (
                <div key={rent.label} className="flex items-center justify-between bg-surface-container p-2 rounded-lg">
                  <div className="flex items-center gap-2">
                    {rent.icon && <span className="material-symbols-outlined text-xs text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>{rent.icon}</span>}
                    <span className="text-on-surface-variant">{rent.label}</span>
                  </div>
                  <span className={`font-bold ${rent.color || 'text-on-surface'}`}>{rent.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h5 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3">Color Group</h5>
            <div className="flex flex-wrap gap-2">
              {['bg-red-600', 'bg-yellow-500', 'bg-green-600', 'bg-blue-600', 'bg-orange-500', 'bg-purple-600', 'bg-pink-500'].map((color, i) => (
                <button key={color} className={`w-6 h-6 rounded-full ${color} border-2 ${i === 1 ? 'border-on-surface ring-2 ring-yellow-500/20' : 'border-transparent hover:border-on-surface'} transition-all`}></button>
              ))}
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-outline-variant/50">
          <button className="w-full py-2 bg-error/10 text-error rounded-lg font-bold hover:bg-error hover:text-on-surface transition-all">Delete Tile</button>
        </div>
      </aside>

      {/* Autosave Status */}
      <div className="fixed bottom-6 right-80 glass-panel px-4 py-2 rounded-lg border border-secondary/20 flex items-center gap-3 animate-pulse">
        <div className="w-2 h-2 rounded-full bg-secondary"></div>
        <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">Autosaved Just Now</span>
      </div>
    </div>
  );
}
```

Note: The board tile colors (`bg-red-500`, `bg-yellow-500`) and the Color Group swatches (`bg-red-600`, `bg-green-600`, etc.) are intentionally kept as literal colors — they represent game-specific board data, not UI chrome.

- [ ] **Step 2: Verify no unwanted hardcoded colors remain**

Run: `grep -nE 'slate-|blue-[0-9]' src/components/BoardEditor.tsx`

Expected: No matches. (The `bg-blue-600` in Color Group swatches is game data, but it uses the pattern `blue-6` not `blue-[0-9]` followed by `00` — verify manually that only color swatches remain.)

Run: `grep -nE 'text-white|hover:text-white|bg-black|hover:bg-white' src/components/BoardEditor.tsx`

Expected: No matches.

- [ ] **Step 3: Commit**

```bash
git add src/components/BoardEditor.tsx
git commit -m "refactor: replace hardcoded colors with semantic tokens in BoardEditor"
```

---

### Task 5: Clean Up Hardcoded Colors in CardDesigner.tsx

**Files:**
- Modify: `src/components/CardDesigner.tsx`

- [ ] **Step 1: Replace all hardcoded colors**

Full updated file:

```tsx
import React from 'react';

export default function CardDesigner() {
  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
        <header className="mb-10 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-headline font-bold text-on-surface tracking-tight mb-2">Card Deck Designer</h1>
            <p className="text-on-surface-variant font-body">Refine your Chance and Community Chest encounters.</p>
          </div>
          <div className="flex gap-2 p-1 bg-surface-container rounded-full">
            <button className="px-6 py-2 bg-primary-container text-on-primary-container rounded-full text-xs font-bold uppercase tracking-wider">Chance</button>
            <button className="px-6 py-2 text-on-surface-variant hover:text-on-surface rounded-full text-xs font-bold uppercase tracking-wider">Community Chest</button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Active Card Selection */}
          <div className="xl:col-span-1 group relative bg-surface-container rounded-2xl p-6 border-2 border-primary/40 shadow-2xl shadow-primary/5 cursor-pointer">
            <div className="flex justify-between items-start mb-6">
              <span className="px-3 py-1 bg-tertiary/10 text-tertiary text-[10px] font-black uppercase tracking-widest rounded-full">Chance #04</span>
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
            <div className="aspect-[5/7] w-full bg-[#fdfcf0] rounded-xl overflow-hidden p-6 flex flex-col items-center justify-between text-[#1a1c1e] shadow-inner relative">
              <div className="w-full text-center relative z-10">
                <div className="w-12 h-12 bg-orange-500 rounded-full mx-auto mb-2 flex items-center justify-center text-[#fdfcf0]">
                  <span className="material-symbols-outlined text-3xl">question_mark</span>
                </div>
                <h3 className="font-headline font-black text-xl uppercase leading-tight">ADVANCE TO GO</h3>
              </div>
              <div className="flex-1 flex items-center justify-center relative z-10">
                <span className="material-symbols-outlined text-8xl text-orange-600" style={{ fontVariationSettings: "'wght' 200" }}>rocket_launch</span>
              </div>
              <p className="text-xs font-medium text-center italic text-[#64748b] relative z-10">(COLLECT $200)</p>
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/paper-fibers.png')" }}></div>
            </div>
            <div className="mt-4 flex justify-between items-center">
              <span className="text-xs font-bold text-on-surface">Advance to Go</span>
              <span className="text-[10px] text-on-surface-variant font-mono">ID: CHN-004</span>
            </div>
          </div>

          {/* Other Cards */}
          {[
            { id: '12', title: 'GO TO JAIL', icon: 'gavel', desc: 'Go directly to Jail' },
            { id: '09', title: 'CHAIRMAN OF THE BOARD', icon: 'workspace_premium', desc: 'Pay each player $50' },
          ].map((card) => (
            <div key={card.id} className="group relative bg-surface-container rounded-2xl p-6 hover:bg-surface-container-high transition-all cursor-pointer">
              <div className="flex justify-between items-start mb-6">
                <span className="px-3 py-1 bg-surface-container-highest text-on-surface-variant text-[10px] font-black uppercase tracking-widest rounded-full">Chance #{card.id}</span>
              </div>
              <div className="aspect-[5/7] w-full bg-[#fdfcf0] rounded-xl overflow-hidden p-6 flex flex-col items-center justify-between text-[#1a1c1e] opacity-60 group-hover:opacity-100 transition-opacity">
                <div className="w-full text-center">
                  <div className="w-10 h-10 border-2 border-orange-500 text-orange-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl">question_mark</span>
                  </div>
                  <h3 className="font-headline font-black text-lg uppercase leading-tight">{card.title}</h3>
                </div>
                <span className="material-symbols-outlined text-7xl text-[#94a3b8]">{card.icon}</span>
                <p className="text-[10px] font-medium text-center italic text-[#64748b]">{card.desc}</p>
              </div>
            </div>
          ))}

          {/* Add New Card Slot */}
          <div className="group relative border-2 border-dashed border-outline-variant/30 bg-transparent rounded-2xl p-6 flex flex-col items-center justify-center gap-4 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer">
            <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-primary text-3xl">add</span>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-on-surface">Add New Chance Card</p>
              <p className="text-[10px] text-on-surface-variant font-medium">16/16 Slots Used</p>
            </div>
          </div>
        </div>
      </div>

      {/* Card Inspector (Right Sidebar) */}
      <aside className="w-80 bg-surface-container flex flex-col border-l border-outline-variant/50 shadow-2xl shadow-surface-dim/40 z-50">
        <div className="p-6 border-b border-outline-variant/50 bg-surface-container-low">
          <h2 className="text-sm font-bold text-secondary font-body mb-1">Card Inspector</h2>
          <p className="text-[10px] text-on-surface-variant font-medium uppercase tracking-wider">Editing: Advance to Go</p>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Live Preview Section */}
          <div className="p-6 bg-surface-container-low">
            <div className="aspect-[5/7] w-48 mx-auto bg-[#fdfcf0] rounded-2xl p-6 flex flex-col items-center justify-between text-[#1a1c1e] shadow-2xl relative overflow-hidden transform rotate-y-[-5deg] rotate-x-[5deg] hover:rotate-0 transition-transform duration-500">
              <div className="w-full text-center relative z-10">
                <div className="w-10 h-10 bg-orange-500 rounded-full mx-auto mb-3 flex items-center justify-center text-[#fdfcf0] shadow-lg">
                  <span className="material-symbols-outlined text-2xl">question_mark</span>
                </div>
                <h3 className="font-headline font-black text-lg uppercase tracking-tight leading-[0.9]">ADVANCE TO GO</h3>
              </div>
              <div className="relative z-10 py-4">
                <span className="material-symbols-outlined text-8xl text-orange-600/90 drop-shadow-sm" style={{ fontVariationSettings: "'wght' 200" }}>rocket_launch</span>
              </div>
              <div className="w-full border-t border-[#e2e8f0] pt-4 text-center relative z-10">
                <p className="text-[10px] font-bold text-[#1e293b] uppercase tracking-tighter mb-1">Instructions:</p>
                <p className="text-[11px] font-medium leading-tight text-[#475569] italic">Collect $200 as you pass through.</p>
              </div>
            </div>
            <p className="text-[10px] text-center text-on-surface-variant mt-4 italic font-medium">Physical Card Preview (Tilt to Rotate)</p>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex items-center gap-1 p-1 bg-surface-container-high/50 rounded-lg">
              <button className="flex-1 py-2 text-secondary border-r-4 border-secondary bg-secondary/10 text-xs font-medium">Content</button>
              <button className="flex-1 py-2 text-on-surface-variant hover:bg-surface-container-high transition-all text-xs font-medium">Visuals</button>
              <button className="flex-1 py-2 text-on-surface-variant hover:bg-surface-container-high transition-all text-xs font-medium">Logic</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Card Title</label>
                <div className="bg-surface-container-high/50 rounded-lg p-3 focus-within:bg-surface-container-high transition-colors">
                  <input className="w-full bg-transparent border-none p-0 text-sm font-bold text-on-surface focus:ring-0" type="text" defaultValue="ADVANCE TO GO" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Action Description</label>
                <div className="bg-surface-container-high/50 rounded-lg p-3 focus-within:bg-surface-container-high transition-colors">
                  <textarea className="w-full bg-transparent border-none p-0 text-sm font-medium text-on-surface-variant focus:ring-0 leading-relaxed h-20 resize-none" defaultValue="Collect $200 salary as you pass through start." />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Illustration Choice</label>
                <div className="grid grid-cols-4 gap-2">
                  {['rocket_launch', 'payments', 'apartment', 'gavel', 'train', 'mood_bad', 'celebration'].map((icon, i) => (
                    <button key={icon} className={`aspect-square rounded flex items-center justify-center transition-colors ${i === 0 ? 'bg-secondary/20 border border-secondary/40 text-secondary' : 'bg-surface-container-high hover:bg-surface-bright text-on-surface-variant'}`}>
                      <span className="material-symbols-outlined text-lg">{icon}</span>
                    </button>
                  ))}
                  <button className="aspect-square border border-dashed border-outline-variant rounded flex items-center justify-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-lg">add</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="p-6 bg-surface-container-low border-t border-outline-variant/50">
          <button className="w-full py-3 bg-gradient-to-br from-primary-container to-primary text-on-primary-container text-xs font-bold uppercase tracking-widest rounded-lg transition-transform active:scale-95">Save Changes</button>
        </div>
      </aside>

      {/* Floating Action Palette */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-surface-container/80 backdrop-blur-xl border border-outline-variant/20 rounded-2xl shadow-2xl z-50">
        <button className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary text-on-primary-container shadow-lg shadow-primary/20">
          <span className="material-symbols-outlined">edit</span>
        </button>
        <div className="w-px h-8 bg-outline-variant/30 mx-2"></div>
        <button className="w-10 h-10 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors">
          <span className="material-symbols-outlined">zoom_in</span>
        </button>
        <button className="w-10 h-10 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors">
          <span className="material-symbols-outlined">auto_fix_high</span>
        </button>
        <button className="w-10 h-10 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors">
          <span className="material-symbols-outlined">content_copy</span>
        </button>
        <button className="w-10 h-10 rounded-lg flex items-center justify-center text-error hover:bg-error/10 transition-colors">
          <span className="material-symbols-outlined">delete</span>
        </button>
      </div>
    </div>
  );
}
```

Note: Card content colors (the `bg-[#fdfcf0]` card background, `text-[#1a1c1e]`, orange icon accents, and card text colors like `text-[#64748b]`) are intentionally kept as literal values — they represent the printed card's appearance, not the editor UI. These should look the same regardless of theme.

- [ ] **Step 2: Verify no unwanted hardcoded colors remain**

Run: `grep -nE 'slate-|bg-black|text-white|hover:text-white|hover:bg-white' src/components/CardDesigner.tsx`

Expected: No matches.

- [ ] **Step 3: Commit**

```bash
git add src/components/CardDesigner.tsx
git commit -m "refactor: replace hardcoded colors with semantic tokens in CardDesigner"
```

---

### Task 6: Clean Up Hardcoded Colors in LoginScreen.tsx and App.tsx

**Files:**
- Modify: `src/components/LoginScreen.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Replace hardcoded colors in LoginScreen.tsx**

In `src/components/LoginScreen.tsx`, make two changes:

Change line 25 from:
```tsx
          <h1 className="text-4xl font-bold text-blue-300 tracking-wider font-headline mb-3">GameCraft Editor</h1>
```
to:
```tsx
          <h1 className="text-4xl font-bold text-primary tracking-wider font-headline mb-3">GameCraft Editor</h1>
```

Change line 35 from:
```tsx
            <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
```
to:
```tsx
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
```

- [ ] **Step 2: Replace hardcoded color in App.tsx**

In `src/App.tsx`, change line 19 from:
```tsx
        <div className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
```
to:
```tsx
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
```

- [ ] **Step 3: Verify no hardcoded colors remain in modified files**

Run: `grep -nE 'slate-|blue-[0-9]' src/components/LoginScreen.tsx src/App.tsx`

Expected: No matches.

- [ ] **Step 4: Run all tests**

Run: `npx vitest run`

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/LoginScreen.tsx src/App.tsx
git commit -m "refactor: replace hardcoded colors with semantic tokens in LoginScreen and App"
```

---

### Task 7: Final Verification

**Files:** None (verification only)

- [ ] **Step 1: Run full grep to confirm no stray hardcoded UI colors remain**

Run: `grep -rnE 'text-slate-|bg-slate-|border-slate-|text-blue-[0-9]|border-blue-[0-9]|hover:text-white|hover:bg-white' src/`

Expected: No matches (game-data colors like board tile swatches use `bg-red-600` etc. which are fine — they don't include `slate-` or `blue-[digit]`).

- [ ] **Step 2: Run type checking**

Run: `npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 3: Run all tests**

Run: `npx vitest run`

Expected: All tests pass.

- [ ] **Step 4: Manual testing in browser**

Run: `npm run dev`

Test the following scenarios:

1. **Dark theme (default):** App loads with dark styling. Navigate all screens (Board, Cards, Rules, Library, Settings). All UI should be consistent dark.
2. **Switch to Light:** In Settings, click "light". The entire UI should immediately switch to light backgrounds and dark text. Navigate all screens to verify.
3. **Switch to System:** In Settings, click "system". The theme should match your OS preference. Change your OS dark mode setting — the app should follow instantly.
4. **Persistence:** Refresh the page. The theme should load from Firestore and apply correctly.
5. **Logged-out state:** Sign out. The login screen should show in dark theme.

- [ ] **Step 5: Commit any remaining fixes (if needed)**

If manual testing reveals issues, fix them and commit:

```bash
git add -A
git commit -m "fix: address theme switching issues found during testing"
```
