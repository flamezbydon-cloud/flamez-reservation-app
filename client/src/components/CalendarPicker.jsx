import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Sun, Moon, Sparkles, AlertCircle, Flame, Ban } from 'lucide-react';

export default function CalendarPicker({
  selectedDate,
  onSelectDate,
  selectedTime,
  onSelectTime,
  partySize,
  timeSlots = [],
  isLoadingSlots = false
}) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = selectedDate ? new Date(selectedDate + 'T00:00:00') : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [servicePeriod, setServicePeriod] = useState('all'); // 'all', 'lunch', 'dinner'

  // Format today's date string YYYY-MM-DD
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Quick date presets (avoiding Sundays)
  const getPresetDates = () => {
    const list = [];
    const currentDay = today.getDay(); // 0 is Sunday

    if (currentDay !== 0) {
      list.push({ label: 'Today', date: todayStr });
    }

    // Tomorrow
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowDay = tomorrow.getDay();
    const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
    
    if (tomorrowDay !== 0) {
      list.push({ label: currentDay === 0 ? 'Tomorrow (Mon)' : 'Tomorrow', date: tomorrowStr });
    } else {
      // If tomorrow is Sunday, offer Monday
      const monday = new Date(today);
      monday.setDate(today.getDate() + 2);
      const mondayStr = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
      list.push({ label: 'Monday', date: mondayStr });
    }

    // This Friday & Saturday
    const daysUntilFri = (5 - currentDay + 7) % 7 || 7;
    const friday = new Date(today);
    friday.setDate(today.getDate() + daysUntilFri);
    const fridayStr = `${friday.getFullYear()}-${String(friday.getMonth() + 1).padStart(2, '0')}-${String(friday.getDate()).padStart(2, '0')}`;
    list.push({ label: 'This Friday', date: fridayStr });

    const saturday = new Date(friday);
    saturday.setDate(friday.getDate() + 1);
    const saturdayStr = `${saturday.getFullYear()}-${String(saturday.getMonth() + 1).padStart(2, '0')}-${String(saturday.getDate()).padStart(2, '0')}`;
    list.push({ label: 'This Saturday', date: saturdayStr });

    return list;
  };

  const presets = getPresetDates();

  // Calendar month days generation
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const prevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Helper to format time 24h to 12h
  const formatTime12h = (time24) => {
    if (!time24) return '';
    const [h, m] = time24.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    return `${displayH}:${m < 10 ? `0${m}` : m} ${ampm}`;
  };

  // Filtered slots by period
  const filteredSlots = timeSlots.filter(slot => {
    if (servicePeriod === 'lunch') return slot.period === 'lunch';
    if (servicePeriod === 'dinner') return slot.period === 'dinner';
    return true;
  });

  const isSelectedDateSunday = selectedDate ? new Date(selectedDate + 'T00:00:00').getDay() === 0 : false;

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6 shadow-2xl border border-white/10 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-orange-500/15 border border-orange-500/30 text-amber-300">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Select Date & Time</h2>
            <p className="text-xs text-amber-400/90 font-medium flex items-center gap-1.5 mt-0.5">
              <span>Mon – Sat: 12:00 PM – 9:00 PM</span>
              <span className="text-slate-400">•</span>
              <span className="text-orange-300">Kitchen Last Call: 8:30 PM</span>
              <span className="text-slate-400">•</span>
              <span className="text-rose-400 font-bold">Sundays Off</span>
            </p>
          </div>
        </div>

        {/* Quick Date Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          {presets.map(preset => (
            <button
              key={preset.label}
              onClick={() => onSelectDate(preset.date)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedDate === preset.date
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-noir-950 font-bold shadow-sm'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Month Calendar */}
      <div className="bg-noir-900/60 rounded-xl p-4 border border-white/5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-base sm:text-lg font-bold text-white">
            {monthNames[month]} {year}
          </h3>
          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Day of Week Headers */}
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
            <div
              key={d}
              className={`text-[11px] font-semibold uppercase tracking-wider ${
                i === 0 ? 'text-rose-400 font-bold' : i === 6 ? 'text-amber-400/80' : 'text-slate-400'
              }`}
            >
              {d} {i === 0 && <span className="text-[9px] block text-rose-500/80 font-normal">Off</span>}
            </div>
          ))}
        </div>

        {/* Day Numbers Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Previous Month trailing days */}
          {Array.from({ length: firstDayIndex }).map((_, i) => {
            const dayNum = daysInPrevMonth - firstDayIndex + i + 1;
            return (
              <div key={`prev-${i}`} className="h-10 flex items-center justify-center text-xs text-slate-600 cursor-not-allowed">
                {dayNum}
              </div>
            );
          })}

          {/* Current Month days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dayDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const dayObj = new Date(year, month, dayNum);
            const isSunday = dayObj.getDay() === 0;
            const isPast = dayDateStr < todayStr;
            const isToday = dayDateStr === todayStr;
            const isSelected = dayDateStr === selectedDate;
            const isDisabled = isPast || isSunday;

            return (
              <button
                key={dayDateStr}
                disabled={isDisabled}
                onClick={() => onSelectDate(dayDateStr)}
                title={isSunday ? "Sundays Off - Restaurant Closed" : isPast ? "Past date" : `Select ${dayDateStr}`}
                className={`h-10 rounded-lg flex flex-col items-center justify-center text-xs relative font-medium transition-all ${
                  isSelected
                    ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-noir-950 font-bold shadow-md shadow-orange-500/30 ring-2 ring-amber-300'
                    : isSunday
                    ? 'text-rose-400/40 bg-rose-950/10 cursor-not-allowed border border-rose-900/10 line-through'
                    : isPast
                    ? 'text-slate-600 cursor-not-allowed hover:bg-transparent'
                    : 'text-slate-200 hover:bg-white/10 hover:text-amber-300'
                }`}
              >
                <span>{dayNum}</span>
                {isSunday && !isSelected && (
                  <span className="text-[8px] text-rose-400/70 font-sans -mt-0.5">Off</span>
                )}
                {isToday && !isSelected && !isSunday && (
                  <span className="w-1 h-1 rounded-full bg-amber-400 absolute bottom-1"></span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sunday Closed Alert Banner (if Sunday is viewed) */}
      {isSelectedDateSunday && (
        <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-3 animate-in fade-in">
          <Ban className="w-5 h-5 text-rose-400 shrink-0" />
          <div>
            <p className="font-bold text-sm text-white">Sundays Off — Restaurant Closed</p>
            <p className="text-slate-300 mt-0.5">
              Flamez by Don is closed every Sunday. Please pick a date between Monday and Saturday (12:00 PM – 9:00 PM).
            </p>
          </div>
        </div>
      )}

      {/* Time Slot Selection Section */}
      {!isSelectedDateSunday && (
        <div className="space-y-3 pt-2">
          
          {/* Service Period Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-semibold text-white">Available Time Slots</span>
              <span className="text-xs text-slate-400">
                (Every 30 mins • 12:00 PM – 8:00 PM)
              </span>
            </div>

            <div className="flex items-center bg-noir-850 p-1 rounded-lg border border-white/10 text-xs">
              <button
                onClick={() => setServicePeriod('all')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  servicePeriod === 'all' ? 'bg-amber-500 text-noir-950 font-bold' : 'text-slate-300 hover:text-white'
                }`}
              >
                All (12pm-8pm)
              </button>
              <button
                onClick={() => setServicePeriod('lunch')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                  servicePeriod === 'lunch' ? 'bg-amber-500 text-noir-950 font-bold' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Sun className="w-3 h-3 text-amber-400" /> Lunch (12-4:30pm)
              </button>
              <button
                onClick={() => setServicePeriod('dinner')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                  servicePeriod === 'dinner' ? 'bg-amber-500 text-noir-950 font-bold' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Moon className="w-3 h-3 text-indigo-400" /> Dinner (5-8pm)
              </button>
            </div>
          </div>

          {/* Time Slot Pills Grid */}
          {isLoadingSlots ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-12 rounded-xl bg-white/5 animate-pulse"></div>
              ))}
            </div>
          ) : filteredSlots.length === 0 ? (
            <div className="p-6 rounded-xl bg-noir-900/40 border border-white/5 text-center text-slate-400 text-xs">
              No time slots available for this selection.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
              {filteredSlots.map(slot => {
                const isSelected = selectedTime === slot.time;
                const isAvailable = slot.isAvailable;
                const count = slot.availableCount;
                const isHighDemand = slot.isHighDemand;

                return (
                  <button
                    key={slot.time}
                    disabled={!isAvailable}
                    onClick={() => onSelectTime(slot.time)}
                    className={`p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? 'bg-gradient-to-r from-amber-500/25 to-orange-500/35 border-amber-400 ring-2 ring-amber-400/60 shadow-lg shadow-orange-500/15'
                        : isAvailable
                        ? 'bg-noir-900/80 hover:bg-noir-850 border-white/10 hover:border-amber-500/40 text-slate-200'
                        : 'bg-noir-950/40 border-white/5 text-slate-600 cursor-not-allowed opacity-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-bold ${isSelected ? 'text-amber-300' : isAvailable ? 'text-white' : 'text-slate-500 line-through'}`}>
                        {formatTime12h(slot.time)}
                      </span>
                      {slot.period === 'lunch' ? (
                        <Sun className="w-3 h-3 text-amber-400/70" />
                      ) : (
                        <Moon className="w-3 h-3 text-indigo-400/70" />
                      )}
                    </div>

                    <div className="mt-1 flex items-center justify-between text-[10px]">
                      {isAvailable ? (
                        <span className={`font-medium ${isHighDemand ? 'text-amber-400 flex items-center gap-0.5' : 'text-emerald-400'}`}>
                          {count} table{count === 1 ? '' : 's'} left {isHighDemand && '🔥'}
                        </span>
                      ) : (
                        <span className="text-rose-400/80 font-medium">Fully booked</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Kitchen Last Call Note */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-orange-950/20 border border-orange-500/20 text-[11px] text-amber-300/90">
            <span className="flex items-center gap-1.5 font-medium">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              Kitchen last call is 8:30 PM • Dining closes at 9:00 PM
            </span>
          </div>

        </div>
      )}

    </div>
  );
}
