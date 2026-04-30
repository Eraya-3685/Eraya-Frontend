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
        setError('Please enter a valid bKash number');
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
      
      // Complete mock payment
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

  return (
    <div className="min-h-screen bg-[#D12053]/5 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden border border-[#D12053]/10">
        {/* Header */}
        <div className="bg-[#D12053] p-6 text-center text-white relative">
          <img src="https://www.logo.wine/a/logo/BKash/BKash-bKash-Logo.wine.svg" alt="bKash" className="h-10 mx-auto bg-white rounded-xl px-2 py-1 mb-4" />
          <div className="absolute top-4 right-4 bg-white/20 p-2 rounded-full">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <p className="text-xs font-medium text-white/80 uppercase tracking-widest">Eraya Merchant</p>
          <h2 className="text-3xl font-black mt-2">৳{amount}</h2>
          <p className="text-[10px] font-bold text-white/60 mt-1 uppercase tracking-widest">Invoice: {invoice}</p>
        </div>

        {/* Body */}
        <div className="p-8 space-y-6">
          <div className="text-center space-y-2">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Sandbox Mode</p>
            <p className="text-xs text-slate-500">This is a simulated gateway. No real money will be deducted.</p>
          </div>

          <div className="space-y-4">
            {step === 1 && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest px-1">Your bKash Account Number</label>
                <input 
                  type="text"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  placeholder="e.g 01712345678"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center text-lg font-bold outline-none focus:ring-4 focus:ring-[#D12053]/10 focus:border-[#D12053]/30 transition-all text-slate-900"
                />
                <p className="text-[9px] text-center text-slate-400 font-bold uppercase tracking-widest pt-2">Use any valid format number</p>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest px-1">Verification Code (OTP)</label>
                <input 
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center text-2xl tracking-[0.5em] font-black outline-none focus:ring-4 focus:ring-[#D12053]/10 focus:border-[#D12053]/30 transition-all text-slate-900"
                />
                <p className="text-[9px] text-center text-amber-500 font-bold uppercase tracking-widest pt-2">Test OTP: 123456</p>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest px-1">Enter bKash PIN</label>
                <input 
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="•••••"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center text-2xl tracking-[0.5em] font-black outline-none focus:ring-4 focus:ring-[#D12053]/10 focus:border-[#D12053]/30 transition-all text-slate-900"
                />
                <p className="text-[9px] text-center text-amber-500 font-bold uppercase tracking-widest pt-2">Test PIN: 12121</p>
              </div>
            )}

            {error && <p className="text-xs font-bold text-[#D12053] text-center bg-[#D12053]/10 py-2 rounded-xl">{error}</p>}
          </div>

          <div className="flex gap-4 pt-4 border-t border-slate-100">
            <button 
              onClick={handleCancel}
              className="flex-1 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 rounded-2xl transition-all"
            >
              Close
            </button>
            <button 
              onClick={handleNext}
              disabled={loading}
              className="flex-1 py-4 bg-[#D12053] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex justify-center items-center gap-2 hover:bg-[#b01b45] transition-all shadow-lg shadow-[#D12053]/20 disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (step === 3 ? 'Confirm' : 'Proceed')}
            </button>
          </div>
        </div>
        
        <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">☎ 16247</p>
        </div>
      </div>
    </div>
  );
};

export default BkashMock;
