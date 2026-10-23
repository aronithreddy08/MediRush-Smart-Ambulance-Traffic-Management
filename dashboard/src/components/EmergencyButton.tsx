import React from 'react';
import { AlertOctagon, Flame, ShieldAlert, Sparkles, Navigation2, CheckCircle2, RotateCcw } from 'lucide-react';

interface EmergencyButtonProps {
  isEmergencyActive: boolean;
  onToggleEmergency: () => void;
  emergencyCount: number;
}

export const EmergencyButton: React.FC<EmergencyButtonProps> = ({
  isEmergencyActive,
  onToggleEmergency,
  emergencyCount,
}) => {
  return (
    <div className="relative flex flex-col items-center justify-center py-8 sm:py-12 my-auto">
      {/* Background Radar / Siren Pulse Waves */}
      <div className="relative flex items-center justify-center">
        {/* Animated Outer Radar Rings */}
        <div
          className={`absolute rounded-full pointer-events-none transition-all duration-700 ${
            isEmergencyActive
              ? 'w-80 h-80 sm:w-96 sm:h-96 bg-red-600/30 radar-ring-1 border border-red-500/50'
              : 'w-72 h-72 sm:w-80 sm:h-80 bg-red-500/10 radar-ring-1 border border-red-500/20'
          }`}
        />
        <div
          className={`absolute rounded-full pointer-events-none transition-all duration-700 ${
            isEmergencyActive
              ? 'w-72 h-72 sm:w-80 sm:h-80 bg-red-600/25 radar-ring-2'
              : 'w-64 h-64 sm:w-72 sm:h-72 bg-red-500/10 radar-ring-2'
          }`}
        />
        <div
          className={`absolute rounded-full pointer-events-none transition-all duration-700 ${
            isEmergencyActive
              ? 'w-60 h-60 sm:w-68 sm:h-68 bg-red-500/20 radar-ring-3'
              : 'w-56 h-56 sm:w-60 sm:h-60 bg-red-500/10 radar-ring-3'
          }`}
        />

        {/* The Master Emergency Button */}
        <button
          id="main-emergency-btn"
          onClick={onToggleEmergency}
          aria-label="Emergency Trigger Button"
          className={`relative z-20 w-52 h-52 sm:w-64 sm:h-64 rounded-full flex flex-col items-center justify-center text-white transition-all duration-300 transform active:scale-95 focus:outline-none select-none cursor-pointer group ${
            isEmergencyActive
              ? 'bg-gradient-to-b from-red-500 via-red-600 to-rose-700 emergency-glow-active border-4 border-white/80 ring-8 ring-red-500/50 animate-pulse'
              : 'bg-gradient-to-b from-red-600 via-red-700 to-red-900 emergency-glow-standby border-4 border-red-400/60 ring-4 ring-red-600/30 hover:scale-105 hover:ring-8 hover:ring-red-500/40'
          }`}
        >
          {/* Subtle button reflection highlight */}
          <div className="absolute inset-x-8 top-3 h-10 rounded-t-full bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />

          {/* Button Icon & Labels */}
          <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
            <div className={`p-2 rounded-full transition-transform duration-300 group-hover:scale-110 ${
              isEmergencyActive ? 'bg-white/20 text-white' : 'text-white'
            }`}>
              <AlertOctagon className="w-14 h-14 sm:w-16 sm:h-16 stroke-[2.2] filter drop-shadow-md" />
            </div>

            <div className="text-center">
              <span className="block text-2xl sm:text-3xl font-black tracking-wider uppercase font-sans drop-shadow-lg">
                {isEmergencyActive ? 'DISPATCHED' : 'EMERGENCY'}
              </span>
              <span className="block text-[11px] sm:text-xs font-mono font-bold tracking-widest text-red-100 uppercase opacity-90">
                {isEmergencyActive ? 'TAP TO RESET' : 'TAP TO INITIATE'}
              </span>
            </div>
          </div>
        </button>
      </div>

      {/* Emergency Status & Action Hints */}
      <div className="mt-8 text-center max-w-md px-4 space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-xs font-mono text-slate-300">
          <span className={`w-2 h-2 rounded-full ${isEmergencyActive ? 'bg-red-400 animate-ping' : 'bg-emerald-400'}`} />
          <span>Status:</span>
          <span className={`font-bold ${isEmergencyActive ? 'text-red-400' : 'text-emerald-400'}`}>
            {isEmergencyActive ? 'EMERGENCY PROTOCOL ACTIVE' : 'READY FOR DISPATCH'}
          </span>
        </div>

        <p className="text-xs text-slate-400">
          {isEmergencyActive
            ? 'Emergency trigger active. Ready to coordinate AI dynamic routing & Green Corridor traffic signals in next stage.'
            : 'Primary control trigger. Press to simulate urgent medical dispatch for this ambulance unit.'}
        </p>
      </div>
    </div>
  );
};
