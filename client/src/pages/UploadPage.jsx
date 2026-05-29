import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, AlertTriangle, FileText, CheckCircle2, ChevronRight, LogOut, Sparkles, Trash2, Menu } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';
import { useQuery } from '@tanstack/react-query';

export const UploadPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | uploading | analysing | scanned_error | error
  const [uploadProgress, setUploadProgress] = useState(0);
  const [docId, setDocId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 1
  });

  const handleUpload = async () => {
    if (!file) return;
    
    setStatus('uploading');
    setUploadProgress(0);
    setErrorMessage('');
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });
      
      const uploadedDocId = res.data.document.id;
      setDocId(uploadedDocId);
      setStatus('analysing');
      
      // Fire and forget analyse endpoint, let polling check the status
      api.post(`/documents/${uploadedDocId}/analyse`).catch(err => console.error(err));
      
    } catch (error) {
      if (error.response?.status === 422 && error.response?.data?.document?.status === 'scanned') {
        setStatus('scanned_error');
        setDocId(error.response.data.document.id);
      } else {
        setStatus('error');
        setErrorMessage(error.response?.data?.message || 'Failed to upload document.');
      }
    }
  };

  const { data: pollData } = useQuery({
    queryKey: ['documentStatus', docId],
    queryFn: async () => {
      const res = await api.get(`/documents/${docId}/status`);
      return res.data;
    },
    enabled: status === 'analysing' && !!docId,
    refetchInterval: (query) => {
      const docStatus = query?.state?.data?.status;
      if (docStatus === 'ready' || docStatus === 'error' || docStatus === 'scanned') {
        return false;
      }
      return 3000;
    }
  });

  useEffect(() => {
    if (pollData?.status === 'ready') {
      navigate(`/document/${docId}`);
    } else if (pollData?.status === 'error') {
      setStatus('error');
      setErrorMessage('Analysis failed. Please try again.');
    } else if (pollData?.status === 'scanned') {
      setStatus('scanned_error');
    }
  }, [pollData, navigate, docId]);

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
            <Link to="/dashboard" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
              <FileText className="w-4 h-4 text-slate-500" />
              Documents
            </Link>
            <Link to="/upload" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg bg-primary-600 text-white transition-all">
              <Upload className="w-4 h-4" />
              Upload
            </Link>
            {['Chat', 'Compare', 'Reports', 'Profile'].map((item) => (
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
          <button onClick={logout} className="w-full flex items-center justify-center gap-2.5 px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-950/20 hover:text-red-300 rounded-lg transition-all">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col p-4 sm:p-6 md:p-8 overflow-y-auto w-full overflow-x-hidden">
        <header className="mb-8 sm:mb-12 text-center max-w-2xl mx-auto pt-6 sm:pt-12 px-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight text-[#003B73]">Upload a Document</h1>
          <p className="text-slate-500 mt-2 sm:mt-3 text-base sm:text-lg">Upload a PDF contract or legal document to begin AI analysis</p>
        </header>

        <div className="flex-1 flex items-start justify-center w-full">
          <div className="w-full max-w-2xl px-2">
            {(status === 'idle' || status === 'uploading') && (
              <div className="bg-white rounded-3xl sm:rounded-[2rem] border border-slate-100 shadow-sm p-6 sm:p-12 w-full">
                {!file ? (
                  <div 
                    {...getRootProps()} 
                    className={`border-2 border-dashed rounded-3xl p-8 sm:p-16 text-center cursor-pointer transition-all w-full ${
                      isDragActive ? 'border-primary-500 bg-primary-50' : 'border-slate-200 hover:border-primary-400 hover:bg-slate-50'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 text-[#003B73] rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                      <Upload className="w-8 h-8 sm:w-10 sm:h-10" />
                    </div>
                    <p className="text-lg sm:text-xl font-bold text-slate-900 mb-2">Drag and drop your PDF here</p>
                    <div className="flex items-center justify-center gap-4 my-4 sm:my-6">
                      <div className="h-px w-12 sm:w-16 bg-slate-200"></div>
                      <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">OR</span>
                      <div className="h-px w-12 sm:w-16 bg-slate-200"></div>
                    </div>
                    <button className="px-5 py-2 sm:px-6 sm:py-2.5 border border-[#003B73] text-[#003B73] font-semibold rounded-lg hover:bg-slate-50 transition-colors text-sm sm:text-base w-full sm:w-auto">
                      Browse Files
                    </button>
                    <p className="text-[10px] sm:text-xs font-medium text-slate-400 mt-4 sm:mt-6">PDF only · Maximum 10MB</p>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-3xl p-5 sm:p-8 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 mb-6 sm:mb-8">
                      <div className="flex items-center gap-4 sm:gap-5 flex-1 min-w-0">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-primary-50 flex items-center justify-center shrink-0">
                          <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-base sm:text-lg font-bold text-slate-900 truncate">{file.name}</p>
                          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                      </div>
                      {status === 'idle' && (
                        <button onClick={() => setFile(null)} className="p-2 sm:p-2.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-xl transition-colors shrink-0 self-end sm:self-auto">
                          <X className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      )}
                    </div>
                    
                    {status === 'uploading' ? (
                      <div>
                        <div className="flex justify-between text-xs sm:text-sm font-semibold mb-2">
                          <span className="text-primary-700">Uploading...</span>
                          <span className="text-slate-500">{uploadProgress}%</span>
                        </div>
                        <div className="h-2 sm:h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary-500 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    ) : (
                      <button 
                        onClick={handleUpload}
                        className="w-full py-3 sm:py-4 bg-primary-600 hover:bg-primary-500 text-white text-base sm:text-lg font-semibold rounded-xl transition-all shadow-lg shadow-primary-500/25 flex items-center justify-center gap-2"
                      >
                        Analyze Document <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    )}
                  </div>
                )}
                
                {fileRejections.length > 0 && (
                  <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start sm:items-center gap-3 text-rose-700 text-xs sm:text-sm font-medium">
                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 mt-0.5 sm:mt-0" />
                    <p>Only PDF files under 10MB are allowed.</p>
                  </div>
                )}
              </div>
            )}

            {status === 'analysing' && (
              <div className="bg-white rounded-3xl sm:rounded-[2rem] border border-slate-100 shadow-sm p-8 sm:p-16 text-center w-full mx-auto flex flex-col items-center">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-slate-50 flex items-center justify-center mb-6 sm:mb-8 relative">
                   <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-[#003B73]" />
                   <Sparkles className="w-5 h-5 sm:w-6 h-6 text-emerald-500 absolute top-3 right-3 sm:top-4 sm:right-4" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-4 sm:mb-6">Analysing your document ...</h2>
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-xs sm:text-sm font-medium">
                  <div className="flex items-center gap-1.5 text-[#007074]">
                    <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></div> Detecting clauses
                  </div>
                  <span className="hidden sm:block text-slate-300">•</span>
                  <div className="flex items-center gap-1.5 text-[#007074]">
                    Identifying risks
                  </div>
                  <span className="hidden sm:block text-slate-300">•</span>
                  <div className="flex items-center gap-1.5 text-[#007074]">
                    Generating summaries
                  </div>
                </div>
              </div>
            )}

            {status === 'scanned_error' && (
              <div className="bg-white rounded-3xl sm:rounded-[2rem] border border-slate-100 shadow-sm p-6 sm:p-12 text-center w-full mx-auto">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <AlertTriangle className="w-8 h-8 sm:w-10 sm:h-10" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 sm:mb-4">Scanned PDF Detected</h2>
                <p className="text-sm sm:text-base text-slate-500 mb-6 sm:mb-8 leading-relaxed">
                  This document appears to be an image-based scan. Please upload a text-based PDF for accurate AI processing and insight generation.
                </p>
                
                <div className="bg-slate-50 rounded-xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8 text-left border border-slate-100 w-full overflow-hidden">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-lg flex items-center justify-center shadow-sm shrink-0">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">{file?.name || 'scanned_document.pdf'}</p>
                    <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 truncate">{file ? (file.size / (1024 * 1024)).toFixed(2) : '4.2'} MB • Unreadable Format</p>
                  </div>
                  <button onClick={() => setStatus('idle')} className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-500 hover:bg-white rounded-lg shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <button 
                  onClick={() => { setFile(null); setStatus('idle'); }}
                  className="w-full sm:w-auto px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl text-sm transition-all"
                >
                  Upload New Document
                </button>
              </div>
            )}

            {status === 'error' && (
              <div className="bg-white rounded-3xl sm:rounded-[2rem] border border-rose-100 shadow-sm p-6 sm:p-12 text-center w-full mx-auto">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <X className="w-8 h-8 sm:w-10 sm:h-10" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 sm:mb-4">Upload Failed</h2>
                <p className="text-sm sm:text-base text-slate-500 mb-6 sm:mb-8">{errorMessage}</p>
                <button 
                  onClick={() => { setFile(null); setStatus('idle'); }}
                  className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-sm transition-all"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
        
        {(status === 'idle' || status === 'uploading') && (
          <div className="mt-auto pt-8 sm:pt-12 flex justify-center pb-2 sm:pb-4 w-full px-2">
            <div className="bg-slate-100/50 backdrop-blur border border-slate-200/50 rounded-xl px-4 sm:px-5 py-2.5 sm:py-3 flex items-start gap-2.5 sm:gap-3 max-w-md w-full">
              <div className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 text-[#007074] shrink-0 text-sm">ℹ️</div>
              <p className="text-[10px] sm:text-xs font-medium text-slate-600 leading-relaxed">
                Uploaded documents are securely processed and temporarily stored for active analysis sessions only.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default UploadPage;
