import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { LogOut, FileText, Sparkles, User, ShieldAlert, Upload, Trash2, Clock, AlertTriangle, CheckCircle2, ChevronRight, X, Menu } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

export const DashboardPage = () => {
  const { user, logout } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [deleteId, setDeleteId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const res = await api.get('/documents');
      return res.data;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/documents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setDeleteId(null);
    }
  });

  // Calculate stats
  const totalDocuments = documents.length;
  const analysedDocuments = documents.filter(d => d.status === 'ready').length;
  
  const analysedWithScores = documents.filter(d => d.status === 'ready' && d.riskScore);
  const averageRiskScore = analysedWithScores.length 
    ? (analysedWithScores.reduce((acc, curr) => acc + curr.riskScore, 0) / analysedWithScores.length).toFixed(1)
    : '-';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Mobile Top Bar */}
      <div className="lg:hidden bg-slate-900 text-white p-4 flex justify-between items-center z-30 sticky top-0">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏛️</span>
          <span className="font-bold tracking-tight">LexAI</span>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 -mr-2 text-slate-300 hover:text-white">
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 lg:w-64 bg-slate-900 text-white flex flex-col justify-between p-6 
        transition-transform duration-300 ease-in-out lg:static lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div>
          <div className="hidden lg:flex items-center gap-2 mb-8">
            <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              <span className="text-primary-400">🏛️</span> LexAI
            </span>
          </div>
          
          <nav className="space-y-1.5">
            <Link to="/dashboard" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg bg-primary-600 text-white transition-all">
              <FileText className="w-4 h-4" />
              Documents
            </Link>
            {['Upload', 'Chat', 'Compare', 'Reports', 'Profile'].map((item) => (
              <Link 
                key={item} 
                to={`/${item.toLowerCase()}`} 
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
              >
                <Sparkles className="w-4 h-4 text-slate-500" />
                {item}
              </Link>
            ))}
          </nav>
        </div>

        <div className="border-t border-slate-800 pt-4 mt-6">
          <div className="flex items-center gap-3 px-4 py-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm shrink-0">
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

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto relative w-full overflow-x-hidden">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">My Documents</h1>
            <p className="text-slate-500 text-sm mt-1">{totalDocuments} documents · last updated today</p>
          </div>
          <div className="w-full sm:w-auto flex items-center gap-3">
            <Link to="/upload" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-500 text-white px-5 py-2.5 rounded-xl shadow-sm text-sm font-semibold transition-all">
              <Upload className="w-4 h-4" /> Upload Document
            </Link>
          </div>
        </header>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 w-full max-w-full">
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col relative overflow-hidden w-full">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <FileText className="w-16 h-16 text-primary-500" />
            </div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Documents</p>
            <div className="flex items-end justify-between">
              <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-800">{totalDocuments}</h3>
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col relative overflow-hidden w-full">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <CheckCircle2 className="w-16 h-16 text-emerald-500" />
            </div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Documents Analysed</p>
            <div className="flex items-end justify-between">
              <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-800">{analysedDocuments}</h3>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col relative overflow-hidden sm:col-span-2 lg:col-span-1 w-full">
             <div className="absolute top-0 right-0 p-4 opacity-10">
              <ShieldAlert className="w-16 h-16 text-rose-500" />
            </div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Average Risk Score</p>
            <div className="flex items-end justify-between">
              <h3 className={`text-3xl sm:text-4xl font-extrabold ${averageRiskScore >= 7 ? 'text-rose-600' : averageRiskScore >= 4 ? 'text-amber-500' : 'text-slate-800'}`}>{averageRiskScore}</h3>
              <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          </div>
        ) : documents.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-6 sm:p-12 text-center max-w-2xl mx-auto mt-6 sm:mt-12 flex flex-col items-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-primary-50 text-primary-500 flex items-center justify-center mb-4 sm:mb-6">
              <Upload className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2">Upload your first document</h2>
            <p className="text-slate-500 text-sm max-w-sm mb-6 sm:mb-8">
              Start analyzing your legal documents for risks, unusual clauses, and plain-english summaries.
            </p>
            <Link 
              to="/upload"
              className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-primary-500/20"
            >
              <Upload className="w-4 h-4" /> Browse Files
            </Link>
          </div>
        ) : (
          <div className="w-full">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Recent Documents</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 w-full">
              {documents.map((doc) => (
                <div key={doc._id} className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col relative group overflow-hidden">
                  <button 
                    onClick={(e) => { e.preventDefault(); setDeleteId(doc._id); }}
                    className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all z-10"
                    title="Delete document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div 
                    className="flex-1 cursor-pointer w-full"
                    onClick={() => doc.status === 'ready' && navigate(`/document/${doc._id}`)}
                  >
                    <div className="flex gap-3 sm:gap-4 mb-4 sm:mb-6 w-full">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                        <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div className="min-w-0 pr-8 flex-1">
                        <h4 className="font-semibold text-slate-900 truncate text-sm sm:text-base w-full" title={doc.fileName}>{doc.fileName}</h4>
                        <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-slate-500 mt-1 sm:mt-1.5 w-full truncate">
                          <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                          <span className="truncate">Uploaded {format(new Date(doc.createdAt), 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-4 sm:pt-5 border-t border-slate-100 flex items-center justify-between w-full">
                      <div className="flex items-center gap-2 sm:gap-3">
                        {doc.status === 'ready' ? (
                          <>
                            <div className="relative flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 shrink-0">
                              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                <path
                                  className="text-slate-100"
                                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                  fill="none" stroke="currentColor" strokeWidth="3"
                                />
                                <path
                                  className={doc.riskScore >= 7 ? 'text-rose-500' : doc.riskScore >= 4 ? 'text-amber-500' : 'text-emerald-500'}
                                  strokeDasharray={`${doc.riskScore * 10}, 100`}
                                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                  fill="none" stroke="currentColor" strokeWidth="3"
                                />
                              </svg>
                              <span className="absolute text-[10px] sm:text-xs font-bold text-slate-700">{doc.riskScore || '-'}</span>
                            </div>
                            <div className="text-[10px] sm:text-sm font-medium text-slate-600 truncate">Risk Score</div>
                          </>
                        ) : doc.status === 'scanned' ? (
                           <div className="text-[10px] sm:text-sm font-medium text-rose-500 flex items-center gap-1.5 truncate">
                            <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> Scanned
                           </div>
                        ) : (
                          <div className="text-[10px] sm:text-sm font-medium text-slate-500 flex items-center gap-1.5 sm:gap-2 truncate">
                            <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin shrink-0"></div>
                            Processing
                          </div>
                        )}
                      </div>
                      
                      <div className={`text-[10px] sm:text-xs font-semibold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md shrink-0 ${
                        doc.status === 'ready' ? 'bg-emerald-100 text-emerald-700' : 
                        doc.status === 'scanned' || doc.status === 'error' ? 'bg-rose-100 text-rose-700' : 
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl p-5 sm:p-6 max-w-sm w-full shadow-xl">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2">Delete Document?</h3>
            <p className="text-sm text-slate-500 mb-6">
              Are you sure you want to delete this document? This action cannot be undone and all associated AI insights will be lost.
            </p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                disabled={deleteMutation.isPending}
              >
                Cancel
              </button>
              <button 
                onClick={() => deleteMutation.mutate(deleteId)}
                className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors flex items-center gap-2"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
