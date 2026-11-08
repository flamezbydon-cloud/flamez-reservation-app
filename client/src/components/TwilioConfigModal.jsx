import React, { useState, useEffect } from 'react';
import { 
  X, 
  Settings, 
  Phone, 
  Key, 
  Shield, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  Sparkles,
  Info
} from 'lucide-react';
import { api } from '../services/api';

export default function TwilioConfigModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const [enabled, setEnabled] = useState(false);
  const [accountSid, setAccountSid] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [fromPhone, setFromPhone] = useState('');
  
  // Test SMS state
  const [testToPhone, setTestToPhone] = useState('+1 (555) 234-8901');
  const [testMessage, setTestMessage] = useState("Flamez by Don: This is a test reservation SMS verification message.");
  const [testStatus, setTestStatus] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    // Load current settings
    api.getSettings().then(data => {
      const tw = data.settings?.twilio || {};
      setEnabled(tw.enabled || false);
      setAccountSid(tw.accountSid || '');
      setFromPhone(tw.fromPhone || '');
    }).catch(err => console.error(err));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage('');
    try {
      await api.updateSettings({
        twilio: {
          enabled,
          accountSid,
          authToken,
          fromPhone
        }
      });
      setSaveMessage('Settings saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err) {
      alert('Failed to save settings: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestSms = async () => {
    if (!testToPhone.trim()) return;
    setIsTesting(true);
    setTestStatus(null);
    try {
      const res = await api.testSms({
        to: testToPhone,
        message: testMessage,
        accountSid: enabled ? accountSid : undefined,
        authToken: enabled ? authToken : undefined,
        fromPhone: enabled ? fromPhone : undefined
      });
      setTestStatus({
        success: true,
        provider: res.result?.provider,
        status: res.result?.status,
        text: `SMS dispatched successfully via ${res.result?.provider || 'Gateway'}`
      });
    } catch (err) {
      setTestStatus({
        success: false,
        text: err.message || 'SMS test failed.'
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-noir-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-noir-900 border border-gold-500/30 rounded-3xl shadow-2xl p-6 sm:p-7 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gold-500/20 text-gold-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-serif">SMS Gateway Configuration</h2>
              <p className="text-xs text-slate-400">Connect live Twilio API or use built-in SMS Simulator</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Note */}
        <div className="p-4 rounded-2xl bg-noir-850 border border-white/10 text-xs text-slate-300 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Built-in Simulator Mode (Active by Default)
            </span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
              Ready
            </span>
          </div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            No Twilio account required to test! All booking confirmations, OTP codes, and cancellations are routed to the interactive Virtual Smartphone Drawer on screen.
          </p>
        </div>

        {/* Twilio Credentials Form */}
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="flex items-center justify-between p-3 rounded-xl bg-noir-800 border border-white/5">
            <div>
              <span className="font-semibold text-white">Enable Real Twilio SMS API</span>
              <p className="text-[11px] text-slate-400">Send real text messages to actual mobile phones</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-500"></div>
            </label>
          </div>

          {enabled && (
            <div className="space-y-3 p-4 rounded-2xl bg-noir-850/80 border border-gold-500/30 animate-in fade-in">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-gold-400" /> Account SID
                </label>
                <input
                  type="text"
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={accountSid}
                  onChange={(e) => setAccountSid(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-noir-900 border border-white/10 text-white font-mono text-xs outline-none focus:border-gold-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-gold-400" /> Auth Token
                </label>
                <input
                  type="password"
                  placeholder="Your Twilio Auth Token"
                  value={authToken}
                  onChange={(e) => setAuthToken(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-noir-900 border border-white/10 text-white font-mono text-xs outline-none focus:border-gold-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-gold-400" /> From Phone Number
                </label>
                <input
                  type="text"
                  placeholder="+1xxxxxxxxxx"
                  value={fromPhone}
                  onChange={(e) => setFromPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-noir-900 border border-white/10 text-white font-mono text-xs outline-none focus:border-gold-400"
                />
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-2 rounded-xl bg-gold-500 hover:bg-gold-400 text-noir-950 font-bold transition-all"
              >
                {isSaving ? 'Saving...' : 'Save Twilio Credentials'}
              </button>

              {saveMessage && (
                <p className="text-[11px] text-emerald-400 text-center">{saveMessage}</p>
              )}
            </div>
          )}

          {/* Test SMS Dispatcher */}
          <div className="pt-2 border-t border-white/10 space-y-2">
            <span className="font-semibold text-slate-300">Test SMS Dispatcher</span>
            <div className="flex gap-2">
              <input
                type="tel"
                placeholder="Target phone number"
                value={testToPhone}
                onChange={(e) => setTestToPhone(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-noir-850 border border-white/10 text-white font-mono text-xs outline-none focus:border-gold-400"
              />
              <button
                type="button"
                onClick={handleTestSms}
                disabled={isTesting}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold flex items-center gap-1.5 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isTesting ? 'Sending...' : 'Test Send'}</span>
              </button>
            </div>

            {testStatus && (
              <div className={`p-2.5 rounded-xl text-[11px] flex items-center gap-2 ${
                testStatus.success
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
              }`}>
                {testStatus.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{testStatus.text}</span>
              </div>
            )}
          </div>

        </form>

      </div>
    </div>
  );
}
