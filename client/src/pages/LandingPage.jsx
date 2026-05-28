import React from 'react';
import { useAuthStore } from '../store/authStore';

export const LandingPage = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-center items-center px-6">
      <div className="max-w-xl text-center">
        <h1 className="text-5xl font-extrabold tracking-tight mb-4">🏛️ LexAI</h1>
        <p className="text-xl text-slate-400 mb-8 leading-relaxed">
          The Intelligent Contract Review and Risk Assessment Engine. Know what you're signing before you sign it.
        </p>
        <div className="flex gap-4 justify-center">
          {isAuthenticated ? (
            <a 
              href="/dashboard"
              className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl text-sm transition-all"
            >
              Go to Dashboard
            </a>
          ) : (
            <>
              <a 
                href="/login"
                className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl text-sm transition-all"
              >
                Log In
              </a>
              <a 
                href="/register"
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-sm transition-all border border-slate-700"
              >
                Create Account
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
