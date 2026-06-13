import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';
import { Document, Page, pdfjs } from 'react-pdf';
import { AlertCircle, ArrowLeft, Bot, FileText, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import clsx from 'clsx';

// Configure PDF worker to use local or CDN
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const ClauseCard = ({ clause }) => {
  const [showOriginal, setShowOriginal] = useState(false);
  const riskColor = clause.finalRiskLevel === 'high' ? 'border-red-500' : 
                    clause.finalRiskLevel === 'medium' ? 'border-amber-500' : 
                    'border-emerald-500';

  const riskBadge = clause.finalRiskLevel === 'high' ? 'bg-red-100 text-red-700' : 
                    clause.finalRiskLevel === 'medium' ? 'bg-amber-100 text-amber-700' : 
                    'bg-emerald-100 text-emerald-700';

  return (
    <div className={clsx("rounded-xl border-l-4 p-5 shadow-sm bg-white border-t border-r border-b border-slate-100 mb-4 transition-all hover:shadow-md", riskColor)}>
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-slate-800 text-lg leading-tight">{clause.clauseTitle}</h3>
        <span className={clsx("px-2.5 py-1 rounded-full text-xs font-medium uppercase tracking-wider", riskBadge)}>
          {clause.finalRiskLevel} Risk
        </span>
      </div>
      
      <div className="text-slate-600 text-sm mb-4 leading-relaxed whitespace-pre-wrap">
        {showOriginal ? clause.originalText : clause.simplifiedText}
      </div>
      
      {clause.triggeredKeywords?.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {clause.triggeredKeywords.map((kw, i) => (
            <span key={i} className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium border border-slate-200">
              {kw}
            </span>
          ))}
        </div>
      )}

      <div className="flex justify-between items-center pt-3 border-t border-slate-100">
        <button 
          onClick={() => setShowOriginal(!showOriginal)}
          className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors"
        >
          {showOriginal ? 'Show Simplified Summary' : 'Show Original Clause'}
        </button>
      </div>
    </div>
  );
};

