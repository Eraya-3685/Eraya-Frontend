import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

/**
 * Protects admin routes.
 * - No token → /login
 * - token but user not loaded yet → fetch profile
 * - user.role not in allowedRoles → / (store home)
 */
const AdminGuard = ({ children, allowedRoles = ['admin'] }) => {
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
  }, [token, user, fetchProfile, navigate]);

  useEffect(() => {
    if (user) {
      const isAllowed = allowedRoles.some(role => role.toLowerCase() === user.role.toLowerCase());
      if (!isAllowed) {
        navigate('/'); // Role not allowed → back to store
      }
    }
  }, [user, allowedRoles, navigate]);

  // No need for a separate loader here, RootAuthHandler handles it.
  // If we reach here and user is null, just return null until RootAuthHandler or fetchProfile finishes.
  const isAllowed = user && allowedRoles.some(role => role.toLowerCase() === user.role.toLowerCase());

  if (!user) return null;

  if (!isAllowed) return null;

  return children;
};

export default AdminGuard;
