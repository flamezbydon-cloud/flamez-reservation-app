import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import CalendarPicker from './components/CalendarPicker';
import PartySizeSelector from './components/PartySizeSelector';
import FloorPlanSelector from './components/FloorPlanSelector';
import BookingModal from './components/BookingModal';
import ConfirmationView from './components/ConfirmationView';
import ManageReservation from './components/ManageReservation';
import HostDashboard from './components/HostDashboard';
import SMSDrawer from './components/SMSDrawer';
import TwilioConfigModal from './components/TwilioConfigModal';
import StaffAuthModal from './components/StaffAuthModal';
import { api } from './services/api';
import { Sparkles, Calendar, Users, MapPin, MessageSquare, PhoneCall, CheckCircle, Shield, Lock } from 'lucide-react';

export default function App() {
  const today = new Date();
  // If today is Sunday, default to tomorrow (Monday)
  const defaultDateObj = today.getDay() === 0 ? new Date(today.getTime() + 86400000) : today;
  const defaultDateStr = `${defaultDateObj.getFullYear()}-${String(defaultDateObj.getMonth() + 1).padStart(2, '0')}-${String(defaultDateObj.getDate()).padStart(2, '0')}`;

  const [activeTab, setActiveTab] = useState('book'); // 'book', 'manage', 'host'
  const [selectedDate, setSelectedDate] = useState(defaultDateStr);
  const [selectedTime, setSelectedTime] = useState('18:00');
  const [partySize, setPartySize] = useState(2);
  const [selectedTableId, setSelectedTableId] = useState(null);

  const [tables, setTables] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Modals & Drawers
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [confirmedReservation, setConfirmedReservation] = useState(null);
  const [confirmedSmsResult, setConfirmedSmsResult] = useState(null);

  const [smsDrawerOpen, setSmsDrawerOpen] = useState(false);
  const [smsUnreadCount, setSmsUnreadCount] = useState(1);
  const [twilioModalOpen, setTwilioModalOpen] = useState(false);

  // Staff Authentication State
  const [isStaffAuthenticated, setIsStaffAuthenticated] = useState(() => {
    try {
      return sessionStorage.getItem('flamez_staff_auth') === 'true';
    } catch (e) {
      return false;
    }
  });
  const [isStaffAuthModalOpen, setIsStaffAuthModalOpen] = useState(false);

  // Initial code to lookup in manage tab if routed from confirmation
  const [manageCode, setManageCode] = useState('');

  // Load time slots when date or party size changes
  useEffect(() => {
    async function loadSlots() {
      setIsLoadingSlots(true);
      try {
        const res = await api.getTimeSlots(selectedDate, partySize);
        setTimeSlots(res.slots || []);
        // Auto-select first available slot if current selectedTime is not available
        if (res.slots && res.slots.length > 0) {
          const currentSlot = res.slots.find(s => s.time === selectedTime);
          if (!currentSlot || !currentSlot.isAvailable) {
            const firstAvail = res.slots.find(s => s.isAvailable);
            if (firstAvail) setSelectedTime(firstAvail.time);
          }
        }
      } catch (err) {
        console.error('Failed to load slots:', err);
      } finally {
        setIsLoadingSlots(false);
      }
    }
    loadSlots();
  }, [selectedDate, partySize]);

  // Load table availability when date, time, or party size changes
  useEffect(() => {
    async function loadTableAvailability() {
      if (!selectedDate || !selectedTime) return;
      setIsLoadingTables(true);
      try {
        const res = await api.getTableAvailability(selectedDate, selectedTime, partySize);
        setTables(res.tables || []);
        
        // If current selected table is now occupied or doesn't fit, deselect it
        if (selectedTableId) {
          const match = res.tables.find(t => t.id === selectedTableId);
          if (!match || !match.isAvailable) {
            setSelectedTableId(null);
          }
        }
      } catch (err) {
        console.error('Failed to load table availability:', err);
      } finally {
        setIsLoadingTables(false);
      }
    }
    loadTableAvailability();
  }, [selectedDate, selectedTime, partySize]);

  const handleBookingConfirmed = (reservation, smsResult) => {
    setConfirmedReservation(reservation);
    setConfirmedSmsResult(smsResult);
    setIsBookingModalOpen(false);
    setSelectedTableId(null);
    setSmsUnreadCount(prev => prev + 1);
  };

  const handleBookAnother = () => {
    setConfirmedReservation(null);
    setConfirmedSmsResult(null);
    setActiveTab('book');
  };

  const handleManageBooking = (code) => {
    setManageCode(code);
    setActiveTab('manage');
  };

  const handleRequestHostStand = () => {
    if (isStaffAuthenticated) {
      setActiveTab('host');
    } else {
      setIsStaffAuthModalOpen(true);
    }
  };

  const handleStaffAuthSuccess = () => {
    setIsStaffAuthenticated(true);
    setIsStaffAuthModalOpen(false);
    setActiveTab('host');
  };

  const handleLockHostStand = () => {
    setIsStaffAuthenticated(false);
    try {
      sessionStorage.removeItem('flamez_staff_auth');
    } catch (e) {}
    setActiveTab('book');
  };

  const selectedTableObj = tables.find(t => t.id === selectedTableId);

  return (
    <div className="min-h-screen bg-noir-950 text-slate-100 flex flex-col justify-between selection:bg-gold-500 selection:text-noir-950">
      
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        smsDrawerOpen={smsDrawerOpen}
        setSmsDrawerOpen={setSmsDrawerOpen}
        smsUnreadCount={smsUnreadCount}
        onOpenTwilioSettings={() => setTwilioModalOpen(true)}
        onRequestHostStand={handleRequestHostStand}
        isStaffAuthenticated={isStaffAuthenticated}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Tab 1: Book Table Flow */}
        {activeTab === 'book' && (
          <div>
            {confirmedReservation ? (
              /* Confirmation Screen */
              <ConfirmationView
                reservation={confirmedReservation}
                smsResult={confirmedSmsResult}
                onBookAnother={handleBookAnother}
                onManageBooking={handleManageBooking}
                onOpenSmsDrawer={() => {
                  setSmsDrawerOpen(true);
                  setSmsUnreadCount(0);
                }}
              />
            ) : (
              /* Booking Flow */
              <div className="space-y-6">
                
                {/* Hero Restaurant Banner */}
                <div className="relative rounded-3xl overflow-hidden border border-white/10 p-6 sm:p-10 bg-gradient-to-r from-noir-900 via-noir-850 to-noir-900 shadow-2xl">
                  <div className="relative z-10 max-w-2xl space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-amber-300 text-xs font-semibold">
                      <Sparkles className="w-3.5 h-3.5" />
                      Restaurant Guru 2026 Recommended • Chef DJ Don
                    </div>
                    <h1 className="text-3xl sm:text-5xl font-serif font-bold tracking-tight text-white leading-tight">
                      Flamez by Don <span className="gold-gradient-text">Western Restaurant</span>
                    </h1>
                    <p className="text-sm sm:text-base text-slate-300 font-light leading-relaxed">
                      We're a Western Restaurant - Owner & Head Chef DJ Don - Travel-inspired menu designed for families. Operating hours: Monday to Saturday from 12:00 PM to 9:00 PM (Kitchen last call 8:30 PM • Sundays Off).
                    </p>

                    {/* Highlights row */}
                    <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Main Dining Area (10 Tables)
                      </span>
                      <span className="flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> 12:00 PM – 8:00 PM Slots
                      </span>
                      <span className="flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Instant Email Confirmation
                      </span>
                    </div>
                  </div>

                  {/* Decorative background blur */}
                  <div className="absolute -right-10 -bottom-10 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>
                </div>

                {/* Step 1 & Step 2 Row: Calendar & Party Size */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Calendar & Time Slots */}
                  <div className="lg:col-span-8">
                    <CalendarPicker
                      selectedDate={selectedDate}
                      onSelectDate={setSelectedDate}
                      selectedTime={selectedTime}
                      onSelectTime={setSelectedTime}
                      partySize={partySize}
                      timeSlots={timeSlots}
                      isLoadingSlots={isLoadingSlots}
                    />
                  </div>

                  {/* Right Column: Party Size Selector */}
                  <div className="lg:col-span-4">
                    <PartySizeSelector
                      partySize={partySize}
                      onSelectPartySize={setPartySize}
                    />
                  </div>
                </div>

                {/* Step 3: Interactive Floor Plan Table Selector */}
                <FloorPlanSelector
                  tables={tables}
                  selectedTableId={selectedTableId}
                  onSelectTable={setSelectedTableId}
                  partySize={partySize}
                  selectedDate={selectedDate}
                  selectedTime={selectedTime}
                  onProceedToBooking={() => setIsBookingModalOpen(true)}
                />

              </div>
            )}
          </div>
        )}

        {/* Tab 2: Manage / Lookup Reservation */}
        {activeTab === 'manage' && (
          <ManageReservation
            initialCode={manageCode}
            onBackToBook={() => setActiveTab('book')}
            onOpenSmsDrawer={() => {
              setSmsDrawerOpen(true);
              setSmsUnreadCount(0);
            }}
          />
        )}

        {/* Tab 3: Maitre D' / Host Stand - Flamez Staff Only */}
        {activeTab === 'host' && (
          isStaffAuthenticated ? (
            <HostDashboard
              onOpenSmsDrawer={() => {
                setSmsDrawerOpen(true);
                setSmsUnreadCount(0);
              }}
              onLockHostStand={handleLockHostStand}
            />
          ) : (
            <div className="max-w-md mx-auto py-16 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Lock className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-serif font-bold text-white">Flamez Staff Only</h2>
              <p className="text-sm text-slate-400">
                The Host Stand is restricted to Flamez by Don management and staff. Customer access is prohibited.
              </p>
              <button
                onClick={() => setIsStaffAuthModalOpen(true)}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-noir-950 font-bold text-sm hover:from-amber-400 hover:to-orange-400 shadow-lg shadow-orange-500/25 transition-all"
              >
                Enter Staff PIN
              </button>
            </div>
          )
        )}

      </main>

      {/* Booking Form Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        date={selectedDate}
        time={selectedTime}
        partySize={partySize}
        table={selectedTableObj}
        onBookingConfirmed={handleBookingConfirmed}
        onOpenSmsDrawer={() => {
          setSmsDrawerOpen(true);
          setSmsUnreadCount(0);
        }}
      />

      {/* Staff Authentication PIN Modal */}
      <StaffAuthModal
        isOpen={isStaffAuthModalOpen}
        onClose={() => setIsStaffAuthModalOpen(false)}
        onSuccess={handleStaffAuthSuccess}
      />

      {/* Footer */}
      <footer className="border-t border-white/10 bg-noir-900/80 mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            <span className="font-serif font-bold text-white text-sm">Flamez by Don Western Restaurant</span>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Operating Hours: Mon – Sat 12:00 PM – 9:00 PM (Kitchen Last Call: 8:30 PM) • Sundays Off • Reservations: (+60) 12 371 1491
            </p>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="mailto:flamezbydonreservation@gmail.com"
              className="text-amber-400 hover:underline flex items-center gap-1"
            >
              flamezbydonreservation@gmail.com
            </a>
            <span>•</span>
            <a
              href="https://wa.me/60123711491"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:underline"
            >
              WhatsApp Support
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}
