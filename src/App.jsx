import { useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import OnboardingFlow from './OnboardingFlow.jsx';
import Dashboard from './Dashboard.jsx';
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
    } catch (error) {
      console.error('Sign out error:', error);
      // Force sign out even if API call fails
      setUser(null);
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

  return <Dashboard user={user} onSignOut={handleSignOut} />;
}