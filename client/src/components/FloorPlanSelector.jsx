import React, { useState } from 'react';
import { 
  Compass, 
  Layers, 
  Grid, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Flame, 
  Utensils, 
  ChevronRight, 
  Info,
  Users
} from 'lucide-react';

export default function FloorPlanSelector({
  tables = [],
  selectedTableId,
  onSelectTable,
  partySize,
  selectedDate,
  selectedTime,
  onProceedToBooking
}) {
  const [activeZoneFilter, setActiveZoneFilter] = useState('All');
  const [viewMode, setViewMode] = useState('floorplan'); // 'floorplan' or 'grid'
  const [hoveredTable, setHoveredTable] = useState(null);

  const zones = ['All', 'Left Section', 'Center Section', 'Right Section'];

  const selectedTable = tables.find(t => t.id === selectedTableId);

  // Filtered tables for grid view
  const filteredTables = tables.filter(t => {
    if (activeZoneFilter === 'All') return true;
    return t.zone === activeZoneFilter;
  });

  const isRightSectionLit = partySize >= 5;

  // Calculate table state
  const getTableState = (table) => {
    if (table.isOccupied) return 'occupied';
    // Party Size: only 5 onwards; right section lights up (incompatible for 1-4)
    if (table.zone === 'Right Section' && partySize < 5) return 'incompatible';
    if (!table.isFitPartySize) return 'incompatible';
    if (selectedTableId === table.id) return 'selected';
    return 'available';
  };

  // Helper for rendering realistic table and surrounding chairs in SVG
  const renderTableSvgNode = (table) => {
    const state = getTableState(table);
    const isSelected = state === 'selected';
    const isAvailable = state === 'available';
    const isOccupied = state === 'occupied';
    const isIncompatible = state === 'incompatible';

    const cx = table.x + table.width / 2;
    const cy = table.y + table.height / 2;

    // Color definitions based on state
    let strokeColor = '#3b4252';
    let fillColor = '#1a1e2d';
    let textColor = '#94a3b8';
    let chairColor = '#2e3440';

    if (isSelected) {
      strokeColor = '#f59e0b';
      fillColor = '#2d1b09';
      textColor = '#fef3c7';
      chairColor = '#f59e0b';
    } else if (isAvailable) {
      strokeColor = '#10b981';
      fillColor = '#062d22';
      textColor = '#a7f3d0';
      chairColor = '#10b981';
    } else if (isOccupied) {
      strokeColor = '#ef4444';
      fillColor = '#2d1519';
      textColor = '#fca5a5';
      chairColor = '#4b1e25';
    } else if (isIncompatible) {
      strokeColor = '#334155';
      fillColor = '#0f172a';
      textColor = '#64748b';
      chairColor = '#1e293b';
    }

    return (
      <g
        key={table.id}
        onClick={() => {
          if (isAvailable || isSelected) {
            onSelectTable(table.id);
          }
        }}
        onMouseEnter={() => setHoveredTable(table)}
        onMouseLeave={() => setHoveredTable(null)}
        className={`transition-all duration-300 ${
          isAvailable || isSelected ? 'cursor-pointer hover:opacity-100' : 'cursor-not-allowed opacity-60'
        }`}
      >
        {/* Glow Ring for Selected Table */}
        {isSelected && (
          <circle
            cx={cx}
            cy={cy}
            r={Math.max(table.width, table.height) * 0.72}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2.5"
            strokeDasharray="5 5"
            className="animate-spin"
            style={{ animationDuration: '10s' }}
          />
        )}

        {/* 2-Seater Table (L2) */}
        {table.shape === 'rect-2' && (
          <>
            {/* Left Chair */}
            <rect x={table.x - 7} y={cy - 10} width="5" height="20" rx="2" fill={chairColor} opacity="0.85" />
            {/* Right Chair */}
            <rect x={table.x + table.width + 2} y={cy - 10} width="5" height="20" rx="2" fill={chairColor} opacity="0.85" />
          </>
        )}

        {/* 4-Seater Tables (Square: L1, L3, L4, L5, C1, C2, C3) */}
        {table.shape === 'square' && (
          <>
            {/* Top Chair */}
            <rect x={cx - 11} y={table.y - 7} width="22" height="5" rx="2" fill={chairColor} opacity="0.85" />
            {/* Bottom Chair */}
            <rect x={cx - 11} y={table.y + table.height + 2} width="22" height="5" rx="2" fill={chairColor} opacity="0.85" />
            {/* Left Chair */}
            <rect x={table.x - 7} y={cy - 11} width="5" height="22" rx="2" fill={chairColor} opacity="0.85" />
            {/* Right Chair */}
            <rect x={table.x + table.width + 2} y={cy - 11} width="5" height="22" rx="2" fill={chairColor} opacity="0.85" />
          </>
        )}

        {/* Vertical 8-Seater Table (R1: Rotated Vertical) */}
        {table.shape === 'rectangle-8-vert' && (
          <>
            {/* 3 Left Chairs */}
            <rect x={table.x - 7} y={table.y + 16} width="5" height="24" rx="2" fill={chairColor} opacity="0.85" />
            <rect x={table.x - 7} y={table.y + 58} width="5" height="24" rx="2" fill={chairColor} opacity="0.85" />
            <rect x={table.x - 7} y={table.y + 100} width="5" height="24" rx="2" fill={chairColor} opacity="0.85" />
            {/* 3 Right Chairs */}
            <rect x={table.x + table.width + 2} y={table.y + 16} width="5" height="24" rx="2" fill={chairColor} opacity="0.85" />
            <rect x={table.x + table.width + 2} y={table.y + 58} width="5" height="24" rx="2" fill={chairColor} opacity="0.85" />
            <rect x={table.x + table.width + 2} y={table.y + 100} width="5" height="24" rx="2" fill={chairColor} opacity="0.85" />
            {/* 1 Top Chair */}
            <rect x={cx - 12} y={table.y - 7} width="24" height="5" rx="2" fill={chairColor} opacity="0.85" />
            {/* 1 Bottom Chair */}
            <rect x={cx - 12} y={table.y + table.height + 2} width="24" height="5" rx="2" fill={chairColor} opacity="0.85" />
          </>
        )}

        {/* Vertical 6-Seater Table (R2: Rotated Vertical) */}
        {table.shape === 'rectangle-6-vert' && (
          <>
            {/* 2 Left Chairs */}
            <rect x={table.x - 7} y={table.y + 18} width="5" height="24" rx="2" fill={chairColor} opacity="0.85" />
            <rect x={table.x - 7} y={table.y + 68} width="5" height="24" rx="2" fill={chairColor} opacity="0.85" />
            {/* 2 Right Chairs */}
            <rect x={table.x + table.width + 2} y={table.y + 18} width="5" height="24" rx="2" fill={chairColor} opacity="0.85" />
            <rect x={table.x + table.width + 2} y={table.y + 68} width="5" height="24" rx="2" fill={chairColor} opacity="0.85" />
            {/* 1 Top Chair */}
            <rect x={cx - 12} y={table.y - 7} width="24" height="5" rx="2" fill={chairColor} opacity="0.85" />
            {/* 1 Bottom Chair */}
            <rect x={cx - 12} y={table.y + table.height + 2} width="24" height="5" rx="2" fill={chairColor} opacity="0.85" />
          </>
        )}

        {/* Main Table Body */}
        <rect
          x={table.x}
          y={table.y}
          width={table.width}
          height={table.height}
          rx={table.shape === 'rect-2' ? 6 : table.shape.includes('vert') ? 10 : 8}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={isSelected ? '3' : '2'}
          className={isSelected ? 'table-node-selected' : isAvailable ? 'table-node-available' : ''}
        />

        {/* Table Code / Label */}
        <text
          x={cx}
          y={cy - 2}
          textAnchor="middle"
          fill={textColor}
          fontSize={table.shape === 'rect-2' ? '11' : '12'}
          fontWeight="bold"
          fontFamily="sans-serif"
        >
          {table.id}
        </text>

        {/* Capacity / Status Subtext */}
        <text
          x={cx}
          y={cy + 13}
          textAnchor="middle"
          fill={textColor}
          fontSize="9"
          fontWeight="bold"
          fontFamily="sans-serif"
          opacity="0.9"
        >
          {isOccupied ? 'Reserved' : `${table.maxCapacity}-Seater`}
        </text>

        {/* Available Pulse Indicator */}
        {isAvailable && !isSelected && (
          <circle cx={table.x + table.width - 5} cy={table.y + 5} r="3.5" fill="#10b981" />
        )}
      </g>
    );
  };

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6 shadow-2xl border border-white/10 space-y-5">
      
      {/* Title & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-orange-500/15 border border-orange-500/30 text-amber-300">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-white">Main Dining Area Floor Plan</h2>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 font-medium">
                10 Tables Total
              </span>
              {isRightSectionLit && (
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-500 text-noir-950 font-bold animate-pulse">
                  Right Section Lit Up (Party of {partySize})
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              {isRightSectionLit
                ? `Party of ${partySize}: Right Section tables R1 (8p) & R2 (6p) are lit up and ready for selection.`
                : `Party of ${partySize}: Left & Center sections (4-seaters & 2-seater) • Right Section lights up for 5+ guests`}
            </p>
          </div>
        </div>

        {/* Mode & Zone Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Zone Selector */}
          <div className="flex items-center bg-noir-850 p-1 rounded-xl border border-white/10 text-xs">
            {zones.map(z => (
              <button
                key={z}
                onClick={() => setActiveZoneFilter(z)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  activeZoneFilter === z
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-noir-950 font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {z}
              </button>
            ))}
          </div>

          {/* Floorplan vs Grid Switcher */}
          <div className="flex items-center bg-noir-850 p-1 rounded-xl border border-white/10 text-xs">
            <button
              onClick={() => setViewMode('floorplan')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                viewMode === 'floorplan'
                  ? 'bg-amber-500 text-noir-950 font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Floor Plan
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-amber-500 text-noir-950 font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" /> Table Cards
            </button>
          </div>
        </div>
      </div>

      {/* Legend Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300 bg-noir-900/60 p-3 rounded-xl border border-white/5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-emerald-500/20 border-2 border-emerald-500"></span>
            <span>Available ({tables.filter(t => t.isAvailable).length} tables)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-amber-500/30 border-2 border-amber-400"></span>
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-rose-500/20 border-2 border-rose-500/70"></span>
            <span>Reserved</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-slate-800 border-2 border-slate-700 opacity-60"></span>
            <span>Incompatible for {partySize} guests</span>
          </div>
        </div>

        <div className="text-[11px] text-amber-300/90 flex items-center gap-1.5 font-medium">
          <Flame className="w-3.5 h-3.5 text-orange-400" /> Kitchen last call: 8:30 PM
        </div>
      </div>

      {/* Floor Plan Visual Map */}
      {viewMode === 'floorplan' ? (
        <div className="relative w-full rounded-2xl bg-noir-950 border border-white/10 overflow-hidden shadow-inner p-2 sm:p-4">
          
          {/* Architectural SVG Map */}
          <div className="w-full overflow-x-auto">
            <svg
              viewBox="0 0 700 500"
              className="w-full min-w-[660px] h-[480px] select-none"
            >
              {/* Background accents */}
              <defs>
                <pattern id="gridPattern" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255, 255, 255, 0.025)" strokeWidth="1" />
                </pattern>
                <linearGradient id="grillGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#ea580c" stopOpacity="0.4" />
                  <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#dc2626" stopOpacity="0.4" />
                </linearGradient>
                <linearGradient id="rightSectionLitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7c2d12" stopOpacity="0.5" />
                  <stop offset="50%" stopColor="#451a03" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0.4" />
                </linearGradient>
                <filter id="rightGlow" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#f59e0b" floodOpacity="0.6" />
                </filter>
              </defs>

              <rect width="700" height="500" fill="url(#gridPattern)" />

              {/* TOP: Open Flame Western Grill & Kitchen Pass */}
              <rect x="180" y="8" width="340" height="26" rx="6" fill="url(#grillGrad)" stroke="#f97316" strokeWidth="1.2" />
              <text x="350" y="25" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="bold" letterSpacing="1">
                🔥 OPEN FLAME WESTERN GRILL & KITCHEN PASS 🔥
              </text>

              {/* MAIN DINING AREA - LEFT SECTION (5 tables: L1, L2, L3, L4, L5) */}
              <rect
                x="26"
                y="46"
                width="188"
                height="424"
                rx="14"
                fill="#151824"
                stroke={isRightSectionLit ? "#334155" : "#f59e0b"}
                strokeWidth="1.2"
                strokeDasharray={isRightSectionLit ? "3 3" : "4 4"}
                opacity={isRightSectionLit ? "0.45" : "0.85"}
              />
              <text x="120" y="66" textAnchor="middle" fill={isRightSectionLit ? "#94a3b8" : "#fde68a"} fontSize="11" fontWeight="bold" letterSpacing="0.5">
                LEFT SECTION
              </text>
              <text x="120" y="78" textAnchor="middle" fill="#94a3b8" fontSize="8.5">
                {isRightSectionLit ? "1–4 Guests (Incompatible for 5+)" : "5 Tables • L1, L3–L5 (4-Seater) & L2 (2-Seater)"}
              </text>

              {/* MAIN DINING AREA - CENTER SECTION (3 tables / 4-seater each: C1, C2, C3) */}
              <rect
                x="230"
                y="46"
                width="188"
                height="424"
                rx="14"
                fill="#151824"
                stroke={isRightSectionLit ? "#334155" : "#f59e0b"}
                strokeWidth="1.2"
                strokeDasharray={isRightSectionLit ? "3 3" : "4 4"}
                opacity={isRightSectionLit ? "0.45" : "0.85"}
              />
              <text x="324" y="66" textAnchor="middle" fill={isRightSectionLit ? "#94a3b8" : "#fde68a"} fontSize="11" fontWeight="bold" letterSpacing="0.5">
                CENTER SECTION
              </text>
              <text x="324" y="78" textAnchor="middle" fill="#94a3b8" fontSize="8.5">
                {isRightSectionLit ? "1–4 Guests (Incompatible for 5+)" : "3 Tables • 4-Seater Each (C1, C2, C3)"}
              </text>

              {/* MAIN DINING AREA - RIGHT SECTION (R1 8-Seater & R2 6-Seater Rotated Vertical) */}
              {isRightSectionLit && (
                <rect
                  x="431"
                  y="43"
                  width="246"
                  height="430"
                  rx="16"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2.5"
                  strokeDasharray="8 4"
                  opacity="0.9"
                  filter="url(#rightGlow)"
                  className="animate-pulse"
                />
              )}
              <rect
                x="434"
                y="46"
                width="240"
                height="424"
                rx="14"
                fill={isRightSectionLit ? "url(#rightSectionLitGrad)" : "#141724"}
                stroke={isRightSectionLit ? "#f59e0b" : "#334155"}
                strokeWidth={isRightSectionLit ? "2.5" : "1"}
                strokeDasharray={isRightSectionLit ? "none" : "3 3"}
                opacity={isRightSectionLit ? "1" : "0.5"}
              />
              {isRightSectionLit ? (
                <>
                  <rect x="464" y="54" width="180" height="22" rx="11" fill="#f59e0b" fillOpacity="0.3" stroke="#f59e0b" strokeWidth="1.2" />
                  <text x="554" y="69" textAnchor="middle" fill="#fef08a" fontSize="11" fontWeight="bold" letterSpacing="0.8">
                    ✨ RIGHT SECTION (ACTIVE)
                  </text>
                  <text x="554" y="86" textAnchor="middle" fill="#fdba74" fontSize="9" fontWeight="bold">
                    Lit Up for Parties 5–8 (R1 & R2)
                  </text>
                </>
              ) : (
                <>
                  <text x="554" y="66" textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="bold" letterSpacing="0.5" opacity="0.7">
                    RIGHT SECTION
                  </text>
                  <text x="554" y="79" textAnchor="middle" fill="#64748b" fontSize="8.5">
                    Parties 5+ Only • R1 (8p) & R2 (6p)
                  </text>
                </>
              )}

              {/* Decorative Divider Pillars */}
              <line x1="222" y1="52" x2="222" y2="460" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
              <line x1="426" y1="52" x2="426" y2="460" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />

              {/* BOTTOM: Entrance & Host Stand */}
              <rect x="280" y="478" width="140" height="16" rx="4" fill="#3b4252" opacity="0.8" />
              <text x="350" y="490" textAnchor="middle" fill="#e2e8f0" fontSize="9" fontWeight="bold">
                DOOR / HOST RECEPTION
              </text>

              {/* Render all table nodes */}
              {tables.map(table => renderTableSvgNode(table))}
            </svg>
          </div>

          {/* Hover Floating Details Card */}
          {hoveredTable && (
            <div className="absolute top-4 right-4 bg-noir-900/95 border border-amber-500/40 p-3.5 rounded-xl shadow-2xl backdrop-blur-md pointer-events-none z-20 max-w-xs animate-in fade-in duration-200">
              <div className="flex items-center justify-between gap-3">
                <span className="font-bold text-white text-sm">{hoveredTable.name}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                  hoveredTable.isAvailable
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : hoveredTable.isOccupied
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-slate-700 text-slate-300'
                }`}>
                  {hoveredTable.isOccupied ? 'Reserved' : hoveredTable.isAvailable ? 'Available' : `Fits up to ${hoveredTable.maxCapacity}p`}
                </span>
              </div>
              <p className="text-xs text-amber-400 font-medium mt-0.5">{hoveredTable.zone}</p>
              <p className="text-[11px] text-slate-300 mt-1">
                Seats up to {hoveredTable.maxCapacity} guests • {hoveredTable.shape === 'rect-2' ? '2-Seater Intimate Table' : hoveredTable.shape === 'square' ? '4-Seater Dining Table' : hoveredTable.shape === 'rectangle-8-vert' ? 'Vertical 8-Seater Grand Table' : 'Vertical 6-Seater Table'}
              </p>
              <div className="flex flex-wrap gap-1 mt-2">
                {hoveredTable.features?.map(f => (
                  <span key={f} className="text-[9px] bg-white/5 px-1.5 py-0.5 rounded text-slate-300">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Grid Mode: Table Cards */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {filteredTables.map(table => {
            const state = getTableState(table);
            const isSelected = state === 'selected';
            const isAvailable = state === 'available';

            return (
              <div
                key={table.id}
                onClick={() => {
                  if (isAvailable || isSelected) {
                    onSelectTable(table.id);
                  }
                }}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-400 ring-2 ring-amber-400 shadow-xl shadow-orange-500/10'
                    : isAvailable
                    ? 'bg-noir-900/80 hover:bg-noir-850 border-white/10 hover:border-amber-500/50 cursor-pointer'
                    : 'bg-noir-950/40 border-white/5 opacity-50 cursor-not-allowed'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-white text-base">{table.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      isSelected
                        ? 'bg-amber-500 text-noir-950 font-bold'
                        : isAvailable
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-rose-500/20 text-rose-300'
                    }`}>
                      {isSelected ? 'Selected' : isAvailable ? 'Available' : 'Reserved'}
                    </span>
                  </div>

                  <p className="text-xs text-amber-400 font-medium mb-1">{table.zone}</p>
                  <p className="text-xs text-slate-300 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    Seats up to <span className="font-bold text-white">{table.maxCapacity} guests</span>
                  </p>

                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {table.features?.map(feat => (
                      <span key={feat} className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-slate-300">
                        {feat}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Capacity: <span className="font-mono text-slate-200">{table.maxCapacity} Pax</span>
                  </span>
                  {isAvailable && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTable(table.id);
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        isSelected
                          ? 'bg-amber-500 text-noir-950 font-bold'
                          : 'bg-white/10 hover:bg-amber-500 hover:text-noir-950 text-white'
                      }`}
                    >
                      {isSelected ? 'Chosen' : 'Select'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Table Summary Bar & Confirmation Trigger */}
      {selectedTable ? (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-noir-900 to-noir-850 border border-amber-500/50 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-noir-950 text-xs font-bold uppercase tracking-wider">
                Table Selected
              </span>
              <h3 className="text-lg font-bold text-white font-serif">{selectedTable.name}</h3>
              <span className="text-xs text-amber-300">({selectedTable.zone})</span>
            </div>
            <p className="text-xs text-slate-300">
              Configured for up to {selectedTable.maxCapacity} guests • Main Dining Area • Kitchen last call 8:30 PM
            </p>
          </div>

          <button
            onClick={onProceedToBooking}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-noir-950 font-bold text-sm tracking-wide shadow-lg shadow-orange-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <span>Complete Guest Details</span>
            <ChevronRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-noir-900/40 border border-white/5 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <Info className="w-4 h-4 text-amber-400" />
          <span>Please select an available green table in the Main Dining Area to proceed.</span>
        </div>
      )}

    </div>
  );
}
