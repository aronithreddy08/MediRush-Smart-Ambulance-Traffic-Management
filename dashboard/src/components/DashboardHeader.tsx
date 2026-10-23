import React, { useState, useEffect } from 'react';
import { HeartPulse, Bell, User, AlertOctagon, Volume2, VolumeX, ShieldAlert, Navigation, GitFork, Map as MapIcon, Gamepad2 } from 'lucide-react';

interface DashboardHeaderProps {
  isEmergencyActive: boolean;
  onToggleEmergency: () => void;
  alertCount: number;
  activeMode: 'CORRIDOR_NAVIGATION' | 'MULTI_AMBULANCE_PRIORITY';
  onModeChange: (mode: 'CORRIDOR_NAVIGATION' | 'MULTI_AMBULANCE_PRIORITY') => void;
  viewMode?: 'MAP_VIEW' | 'DRIVE_VIEW';
  onViewModeChange?: (view: 'MAP_VIEW' | 'DRIVE_VIEW') => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  isEmergencyActive,
  onToggleEmergency,
  alertCount,
  activeMode,
  onModeChange,
  viewMode = 'MAP_VIEW',
  onViewModeChange,
}) => {
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
      setDateStr(
        now.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="w-full bg-[#0b1120] border-b border-slate-800/90 px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-50 shadow-2xl">
      {/* Brand & Project Name */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center text-white shadow-lg shadow-red-600/30 border border-red-400/40">
          <HeartPulse className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h1 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
            <span>MediRush</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800/60 font-bold uppercase">
              1KM V2X PRIORITY
            </span>
          </h1>
          <p className="text-[11px] text-slate-400 font-medium hidden md:block">
            AI-Powered Smart Ambulance &bull; Dynamic Routing &amp; Traffic Management System
          </p>
        </div>
      </div>

      {/* Center Controls: View Switcher (MAP VIEW vs DRIVE VIEW) & Mode Switcher */}
      <div className="flex flex-wrap items-center gap-2.5">
        
        {/* 1. MAP VIEW vs DRIVE VIEW Switcher */}
        {onViewModeChange && activeMode === 'CORRIDOR_NAVIGATION' && (
          <div className="flex items-center bg-[#070b14] p-1 rounded-xl border border-slate-800 shadow-inner">
            <button
              onClick={() => onViewModeChange('MAP_VIEW')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all flex items-center space-x-1.5 cursor-pointer ${
                viewMode === 'MAP_VIEW'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>MAP VIEW</span>
            </button>

            <button
              onClick={() => onViewModeChange('DRIVE_VIEW')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all flex items-center space-x-1.5 cursor-pointer ${
                viewMode === 'DRIVE_VIEW'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/40 border border-emerald-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Gamepad2 className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
              <span>DRIVE VIEW</span>
            </button>
          </div>
        )}

        {/* 2. System Mode Tabs (Arterial Navigation vs 4-Way Junction) */}
        <div className="flex items-center bg-[#070b14] p-1 rounded-xl border border-slate-800 shadow-inner">
          <button
            onClick={() => onModeChange('CORRIDOR_NAVIGATION')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeMode === 'CORRIDOR_NAVIGATION'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Arterial Nav</span>
          </button>

          <button
            onClick={() => onModeChange('MULTI_AMBULANCE_PRIORITY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeMode === 'MULTI_AMBULANCE_PRIORITY'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/40 animate-pulse'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <GitFork className="w-3.5 h-3.5" />
            <span>4-Way Junction</span>
          </button>
        </div>
      </div>

      {/* Master Emergency Button & System Clock */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleEmergency}
          id="header-emergency-toggle-btn"
          className={`px-4 py-2 rounded-xl text-xs font-mono font-black uppercase tracking-wider flex items-center space-x-2 transition-all duration-300 shadow-xl cursor-pointer active:scale-95 border select-none ${
            isEmergencyActive
              ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white border-red-400/80 shadow-red-600/50 animate-pulse'
              : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500'
          }`}
        >
          <span className={`w-2.5 h-2.5 rounded-full ${isEmergencyActive ? 'bg-white animate-ping' : 'bg-red-500'}`}></span>
          <span>{isEmergencyActive ? 'EMERGENCY ACTIVE' : 'TRIGGER EMERGENCY'}</span>
        </button>

        {/* Live Clock */}
        <div className="hidden lg:flex flex-col items-end text-right font-mono border-l border-slate-800 pl-3">
          <span className="text-xs font-bold text-white">{timeStr || '10:24:00 AM'}</span>
          <span className="text-[10px] text-slate-500">{dateStr}</span>
        </div>
      </div>
    </header>
  );
};
