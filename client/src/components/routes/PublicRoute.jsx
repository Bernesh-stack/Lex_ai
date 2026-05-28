import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export const PublicRoute = () => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="relative flex items-center justify-center">
          <div className="absolute w-16 h-16 border-4 border-primary-100 rounded-full animate-ping"></div>
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="mt-6 text-slate-500 font-medium text-sm tracking-wider uppercase animate-pulse">
          Securing session...
        </p>
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />;
};

export default PublicRoute;
