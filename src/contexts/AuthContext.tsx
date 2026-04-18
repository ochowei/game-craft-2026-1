import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, onAuthStateChanged, signInWithGoogle, consumeRedirectResult, logout, provisionUserProfile, User } from '../lib/firebase';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<User | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Consume a pending redirect result on first mount (after Google redirects back).
    // onAuthStateChanged will also fire with the user; we provision here so the
    // publicProfile mirror runs before the app renders.
    consumeRedirectResult().then(async (redirectedUser) => {
      if (redirectedUser) {
        await provisionUserProfile(redirectedUser);
      }
    });

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    // signInWithRedirect navigates away; this promise resolves with null.
    // The user object arrives on the next page load via consumeRedirectResult.
    return signInWithGoogle();
  };

  const signOut = async () => {
    await logout();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
