import React from 'react';
import { Truck, User, Radio, ShieldCheck, AlertCircle, Clock, Zap } from 'lucide-react';

interface AmbulanceInfoCardProps {
  ambulanceId: string;
  driverName: string;
  isEmergencyActive: boolean;
  onAmbulanceIdChange?: (id: string) => void;
  onDriverNameChange?: (name: string) => void;
}

export const AmbulanceInfoCard: React.FC<AmbulanceInfoCardProps> = ({
  ambulanceId,
  driverName,
  isEmergencyActive,
}) => {
  return (
    <div className={`w-full glass-panel rounded-2xl p-5 border transition-all duration-300 ${
      isEmergencyActive 
        ? 'border-red-500/50 bg-red-950/20 shadow-lg shadow-red-950/50' 
        : 'border-slate-800 hover:border-slate-700'
    }`}>
      {/* Card Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
        <div className="flex items-center space-x-2.5">
          <div className={`p-2 rounded-xl border ${
            isEmergencyActive 
              ? 'bg-red-500/20 text-red-400 border-red-500/40' 
              : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
          }`}>
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wide">Ambulance Unit Profile</h2>
            <p className="text-xs text-slate-400">Emergency Medical Service Vehicle</p>
          </div>
        </div>

        {/* Live Status Badge */}
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider uppercase border transition-all ${
          isEmergencyActive
            ? 'bg-red-900/60 text-red-300 border-red-500/60 shadow-lg shadow-red-900/50 animate-pulse'
            : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
        }`}>
          <span className={`w-2 h-2 rounded-full ${
            isEmergencyActive ? 'bg-red-400 animate-ping' : 'bg-emerald-400 animate-pulse'
          }`}></span>
          <span>{isEmergencyActive ? 'ACTIVE DISPATCH' : 'STANDBY / READY'}</span>
        </div>
      </div>

      {/* Ambulance & Driver Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
        {/* Ambulance ID */}
        <div className="bg-slate-900/60 rounded-xl p-3.5 border border-slate-800/80 flex items-center space-x-3.5">
          <div className="p-2.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
            <Truck className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block">Ambulance ID</span>
            <span className="text-sm font-mono font-bold text-white tracking-wider truncate block">
              {ambulanceId}
            </span>
          </div>
        </div>

        {/* Driver Name */}
        <div className="bg-slate-900/60 rounded-xl p-3.5 border border-slate-800/80 flex items-center space-x-3.5">
          <div className="p-2.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <User className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block">Driver Name</span>
            <span className="text-sm font-bold text-white truncate block">
              {driverName}
            </span>
          </div>
        </div>

        {/* Current Status */}
        <div className="bg-slate-900/60 rounded-xl p-3.5 border border-slate-800/80 flex items-center space-x-3.5">
          <div className={`p-2.5 rounded-lg border ${
            isEmergencyActive 
              ? 'bg-red-500/20 text-red-400 border-red-500/30' 
              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          }`}>
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block">Current Status</span>
            <span className={`text-sm font-bold truncate block ${
              isEmergencyActive ? 'text-red-400 font-mono' : 'text-emerald-400 font-mono'
            }`}>
              {isEmergencyActive ? '🚨 EMERGENCY RUN' : '🟢 IDLE / READY'}
            </span>
          </div>
        </div>

        {/* Modular Telemetry / Dispatch Readiness */}
        <div className="bg-slate-900/60 rounded-xl p-3.5 border border-slate-800/80 flex items-center space-x-3.5">
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Zap className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block">Unit Readiness</span>
            <span className="text-sm font-mono font-bold text-amber-300">
              100% OPERATIONAL
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
