import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  Users, 
  MapPin, 
  Phone, 
  Mail, 
  User, 
  Sparkles, 
  MessageSquare, 
  CheckCircle2, 
  AlertCircle, 
  Lock,
  ChevronRight,
  ShieldCheck,
  Globe,
  FileText
} from 'lucide-react';
import { api } from '../services/api';

export default function BookingModal({
  isOpen,
  onClose,
  date,
  time,
  partySize,
  table,
  onBookingConfirmed,
  onOpenSmsDrawer
}) {
  if (!isOpen || !table) return null;

  const [guestName, setGuestName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [occasion, setOccasion] = useState('Casual Dining');
  const [notes, setNotes] = useState('');
  const [sendSms, setSendSms] = useState(true);

  // OTP verification state
  const [requireOtp, setRequireOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const occasions = [
    'Casual Dining',
    'Romantic Date Night',
    'Birthday Celebration',
    'Anniversary',
    'Business Meeting',
    'Family Gathering',
    'Tourist / Holiday Meal',
    'Special Celebration'
  ];

  // Quick international prefix presets for tourists and locals
  const countryPrefixes = [
    { code: '+60', label: '🇲🇾 +60 (MY)' },
    { code: '+65', label: '🇸🇬 +65 (SG)' },
    { code: '+61', label: '🇦🇺 +61 (AU)' },
    { code: '+44', label: '🇬🇧 +44 (UK)' },
    { code: '+1', label: '🇺🇸 +1 (US)' },
    { code: '+86', label: '🇨🇳 +86 (CN)' },
    { code: '+62', label: '🇮🇩 +62 (ID)' },
    { code: '+81', label: '🇯🇵 +81 (JP)' }
  ];

  const handleApplyPrefix = (prefix) => {
    // If phone is empty or doesn't start with +, set prefix
    if (!phone || !phone.startsWith('+')) {
      setPhone(`${prefix} ${phone.replace(/^0+/, '')}`);
    } else {
      // Replace existing prefix
      const rest = phone.replace(/^\+\d+\s*/, '');
      setPhone(`${prefix} ${rest}`);
    }
  };

  // Helper format 24h to 12h
  const formatTime12h = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    return `${displayH}:${m < 10 ? `0${m}` : m} ${ampm}`;
  };

  const handleSendOtp = async () => {
    const rawDigits = phone.replace(/\D/g, '');
    if (!phone || rawDigits.length < 7) {
      setOtpError('Please enter a valid mobile number with country code first.');
      return;
    }
    setOtpError('');
    setIsSendingOtp(true);
    try {
      await api.sendOtp(phone, guestName || 'Guest');
      setOtpSent(true);
      if (onOpenSmsDrawer) onOpenSmsDrawer();
    } catch (err) {
      setOtpError(err.message || 'Failed to send verification SMS.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.trim().length !== 6) {
      setOtpError('Please enter the 6-digit code sent via SMS.');
      return;
    }
    setOtpError('');
    try {
      await api.verifyOtp(phone, otpCode);
      setIsPhoneVerified(true);
      setOtpSent(false);
    } catch (err) {
      setOtpError(err.message || 'Invalid code.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!guestName.trim()) {
      setError('Please enter your full name.');
      return;
    }

    const rawDigits = phone.replace(/\D/g, '');
    if (!phone.trim() || rawDigits.length < 7) {
      setError('Please enter a valid mobile phone number including your country code (e.g. +60 for Malaysia, +65, +44, +1, etc.).');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid email address to receive your booking confirmation.');
      return;
    }

    if (requireOtp && !isPhoneVerified) {
      setError('Please verify your phone number via SMS code first.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.createReservation({
        guestName,
        phone,
        email,
        date,
        time,
        partySize,
        tableId: table.id,
        occasion,
        notes: notes.trim(),
        specialRequests: notes.trim(),
        sendSms
      });

      onBookingConfirmed(response.reservation, response.emailResult);
    } catch (err) {
      setError(err.message || 'Failed to book reservation. Please try another slot or table.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-noir-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-noir-900 border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden my-8">
        
        {/* Header Bar */}
        <div className="p-6 bg-gradient-to-r from-noir-850 via-noir-900 to-noir-850 border-b border-white/10 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400">
              Confirm Your Booking
            </span>
            <h2 className="text-xl font-bold text-white font-serif mt-0.5">
              Guest & Reservation Details
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Summary Card */}
        <div className="mx-6 mt-6 p-4 rounded-2xl bg-noir-850/70 border border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 flex items-center gap-1 uppercase font-semibold">
              <Calendar className="w-3 h-3 text-amber-400" /> Date
            </span>
            <p className="text-xs font-bold text-white">
              {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 flex items-center gap-1 uppercase font-semibold">
              <Clock className="w-3 h-3 text-amber-400" /> Time
            </span>
            <p className="text-xs font-bold text-white">
              {formatTime12h(time)}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 flex items-center gap-1 uppercase font-semibold">
              <Users className="w-3 h-3 text-amber-400" /> Party
            </span>
            <p className="text-xs font-bold text-white">
              {partySize} {partySize === 1 ? 'Guest' : 'Guests'}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 flex items-center gap-1 uppercase font-semibold">
              <MapPin className="w-3 h-3 text-amber-400" /> Table
            </span>
            <p className="text-xs font-bold text-amber-300 truncate" title={table.name}>
              {table.name}
            </p>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Booking Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Guest Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-400" /> Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Jonathan Lee"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-noir-800 border border-white/10 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-white placeholder-slate-500 text-sm outline-none transition-all"
            />
          </div>

          {/* Mobile Phone (Tourist & General International) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-amber-400" /> Mobile Phone (for SMS Confirmation) *
              </label>
              {isPhoneVerified && (
                <span className="text-emerald-400 text-[11px] font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified
                </span>
              )}
            </div>

            {/* Quick Country Code Selector Chips for Tourists & Locals */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
              <span className="text-slate-400 text-[10px] shrink-0 flex items-center gap-1">
                <Globe className="w-3 h-3 text-amber-400/80" /> Prefix:
              </span>
              {countryPrefixes.map(cp => (
                <button
                  key={cp.code}
                  type="button"
                  onClick={() => handleApplyPrefix(cp.code)}
                  className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-amber-500/20 hover:text-amber-300 border border-white/10 hover:border-amber-500/30 text-slate-300 text-[10px] font-mono whitespace-nowrap transition-all"
                >
                  {cp.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="tel"
                required
                placeholder="e.g. +60 12 345 6789 or +44 7700 900077"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-noir-800 border border-white/10 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-white placeholder-slate-500 text-sm outline-none transition-all font-mono"
              />

              {requireOtp && !isPhoneVerified && (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isSendingOtp}
                  className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition-all whitespace-nowrap"
                >
                  {isSendingOtp ? 'Sending...' : otpSent ? 'Resend Code' : 'Send Code'}
                </button>
              )}
            </div>
            
            <p className="text-[11px] text-slate-400 flex items-center gap-1">
              <span>🌍 International & tourist numbers welcome. Please include your country code (e.g. +60, +65, +1, +44, +61).</span>
            </p>

            {/* OTP input box if OTP sent */}
            {otpSent && !isPhoneVerified && (
              <div className="p-3 mt-2 rounded-xl bg-noir-850 border border-amber-500/40 space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">Enter 6-digit code received via SMS:</span>
                  <button
                    type="button"
                    onClick={onOpenSmsDrawer}
                    className="text-amber-400 hover:underline text-[11px]"
                  >
                    View in Virtual Phone 📱
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-32 px-3 py-1.5 rounded-lg bg-noir-900 border border-white/20 text-white text-center font-mono tracking-widest text-base font-bold outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    className="px-4 py-1.5 rounded-lg bg-amber-500 text-noir-950 font-bold text-xs hover:bg-amber-400 transition-all"
                  >
                    Verify
                  </button>
                </div>
                {otpError && (
                  <p className="text-[11px] text-rose-400">{otpError}</p>
                )}
              </div>
            )}
          </div>

          {/* Email Address - Required for Email Confirmation */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-amber-400" /> Email Address <span className="text-amber-400 font-bold">*</span>
              </span>
              <span className="text-[11px] text-emerald-400 font-medium">Instant Confirmation Sent Here</span>
            </label>
            <input
              type="email"
              required
              placeholder="e.g. yourname@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-noir-800 border border-white/10 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-white placeholder-slate-500 text-sm outline-none transition-all"
            />
          </div>

          {/* Occasion & Notes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Dining Occasion
              </label>
              <select
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-noir-800 border border-white/10 focus:border-amber-400 text-white text-xs outline-none cursor-pointer"
              >
                {occasions.map(occ => (
                  <option key={occ} value={occ} className="bg-noir-900">{occ}</option>
                ))}
              </select>
            </div>

            {/* Renamed from "Special Requests" to "Notes" */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-400" /> Notes
              </label>
              <input
                type="text"
                placeholder="Dietary, allergies, baby chair, celebrations, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-noir-800 border border-white/10 focus:border-amber-400 text-white placeholder-slate-500 text-xs outline-none"
              />
            </div>
          </div>

          {/* Email Confirmation Notice */}
          <div className="pt-3 border-t border-white/10">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-300">
              <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>A booking confirmation will be sent directly to your email address and to Flamez by Don.</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-slate-400 hover:text-white text-xs font-semibold transition-all"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-noir-950 font-bold text-sm tracking-wide shadow-lg shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Confirming...</span>
              ) : (
                <>
                  <span>Confirm Reservation</span>
                  <ChevronRight className="w-4 h-4 stroke-[3]" />
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
