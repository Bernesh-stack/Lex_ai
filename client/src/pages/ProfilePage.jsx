import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import api from '../api/axios';
import { User, Lock, Trash2, LogOut, FileText, AlertTriangle, Activity, ShieldAlert, ArrowLeft } from 'lucide-react';

export const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Fetch documents for usage stats
  const { data: documents = [] } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const res = await api.get('/documents');
      return res.data;
    }
  });

  const stats = {
    totalDocs: documents.length,
    analyzedDocs: documents.filter(d => d.status === 'ready').length,
    avgRisk: documents.filter(d => d.status === 'ready' && d.riskScore).length > 0 
      ? (documents.reduce((acc, curr) => acc + (curr.riskScore || 0), 0) / documents.filter(d => d.status === 'ready' && d.riskScore).length).toFixed(1)
      : 0
  };

  // Mutations
  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      await api.put('/users/me', { name, email });
    },
    onSuccess: () => {
      alert('Profile updated successfully!');
      // A quick reload to re-fetch the user into the auth store, or we could update zustand manually
      window.location.reload(); 
    },
    onError: (err) => {
      alert(err.response?.data?.message || 'Update failed');
    }
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async () => {
      await api.put('/users/me/password', { currentPassword, newPassword });
    },
    onSuccess: () => {
      alert('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
    },
    onError: (err) => {
      alert(err.response?.data?.message || 'Password update failed');
    }
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      await api.delete('/users/me');
    },
    onSuccess: () => {
      logout();
      navigate('/login');
    },
    onError: (err) => {
      alert(err.response?.data?.message || 'Account deletion failed');
      setShowDeleteModal(false);
    }
  });

  const handleUpdateProfile = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate();
  };

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;
    updatePasswordMutation.mutate();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative">
      <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 shrink-0 z-10 sticky top-0 shadow-sm">
        <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-slate-100 rounded-full transition-colors group mr-4">
          <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-slate-800" />
        </button>
        <h1 className="font-semibold text-slate-800 text-lg flex items-center gap-2">
          <User className="w-5 h-5 text-indigo-500" />
          Profile Settings
        </h1>
      </header>

      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Left Column: Forms */}
          <div className="md:col-span-2 space-y-8">
            
            {/* Profile Info Form */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-lg">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Account Details</h2>
                  <p className="text-sm text-slate-500">Update your personal information.</p>
                </div>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors"
                  />
                </div>
                <div className="pt-2">
                  <button 
                    type="submit"
                    disabled={updateProfileMutation.isPending || (name === user?.name && email === user?.email)}
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:hover:bg-indigo-600 shadow-sm"
                  >
                    {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>

            {/* Change Password Form */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                <Lock className="w-5 h-5 text-slate-600" />
                <h2 className="text-lg font-bold text-slate-800">Change Password</h2>
              </div>

              <form onSubmit={handleUpdatePassword} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors"
                  />
                </div>
                <div className="pt-2">
                  <button 
                    type="submit"
                    disabled={updatePasswordMutation.isPending || !currentPassword || !newPassword}
                    className="px-6 py-2.5 bg-slate-800 text-white rounded-xl font-semibold hover:bg-slate-900 transition-colors disabled:opacity-50 disabled:hover:bg-slate-800 shadow-sm"
                  >
                    {updatePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column: Stats & Danger Zone */}
          <div className="space-y-8">
            
            {/* Usage Stats */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                <Activity className="w-5 h-5 text-indigo-500" />
                <h2 className="text-base font-bold text-slate-800">Usage Statistics</h2>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2 text-slate-600">
                    <FileText className="w-4 h-4" />
                    <span className="text-sm font-medium">Total Uploads</span>
                  </div>
                  <span className="font-bold text-slate-800">{stats.totalDocs}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-emerald-50/50 rounded-lg">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <ShieldAlert className="w-4 h-4" />
                    <span className="text-sm font-medium">Analyzed</span>
                  </div>
                  <span className="font-bold text-emerald-700">{stats.analyzedDocs}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-amber-50/50 rounded-lg">
                  <div className="flex items-center gap-2 text-amber-700">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm font-medium">Avg Risk Score</span>
                  </div>
                  <span className="font-bold text-amber-700">{stats.avgRisk} / 10</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>

              <button 
                onClick={() => setShowDeleteModal(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 border border-red-100 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition-colors shadow-sm"
              >
                <Trash2 className="w-4 h-4" /> Delete Account
              </button>
            </div>
          </div>

        </div>
      </main>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="bg-white p-8 rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 text-center mb-2">Delete Account?</h3>
            <p className="text-slate-500 text-center text-sm mb-6 leading-relaxed">
              Are you absolutely sure you want to delete your account? This action cannot be undone and will permanently delete all your uploaded documents, analyses, and data.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteAccountMutation.isPending}
                className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={() => deleteAccountMutation.mutate()}
                disabled={deleteAccountMutation.isPending}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 shadow-sm"
              >
                {deleteAccountMutation.isPending ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
