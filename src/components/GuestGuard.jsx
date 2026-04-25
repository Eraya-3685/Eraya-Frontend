import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

/**
 * GuestGuard prevents authenticated users from accessing 
 * authentication-related pages like Login and Signup.
 */
const GuestGuard = ({ children }) => {
  const { token } = useAuthStore();
  
  if (token) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default GuestGuard;
