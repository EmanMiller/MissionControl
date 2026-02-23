import { useState, useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { Zap, Github, Apple, Loader2 } from 'lucide-react';
import apiClient from './services/api.js';

/* ─── SVG Icons ──────────────────────────────────────────────────────────── */

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export default function OnboardingFlow({ onAuthSuccess }) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState(null);

  // Handle URL parameters for GitHub OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (code && state) {
      handleGitHubCallback(code, state);
    }
  }, []);

  async function handleGitHubCallback(code, state) {
    setIsAuthenticating(true);
    setError(null);
    
    try {
      const response = await apiClient.loginWithGitHub(code, state);
      if (response.success) {
        onAuthSuccess(response);
      } else {
        setError('GitHub authentication failed');
      }
    } catch (error) {
      console.error('GitHub auth error:', error);
      setError(error.message);
    } finally {
      setIsAuthenticating(false);
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }

  async function handleGoogleSuccess(credentialResponse) {
    setIsAuthenticating(true);
    setError(null);
    
    try {
      const response = await apiClient.loginWithGoogle(credentialResponse.credential);
      if (response.success) {
        onAuthSuccess(response);
      } else {
        setError('Google authentication failed');
      }
    } catch (error) {
      console.error('Google auth error:', error);
      setError(error.message);
    } finally {
      setIsAuthenticating(false);
    }
  }

  async function handleGitHubLogin() {
    try {
      // Get GitHub OAuth URL from backend
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/auth/github`);
      const data = await response.json();
      
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        setError(data.details || data.error || 'Failed to initiate GitHub authentication');
      }
    } catch (error) {
      console.error('GitHub login error:', error);
      setError('Failed to connect to authentication server');
    }
  }

  async function handleAppleLogin() {
    setError('Apple Sign In requires additional configuration. Please use Google or GitHub for now.');
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-[#06B6D4] to-[#8B5CF6] rounded-xl flex items-center justify-center">
              <Zap size={24} className="text-white" />
            </div>
          </div>
          
          <h1 className="text-[#F9FAFB] text-2xl font-bold mb-2">Welcome to Mission Control</h1>
          <p className="text-[#9CA3AF] text-sm leading-relaxed">
            An autonomous network of AI agents that operates around the clock, 
            executing tasks and generating value continuously.
          </p>
        </div>

        {/* Authentication Options */}
        <div className="space-y-4">
          {error && (
            <div className="bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg p-3 text-[#EF4444] text-sm">
              {error}
            </div>
          )}

          {/* Google OAuth */}
          <div className="flex flex-col">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google Sign In failed')}
              theme="filled_black"
              shape="pill"
              width="100%"
              disabled={isAuthenticating}
            />
          </div>

          {/* GitHub OAuth */}
          <button
            onClick={handleGitHubLogin}
            disabled={isAuthenticating}
            className="w-full bg-[#24292F] hover:bg-[#32383F] border-none text-white text-sm font-medium rounded-lg p-3 flex items-center justify-center gap-3 cursor-pointer transition-colors disabled:opacity-50"
            style={{ fontFamily: 'inherit' }}
          >
            {isAuthenticating ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Github size={18} />
            )}
            Continue with GitHub
          </button>

          {/* Apple Sign In */}
          <button
            onClick={handleAppleLogin}
            disabled={isAuthenticating}
            className="w-full bg-[#000000] hover:bg-[#1D1D1F] border border-[#2A2A2A] text-white text-sm font-medium rounded-lg p-3 flex items-center justify-center gap-3 cursor-pointer transition-colors disabled:opacity-50"
            style={{ fontFamily: 'inherit' }}
          >
            <Apple size={18} />
            Continue with Apple
          </button>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-[#6B7280] text-xs leading-relaxed">
            By signing in, you agree to connect your OpenClaw instance to Mission Control 
            for autonomous task processing and management.
          </p>
        </div>

        {/* Loading Overlay */}
        {isAuthenticating && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-6 flex items-center gap-3">
              <Loader2 size={20} className="animate-spin text-[#06B6D4]" />
              <span className="text-[#F9FAFB] text-sm">Authenticating...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}