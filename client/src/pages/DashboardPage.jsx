import React from 'react';
import { useAuthStore } from '../store/authStore';
import { LogOut, FileText, Sparkles, User, ShieldAlert } from 'lucide-react';

export const DashboardPage = () => {
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col justify-between p-6">
        <div>
          <div className="flex items-center gap-2 mb-8">
            <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              <span className="text-primary-400">🏛️</span> LexAI
            </span>
          </div>
          
          <nav className="space-y-1.5">
            <a href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg bg-primary-600 text-white transition-all">
              <FileText className="w-4 h-4" />
              Documents
            </a>
            {['Upload', 'Chat', 'Compare', 'Reports', 'Profile'].map((item) => (
              <a 
                key={item} 
                href={`/${item.toLowerCase()}`} 
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
              >
                <Sparkles className="w-4 h-4 text-slate-500" />
                {item}
              </a>
            ))}
          </nav>
        </div>

        <div className="border-t border-slate-850 pt-4">
          <div className="flex items-center gap-3 px-4 py-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="truncate">
              <p className="text-sm font-semibold truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-950/20 hover:text-red-300 rounded-lg transition-all"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome back, {user?.name || 'User'}!</h1>
            <p className="text-slate-500 text-sm mt-1">Manage and analyze your legal documents securely with AI.</p>
          </div>
          <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl shadow-sm border border-slate-100">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-semibold text-slate-600">Database Connected</span>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Analyzed Contracts</p>
              <h3 className="text-3xl font-extrabold text-slate-800 mt-2">{user?.documentsCount || 0}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
              <FileText className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Detected Risks</p>
              <h3 className="text-3xl font-extrabold text-slate-800 mt-2">0</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
              <ShieldAlert className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Security Tier</p>
              <h3 className="text-xl font-bold text-slate-800 mt-2">Lex Enterprise</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <User className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Action Panel Placeholder */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 text-center max-w-xl mx-auto mt-12">
          <div className="w-16 h-16 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Start Analyzing Legal Documents</h2>
          <p className="text-slate-500 text-sm mt-2 max-w-sm mx-auto">
            Upload any legal agreement in PDF format. LexAI will extract the clauses and run them through our Risk Engine.
          </p>
          <a 
            href="/upload"
            className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-primary-500/20"
          >
            Upload Document
          </a>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
