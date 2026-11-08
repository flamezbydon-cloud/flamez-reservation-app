import React, { useState } from 'react';
import { 
  Search, 
  Calendar, 
  Clock, 
  Users, 
  MapPin, 
  Phone, 
  MessageSquare, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  RefreshCw,
  ArrowLeft
} from 'lucide-react';
import { api } from '../services/api';

export default function ManageReservation({
  initialCode = '',
  onBackToBook,
  onOpenSmsDrawer
}) {
  const [searchType, setSearchType] = useState('code'); // 'code' or 'phone'
  const [searchValue, setSearchValue] = useState(initialCode);
  const [isSearching, setIsSearching] = useState(false);
  const [reservation, setReservation] = useState(null);
  const [reservationList, setReservationList] = useState([]);
  const [searchError, setSearchError] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  // Cancellation state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('Change of plans');
  const [isCancelling, setIsCancelling] = useState(false);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchValue.trim()) return;

    setSearchError('');
    setActionMessage('');
    setIsSearching(true);
    setReservation(null);
    setReservationList([]);

    try {
      if (searchType === 'code') {
        const res = await api.lookupByCode(searchValue.trim());
        setReservation(res.reservation);
      } else {
        const res = await api.lookupByPhone(searchValue.trim());
        if (res.reservations.length === 1) {
          setReservation(res.reservations[0]);
        } else {
          setReservationList(res.reservations);
        }
      }
    } catch (err) {
      setSearchError(err.message || 'No reservation found.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleCancelReservation = async () => {
    if (!reservation?.id) return;
    setIsCancelling(true);
    try {
      const res = await api.cancelReservation(reservation.id, cancelReason);
      setReservation(res.reservation);
      setShowCancelModal(false);
      setActionMessage('Your reservation has been cancelled. An SMS cancellation alert has been sent to your phone.');
      if (onOpenSmsDrawer) onOpenSmsDrawer();
    } catch (err) {
      setSearchError('Failed to cancel: ' + err.message);
    } finally {
      setIsCancelling(false);
    }
  };

  const formatTime12h = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    return `${displayH}:${m < 10 ? `0${m}` : m} ${ampm}`;
  };

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-6 animate-in fade-in duration-300">
      
      {/* Search Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl space-y-6">
        
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-gold-400">
            Guest Self-Service
          </span>
          <h2 className="text-2xl font-bold font-serif text-white mt-1">
            Find & Manage Your Reservation
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Lookup your booking using your Confirmation Code (e.g. #FLZ-8421) or registered phone number.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-4">
          <button
            onClick={() => { setSearchType('code'); setSearchValue(''); }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              searchType === 'code'
                ? 'bg-gold-500 text-noir-950 shadow-md'
                : 'text-slate-300 hover:text-white bg-white/5'
            }`}
          >
            Confirmation Code
          </button>
          <button
            onClick={() => { setSearchType('phone'); setSearchValue(''); }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              searchType === 'phone'
                ? 'bg-gold-500 text-noir-950 shadow-md'
                : 'text-slate-300 hover:text-white bg-white/5'
            }`}
          >
            Phone Number
          </button>
        </div>

        {/* Search Input Form */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              required
              placeholder={searchType === 'code' ? 'Enter code (e.g. LE-7482)' : 'Enter phone (e.g. 555-234-8901)'}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-noir-850 border border-white/15 focus:border-gold-400 text-white placeholder-slate-500 text-sm outline-none font-mono tracking-wide"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-noir-950 font-bold text-sm shadow-lg shadow-gold-500/20 transition-all disabled:opacity-50"
          >
            <Search className="w-4 h-4 stroke-[2.5]" />
            <span>{isSearching ? 'Searching...' : 'Find'}</span>
          </button>
        </form>

        {searchError && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{searchError}</span>
          </div>
        )}

        {actionMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}

      </div>

      {/* Multiple Results List */}
      {reservationList.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-300">
            Found {reservationList.length} reservations for this phone:
          </h3>
          <div className="grid gap-3">
            {reservationList.map(res => (
              <div
                key={res.id}
                onClick={() => setReservation(res)}
                className="p-4 rounded-2xl bg-noir-850 hover:bg-noir-800 border border-white/10 hover:border-gold-500/40 cursor-pointer transition-all flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-gold-300 text-sm">#{res.confirmationCode}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      res.status === 'Confirmed' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                    }`}>
                      {res.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    {res.date} at {formatTime12h(res.time)} • {res.partySize} Guests • {res.tableName}
                  </p>
                </div>
                <span className="text-xs text-gold-400 font-semibold">View Details →</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reservation Details Card */}
      {reservation && (
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-lg font-bold text-gold-300">
                  #{reservation.confirmationCode}
                </span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  reservation.status === 'Confirmed'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : reservation.status === 'Seated'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}>
                  {reservation.status}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1">{reservation.guestName}</h3>
            </div>

            {/* Action buttons */}
            {reservation.status === 'Confirmed' && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="px-4 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 text-xs font-semibold transition-all"
              >
                Cancel Reservation
              </button>
            )}
          </div>

          {/* Grid specs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-slate-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-gold-400" /> Date
              </span>
              <p className="font-bold text-white text-sm">{reservation.date}</p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-gold-400" /> Time
              </span>
              <p className="font-bold text-white text-sm">{formatTime12h(reservation.time)}</p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-gold-400" /> Guests
              </span>
              <p className="font-bold text-white text-sm">{reservation.partySize} People</p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-gold-400" /> Seating
              </span>
              <p className="font-bold text-gold-300 text-sm">{reservation.tableName}</p>
              <p className="text-[11px] text-slate-400">{reservation.zone}</p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-gold-400" /> Contact Phone
              </span>
              <p className="font-bold text-white font-mono text-sm">{reservation.phone}</p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> SMS Confirmation
              </span>
              <p className="font-bold text-emerald-300 text-sm">{reservation.smsStatus || 'Delivered'}</p>
            </div>
          </div>

          {(reservation.notes || reservation.specialRequests) && (
            <div className="p-3.5 rounded-xl bg-noir-850 border border-white/5 text-xs text-slate-300">
              <span className="font-semibold text-amber-300">Notes: </span>
              {reservation.notes || reservation.specialRequests}
            </div>
          )}

          {/* Quick Buttons */}
          <div className="pt-2 flex items-center justify-between">
            <button
              onClick={onBackToBook}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Book a new table
            </button>

            <button
              onClick={onOpenSmsDrawer}
              className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
            >
              <MessageSquare className="w-3.5 h-3.5" /> View SMS Messages
            </button>
          </div>

        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-noir-950/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-noir-900 border border-rose-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Cancel Reservation?</h3>
                <p className="text-xs text-slate-400">Table #{reservation.tableName} on {reservation.date}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you wish to cancel this reservation? An automated SMS cancellation notice will be sent to <span className="font-mono text-gold-300">{reservation.phone}</span>.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Reason for cancellation:</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-noir-850 border border-white/10 text-white text-xs outline-none"
              >
                <option value="Change of plans">Change of plans</option>
                <option value="Scheduling conflict">Scheduling conflict</option>
                <option value="Unable to attend">Unable to attend</option>
                <option value="Booked elsewhere">Booked elsewhere</option>
              </select>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Keep Reservation
              </button>
              <button
                onClick={handleCancelReservation}
                disabled={isCancelling}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all disabled:opacity-50"
              >
                {isCancelling ? 'Cancelling...' : 'Yes, Cancel & Send SMS'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
