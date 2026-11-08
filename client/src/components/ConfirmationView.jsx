import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, 
  Calendar, 
  Clock, 
  Users, 
  MapPin, 
  Phone, 
  MessageSquare, 
  Copy, 
  Check, 
  Download, 
  CalendarPlus, 
  RefreshCw, 
  ArrowRight,
  Sparkles,
  Utensils
} from 'lucide-react';
import { api } from '../services/api';

export default function ConfirmationView({
  reservation,
  smsResult,
  onBookAnother,
  onManageBooking,
  onOpenSmsDrawer
}) {
  const [copied, setCopied] = useState(false);
  const [resendingSms, setResendingSms] = useState(false);
  const [smsResentMessage, setSmsResentMessage] = useState('');

  useEffect(() => {
    // Fire celebratory confetti on mount
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#cfab5c', '#dec487', '#10b981', '#f3ebd4']
      });
    } catch (e) {}
  }, []);

  const handleCopyCode = () => {
    if (reservation?.confirmationCode) {
      navigator.clipboard.writeText(reservation.confirmationCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleResendSms = async () => {
    if (!reservation?.id) return;
    setResendingSms(true);
    setSmsResentMessage('');
    try {
      await api.resendSms(reservation.id);
      setSmsResentMessage('SMS confirmation resent successfully!');
      if (onOpenSmsDrawer) onOpenSmsDrawer();
    } catch (err) {
      setSmsResentMessage('Failed to resend SMS: ' + err.message);
    } finally {
      setResendingSms(false);
    }
  };

  const generateGoogleCalendarUrl = () => {
    if (!reservation) return '#';
    const dateFormatted = reservation.date.replace(/-/g, '');
    const [h, m] = reservation.time.split(':').map(Number);
    
    // Start time
    const startHour = String(h).padStart(2, '0');
    const startMin = String(m).padStart(2, '0');
    const startIso = `${dateFormatted}T${startHour}${startMin}00`;

    // End time (+90 mins)
    const endTotalMin = h * 60 + m + 90;
    const endH = String(Math.floor(endTotalMin / 60)).padStart(2, '0');
    const endM = String(endTotalMin % 60).padStart(2, '0');
    const endIso = `${dateFormatted}T${endH}${endM}00`;

    const title = encodeURIComponent(`Dinner at Flamez by Don (Table ${reservation.tableName})`);
    const details = encodeURIComponent(
      `Reservation Confirmation Code: #${reservation.confirmationCode}\n` +
      `Party Size: ${reservation.partySize} guests\n` +
      `Table: ${reservation.tableName} (${reservation.zone})\n` +
      `Phone: ${reservation.phone}\n` +
      `Operating Hours: Mon-Sat 12:00 PM - 9:00 PM (Kitchen last call 8:30 PM, Sundays off).\n` +
      `For modifications or cancellations, call (+60) 12 371 1491.`
    );
    const location = encodeURIComponent("Flamez by Don Western Restaurant");

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}&location=${location}`;
  };

  const downloadIcsFile = () => {
    if (!reservation) return;
    const dateFormatted = reservation.date.replace(/-/g, '');
    const [h, m] = reservation.time.split(':').map(Number);
    const startIso = `${dateFormatted}T${String(h).padStart(2, '0')}${String(m).padStart(2, '0')}00`;
    const endTotalMin = h * 60 + m + 90;
    const endIso = `${dateFormatted}T${String(Math.floor(endTotalMin / 60)).padStart(2, '0')}${String(endTotalMin % 60).padStart(2, '0')}00`;

    const icsData = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Flamez by Don//Reservation System//EN',
      'BEGIN:VEVENT',
      `UID:res-${reservation.confirmationCode}@flamezbydon.com`,
      `DTSTAMP:${dateFormatted}T000000Z`,
      `DTSTART:${startIso}`,
      `DTEND:${endIso}`,
      `SUMMARY:Dinner at Flamez by Don (#${reservation.confirmationCode})`,
      `DESCRIPTION:Table ${reservation.tableName} (${reservation.zone}) for ${reservation.partySize} guests. Kitchen last call is 8:30 PM.`,
      'LOCATION:Flamez by Don Western Restaurant',
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `reservation-${reservation.confirmationCode}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTime12h = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    return `${displayH}:${m < 10 ? `0${m}` : m} ${ampm}`;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-6 animate-in fade-in duration-300">
      
      {/* Top Banner */}
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 mb-2">
          <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-white">
          Reservation Confirmed
        </h1>
        <p className="text-sm text-slate-300">
          We look forward to welcoming you, <span className="text-gold-300 font-semibold">{reservation?.guestName}</span>.
        </p>
      </div>

      {/* Luxury Digital Pass / Ticket */}
      <div className="relative rounded-3xl bg-gradient-to-b from-noir-850 via-noir-900 to-noir-950 border-2 border-gold-500/40 shadow-2xl overflow-hidden p-6 sm:p-8">
        
        {/* Subtle Decorative Elements */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-gold-500/5 rounded-full blur-3xl pointer-events-none"></div>

        {/* Ticket Header */}
        <div className="flex items-center justify-between pb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold-500/20 border border-gold-500/40 flex items-center justify-center text-gold-300">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-white">Flamez by Don Western Restaurant</h2>
              <p className="text-xs text-amber-400 font-medium">Restaurant Guru 2026 Recommended • Mon-Sat 12 PM - 9 PM</p>
            </div>
          </div>

          {/* Confirmation Code Badge */}
          <div className="text-right">
            <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
              Booking Code
            </span>
            <div 
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 cursor-pointer bg-gold-500/15 hover:bg-gold-500/25 border border-gold-500/40 px-3 py-1 rounded-xl transition-all group mt-0.5"
              title="Click to copy confirmation code"
            >
              <span className="font-mono text-sm sm:text-base font-bold text-gold-300">
                #{reservation?.confirmationCode}
              </span>
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-gold-400 group-hover:scale-110" />
              )}
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 py-6 border-b border-white/10">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
              <Calendar className="w-3.5 h-3.5 text-gold-400" /> Date
            </span>
            <p className="text-sm font-bold text-white">
              {new Date(reservation?.date + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-gold-400" /> Time
            </span>
            <p className="text-sm font-bold text-white">
              {formatTime12h(reservation?.time)}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
              <Users className="w-3.5 h-3.5 text-gold-400" /> Party Size
            </span>
            <p className="text-sm font-bold text-white">
              {reservation?.partySize} Guests
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
              <MapPin className="w-3.5 h-3.5 text-gold-400" /> Table & Zone
            </span>
            <p className="text-sm font-bold text-gold-300">
              {reservation?.tableName}
            </p>
            <p className="text-[11px] text-slate-400">{reservation?.zone}</p>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
              <Phone className="w-3.5 h-3.5 text-gold-400" /> Guest Contact
            </span>
            <p className="text-sm font-bold text-white font-mono">
              {reservation?.phone}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-gold-400" /> Occasion
            </span>
            <p className="text-sm font-bold text-white">
              {reservation?.occasion || 'Dining'}
            </p>
          </div>
        </div>

        {/* Guest Notes */}
        {(reservation?.notes || reservation?.specialRequests) && (
          <div className="mt-4 p-3.5 rounded-2xl bg-noir-850/80 border border-white/10 text-xs text-slate-300">
            <span className="font-semibold text-amber-300">Notes: </span>
            <span>{reservation.notes || reservation.specialRequests}</span>
          </div>
        )}

        {/* SMS Status Banner */}
        <div className="mt-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-300">
                  SMS Confirmation Delivered
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold">
                  {smsResult?.provider || 'Live SMS Gateway'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Sent to {reservation?.phone}. Contains booking pass & direct cancel shortcut.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenSmsDrawer}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold transition-all whitespace-nowrap"
            >
              Open Virtual Phone 📱
            </button>
            <button
              onClick={handleResendSms}
              disabled={resendingSms}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all"
              title="Resend Confirmation SMS"
            >
              <RefreshCw className={`w-4 h-4 ${resendingSms ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {smsResentMessage && (
          <p className="text-xs text-emerald-400 text-center mt-2">{smsResentMessage}</p>
        )}

        {/* Calendar Add & Download Buttons */}
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={generateGoogleCalendarUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold border border-white/10 hover:border-gold-500/40 transition-all"
            >
              <CalendarPlus className="w-4 h-4 text-gold-400" />
              <span>Google Calendar</span>
            </a>

            <button
              onClick={downloadIcsFile}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold border border-white/10 hover:border-gold-500/40 transition-all"
            >
              <Download className="w-4 h-4 text-gold-400" />
              <span>Apple / Outlook (.ics)</span>
            </button>
          </div>

          <button
            onClick={() => onManageBooking(reservation?.confirmationCode)}
            className="flex items-center gap-1 text-xs text-gold-300 hover:text-gold-200 font-semibold"
          >
            <span>Manage Reservation</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* Book Another Table CTA */}
      <div className="text-center pt-2">
        <button
          onClick={onBookAnother}
          className="text-xs text-slate-400 hover:text-white hover:underline transition-all"
        >
          ← Make another reservation
        </button>
      </div>

    </div>
  );
}
