import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Calendar, 
  Users, 
  UserCheck, 
  Clock, 
  Plus, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  MessageSquare, 
  RefreshCw,
  Utensils,
  XCircle,
  Eye,
  Filter,
  Lock,
  FileText
} from 'lucide-react';
import { api } from '../services/api';

export default function HostDashboard({ onOpenSmsDrawer, onLockHostStand }) {
  const today = new Date();
  const defaultDateObj = today.getDay() === 0 ? new Date(today.getTime() + 86400000) : today;
  const todayStr = `${defaultDateObj.getFullYear()}-${String(defaultDateObj.getMonth() + 1).padStart(2, '0')}-${String(defaultDateObj.getDate()).padStart(2, '0')}`;

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [reservations, setReservations] = useState([]);
  const [tables, setTables] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Walk-in modal state
  const [showWalkinModal, setShowWalkinModal] = useState(false);
  const [walkinName, setWalkinName] = useState('');
  const [walkinPhone, setWalkinPhone] = useState('');
  const [walkinParty, setWalkinParty] = useState(2);
  const [walkinTableId, setWalkinTableId] = useState('');
  const [walkinTime, setWalkinTime] = useState('19:00');
  const [walkinNotes, setWalkinNotes] = useState('');
  const [isCreatingWalkin, setIsCreatingWalkin] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [resData, tableData] = await Promise.all([
        api.getReservations({ date: selectedDate }),
        api.getTables()
      ]);
      setReservations(resData.reservations || []);
      setTables(tableData.tables || []);
    } catch (err) {
      console.error('Failed to load host dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const handleStatusChange = async (resId, newStatus) => {
    try {
      await api.updateStatus(resId, newStatus);
      await loadData();
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const handleResendSms = async (resId) => {
    try {
      await api.resendSms(resId);
      if (onOpenSmsDrawer) onOpenSmsDrawer();
      alert('SMS confirmation resent to guest!');
    } catch (err) {
      alert('Failed to resend SMS: ' + err.message);
    }
  };

  const handleCreateWalkin = async (e) => {
    e.preventDefault();
    if (!walkinName || !walkinTableId) return;

    setIsCreatingWalkin(true);
    try {
      await api.createReservation({
        guestName: walkinName,
        phone: walkinPhone,
        date: selectedDate,
        time: walkinTime,
        partySize: walkinParty,
        tableId: walkinTableId,
        occasion: 'Walk-in Dining',
        notes: walkinNotes || 'Walk-in guest registered by Flamez Staff',
        specialRequests: walkinNotes || 'Walk-in guest registered by Flamez Staff',
        sendSms: Boolean(walkinPhone)
      });

      setShowWalkinModal(false);
      setWalkinName('');
      setWalkinPhone('');
      setWalkinNotes('');
      setWalkinTableId('');
      await loadData();
      if (onOpenSmsDrawer) onOpenSmsDrawer();
    } catch (err) {
      alert('Walk-in booking error: ' + err.message);
    } finally {
      setIsCreatingWalkin(false);
    }
  };

  // Metrics
  const totalBookings = reservations.length;
  const totalGuests = reservations.reduce((sum, r) => sum + (r.status !== 'Cancelled' ? r.partySize : 0), 0);
  const seatedCount = reservations.filter(r => r.status === 'Seated').length;
  const completedCount = reservations.filter(r => r.status === 'Completed').length;
  const confirmedCount = reservations.filter(r => r.status === 'Confirmed').length;

  // Filtered reservations
  const filteredReservations = reservations.filter(r => {
    const matchesSearch = 
      r.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.phone.includes(searchQuery) ||
      r.confirmationCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.tableName && r.tableName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'All' || r.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const formatTime12h = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    return `${displayH}:${m < 10 ? `0${m}` : m} ${ampm}`;
  };

  return (
    <div className="max-w-7xl mx-auto py-6 space-y-6 animate-in fade-in duration-300">
      
      {/* Top Banner & Date Picker */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-gold-500/20 text-gold-400">
              <Shield className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-gold-400">
              Maitre D' & Host Stand
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-white mt-1">
            Floor Management & Guest Service
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time table allocation, guest arrival check-in, and SMS notification control.
          </p>
        </div>

        {/* Date Selector & Walkin Button */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-noir-850 px-3.5 py-2 rounded-2xl border border-white/10">
            <Calendar className="w-4 h-4 text-gold-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-white text-xs font-semibold outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={() => setShowWalkinModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-noir-950 font-bold text-xs tracking-wide shadow-lg shadow-gold-500/20 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Walk-In Guest</span>
          </button>

          <button
            onClick={loadData}
            className="p-2.5 rounded-2xl bg-noir-850 hover:bg-noir-800 border border-white/10 text-slate-300 hover:text-white transition-all"
            title="Refresh Shift Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {onLockHostStand && (
            <button
              onClick={onLockHostStand}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-bold text-xs transition-all"
              title="Lock Host Stand & Return to Customer View"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lock Staff Portal</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-noir-900/80 border border-white/10">
          <span className="text-xs text-slate-400">Total Bookings</span>
          <p className="text-2xl font-bold text-white font-serif mt-1">{totalBookings}</p>
          <span className="text-[10px] text-slate-500">For {selectedDate}</span>
        </div>

        <div className="p-4 rounded-2xl bg-noir-900/80 border border-white/10">
          <span className="text-xs text-slate-400">Expected Guests</span>
          <p className="text-2xl font-bold text-gold-300 font-serif mt-1">{totalGuests}</p>
          <span className="text-[10px] text-gold-400/80">Covers</span>
        </div>

        <div className="p-4 rounded-2xl bg-noir-900/80 border border-emerald-500/30 bg-emerald-500/5">
          <span className="text-xs text-emerald-400">Confirmed (Waiting)</span>
          <p className="text-2xl font-bold text-emerald-300 font-serif mt-1">{confirmedCount}</p>
          <span className="text-[10px] text-emerald-400/70">Awaiting arrival</span>
        </div>

        <div className="p-4 rounded-2xl bg-noir-900/80 border border-blue-500/30 bg-blue-500/5">
          <span className="text-xs text-blue-400">Currently Seated</span>
          <p className="text-2xl font-bold text-blue-300 font-serif mt-1">{seatedCount}</p>
          <span className="text-[10px] text-blue-400/70">At table now</span>
        </div>

        <div className="p-4 rounded-2xl bg-noir-900/80 border border-white/10">
          <span className="text-xs text-slate-400">Completed</span>
          <p className="text-2xl font-bold text-slate-300 font-serif mt-1">{completedCount}</p>
          <span className="text-[10px] text-slate-500">Departed</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-noir-900/60 p-4 rounded-2xl border border-white/10">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search guest, phone, table..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-noir-850 border border-white/10 text-white placeholder-slate-500 text-xs outline-none focus:border-gold-400"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['All', 'Confirmed', 'Seated', 'Completed', 'Cancelled'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === st
                  ? 'bg-gold-500 text-noir-950 font-bold'
                  : 'bg-noir-850 text-slate-300 hover:text-white border border-white/5'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Reservations Table */}
      <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-noir-850/80 text-slate-400 uppercase tracking-wider font-semibold text-[11px]">
                <th className="py-3.5 px-4">Time</th>
                <th className="py-3.5 px-4">Guest</th>
                <th className="py-3.5 px-4">Code</th>
                <th className="py-3.5 px-4">Party</th>
                <th className="py-3.5 px-4">Table</th>
                <th className="py-3.5 px-4">SMS Status</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredReservations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No reservations found for {selectedDate}.
                  </td>
                </tr>
              ) : (
                filteredReservations.map(res => (
                  <tr key={res.id} className="hover:bg-white/[0.02] transition-colors">
                    
                    {/* Time */}
                    <td className="py-3.5 px-4 font-mono font-bold text-white whitespace-nowrap">
                      {formatTime12h(res.time)}
                    </td>

                    {/* Guest Name & Phone */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <p className="font-bold text-white text-sm">{res.guestName}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{res.phone}</p>
                      {(res.notes || res.specialRequests) && (
                        <p className="text-[10px] text-amber-300/85 italic truncate max-w-xs" title={res.notes || res.specialRequests}>
                          Notes: "{res.notes || res.specialRequests}"
                        </p>
                      )}
                    </td>

                    {/* Confirmation Code */}
                    <td className="py-3.5 px-4 font-mono font-bold text-gold-300 whitespace-nowrap">
                      #{res.confirmationCode}
                    </td>

                    {/* Party */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-semibold text-slate-200">
                      {res.partySize} guests
                    </td>

                    {/* Table & Zone */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <p className="font-bold text-white">{res.tableName}</p>
                      <p className="text-[10px] text-slate-400">{res.zone}</p>
                    </td>

                    {/* SMS Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        <span className="text-emerald-300 font-medium text-[11px]">
                          {res.smsStatus || 'Delivered'}
                        </span>
                        <button
                          onClick={() => handleResendSms(res.id)}
                          className="p-1 text-slate-400 hover:text-white"
                          title="Resend SMS confirmation"
                        >
                          <RefreshCw className="w-3 h-3" />
                        </button>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        res.status === 'Confirmed'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : res.status === 'Seated'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                          : res.status === 'Completed'
                          ? 'bg-slate-700 text-slate-300'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}>
                        {res.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1">
                      {res.status === 'Confirmed' && (
                        <button
                          onClick={() => handleStatusChange(res.id, 'Seated')}
                          className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[11px] transition-all"
                        >
                          Seat
                        </button>
                      )}

                      {res.status === 'Seated' && (
                        <button
                          onClick={() => handleStatusChange(res.id, 'Completed')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] transition-all"
                        >
                          Finish
                        </button>
                      )}

                      {res.status === 'Confirmed' && (
                        <button
                          onClick={() => handleStatusChange(res.id, 'No-Show')}
                          className="px-2 py-1 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 font-semibold text-[11px] transition-all"
                        >
                          No-Show
                        </button>
                      )}
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Walk-in Modal */}
      {showWalkinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-noir-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-noir-900 border border-gold-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Utensils className="w-5 h-5 text-gold-400" />
                <h3 className="text-lg font-bold text-white">Register Walk-In Party</h3>
              </div>
              <button
                onClick={() => setShowWalkinModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateWalkin} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Guest Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={walkinName}
                  onChange={(e) => setWalkinName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-noir-850 border border-white/10 text-white outline-none focus:border-gold-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Mobile Phone (Tourist / International supported)</label>
                <input
                  type="tel"
                  placeholder="e.g. +60 12 345 6789 or +44 7700 900077"
                  value={walkinPhone}
                  onChange={(e) => setWalkinPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-noir-850 border border-white/10 text-white outline-none focus:border-gold-400 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Dietary, anniversary, window preference"
                  value={walkinNotes}
                  onChange={(e) => setWalkinNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-noir-850 border border-white/10 text-white outline-none focus:border-gold-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Party Size</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={walkinParty}
                    onChange={(e) => setWalkinParty(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-noir-850 border border-white/10 text-white outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Time Slot</label>
                  <select
                    value={walkinTime}
                    onChange={(e) => setWalkinTime(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-noir-850 border border-white/10 text-white outline-none"
                  >
                    <option value="12:00">12:00 PM</option>
                    <option value="12:30">12:30 PM</option>
                    <option value="13:00">1:00 PM</option>
                    <option value="13:30">1:30 PM</option>
                    <option value="14:00">2:00 PM</option>
                    <option value="14:30">2:30 PM</option>
                    <option value="15:00">3:00 PM</option>
                    <option value="15:30">3:30 PM</option>
                    <option value="16:00">4:00 PM</option>
                    <option value="16:30">4:30 PM</option>
                    <option value="17:00">5:00 PM</option>
                    <option value="17:30">5:30 PM</option>
                    <option value="18:00">6:00 PM</option>
                    <option value="18:30">6:30 PM</option>
                    <option value="19:00">7:00 PM</option>
                    <option value="19:30">7:30 PM</option>
                    <option value="20:00">8:00 PM (Last Call 8:30)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Assign Table *</label>
                <select
                  required
                  value={walkinTableId}
                  onChange={(e) => setWalkinTableId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-noir-850 border border-white/10 text-white outline-none cursor-pointer"
                >
                  <option value="">-- Choose Table --</option>
                  {tables.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.zone} - Seats {t.minCapacity}-{t.maxCapacity})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowWalkinModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingWalkin}
                  className="px-5 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-noir-950 font-bold"
                >
                  {isCreatingWalkin ? 'Allocating...' : 'Seat & Send SMS'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
