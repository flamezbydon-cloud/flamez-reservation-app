import React, { useState } from 'react';
import { Shield, Lock, X, Flame, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';
import { api } from '../services/api';

export default function StaffAuthModal({ isOpen, onClose, onSuccess }) {
  if (!isOpen) return null;

  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async (pinToVerify) => {
    const pin = pinToVerify || passcode;
    if (!pin.trim()) {
      setError('Please enter the Flamez Staff PIN.');
      return;
    }

    setError('');
    setIsVerifying(true);
    try {
      await api.verifyStaffPasscode(pin);
      sessionStorage.setItem('flamez_staff_auth', 'true');
      onSuccess();
    } catch (err) {
      setError(err.message || 'Incorrect passcode. Staff access denied.');
      setPasscode('');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleKeyPress = (num) => {
    if (passcode.length < 8) {
      const next = passcode + num;
      setPasscode(next);
      if (next.length === 4) {
        handleVerify(next);
      }
    }
  };

  const handleBackspace = () => {
    setPasscode(prev => prev.slice(0, -1));
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-noir-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-noir-900 border border-amber-500/40 rounded-3xl p-6 shadow-2xl relative space-y-5">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-noir-950 mx-auto shadow-lg shadow-orange-500/20">
            <Lock className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
              Staff Portal Only
            </span>
            <h3 className="text-lg font-bold text-white font-serif mt-0.5">
              Host Stand Authentication
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Customer access restricted. Only authorized Flamez by Don floor staff can enter.
            </p>
          </div>
        </div>

        {/* PIN Display Dots */}
        <div className="flex justify-center items-center gap-3 py-2">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className={`w-3.5 h-3.5 rounded-full border transition-all ${
                passcode.length > i
                  ? 'bg-amber-400 border-amber-300 scale-110 shadow-sm shadow-amber-400/50'
                  : 'bg-noir-850 border-white/20'
              }`}
            />
          ))}
        </div>

        {/* Error message */}
        {error && (
          <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 justify-center">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(n => (
            <button
              key={n}
              type="button"
              onClick={() => handleKeyPress(n)}
              className="h-12 rounded-xl bg-noir-850 hover:bg-noir-800 active:bg-amber-500/20 text-white text-base font-semibold border border-white/10 hover:border-amber-500/40 transition-all flex items-center justify-center"
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPasscode('')}
            className="h-12 rounded-xl bg-noir-850/60 hover:bg-noir-800 text-slate-400 text-xs font-semibold border border-white/5 transition-all"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="h-12 rounded-xl bg-noir-850 hover:bg-noir-800 active:bg-amber-500/20 text-white text-base font-semibold border border-white/10 hover:border-amber-500/40 transition-all flex items-center justify-center"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="h-12 rounded-xl bg-noir-850/60 hover:bg-noir-800 text-slate-400 text-xs font-semibold border border-white/5 transition-all flex items-center justify-center"
          >
            ⌫
          </button>
        </div>

        {/* Direct Text Input & Submit for Keyboard users */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleVerify();
          }}
          className="space-y-2 pt-2 border-t border-white/10"
        >
          <div className="flex gap-2">
            <input
              type="password"
              placeholder="Or type PIN here..."
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="flex-1 px-3.5 py-2 rounded-xl bg-noir-850 border border-white/10 text-white text-center font-mono text-sm tracking-widest outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              disabled={isVerifying || !passcode}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-noir-950 font-bold text-xs shadow-md transition-all disabled:opacity-50"
            >
              {isVerifying ? 'Verifying...' : 'Unlock'}
            </button>
          </div>
          <p className="text-[11px] text-slate-500 text-center">
            Staff Passcode: <span className="font-mono text-amber-400/80">1149</span>
          </p>
        </form>

      </div>
    </div>
  );
}
