import React from 'react';
import { CheckCircle2, RotateCcw, Award, Zap, Clock, ShieldCheck, Heart } from 'lucide-react';

interface TripSummaryScreenProps {
  summary: {
    totalTimeMin: string;
    timeSavedMin: number;
    signalsCleared: number;
    avgSpeedKmh: number;
    hospitalName: string;
  };
  onReturnHome: () => void;
}

export const TripSummaryScreen: React.FC<TripSummaryScreenProps> = ({
  summary,
  onReturnHome
}) => {
  return (
    <div className="flex-1 flex flex-col justify-between p-6 max-w-md mx-auto w-full text-center space-y-6">
      {/* Success Badge */}
      <div className="my-auto space-y-5">
        <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500/60 mx-auto flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/20">
          <CheckCircle2 className="w-12 h-12" />
        </div>

        <div>
          <span className="px-3 py-1 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase tracking-widest font-mono">
            MISSION ACCOMPLISHED
          </span>
          <h2 className="text-2xl font-black text-white mt-2">Patient Delivered Safely</h2>
          <p className="text-xs text-slate-400 mt-1">{summary.hospitalName}</p>
        </div>

        {/* 4 Stats Grid */}
        <div className="grid grid-cols-2 gap-3 text-left">
          <div className="glass-card p-3.5 rounded-2xl">
            <p className="text-[10px] text-slate-400 uppercase font-mono">Total Transit Time</p>
            <p className="text-xl font-black text-white font-mono">{summary.totalTimeMin} min</p>
          </div>

          <div className="glass-card p-3.5 rounded-2xl border-emerald-500/40 bg-emerald-950/30">
            <p className="text-[10px] text-emerald-400 uppercase font-mono">AI Time Saved</p>
            <p className="text-xl font-black text-emerald-400 font-mono">+{summary.timeSavedMin} min</p>
          </div>

          <div className="glass-card p-3.5 rounded-2xl">
            <p className="text-[10px] text-slate-400 uppercase font-mono">Average Speed</p>
            <p className="text-xl font-black text-white font-mono">{summary.avgSpeedKmh} km/h</p>
          </div>

          <div className="glass-card p-3.5 rounded-2xl">
            <p className="text-[10px] text-slate-400 uppercase font-mono">Green Corridors</p>
            <p className="text-xl font-black text-emerald-300 font-mono">{summary.signalsCleared} Cleared</p>
          </div>
        </div>
      </div>

      {/* Return to Ready Standby Button */}
      <button
        onClick={onReturnHome}
        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-sm shadow-xl shadow-red-600/30 flex items-center justify-center space-x-2 transition-all"
      >
        <RotateCcw className="w-4 h-4" />
        <span>Return to Standby Mode</span>
      </button>
    </div>
  );
};
