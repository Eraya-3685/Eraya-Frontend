import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, Loader2 } from 'lucide-react';
import useDocumentTitle from '../hooks/useDocumentTitle';

const BkashMock = () => {
  useDocumentTitle('bKash Payment Gateway');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const amount = searchParams.get('amount');
  const invoice = searchParams.get('invoice');
  const callback = searchParams.get('callback');
  
  const [step, setStep] = useState(1);
  const [number, setNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleNext = () => {
    if (step === 1) {
      if (!number || number.length < 11) {
        setError('Enter a valid bKash number');
        return;
      }
      setError('');
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setStep(2);
      }, 800);
    } else if (step === 2) {
      if (otp !== '123456') {
        setError('Invalid OTP. Use 123456 for testing.');
        return;
      }
      setError('');
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setStep(3);
      }, 800);
    } else if (step === 3) {
      if (pin !== '12121') {
        setError('Invalid PIN. Use 12121 for testing.');
        return;
      }
      setError('');
      setLoading(true);
      
      setTimeout(() => {
        if (callback) {
          window.location.href = `${callback}?paymentID=MOCK_${invoice}&status=success&senderNumber=${number}`;
        } else {
          navigate('/profile');
        }
      }, 1500);
    }
  };

  const handleCancel = () => {
    if (callback) {
      window.location.href = `${callback}?paymentID=MOCK_${invoice}&status=failed`;
    } else {
      navigate('/checkout');
    }
  };

  const C = {
    bkash: '#d12053',
    t900: '#0d1117',
    t500: '#64748b',
    t300: '#94a3b8',
    bSoft: 'rgba(0,0,0,0.06)',
    bg: '#fcfcfe'
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ background: '#fff', width: '100%', maxWidth: 380, borderRadius: '2.5rem', boxShadow: '0 40px 100px -20px rgba(0,0,0,0.15)', overflow: 'hidden', border: `1px solid ${C.bSoft}` }}>
        
        {/* Top bar with logo */}
        <div style={{ background: C.bkash, padding: '2.5rem 2rem', textAlign: 'center', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', width: 32, height: 32, background: 'rgba(255,255,255,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
             <ShieldCheck style={{ width: 16, height: 16, color: '#fff' }} />
          </div>
          <div style={{ background: '#fff', padding: '0.4rem 1.25rem', borderRadius: '1rem', display: 'inline-block', marginBottom: '1.5rem', boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }}>
             <img src="https://www.logo.wine/a/logo/BKash/BKash-bKash-Logo.wine.svg" alt="bKash" style={{ height: 28 }} />
          </div>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.15em', margin: 0 }}>Eraya Merchant</p>
          <h2 style={{ color: '#fff', fontSize: '2.25rem', fontWeight: 900, margin: '0.5rem 0 0', letterSpacing: '-0.02em' }}>৳{amount}</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', marginTop: '0.25rem' }}>Inv: {invoice}</p>
        </div>

        {/* Form area */}
        <div style={{ padding: '2.5rem 2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
             <span style={{ background: '#f1f5f9', padding: '0.4rem 1rem', borderRadius: '2rem', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.08em' }}>Secure Sandbox</span>
          </div>

          <div style={{ minHeight: 120 }}>
            {step === 1 && (
              <div style={{ animation: 'fadeIn 0.4s ease' }}>
                <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 800, color: C.t500, letterSpacing: '0.05em', marginBottom: '0.75rem', paddingLeft: '0.5rem' }}>Your bKash Number</label>
                <input 
                  type="text"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  autoComplete="off"
                  style={{ width: '100%', background: '#f8fafc', border: `1px solid #e2e8f0`, borderRadius: '1.25rem', padding: '1rem', textAlign: 'center', fontSize: '1.1rem', fontWeight: 800, color: C.t900, outline: 'none', transition: 'all 0.3s' }}
                  onFocus={e => e.target.style.borderColor = C.bkash}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
            )}

            {step === 2 && (
              <div style={{ animation: 'fadeIn 0.4s ease' }}>
                <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 800, color: C.t500, letterSpacing: '0.05em', marginBottom: '0.75rem', paddingLeft: '0.5rem' }}>Verification Code</label>
                <input 
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  autoComplete="one-time-code"
                  style={{ width: '100%', background: '#f8fafc', border: `1px solid #e2e8f0`, borderRadius: '1.25rem', padding: '1rem', textAlign: 'center', fontSize: '1.5rem', fontWeight: 900, color: C.t900, outline: 'none', letterSpacing: '0.4em' }}
                />
                <p style={{ textAlign: 'center', fontSize: '0.65rem', fontWeight: 700, color: '#f59e0b', marginTop: '0.75rem' }}>Use Test OTP: 123456</p>
              </div>
            )}

            {step === 3 && (
              <div style={{ animation: 'fadeIn 0.4s ease' }}>
                <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 800, color: C.t500, letterSpacing: '0.05em', marginBottom: '0.75rem', paddingLeft: '0.5rem' }}>Enter PIN</label>
                <input 
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="•••••"
                  autoComplete="new-password"
                  style={{ width: '100%', background: '#f8fafc', border: `1px solid #e2e8f0`, borderRadius: '1.25rem', padding: '1rem', textAlign: 'center', fontSize: '1.5rem', fontWeight: 900, color: C.t900, outline: 'none', letterSpacing: '0.4em' }}
                />
                <p style={{ textAlign: 'center', fontSize: '0.65rem', fontWeight: 700, color: '#f59e0b', marginTop: '0.75rem' }}>Use Test PIN: 12121</p>
              </div>
            )}

            {error && <p style={{ fontSize: '0.7rem', fontWeight: 700, color: C.bkash, textAlign: 'center', marginTop: '1rem', padding: '0.75rem', background: 'rgba(209,32,83,0.08)', borderRadius: '0.75rem' }}>{error}</p>}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2.5rem' }}>
            <button 
              onClick={handleCancel}
              style={{ flex: 1, height: 48, border: 'none', background: '#f1f5f9', color: C.t500, borderRadius: '1.15rem', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.05em', cursor: 'pointer', transition: 'all 0.2s' }}
            >Close</button>
            <button 
              onClick={handleNext}
              disabled={loading}
              style={{ 
                flex: 1.5, height: 48, border: 'none', background: C.bkash, color: '#fff', 
                borderRadius: '1.15rem', fontSize: '0.75rem', fontWeight: 800, 
                letterSpacing: '0.05em', cursor: 'pointer', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                boxShadow: '0 10px 25px -5px rgba(209,32,83,0.3)', opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> : (step === 3 ? 'Confirm' : 'Next')}
            </button>
          </div>
        </div>
        
        <div style={{ padding: '1.25rem', textAlign: 'center', borderTop: `1px solid ${C.bSoft}` }}>
           <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 800, color: C.t300, letterSpacing: '0.1em' }}>☎ 16247</p>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default BkashMock;
