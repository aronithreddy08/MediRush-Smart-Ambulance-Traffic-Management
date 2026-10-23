import React from 'react';
import { HospitalDestination, HYDERABAD_DESTINATIONS } from '../data/destinationsData';
import { Truck, Phone, MapPin, Navigation, Clock, CloudRain, ShieldAlert, AlertOctagon, Activity, Zap, AlertTriangle } from 'lucide-react';

interface LeftSidebarProps {
  ambulanceId: string;
  driverName: string;
  selectedDestination: HospitalDestination;
  onSelectDestination: (dest: HospitalDestination) => void;
  isEmergencyActive: boolean;
  onToggleEmergency: () => void;
  distanceRemainingKm: number;
  etaMinutes: number;
  currentSpeedKmh: number;
  tripMode?: 'MEDIRUSH_AI' | 'NORMAL_CASE';
  onSelectTripMode?: (mode: 'MEDIRUSH_AI' | 'NORMAL_CASE') => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  ambulanceId,
  driverName,
  selectedDestination,
  onSelectDestination,
  isEmergencyActive,
  onToggleEmergency,
  distanceRemainingKm,
  etaMinutes,
  currentSpeedKmh,
  tripMode = 'MEDIRUSH_AI',
  onSelectTripMode,
}) => {
  return (
    <div className="w-full lg:w-72 flex flex-col space-y-3 flex-shrink-0">
      
      {/* 1. Live Ambulance Profile Card */}
      <div className="bg-[#0f172a]/90 backdrop-blur-md rounded-2xl p-3.5 border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
            Live Ambulance
          </span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase flex items-center gap-1 ${
            tripMode === 'MEDIRUSH_AI'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${tripMode === 'MEDIRUSH_AI' ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`}></span>
            <span>{tripMode === 'MEDIRUSH_AI' ? 'AI Preemption' : 'Normal Case'}</span>
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <div className="w-12 h-11 rounded-xl bg-gradient-to-br from-red-600/30 to-slate-900 border border-red-500/30 flex items-center justify-center text-2xl shadow">
            🚑
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-mono font-black text-white tracking-wider truncate">
              {ambulanceId}
            </h3>
            <p className="text-[11px] text-emerald-400 font-semibold truncate">
              {tripMode === 'MEDIRUSH_AI' ? '1km V2X Early Alert Active' : 'Normal City Traffic Speed'}
            </p>
          </div>
        </div>

        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 block font-mono">Driver</span>
            <span className="text-xs font-bold text-slate-200">{driverName}</span>
          </div>
          <button
            className="p-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 transition-colors shadow cursor-pointer"
            title="Radio Contact Driver"
          >
            <Phone className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 2. THE 2 TRIP SIMULATION BUTTONS (MediRush AI vs Normal Case) */}
      <div className="bg-[#0f172a]/95 backdrop-blur-md rounded-2xl p-3 border border-slate-800 shadow-xl space-y-2">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
          Compare Trip Simulations:
        </span>

        {/* Button 1: MediRush AI Smart Emergency Trip */}
        <button
          onClick={() => onSelectTripMode && onSelectTripMode('MEDIRUSH_AI')}
          className={`w-full py-2.5 px-3 rounded-xl text-xs font-mono font-black uppercase tracking-wider flex items-center justify-between transition-all shadow-lg cursor-pointer active:scale-95 border ${
            tripMode === 'MEDIRUSH_AI'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-emerald-400/80 shadow-emerald-600/40 ring-1 ring-emerald-400'
              : 'bg-slate-900 hover:bg-emerald-950/50 text-slate-300 hover:text-emerald-300 border-slate-700'
          }`}
        >
          <div className="flex items-center space-x-1.5">
            <Zap className="w-4 h-4 text-emerald-300 fill-current" />
            <span className="text-[11px]">1. MEDIRUSH AI TRIP</span>
          </div>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300">
            1km Preempt
          </span>
        </button>

        {/* Button 2: Normal Case Ambulance Trip */}
        <button
          onClick={() => onSelectTripMode && onSelectTripMode('NORMAL_CASE')}
          className={`w-full py-2.5 px-3 rounded-xl text-xs font-mono font-black uppercase tracking-wider flex items-center justify-between transition-all shadow-lg cursor-pointer active:scale-95 border ${
            tripMode === 'NORMAL_CASE'
              ? 'bg-gradient-to-r from-red-700 to-amber-800 text-white border-amber-400/80 shadow-amber-700/40 ring-1 ring-amber-400'
              : 'bg-slate-900 hover:bg-red-950/50 text-slate-300 hover:text-amber-300 border-slate-700'
          }`}
        >
          <div className="flex items-center space-x-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-300" />
            <span className="text-[11px]">2. NORMAL CASE TRIP</span>
          </div>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-950 border border-red-500/40 text-red-300">
            Red Lights
          </span>
        </button>
      </div>

      {/* 3. Trip Info & Interactive Destination Selector */}
      <div className="bg-[#0f172a]/90 backdrop-blur-md rounded-2xl p-3.5 border border-slate-800 shadow-xl space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
            Trip Info
          </span>
          <span className={`text-[10px] font-mono font-bold ${tripMode === 'MEDIRUSH_AI' ? 'text-emerald-400' : 'text-red-400'}`}>
            {tripMode === 'MEDIRUSH_AI' ? 'Green Wave ON' : 'City Delay Active'}
          </span>
        </div>

        {/* Origin */}
        <div className="flex items-start space-x-2">
          <div className="p-1 rounded-md bg-emerald-500/20 text-emerald-400 mt-0.5">
            <MapPin className="w-3 h-3" />
          </div>
          <div>
            <span className="text-[9px] text-slate-400 font-mono block">Origin</span>
            <span className="text-xs font-bold text-slate-200">Cyber Towers, Hitec City</span>
          </div>
        </div>

        {/* Destination Dropdown Selector */}
        <div className="flex items-start space-x-2">
          <div className="p-1 rounded-md bg-red-500/20 text-red-400 mt-0.5">
            <Navigation className="w-3 h-3" />
          </div>
          <div className="flex-1">
            <span className="text-[9px] text-slate-400 font-mono block">Destination</span>
            <select
              value={selectedDestination.id}
              onChange={(e) => {
                const found = HYDERABAD_DESTINATIONS.find((d) => d.id === e.target.value);
                if (found) onSelectDestination(found);
              }}
              className="w-full mt-1 bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-lg px-2.5 py-1 text-xs font-bold text-emerald-400 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
            >
              {HYDERABAD_DESTINATIONS.map((dest) => (
                <option key={dest.id} value={dest.id} className="bg-slate-900 text-slate-200">
                  {dest.name} ({dest.totalDistanceKm} km)
                </option>
              ))}
            </select>
            <span className="text-[9px] text-slate-400 mt-0.5 block">{selectedDestination.area}</span>
          </div>
        </div>

        {/* Distance & ETA Row */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
          <div className="bg-slate-900/60 p-1.5 rounded-xl border border-slate-800/80">
            <span className="text-[9px] text-slate-400 uppercase font-mono block">Distance</span>
            <span className="text-sm font-mono font-black text-white">{distanceRemainingKm.toFixed(1)} km</span>
          </div>
          <div className="bg-slate-900/60 p-1.5 rounded-xl border border-slate-800/80">
            <span className="text-[9px] text-slate-400 uppercase font-mono block">ETA</span>
            <span className={`text-sm font-mono font-black ${tripMode === 'MEDIRUSH_AI' ? 'text-emerald-400' : 'text-amber-400'}`}>
              {tripMode === 'MEDIRUSH_AI' ? `${Math.ceil(etaMinutes)} mins` : `${Math.ceil(etaMinutes * 2.1)} mins`}
            </span>
          </div>
        </div>

        <div className="text-[9px] text-slate-400 font-mono flex items-center justify-between pt-0.5">
          <span>{tripMode === 'MEDIRUSH_AI' ? '0 Signal Stops' : '4 Signal Delays'}</span>
          <span className="text-emerald-400 font-bold">{selectedDestination.availableBeds} ICU Beds</span>
        </div>
      </div>

      {/* 4. AI Traffic Status Gauge */}
      <div className="bg-[#0f172a]/90 backdrop-blur-md rounded-2xl p-3 border border-slate-800 shadow-xl text-center space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
            {tripMode === 'MEDIRUSH_AI' ? 'AI Preempted Flow' : 'City Congestion Level'}
          </span>
          <span className={`text-[9px] font-mono ${tripMode === 'MEDIRUSH_AI' ? 'text-emerald-400' : 'text-red-400'}`}>
            {tripMode === 'MEDIRUSH_AI' ? '92% Green Corridor' : 'Heavy Traffic'}
          </span>
        </div>

        <div className="relative flex flex-col items-center justify-center py-1">
          <svg className="w-24 h-13" viewBox="0 0 120 70">
            <path
              d="M 15 65 A 45 45 0 0 1 105 65"
              fill="none"
              stroke="#1e293b"
              strokeWidth="9"
              strokeLinecap="round"
            />
            <path
              d="M 15 65 A 45 45 0 0 1 85 25"
              fill="none"
              stroke="url(#trafficGradient)"
              strokeWidth="9"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="trafficGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="60%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
            </defs>
          </svg>

          <div className="absolute top-5 flex flex-col items-center">
            <span className="text-lg font-black text-white font-mono">
              {tripMode === 'MEDIRUSH_AI' ? '72%' : '28%'}
            </span>
            <span className="text-[8px] text-amber-400 font-bold uppercase">
              {tripMode === 'MEDIRUSH_AI' ? 'Preempted' : 'Normal Flow'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
