import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// Routes Guarding
import ProtectedRoute from './components/routes/ProtectedRoute';
import PublicRoute from './components/routes/PublicRoute';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import UploadPage from './pages/UploadPage';
import DocumentPage from './pages/DocumentPage';
import ChatPage from './pages/ChatPage';
import ReportPage from './pages/ReportPage';
import ComparePage from './pages/ComparePage';
import ProfilePage from './pages/ProfilePage';
import SharePage from './pages/SharePage';

function App() {
  const { checkAuth, isLoading } = useAuthStore();

  // Run silent checkAuth on mount to retrieve session from cookie
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="relative flex items-center justify-center">
          <div className="absolute w-16 h-16 border-4 border-primary-100 rounded-full animate-ping"></div>
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="mt-6 text-slate-500 font-semibold text-sm tracking-wider uppercase animate-pulse">
          Starting LexAI...
        </p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes for guests only (will redirect to /dashboard if logged in) */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Landing Page is visible to all */}
        <Route path="/" element={<LandingPage />} />

        {/* Protected Routes (requires login, will redirect to /login if unauthenticated) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/document/:id" element={<DocumentPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/reports" element={<ReportPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/share" element={<SharePage />} />
        </Route>

        {/* Catch-all redirect to landing page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
