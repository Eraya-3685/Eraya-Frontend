import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, RefreshCcw, AlertCircle, ShieldCheck, ChevronLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import SegmentedOTPInput from '../components/SegmentedOTPInput';
import ErrorMsg from '../components/ErrorMsg';
import Logo from '../components/Logo';
import toast from 'react-hot-toast';
import useDocumentTitle from '../hooks/useDocumentTitle';

const Login = () => {
  useDocumentTitle('Login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [resetEmail, setResetEmail] = useState('');
  const [resetData, setResetData] = useState({ otp: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [unverifiedUserId, setUnverifiedUserId] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [activationOtp, setActivationOtp] = useState('');

  const { login, verifySignup, resendActivationOTP, forgotPassword, resetPassword, loading } = useAuthStore();
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    const { supabase } = await import('../supabase');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
    if (error) toast.error(error.message);
  };

  const validateLogin = () => {
    const newErrors = {};
    if (!identifier) newErrors.identifier = 'Email or phone required';
    if (!password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateLogin()) return;
    try {
      const role = await login(identifier, password);
      toast.success('Welcome back!');

      const roleLower = role?.toLowerCase()?.trim();
      if (roleLower === 'admin' || roleLower === 'moderator') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (error) {
      let serverMsg = error.response?.data?.error || error.response?.data || 'Login failed';
      const msgLower = serverMsg.toLowerCase();

      // Check for unverified account with ID
      const idMatch = serverMsg.match(/\[ID:(\d+)\]/);
      if (idMatch) {
        setUnverifiedUserId(idMatch[1]);
        serverMsg = serverMsg.replace(/\[ID:\d+\]/, '').trim();
      }
      
      if (msgLower.includes('password') || msgLower.includes('incorrect')) {
        setErrors({ password: serverMsg });
      } else {
        setErrors({ identifier: serverMsg });
      }
    }
  };

  const handleActivationVerify = async (e) => {
    e.preventDefault();
    if (activationOtp.length < 6) {
      toast.error('Please enter 6-digit code');
      return;
    }

    try {
      const role = await verifySignup(Number(unverifiedUserId), activationOtp);
      toast.success('Account verified successfully! You are now logged in.');
      
      const roleLower = role?.toLowerCase()?.trim();
      if (roleLower === 'admin' || roleLower === 'moderator') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || error.response?.data || 'Verification failed');
    }
  };

  const handleForgotRequest = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      setErrors({ resetEmail: 'Email address is required' });
      return;
    }
    try {
      await forgotPassword(resetEmail);
      toast.success('Reset code sent!');
      setResetStep(2);
      setErrors({});
    } catch (error) {
      toast.error('Failed to send reset code');
    }
  };

  const validateReset = () => {
    const newErrors = {};
    if (!resetData.otp || resetData.otp.length < 6) newErrors.otp = '6-digit code required';
    if (resetData.password.length < 6) newErrors.password = 'Min 6 characters required';
    if (resetData.password !== resetData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!validateReset()) return;
    try {
      const role = await resetPassword({
        email: resetEmail,
        otp: resetData.otp,
        password: resetData.password
      });
      const roleLower = role?.toLowerCase()?.trim();
      toast.success('Password reset successful! Welcome back.');
      navigate((roleLower === 'admin' || roleLower === 'moderator') ? '/admin' : '/');
      setErrors({});
    } catch (error) {
      const msg = error.response?.data;
      if (typeof msg === 'string' && msg.includes('same as the old one')) {
        setErrors({ password: 'New password cannot be the same as your old one' });
      } else {
        toast.error(msg || 'Reset failed');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 relative overflow-hidden">

      {/* Background Accents */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] -translate-y-1/2 translate-x-1/2 rounded-full" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/5 blur-[100px] translate-y-1/2 -translate-x-1/2 rounded-full" />

      {/* Brand */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-6 z-10 text-center flex flex-col items-center"
      >
        <div className="w-56 h-56 rounded-full bg-white shadow-2xl shadow-slate-200/50 border-8 border-white flex items-center justify-center overflow-hidden group mb-4 ring-1 ring-slate-200/50">
          <img 
            src="/assets/logo.png" 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
            alt="Eraya Brand" 
          />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        <div className="bg-white p-8 md:p-10 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
          <AnimatePresence mode="wait">
            {!isResetMode ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome back</h2>
                <p className="text-slate-500 text-sm mb-8">Sign in to your account to continue.</p>

                {isVerifying ? (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <button
                      onClick={() => setIsVerifying(false)}
                      className="flex items-center gap-2 text-slate-500 hover:text-secondary transition-colors text-sm font-bold mb-6"
                    >
                      <ChevronLeft className="w-4 h-4" /> Back to Sign In
                    </button>
                    
                    <div className="text-center space-y-2 mb-8">
                      <h2 className="text-2xl font-bold text-slate-900">Verify Your Account</h2>
                      <p className="text-slate-500 text-sm leading-relaxed">
                        We've sent a 6-digit verification code to <span className="text-slate-900 font-bold">{identifier}</span>. 
                        Please enter it below to activate your account.
                      </p>
                    </div>

                    <form onSubmit={handleActivationVerify} className="space-y-6">
                      <div className="space-y-4">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-widest ml-1">Verification Code</label>
                        <SegmentedOTPInput
                          value={activationOtp}
                          onChange={(val) => setActivationOtp(val)}
                          disabled={loading}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-secondary hover:bg-secondary-dark text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-secondary/20 flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <>Verify & Sign In <ShieldCheck className="w-5 h-5" /></>}
                      </button>

                      <div className="text-center">
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await resendActivationOTP(Number(unverifiedUserId));
                              toast.success('A new verification code has been sent!');
                            } catch (error) {
                              toast.error(error.response?.data?.error || 'Failed to resend code');
                            }
                          }}
                          className="text-xs font-bold text-slate-400 hover:text-secondary transition-colors"
                        >
                          Didn't receive the code? Resend Code
                        </button>
                      </div>
                    </form>
                  </motion.div>
                ) : (
                  <>
                    <form
                  onSubmit={handleSubmit}
                  method="POST"
                  action="/login"
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <label htmlFor="identifier" className="text-xs font-bold text-slate-700 uppercase tracking-widest ml-1">Email or Phone</label>
                    <div className="relative group">
                      <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${errors.identifier ? 'text-red-400' : 'text-slate-400 group-focus-within:text-secondary'}`} />
                      <input
                        id="identifier"
                        type="text"
                        name="email"
                        autoComplete="username"
                        value={identifier}
                        onChange={(e) => {
                          setIdentifier(e.target.value);
                          if (errors.identifier) setErrors({ ...errors, identifier: null });
                        }}
                        className={`w-full bg-slate-50 border rounded-xl py-3.5 pl-12 pr-4 text-slate-900 font-medium outline-none transition-all ${errors.identifier ? 'border-red-200 bg-red-50/30' : 'border-slate-200 focus:border-secondary focus:bg-white'}`}
                        placeholder="Email or phone number"
                        required
                      />
                    </div>
                    <AnimatePresence>
                      {errors.identifier && (
                        <div className="flex flex-col gap-1">
                          <ErrorMsg message={errors.identifier} />
                          {unverifiedUserId && errors.identifier.toLowerCase().includes('verify') && (
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await resendActivationOTP(Number(unverifiedUserId));
                                  toast.success('Verification code sent to your email');
                                  setIsVerifying(true);
                                } catch (error) {
                                  toast.error(error.response?.data?.error || 'Failed to send code');
                                }
                              }}
                              className="text-secondary hover:underline text-xs font-bold w-fit ml-1"
                            >
                              Verify Now →
                            </button>
                          )}
                        </div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center ml-1">
                      <label htmlFor="password" className="text-xs font-bold text-slate-700 uppercase tracking-widest">Password</label>
                      <button type="button" onClick={() => setIsResetMode(true)} className="text-xs font-bold text-secondary hover:underline">Forgot password?</button>
                    </div>
                    <div className="relative group">
                      <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${errors.password ? 'text-red-400' : 'text-slate-400 group-focus-within:text-secondary'}`} />
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        name="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (errors.password) setErrors({ ...errors, password: null });
                        }}
                        className={`w-full bg-slate-50 border rounded-xl py-3.5 pl-12 pr-12 text-slate-900 font-medium outline-none transition-all ${errors.password ? 'border-red-200 bg-red-50/30' : 'border-slate-200 focus:border-secondary focus:bg-white'}`}
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-secondary transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <AnimatePresence>{errors.password && <ErrorMsg message={errors.password} />}</AnimatePresence>
                  </div>

                  <button
                    type="submit"
                    id="submit-btn"
                    disabled={loading}
                    className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <>Sign In <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </form>

                <div className="my-8 flex items-center gap-4">
                  <div className="flex-grow h-[1px] bg-slate-100" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">or</span>
                  <div className="flex-grow h-[1px] bg-slate-100" />
                </div>

                <button
                  onClick={handleGoogleLogin}
                  className="w-full py-4 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-slate-50 transition-all active:scale-[0.98]"
                >
                  <div className="w-5 h-5">
                    <svg viewBox="0 0 24 24" className="w-full h-full">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  </div>
                  Continue with Google
                </button>
                </>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="forgot"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <button
                  onClick={() => {
                    if (resetStep === 2) {
                      setResetStep(1);
                      setResetData({ otp: '', password: '', confirmPassword: '' });
                      setErrors({});
                    } else {
                      setIsResetMode(false);
                      setResetStep(1);
                      setResetEmail('');
                      setResetData({ otp: '', password: '', confirmPassword: '' });
                      setErrors({});
                    }
                  }}
                  className="flex items-center gap-2 text-slate-500 font-bold text-xs mb-6 hover:text-secondary transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> {resetStep === 2 ? 'Back to Email' : 'Back to Sign In'}
                </button>

                <h2 className="text-2xl font-bold text-slate-900 mb-2">Reset Password</h2>
                <p className="text-slate-500 text-sm mb-8">
                  {resetStep === 1 
                    ? "Enter your email for a 6-digit reset code." 
                    : `A 6-digit code has been sent to ${resetEmail}. Enter it and your new password.`}
                </p>

                {resetStep === 1 ? (
                  <form onSubmit={handleForgotRequest} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-widest ml-1">Email Address</label>
                      <div className="relative group">
                        <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${errors.resetEmail ? 'text-red-400' : 'text-slate-400 group-focus-within:text-secondary'}`} />
                        <input
                          type="email"
                          value={resetEmail}
                          onChange={(e) => {
                            setResetEmail(e.target.value);
                            if (errors.resetEmail) setErrors({ ...errors, resetEmail: null });
                          }}
                          className={`w-full bg-slate-50 border rounded-xl py-3.5 pl-12 pr-4 text-slate-900 font-medium outline-none transition-all ${errors.resetEmail ? 'border-red-200 bg-red-50/30' : 'border-slate-200 focus:border-secondary focus:bg-white'}`}
                          placeholder="eraya@gmail.com"
                        />
                      </div>
                      <AnimatePresence>{errors.resetEmail && <ErrorMsg message={errors.resetEmail} />}</AnimatePresence>
                    </div>
                    <button type="submit" disabled={loading} className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50">
                      {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <>Send Reset Code <ArrowRight className="w-4 h-4" /></>}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleResetSubmit} className="space-y-5">
                    <div className="space-y-4">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-widest ml-1">Verification Code</label>
                      <SegmentedOTPInput
                        value={resetData.otp}
                        onChange={(val) => {
                          setResetData({ ...resetData, otp: val });
                          if (errors.otp) setErrors({ ...errors, otp: null });
                        }}
                        disabled={loading}
                      />
                      <AnimatePresence>{errors.otp && <ErrorMsg message={errors.otp} />}</AnimatePresence>
                    </div>

                    <div className="space-y-2 pt-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-widest ml-1">New Password</label>
                      <div className="relative group">
                        <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${errors.password ? 'text-red-400' : 'text-slate-400 group-focus-within:text-secondary'}`} />
                        <input
                          type={showPassword ? "text" : "password"}
                          name="new-password"
                          autoComplete="new-password"
                          value={resetData.password}
                          onChange={(e) => {
                            setResetData({ ...resetData, password: e.target.value });
                            if (errors.password) setErrors({ ...errors, password: null });
                          }}
                          className={`w-full bg-slate-50 border rounded-xl py-3.5 pl-12 pr-12 text-slate-900 font-medium outline-none transition-all ${errors.password ? 'border-red-200 bg-red-50/30' : 'border-slate-200 focus:border-secondary focus:bg-white'}`}
                          placeholder="••••••••"
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-secondary transition-colors">
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      <AnimatePresence>{errors.password && <ErrorMsg message={errors.password} />}</AnimatePresence>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-widest ml-1">Confirm Password</label>
                      <div className="relative group">
                        <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${errors.confirmPassword ? 'text-red-400' : 'text-slate-400 group-focus-within:text-secondary'}`} />
                        <input
                          type={showPassword ? "text" : "password"}
                          name="confirm-password"
                          autoComplete="new-password"
                          value={resetData.confirmPassword}
                          onChange={(e) => {
                            setResetData({ ...resetData, confirmPassword: e.target.value });
                            if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: null });
                          }}
                          className={`w-full bg-slate-50 border rounded-xl py-3.5 pl-12 pr-12 text-slate-900 font-medium outline-none transition-all ${errors.confirmPassword ? 'border-red-200 bg-red-50/30' : 'border-slate-200 focus:border-secondary focus:bg-white'}`}
                          placeholder="••••••••"
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-secondary transition-colors">
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      <AnimatePresence>{errors.confirmPassword && <ErrorMsg message={errors.confirmPassword} />}</AnimatePresence>
                    </div>

                    <button type="submit" disabled={loading} className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50 shadow-xl">
                      {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <>Reset Password</>}
                    </button>
                  </form>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="mt-8 text-center text-slate-500 text-sm">
          Don't have an account?{' '}
          <Link to="/signup" className="text-secondary font-bold hover:underline transition-colors">Sign up for free</Link>
        </p>
      </motion.div>

      <div className="mt-12 text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
        <ShieldCheck className="w-4 h-4" /> Secure Authentication System
      </div>
    </div>
  );
};

export default Login;