export const DocumentPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { accessToken } = useAuthStore();
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['document', id],
    queryFn: async () => {
      const res = await api.get(`/documents/${id}`);
      return res.data;
    }
  });

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const documentUrl = `${api.defaults.baseURL}/documents/${id}/file`;
  const pdfFile = { url: documentUrl, httpHeaders: { Authorization: `Bearer ${accessToken}` } };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Sticky Header Skeleton */}
        <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-slate-200 rounded-full animate-pulse"></div>
            <div className="w-48 h-6 bg-slate-200 rounded animate-pulse"></div>
          </div>
          <div className="flex gap-3">
             <div className="w-24 h-9 bg-slate-200 rounded-lg animate-pulse"></div>
             <div className="w-24 h-9 bg-slate-200 rounded-lg animate-pulse"></div>
             <div className="w-24 h-9 bg-slate-200 rounded-lg animate-pulse"></div>
             <div className="w-24 h-9 bg-slate-800/20 rounded-lg animate-pulse"></div>
          </div>
        </div>
        {/* Layout Skeleton */}
        <div className="flex flex-1 overflow-hidden">
          <div className="w-[45%] bg-slate-200/50 p-6 flex justify-center">
            <div className="w-full max-w-lg bg-white h-[800px] shadow-sm rounded-lg animate-pulse"></div>
          </div>
          <div className="w-[55%] bg-slate-50 p-6 overflow-y-auto">
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="w-full h-32 bg-white rounded-2xl mb-6 shadow-sm border border-slate-100 animate-pulse"></div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-32 h-6 bg-slate-200 rounded animate-pulse"></div>
                <div className="w-24 h-4 bg-slate-200 rounded animate-pulse"></div>
              </div>
              {[1, 2, 3].map(i => (
                <div key={i} className="w-full h-48 bg-white rounded-xl mb-4 shadow-sm border border-slate-100 animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !data?.document) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Failed to load analysis</h1>
          <p className="text-slate-500 text-sm mb-6">We couldn't fetch the document details. Please try again.</p>
          <button onClick={() => refetch()} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { document, clauses } = data;
  
  // Calculate risk percentages or use provided riskScore
  const getRiskLabel = (score) => {
    if (score >= 8) return { label: 'High Risk', color: 'text-red-600', bg: 'bg-red-500' };
    if (score >= 5) return { label: 'Medium Risk', color: 'text-amber-600', bg: 'bg-amber-500' };
    return { label: 'Low Risk', color: 'text-emerald-600', bg: 'bg-emerald-500' };
  };
  
  const riskInfo = getRiskLabel(document.riskScore || 1);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col h-screen overflow-hidden">
      {/* Sticky Top Bar */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-slate-100 rounded-full transition-colors group">
            <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-slate-800" />
          </button>
          <div className="h-6 w-px bg-slate-200"></div>
          <h1 className="font-semibold text-slate-800 text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-500" />
            {document.fileName}
          </h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button 
            onClick={() => navigate(`/chat/${id}`)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-semibold hover:bg-indigo-100 transition-colors"
            title="Ask AI"
          >
            <Bot className="w-4 h-4" /> <span className="hidden sm:inline">Ask AI</span>
          </button>
          <button 
            onClick={() => navigate(`/reports/${id}`)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
            title="Risk Report"
          >
            <FileText className="w-4 h-4 sm:hidden" /> <span className="hidden sm:inline">Risk Report</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Left Panel: PDF Viewer (45%) */}
        <div className="w-full md:w-[45%] bg-slate-100/50 flex flex-col border-b md:border-b-0 md:border-r border-slate-200 h-1/2 md:h-full relative overflow-hidden shrink-0">
          <div className="flex-1 overflow-auto flex justify-center p-6 bg-slate-200/40 custom-scrollbar">
            <Document
              file={pdfFile}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={
                <div className="flex flex-col items-center justify-center h-full text-slate-500 min-h-[500px]">
                  <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
                  <p className="text-sm font-medium">Loading document...</p>
                </div>
              }
              error={
                <div className="flex flex-col items-center justify-center h-full text-red-500 min-h-[500px] bg-white p-8 rounded-xl shadow-sm border border-red-100">
                  <AlertCircle className="w-10 h-10 mb-4 text-red-400" />
                  <p className="font-medium text-slate-800 mb-1">Failed to load PDF</p>
                  <p className="text-sm text-slate-500">The file might be corrupted or unavailable.</p>
                </div>
              }
              className="pdf-document drop-shadow-md"
            >
              <Page 
                pageNumber={pageNumber} 
                className="bg-white transition-all rounded" 
                renderTextLayer={false} 
                renderAnnotationLayer={false}
                width={550}
              />
            </Document>
          </div>
          {/* PDF Controls */}
          {numPages && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md px-2 py-2 rounded-full shadow-lg border border-slate-200 flex items-center gap-2 z-10">
              <button 
                disabled={pageNumber <= 1}
                onClick={() => setPageNumber(prev => Math.max(prev - 1, 1))}
                className="p-1.5 rounded-full hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors text-slate-600"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm font-semibold text-slate-700 min-w-[4rem] text-center">
                {pageNumber} <span className="text-slate-400 font-normal">/ {numPages}</span>
              </span>
              <button 
                disabled={pageNumber >= numPages}
                onClick={() => setPageNumber(prev => Math.min(prev + 1, numPages))}
                className="p-1.5 rounded-full hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors text-slate-600"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Right Panel: Analysis (55%) */}
        <div className="w-full md:w-[55%] bg-slate-50 p-4 sm:p-8 overflow-y-auto h-1/2 md:h-full custom-scrollbar">
          <div className="max-w-3xl mx-auto space-y-8 pb-20">
            
            {/* Overall Risk Score Card */}
            <div className="bg-white p-7 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between relative overflow-hidden">
              <div className="relative z-10">
                <h2 className="text-slate-500 font-bold mb-2 text-xs uppercase tracking-widest">Overall Risk Score</h2>
                <div className="flex items-baseline gap-2">
                  <span className={clsx("text-5xl font-extrabold tracking-tight", riskInfo.color)}>
                    {document.riskScore || 1}
                  </span>
                  <span className="text-slate-400 text-xl font-medium">/ 10</span>
                </div>
              </div>
              <div className="text-right relative z-10">
                <div className={clsx("inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold text-white mb-2 shadow-sm", riskInfo.bg)}>
                  {riskInfo.label}
                </div>
                <p className="text-sm text-slate-500 font-medium">Based on {clauses?.length || 0} analysed clauses</p>
              </div>
              {/* Decorative background element */}
              <div className={clsx("absolute -right-6 -top-6 w-32 h-32 rounded-full opacity-10 blur-2xl pointer-events-none", riskInfo.bg)}></div>
            </div>

            {/* Clauses List */}
            <div className="space-y-5">
              <div className="flex items-end justify-between mb-4 px-1">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Clause Analysis</h2>
                  <p className="text-sm text-slate-500 mt-1">Review AI-simplified summaries and risk assessments</p>
                </div>
                <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-sm text-slate-600 font-medium shadow-sm">
                  {clauses?.length || 0} Detected
                </span>
              </div>
              
              {clauses?.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {clauses.map((clause, idx) => (
                    <ClauseCard key={clause._id || idx} clause={clause} />
                  ))}
                </div>
              ) : (
                <div className="text-center p-16 bg-white rounded-2xl border border-dashed border-slate-200">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-1">No clauses found</h3>
                  <p className="text-slate-500 max-w-sm mx-auto">We couldn't detect any specific clauses to analyze in this document.</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
export default DocumentPage;
