import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Compass } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
      <div className="bg-white p-8 sm:p-12 rounded-3xl shadow-sm border border-slate-100 max-w-md w-full flex flex-col items-center">
        <div className="w-20 h-20 bg-primary-50 text-primary-500 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-primary-100">
          <Compass className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight mb-2">404</h1>
        <h2 className="text-xl font-bold text-slate-700 mb-3">Page not found</h2>
        <p className="text-slate-500 mb-8 leading-relaxed text-sm">
          Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or never existed.
        </p>
        <Link 
          to="/"
          className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-primary-500/20"
        >
          <Home className="w-4 h-4" /> Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
