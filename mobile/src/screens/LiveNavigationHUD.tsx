import React from 'react';
import { 
  Navigation, 
  ShieldCheck, 
  AlertTriangle, 
  Timer, 
  Compass, 
  Zap, 
  CheckCircle2, 
  ArrowUpRight,
  Radio
} from 'lucide-react';

interface LiveNavigationHUDProps {
  currentSpeedKmh: number;
  remainingDistanceKm: number;
  remainingTimeMin: number;
  timeSavedMin: number;
  hospitalName: string;
  rerouteAlert: string | null;
  upcomingSignalName: string;
  isSignalPreempted: boolean;
  onCompleteTrip: () => void;
}

export const LiveNavigationHUD: React.FC<LiveNavigationHUDProps> = ({
  currentSpeedKmh,
  remainingDistanceKm,
  remainingTimeMin,
  timeSavedMin,
  hospitalName,
  rerouteAlert,
  upcomingSignalName,
  isSignalPreempted,
  onCompleteTrip
}) => {
  return (
    <div className="flex-1 flex flex-col justify-between p-5 max-w-md mx-auto w-full space-y-4">
      {/* Top Turn Instruction Banner */}
      <div className="glass-card rounded-2xl p-4 border border-emerald-500/30 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-emerald-400 font-mono font-semibold">IN 350 METERS</p>
            <h3 className="text-sm font-bold text-slate-100">Continue on Central Expressway</h3>
          </div>
        </div>

        <span className="text-xs font-bold font-mono text-slate-300">
          {remainingDistanceKm.toFixed(1)} km
        </span>
      </div>

      {/* Dynamic Reroute Notification Banner if present */}
      {rerouteAlert && (
        <div className="p-3 rounded-xl bg-amber-950/70 border border-amber-500/50 flex items-center space-x-2 text-xs text-amber-200 animate-pulse">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>{rerouteAlert}</span>
        </div>
      )}

      {/* Center Speedometer & Green Wave HUD */}
      <div className="glass-card rounded-3xl p-6 border border-slate-800 flex flex-col items-center justify-center space-y-4 text-center">
        {/* Destination pill */}
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-950/70 border border-sky-500/40 text-sky-300 truncate max-w-[280px]">
          Target: {hospitalName}
        </span>

        {/* Big Speed Gauge */}
        <div className="flex flex-col items-center">
          <span className="text-6xl font-black text-white font-mono tracking-tight">
            {Math.round(currentSpeedKmh)}
          </span>
          <span className="text-xs font-bold text-slate-400 tracking-widest uppercase font-mono">
            KM / H
          </span>
        </div>

        {/* Green Wave Radar Status Bar */}
        <div className="w-full p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-left">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div>
              <p className="text-[10px] text-slate-400 font-mono uppercase">Next Signal Priority</p>
              <p className="text-xs font-bold text-slate-200 truncate max-w-[170px]">{upcomingSignalName}</p>
            </div>
          </div>

          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase tracking-wider font-mono">
            GREEN WAVE LOCKED
          </span>
        </div>
      </div>

      {/* ETA & Time Saved Card */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card p-3 rounded-2xl">
          <div className="flex items-center space-x-1.5 text-slate-400 text-xs mb-1">
            <Timer className="w-3.5 h-3.5 text-emerald-400" />
            <span>AI Dynamic ETA</span>
          </div>
          <p className="text-2xl font-black text-emerald-400 font-mono">
            {remainingTimeMin.toFixed(1)} <span className="text-xs font-normal text-slate-400">min</span>
          </p>
        </div>

        <div className="glass-card p-3 rounded-2xl">
          <div className="flex items-center space-x-1.5 text-slate-400 text-xs mb-1">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Time Saved</span>
          </div>
          <p className="text-2xl font-black text-amber-300 font-mono">
            -{timeSavedMin.toFixed(1)} <span className="text-xs font-normal text-slate-400">min</span>
          </p>
        </div>
      </div>

      {/* Arrived at Destination Trigger */}
      <button
        onClick={onCompleteTrip}
        className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xl shadow-emerald-600/30 flex items-center justify-center space-x-2 active:scale-98 transition-all"
      >
        <CheckCircle2 className="w-4 h-4" />
        <span>Arrived at Hospital — Complete Trip</span>
      </button>
    </div>
  );
};
