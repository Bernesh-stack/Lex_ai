import React from 'react';
import { useParams } from 'react-router-dom';

export const DocumentPage = () => {
  const { id } = useParams();
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-center max-w-md">
        <span className="text-4xl">📄</span>
        <h1 className="text-2xl font-bold text-slate-800 mt-4">Document Details</h1>
        <p className="text-slate-500 text-sm mt-2">Viewing document: {id}. Analysis details coming soon!</p>
        <a href="/dashboard" className="inline-block mt-6 text-sm font-semibold text-primary-500 hover:text-primary-600">Back to Dashboard</a>
      </div>
    </div>
  );
};

export default DocumentPage;
