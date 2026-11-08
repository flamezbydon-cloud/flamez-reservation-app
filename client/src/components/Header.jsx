import React from 'react';
import { Calendar, Utensils, Flame, MessageSquare, Settings, UserCheck, Shield, Sparkles, Award, Lock, Phone } from 'lucide-react';

export default function Header({
  activeTab,
  setActiveTab,
  smsDrawerOpen,
  setSmsDrawerOpen,
  smsUnreadCount,
  onOpenTwilioSettings,
  onRequestHostStand,
  isStaffAuthenticated = false,
  restaurantName = "Flamez by Don"
}) {
  return (
    <header className="sticky top-0 z-40 bg-noir-900/90 backdrop-blur-md border-b border-white/10 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo & Tagline */}
          <div 
            onClick={() => setActiveTab('book')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-500 via-amber-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/25 group-hover:scale-105 transition-transform duration-300">
              <Flame className="w-6 h-6 text-noir-950 fill-noir-950 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-white group-hover:text-amber-300 transition-colors">
                  {restaurantName}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300 font-light hidden sm:flex">
                <span>Western Restaurant • Mon-Sat 12pm–9pm</span>
                <span className="text-slate-500">•</span>
                <span className="text-amber-400/90 font-mono flex items-center gap-1">
                  <Phone className="w-3 h-3 text-amber-400" /> (+60) 12 371 1491
                </span>
              </div>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="flex items-center gap-1 sm:gap-2 bg-noir-850/80 p-1.5 rounded-full border border-white/10 shadow-inner">
            <button
              onClick={() => setActiveTab('book')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'book'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-noir-950 shadow-md font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Book Table</span>
            </button>

            <button
              onClick={() => setActiveTab('manage')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'manage'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-noir-950 shadow-md font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>My Booking</span>
            </button>

            {/* Host Stand — Staff Only Access */}
            <button
              onClick={onRequestHostStand}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'host'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-noir-950 shadow-md font-bold'
                  : 'text-slate-300 hover:text-amber-300 hover:bg-white/5 border border-transparent hover:border-amber-500/20'
              }`}
              title="Restricted Flamez Staff Portal (Customer Access Prohibited)"
            >
              {isStaffAuthenticated ? (
                <Shield className="w-4 h-4 text-emerald-400" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span className="hidden md:inline">Host Stand</span>
              <span className="md:hidden">Staff</span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                isStaffAuthenticated ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/15 text-amber-400'
              }`}>
                {isStaffAuthenticated ? 'Active' : 'Staff'}
              </span>
            </button>
          </nav>

          {/* Right Action Buttons: SMS Simulator Drawer & Twilio Settings */}
          <div className="flex items-center gap-2">
            
            {/* SMS Simulator Button with Unread Badge */}
            <button
              onClick={() => setSmsDrawerOpen(!smsDrawerOpen)}
              className="relative flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl bg-noir-800 hover:bg-noir-700 text-slate-200 border border-white/10 hover:border-amber-500/50 transition-all group"
              title="Open Virtual Smartphone SMS Drawer"
            >
              <div className="relative">
                <MessageSquare className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                {smsUnreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-noir-950 animate-pulse">
                    {smsUnreadCount}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium hidden lg:inline">SMS Simulator</span>
            </button>

            {/* Twilio Settings */}
            <button
              onClick={onOpenTwilioSettings}
              className="p-2.5 rounded-xl bg-noir-800 hover:bg-noir-700 text-slate-300 hover:text-amber-300 border border-white/10 hover:border-amber-500/50 transition-all"
              title="Twilio SMS API Configuration"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
