import { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { GoogleOAuthProvider } from '@react-oauth/google';
import OnboardingFlow from './OnboardingFlow.jsx';
import KanbanDashboard from './components/KanbanDashboard.jsx';
import apiClient from './services/api.js';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    initializeAuth();
  }, []);

  async function initializeAuth() {
    try {
      setLoading(true);
      const result = await apiClient.verifyToken();
      
      if (result && result.success) {
        setUser(result.user);
      } else {
        // No valid token, user needs to authenticate
        setUser(null);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      setUser(null);
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
    // Use a development Google Client ID for testing
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '1234567890-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com';
    
    return (
      <GoogleOAuthProvider clientId={googleClientId}>
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