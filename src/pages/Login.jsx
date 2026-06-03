import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Eye, EyeOff, Loader2, Package } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import toast from 'react-hot-toast';
import { supabase } from '../supabase';
import useDocumentTitle from '../hooks/useDocumentTitle';

const Login = () => {
  useDocumentTitle('Login | Eraya');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]       = useState(false);

  // Forgot password views & states
  const [view, setView] = useState('login'); // 'login' | 'forgot' | 'reset'
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const { login, forgotPassword, resetPassword } = useAuthStore();
  const navigate   = useNavigate();
  const location   = useLocation();
  const from       = location.state?.from || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const role = await login(email, password);
      toast.success('Welcome back to Eraya!');
      setTimeout(() => {
        navigate(role === 'admin' || role === 'moderator' ? '/admin' : from, { replace: true });
      }, 400);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setResetLoading(true);
    try {
      await forgotPassword(forgotEmail);
      toast.success('Verification code sent to your email');
      setView('reset');
    } catch (error) {
      toast.error(error.response?.data?.error || error.response?.data || 'Failed to send reset code');
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetOtp || !newPassword || !confirmPassword) return;
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setResetLoading(true);
    try {
      const role = await resetPassword({
        email: forgotEmail,
        otp: resetOtp,
        password: newPassword
      });
      toast.success('Password reset successful! Welcome back.');
      setTimeout(() => {
        navigate(role === 'admin' || role === 'moderator' ? '/admin' : from, { replace: true });
      }, 400);
    } catch (error) {
      toast.error(error.response?.data?.error || error.response?.data || 'Failed to reset password');
    } finally {
      setResetLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResetLoading(true);
    try {
      await forgotPassword(forgotEmail);
      toast.success('Verification code resent to your email');
    } catch (error) {
      toast.error(error.response?.data?.error || error.response?.data || 'Failed to resend code');
    } finally {
      setResetLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + '/login' }
      });
      if (error) throw error;
    } catch (error) {
      toast.error(error.message);
    }
  };

  const inputStyle = {
    width: '100%', background: '#f8fafc', border: '1.5px solid #e8ecf0',
    borderRadius: '1rem', padding: '0.875rem 1rem 0.875rem 3rem',
    fontSize: '0.875rem', fontWeight: 600, color: '#0d1117',
    outline: 'none', fontFamily: "'Plus Jakarta Sans', sans-serif",
    transition: 'border-color .2s, box-shadow .2s',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      {/* Soft background orbs */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '40%', height: '40%', background: 'rgba(204,255,0,0.12)', borderRadius: '50%', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: '40%', height: '40%', background: 'rgba(59,130,246,0.10)', borderRadius: '50%', filter: 'blur(80px)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none', marginBottom: '0.75rem' }}>
            <div style={{ width: 42, height: 42, background: '#0d1117', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(0,0,0,0.15)' }}>
              <Package style={{ width: 20, height: 20, color: '#fff' }} />
            </div>
            <span style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '0.15em', color: '#0d1117' }}>Eraya</span>
          </Link>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', margin: 0 }}>Premium Lifestyle</p>
        </div>

        {/* Card */}
        <div style={{ background: '#fff', borderRadius: '2rem', border: '1px solid #eaeef2', boxShadow: '0 20px 60px -15px rgba(0,0,0,0.08)', padding: '2.5rem' }}>
          {view === 'login' && (
            <>
              <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0d1117', margin: '0 0 0.35rem', letterSpacing: '-0.03em' }}>Welcome Back</h1>
                <p style={{ fontSize: '0.85rem', fontWeight: 500, color: '#94a3b8', margin: 0 }}>Sign in to your Eraya account</p>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Email */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginBottom: '0.5rem' }}>
                    Email or Phone
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#94a3b8' }} />
                    <input
                      type="text" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="Enter email or phone" required style={inputStyle}
                      onFocus={e => { e.target.style.borderColor = '#0d1117'; e.target.style.boxShadow = '0 0 0 3px rgba(13,17,23,0.06)'; }}
                      onBlur={e => { e.target.style.borderColor = '#e8ecf0'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b' }}>Password</label>
                    <button type="button" onClick={() => { setForgotEmail(email); setView('forgot'); }} style={{ background: 'none', border: 'none', fontSize: '0.75rem', fontWeight: 700, color: '#3b82f6', cursor: 'pointer', padding: 0 }}>Forgot?</button>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Lock style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#94a3b8' }} />
                    <input
                      type={showPassword ? 'text' : 'password'} value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••" required style={{ ...inputStyle, paddingRight: '3rem' }}
                      onFocus={e => { e.target.style.borderColor = '#0d1117'; e.target.style.boxShadow = '0 0 0 3px rgba(13,17,23,0.06)'; }}
                      onBlur={e => { e.target.style.borderColor = '#e8ecf0'; e.target.style.boxShadow = 'none'; }}
                    />
                    <button type="button" onClick={() => setShowPassword(v => !v)}
                      style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, display: 'flex' }}>
                      {showPassword ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button type="submit" disabled={loading}
                  style={{ width: '100%', background: '#0d1117', color: '#fff', border: 'none', borderRadius: '1rem', padding: '1rem', fontSize: '0.85rem', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all .2s', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  onMouseEnter={e => !loading && (e.currentTarget.style.background = '#1e293b')}
                  onMouseLeave={e => e.currentTarget.style.background = '#0d1117'}
                >
                  {loading ? <Loader2 style={{ width: 16, height: 16, animation: 'spin 0.8s linear infinite' }} /> : <>Sign In <ArrowRight style={{ width: 16, height: 16 }} /></>}
                </button>
              </form>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.75rem 0' }}>
                <div style={{ flex: 1, height: 1, background: '#f1f5f9' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>or</span>
                <div style={{ flex: 1, height: 1, background: '#f1f5f9' }} />
              </div>

              {/* Google */}
              <button onClick={handleGoogle}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '0.875rem', background: '#f8fafc', border: '1.5px solid #eaeef2', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 700, color: '#374151', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif", transition: 'all .2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#eaeef2'; }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Continue with Google
              </button>

              <p style={{ textAlign: 'center', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', margin: '1.5rem 0 0' }}>
                New here?{' '}
                <Link to="/signup" style={{ color: '#0d1117', fontWeight: 800, textDecoration: 'none' }}>Create account →</Link>
              </p>
            </>
          )}

          {view === 'forgot' && (
            <>
              <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0d1117', margin: '0 0 0.35rem', letterSpacing: '-0.03em' }}>Reset Password</h1>
                <p style={{ fontSize: '0.85rem', fontWeight: 500, color: '#94a3b8', margin: 0 }}>Enter your email to request a reset code</p>
              </div>

              <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginBottom: '0.5rem' }}>Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#94a3b8' }} />
                    <input
                      type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                      placeholder="name@example.com" required style={inputStyle}
                      onFocus={e => { e.target.style.borderColor = '#0d1117'; e.target.style.boxShadow = '0 0 0 3px rgba(13,17,23,0.06)'; }}
                      onBlur={e => { e.target.style.borderColor = '#e8ecf0'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                </div>

                <button type="submit" disabled={resetLoading}
                  style={{ width: '100%', background: '#0d1117', color: '#fff', border: 'none', borderRadius: '1rem', padding: '1rem', fontSize: '0.85rem', fontWeight: 800, cursor: resetLoading ? 'not-allowed' : 'pointer', opacity: resetLoading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all .2s', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {resetLoading ? <Loader2 style={{ width: 16, height: 16, animation: 'spin 0.8s linear infinite' }} /> : <>Send Reset Code <ArrowRight style={{ width: 16, height: 16 }} /></>}
                </button>
              </form>

              <p style={{ textAlign: 'center', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', margin: '1.5rem 0 0' }}>
                Remember your password?{' '}
                <button type="button" onClick={() => setView('login')} style={{ background: 'none', border: 'none', color: '#0d1117', fontWeight: 800, cursor: 'pointer', padding: 0 }}>Back to Login</button>
              </p>
            </>
          )}

          {view === 'reset' && (
            <>
              <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0d1117', margin: '0 0 0.35rem', letterSpacing: '-0.03em' }}>Verify Reset</h1>
                <p style={{ fontSize: '0.85rem', fontWeight: 500, color: '#94a3b8', margin: 0 }}>We've sent a 6-digit code to {forgotEmail}</p>
              </div>

              <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Code */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginBottom: '0.5rem' }}>Verification Code (OTP)</label>
                  <input
                    type="text" maxLength={6} value={resetOtp} onChange={e => setResetOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit code" required style={{ ...inputStyle, paddingLeft: '1rem', letterSpacing: resetOtp ? '6px' : 'normal', textAlign: 'center' }}
                    onFocus={e => { e.target.style.borderColor = '#0d1117'; e.target.style.boxShadow = '0 0 0 3px rgba(13,17,23,0.06)'; }}
                    onBlur={e => { e.target.style.borderColor = '#e8ecf0'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>

                {/* Password */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginBottom: '0.5rem' }}>New Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#94a3b8' }} />
                    <input
                      type={showNewPassword ? 'text' : 'password'} value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Min 6 characters" required style={{ ...inputStyle, paddingRight: '3rem' }}
                      onFocus={e => { e.target.style.borderColor = '#0d1117'; e.target.style.boxShadow = '0 0 0 3px rgba(13,17,23,0.06)'; }}
                      onBlur={e => { e.target.style.borderColor = '#e8ecf0'; e.target.style.boxShadow = 'none'; }}
                    />
                    <button type="button" onClick={() => setShowNewPassword(v => !v)}
                      style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, display: 'flex' }}>
                      {showNewPassword ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginBottom: '0.5rem' }}>Confirm New Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#94a3b8' }} />
                    <input
                      type={showNewPassword ? 'text' : 'password'} value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password" required style={inputStyle}
                      onFocus={e => { e.target.style.borderColor = '#0d1117'; e.target.style.boxShadow = '0 0 0 3px rgba(13,17,23,0.06)'; }}
                      onBlur={e => { e.target.style.borderColor = '#e8ecf0'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                </div>

                <button type="submit" disabled={resetLoading}
                  style={{ width: '100%', background: '#0d1117', color: '#fff', border: 'none', borderRadius: '1rem', padding: '1rem', fontSize: '0.85rem', fontWeight: 800, cursor: resetLoading ? 'not-allowed' : 'pointer', opacity: resetLoading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all .2s', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {resetLoading ? <Loader2 style={{ width: 16, height: 16, animation: 'spin 0.8s linear infinite' }} /> : <>Reset & Sign In <ArrowRight style={{ width: 16, height: 16 }} /></>}
                </button>

                <button type="button" onClick={handleResendCode} disabled={resetLoading} style={{ background: 'none', border: 'none', fontSize: '0.75rem', fontWeight: 700, color: '#3b82f6', cursor: 'pointer', padding: 0, marginTop: '0.5rem' }}>
                  Resend Verification Code
                </button>
              </form>

              <p style={{ textAlign: 'center', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', margin: '1.5rem 0 0' }}>
                <button type="button" onClick={() => setView('login')} style={{ background: 'none', border: 'none', color: '#0d1117', fontWeight: 800, cursor: 'pointer', padding: 0 }}>Back to Login</button>
              </p>
            </>
          )}
        </div>

        {/* Security badge */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ width: 6, height: 6, background: '#22c55e', borderRadius: '50%' }} />
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8' }}>AES-256 Secure</span>
          </div>
          <div style={{ width: 1, height: 12, background: '#e2e8f0' }} />
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8' }}>© 2026 Eraya</span>
        </div>
      </motion.div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Login;
