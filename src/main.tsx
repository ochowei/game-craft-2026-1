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
