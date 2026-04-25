import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

/**
 * Protects admin routes.
 * - No token → /login
 * - token but user not loaded yet → fetch profile
 * - user.role !== 'admin' → / (store home)
 */
const AdminGuard = ({ children }) => {
  const { user, token, fetchProfile } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    if (!user) {
      fetchProfile();
    }
  }, [token]);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/'); // Buyer tried to access admin → back to store
    }
  }, [user]);

  // Loading
  if (!user) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-slate-900">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
        <p className="text-white/40 text-sm font-medium">Verifying access...</p>
      </div>
    );
  }

  if (user.role !== 'admin') return null;

  return children;
};

export default AdminGuard;
