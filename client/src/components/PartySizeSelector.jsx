import React from 'react';
import { Users, MessageCircle } from 'lucide-react';

export default function PartySizeSelector({ partySize, onSelectPartySize }) {
  const sizes = [1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6 shadow-2xl border border-white/10 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-orange-500/15 border border-orange-500/30 text-amber-300">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Party Size</h2>
            <p className="text-xs text-slate-400">Step 2: How many guests will be dining?</p>
          </div>
        </div>

        <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-amber-300 font-semibold">
          {partySize} {partySize === 1 ? 'Guest' : 'Guests'}
        </div>
      </div>

      {/* Button Row */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
        {sizes.map((num) => {
          const isSelected = partySize === num;
          const isLargeParty = num >= 5;
          return (
            <button
              key={num}
              onClick={() => onSelectPartySize(num)}
              className={`h-11 rounded-xl font-semibold text-sm transition-all flex flex-col items-center justify-center relative ${
                isSelected
                  ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-noir-950 font-bold shadow-lg shadow-orange-500/25 ring-2 ring-amber-300 scale-105'
                  : 'bg-noir-900/80 hover:bg-noir-850 text-slate-200 border border-white/10 hover:border-amber-500/40 hover:text-white'
              }`}
              title={isLargeParty ? `${num} Guests (Right Section)` : `${num} Guests`}
            >
              <span>{num}</span>
            </button>
          );
        })}
      </div>

      {/* Large Parties & Restaurant Booking WhatsApp Note */}
      <div className="p-3.5 rounded-xl bg-noir-900/80 border border-emerald-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-slate-200">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div>
            <p className="font-semibold text-white">More than 8 guests or restaurant booking to WhatsApp us</p>
            <p className="text-slate-400 text-[11px]">Flamez by Don: <span className="text-amber-400 font-mono font-medium">(+60) 12 371 1491</span></p>
          </div>
        </div>

        <a
          href="https://wa.me/60123711491?text=Hi%20Flamez%20by%20Don%2C%20I%20would%20like%20to%20inquire%20about%20a%20booking%20for%20more%20than%208%20guests%20%2F%20restaurant%20booking."
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 hover:text-emerald-200 border border-emerald-500/40 font-semibold text-xs transition-all shrink-0 group"
        >
          <MessageCircle className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
          <span>WhatsApp Us</span>
        </a>
      </div>
    </div>
  );
}
