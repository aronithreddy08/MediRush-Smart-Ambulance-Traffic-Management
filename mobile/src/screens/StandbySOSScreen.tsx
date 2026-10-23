import React from 'react';
import { HeartPulse, Radio, Shield, Zap, AlertOctagon, Sparkles, Navigation } from 'lucide-react';

interface StandbySOSScreenProps {
  onTriggerSOS: () => void;
  driverName: string;
  vehicleId: string;
  isBackendConnected: boolean;
}

export const StandbySOSScreen: React.FC<StandbySOSScreenProps> = ({
  onTriggerSOS,
  driverName,
  vehicleId,
  isBackendConnected
}) => {
  return (
    <div className="flex-1 flex flex-col justify-between p-6 max-w-md mx-auto w-full">
      {/* Top Driver Status Bar */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100">{driverName}</h2>
            <p className="text-xs font-mono text-slate-400">{vehicleId}</p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>READY</span>
        </div>
      </div>

      {/* Center Giant Tactile SOS Emergency Button */}
      <div className="my-auto flex flex-col items-center justify-center text-center space-y-6">
        <div className="relative flex items-center justify-center">
          {/* Pulsing Radar Ring */}
          <div className="absolute w-64 h-64 rounded-full bg-red-600/20 animate-ping"></div>
          <div className="absolute w-52 h-52 rounded-full bg-red-600/30 animate-pulse"></div>

          {/* Master SOS Button */}
          <button
            onClick={onTriggerSOS}
            className="relative z-10 w-44 h-44 rounded-full glass-sos-glow border-4 border-red-400/80 active:scale-95 transition-transform flex flex-col items-center justify-center text-white space-y-1 group shadow-2xl"
          >
            <AlertOctagon className="w-12 h-12 text-white fill-current group-hover:scale-110 transition-transform" />
            <span className="text-2xl font-black tracking-wider uppercase">SOS</span>
            <span className="text-[10px] font-bold text-red-200 tracking-widest font-mono">TRIGGER EMERGENCY</span>
          </button>
        </div>

        <div className="space-y-1">
          <h3 className="text-lg font-bold text-slate-100">Tap to Initiate Emergency Run</h3>
          <p className="text-xs text-slate-400 max-w-[280px]">
            Instantly locks GPS coordinates, calculates AI optimal routing, and activates Green Wave traffic signals.
          </p>
        </div>
      </div>

      {/* Bottom Telemetry Bar */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="glass-card p-2.5 rounded-xl">
          <p className="text-[10px] text-slate-400 uppercase font-mono">GPS Lock</p>
          <p className="text-xs font-bold text-emerald-400">High Precision</p>
        </div>
        <div className="glass-card p-2.5 rounded-xl">
          <p className="text-[10px] text-slate-400 uppercase font-mono">Signal Mesh</p>
          <p className="text-xs font-bold text-sky-400">Auto-Preempt</p>
        </div>
        <div className="glass-card p-2.5 rounded-xl">
          <p className="text-[10px] text-slate-400 uppercase font-mono">AI Routing</p>
          <p className="text-xs font-bold text-purple-400">Dynamic</p>
        </div>
      </div>
    </div>
  );
};
