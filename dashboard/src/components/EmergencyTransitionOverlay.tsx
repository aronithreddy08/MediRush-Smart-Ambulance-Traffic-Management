import React, { useEffect, useState } from 'react';
import { ShieldAlert, Zap, Radio, CheckCircle2, Navigation, Activity, ArrowRight } from 'lucide-react';
import { HospitalDestination } from '../data/destinationsData';

interface EmergencyTransitionOverlayProps {
  destination: HospitalDestination;
  tripMode: 'MEDIRUSH_AI' | 'NORMAL_CASE';
  onComplete: () => void;
}

export const EmergencyTransitionOverlay: React.FC<EmergencyTransitionOverlayProps> = ({
  destination,
  tripMode,
  onComplete,
}) => {
  const [step, setStep] = useState(0);

  const steps = [
    { title: 'Locating Emergency Vehicle', detail: 'Ambulance TS 09 AB 1234 • GPS Lock Acquired' },
    { title: 'Calculating Optimal Corridor', detail: `Destination: ${destination.name} (${destination.totalDistanceKm} km)` },
    { title: 'Analyzing Real-Time Congestion', detail: 'Dynamic AI Lane Allocation & Reroute Engine Active' },
    { title: 'Connecting 1KM V2X Preemption Mesh', detail: `${destination.signals.length} Traffic Signals Linked • Green Wave Armed` },
  ];

  useEffect(() => {
    const timer1 = setTimeout(() => setStep(1), 350);
    const timer2 = setTimeout(() => setStep(2), 750);
    const timer3 = setTimeout(() => setStep(3), 1150);
    const timer4 = setTimeout(() => setStep(4), 1550);
    const timerDone = setTimeout(() => onComplete(), 1950);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timerDone);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4 select-none animate-fadeIn">
      <div className="bg-[#0b1120] border-2 border-red-500/60 max-w-lg w-full rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(239,68,68,0.35)] relative overflow-hidden flex flex-col space-y-5">
        
        {/* Animated Background Scanner Line */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse"></div>

        {/* Top Header */}
        <div className="flex items-center space-x-3.5 pb-3 border-b border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/50 flex items-center justify-center text-red-400 shadow-lg shadow-red-600/30">
            <Zap className="w-6 h-6 fill-current animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-mono font-black text-red-400 uppercase tracking-widest block">
              SYSTEM DISPATCH INITIALIZATION
            </span>
            <h2 className="text-base sm:text-lg font-black text-white tracking-wide truncate">
              INITIALIZING EMERGENCY RESPONSE
            </h2>
          </div>
        </div>

        {/* Dispatch Checklist Sequence */}
        <div className="space-y-3 font-mono text-xs">
          {steps.map((s, idx) => {
            const isDone = step > idx;
            const isCurrent = step === idx;

            return (
              <div
                key={idx}
                className={`p-3 rounded-2xl border transition-all duration-300 flex items-center space-x-3 ${
                  isDone
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                    : isCurrent
                    ? 'bg-slate-900 border-red-500 text-white shadow-lg animate-pulse'
                    : 'bg-slate-950/50 border-slate-800/80 text-slate-500 opacity-40'
                }`}
              >
                <div className="flex-shrink-0">
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : isCurrent ? (
                    <div className="w-4 h-4 rounded-full border-2 border-red-400 border-t-transparent animate-spin" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-700" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate">{s.title}</div>
                  <div className="text-[10px] text-slate-400 truncate">{s.detail}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Trip Mode Pill & Skip Button */}
        <div className="pt-2 flex items-center justify-between">
          <span className={`text-[10px] font-mono px-2.5 py-1 rounded-full font-bold uppercase ${
            tripMode === 'MEDIRUSH_AI'
              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
              : 'bg-amber-950 text-amber-300 border border-amber-500/40'
          }`}>
            {tripMode === 'MEDIRUSH_AI' ? '🚀 1KM V2X Preemption Wave' : '🛑 Normal Municipal Cycle'}
          </span>

          <button
            onClick={onComplete}
            className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold uppercase transition-all shadow-lg flex items-center space-x-1 cursor-pointer"
          >
            <span>START DRIVE</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
