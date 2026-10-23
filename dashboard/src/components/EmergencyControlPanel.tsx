import React from 'react';
import { 
  Play, 
  RotateCcw, 
  AlertTriangle, 
  Zap, 
  HeartPulse, 
  Timer, 
  Compass, 
  Gauge, 
  ShieldCheck, 
  Activity 
} from 'lucide-react';

interface EmergencyControlPanelProps {
  isSimulating: boolean;
  onStartSimulation: () => void;
  onResetSimulation: () => void;
  onInjectTrafficJam: () => void;
  ambulanceSpeed: number;
  timeRemainingMin: number;
  baselineTimeMin: number;
  timeSavedMin: number;
  distanceRemainingKm: number;
  signalsClearedCount: number;
  patientCondition: string;
  severity: string;
  activeHospitalName: string;
}

export const EmergencyControlPanel: React.FC<EmergencyControlPanelProps> = ({
  isSimulating,
  onStartSimulation,
  onResetSimulation,
  onInjectTrafficJam,
  ambulanceSpeed,
  timeRemainingMin,
  baselineTimeMin,
  timeSavedMin,
  distanceRemainingKm,
  signalsClearedCount,
  patientCondition,
  severity,
  activeHospitalName
}) => {
  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col space-y-4">
      {/* Header with status badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
            <HeartPulse className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">Live Incident Telemetry</h2>
            <p className="text-xs text-slate-400 font-mono">ID: AMB-DELHI-0104</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-300 border border-red-500/30 uppercase tracking-wider">
            {severity}
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
            {patientCondition.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Target Hospital destination card */}
      <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Target Facility</p>
          <p className="text-sm font-bold text-sky-300 truncate max-w-[220px]">{activeHospitalName || 'Apex Super Specialty Hospital'}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Corridor Status</p>
          <div className="flex items-center space-x-1 text-emerald-400 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Green Wave Locked</span>
          </div>
        </div>
      </div>

      {/* Real-time Telemetry 4-Card Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Speed Gauge */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="flex items-center space-x-1">
              <Gauge className="w-3.5 h-3.5 text-cyan-400" />
              <span>Speed</span>
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">+18 km/h</span>
          </div>
          <p className="text-2xl font-black text-white font-mono">{Math.round(ambulanceSpeed)} <span className="text-xs text-slate-400 font-normal">km/h</span></p>
        </div>

        {/* AI Dynamic ETA */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="flex items-center space-x-1">
              <Timer className="w-3.5 h-3.5 text-emerald-400" />
              <span>AI ETA</span>
            </span>
            <span className="text-[10px] text-emerald-400 font-bold font-mono">-{timeSavedMin}m saved</span>
          </div>
          <p className="text-2xl font-black text-emerald-400 font-mono">{timeRemainingMin.toFixed(1)} <span className="text-xs text-slate-400 font-normal">min</span></p>
        </div>

        {/* Distance Remaining */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="flex items-center space-x-1">
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>Distance</span>
            </span>
          </div>
          <p className="text-2xl font-black text-white font-mono">{distanceRemainingKm.toFixed(1)} <span className="text-xs text-slate-400 font-normal">km</span></p>
        </div>

        {/* Signals Preempted */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="flex items-center space-x-1">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Green Lights</span>
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">100% Flow</span>
          </div>
          <p className="text-2xl font-black text-emerald-300 font-mono">{signalsClearedCount} <span className="text-xs text-slate-400 font-normal">Cleared</span></p>
        </div>
      </div>

      {/* Interactive Simulation Controls */}
      <div className="pt-2 border-t border-slate-800 flex flex-col space-y-2.5">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Live Simulation Controls</p>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onStartSimulation}
            disabled={isSimulating}
            className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
              isSimulating
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-600/30'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{isSimulating ? 'Run in Progress...' : 'Start Emergency Run'}</span>
          </button>

          <button
            onClick={onInjectTrafficJam}
            className="py-2.5 px-3 rounded-xl text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 flex items-center justify-center space-x-1.5 transition-colors"
            title="Simulate sudden traffic bottleneck to demonstrate AI dynamic rerouting"
          >
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Inject Traffic Jam</span>
          </button>
        </div>

        <button
          onClick={onResetSimulation}
          className="w-full py-2 px-3 rounded-xl text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 flex items-center justify-center space-x-2 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Simulation & Signals</span>
        </button>
      </div>
    </div>
  );
};
