import React from 'react';
import { HeartPulse, ShieldAlert, Activity, Sparkles } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="w-full border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Project Info */}
        <div className="flex items-center space-x-3.5">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center shadow-lg shadow-red-500/25 border border-red-400/30">
              <HeartPulse className="w-7 h-7 text-white animate-pulse" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-slate-950"></span>
            </span>
          </div>
          
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
                <span>Medi</span>
                <span className="text-red-500">Rush</span>
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded bg-red-950/80 text-red-400 border border-red-500/30">
                PROTOTYPE v1.0
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-300">
              AI-Powered Smart Ambulance Emergency Coordination, Dynamic Routing &amp; Traffic Management System
            </p>
          </div>
        </div>

        {/* Tagline & System Health */}
        <div className="flex flex-col sm:flex-row items-center gap-3 md:gap-6">
          <div className="text-center sm:text-right">
            <div className="text-xs font-bold text-red-400 flex items-center justify-center sm:justify-end gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Faster Routes. Faster Response. Saving Lives.</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              B.Tech Capstone Project
            </div>
          </div>

          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono text-slate-300">
            <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>SYS STATUS:</span>
            <span className="text-emerald-400 font-bold">ONLINE</span>
          </div>
        </div>
      </div>
    </header>
  );
};
