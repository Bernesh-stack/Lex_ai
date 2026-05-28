import React from 'react';

export const SharePage = () => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-center max-w-md">
      <span className="text-4xl">🔗</span>
      <h1 className="text-2xl font-bold text-slate-800 mt-4">Share Document</h1>
      <p className="text-slate-500 text-sm mt-2">Collaboration and sharing links are coming soon!</p>
      <a href="/dashboard" className="inline-block mt-6 text-sm font-semibold text-primary-500 hover:text-primary-600">Back to Dashboard</a>
    </div>
  </div>
);

export default SharePage;
