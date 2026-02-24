import { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { GoogleOAuthProvider } from '@react-oauth/google';
import OnboardingFlow from './OnboardingFlow.jsx';
import KanbanDashboard from './components/KanbanDashboard.jsx';
import apiClient, { isNetworkError } from './services/api.js';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionError, setConnectionError] = useState(false);

  useEffect(() => {
    initializeAuth();
  }, []);

  useEffect(() => {
    const handleOnline = () => setConnectionError(false);
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  async function initializeAuth() {
    try {
      setLoading(true);
      setConnectionError(false);
      const result = await apiClient.verifyToken();
      
      if (result && result.success) {
        setUser(result.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Auth initialization error:', err);
      setUser(null);
      if (isNetworkError(err)) setConnectionError(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleAuthSuccess(authData) {
    if (authData.success && authData.user) {
      setUser(authData.user);
    }
  }

  async function handleSignOut() {
    try {
      await apiClient.logout();
      setUser(null);
      toast.success('Signed out');
    } catch (error) {
      console.error('Sign out error:', error);
      setUser(null);
      toast.success('Signed out');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-[#9CA3AF] text-sm">Loading Mission Control...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-[#EF4444] text-sm">Error: {error}</div>
      </div>
    );
  }

  if (!user) {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '1234567890-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com';
    
    return (
      <GoogleOAuthProvider clientId={googleClientId}>
        {connectionError && (
          <div className="bg-amber-500/20 border-b border-amber-500/40 text-amber-200 text-center py-2 px-4 text-sm">
            Can&apos;t reach the server. Check your connection or try again later.
          </div>
        )}
        <OnboardingFlow onAuthSuccess={handleAuthSuccess} />
      </GoogleOAuthProvider>
    );
  }

  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 4000, style: { background: '#111', color: '#F9FAFB', border: '1px solid #2A2A2A' } }} />
      <KanbanDashboard user={user} onSignOut={handleSignOut} />
    </>
  );
}