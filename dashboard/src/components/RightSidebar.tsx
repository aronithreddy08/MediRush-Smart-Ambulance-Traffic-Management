import React from 'react';
import { TrafficSignal } from '../data/destinationsData';
import { Video, Maximize2, ShieldCheck, Eye, Radio, AlertTriangle } from 'lucide-react';

interface RightSidebarProps {
  signals: TrafficSignal[];
  activeSignalId: string | null;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({ signals, activeSignalId }) => {
  return (
    <div className="w-full lg:w-80 flex flex-col space-y-3 flex-shrink-0">
      <div className="bg-[#0f172a]/90 backdrop-blur-md rounded-2xl p-3.5 border border-slate-800 shadow-xl flex-1 flex flex-col space-y-2.5">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
          <div className="flex items-center space-x-2 text-slate-300">
            <Video className="w-4 h-4 text-emerald-400" />
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300">
              Live Intersections &bull; 1km V2X
            </span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 animate-pulse">● Live Stream</span>
        </div>

        {/* Intersection Camera Cards List */}
        <div className="space-y-2.5 overflow-y-auto max-h-[calc(100vh-270px)] pr-1">
          {signals.map((sig, idx) => {
            const isPreempted = sig.currentState === 'PREEMPTED_GREEN';
            const is1KmAlert = sig.currentState === 'ALERT_1KM';
            const isCleared = sig.currentState === 'CLEARED';

            return (
              <div
                key={sig.id}
                className={`rounded-xl border p-2.5 transition-all duration-300 ${
                  isPreempted
                    ? 'border-emerald-500/60 bg-emerald-950/20 shadow-lg shadow-emerald-950/40'
                    : is1KmAlert
                    ? 'border-amber-500/60 bg-amber-950/25 shadow-lg shadow-amber-950/40 animate-pulse'
                    : isCleared
                    ? 'border-slate-800/60 bg-slate-950/40 opacity-70'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                {/* Title & Signal Status Badge */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[11px] font-bold text-white">
                      {idx + 1}. {sig.name}
                    </span>
                  </div>

                  {/* Signal Status Pill */}
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase flex items-center gap-1 ${
                      isPreempted
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse'
                        : is1KmAlert
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-ping'
                        : isCleared
                        ? 'bg-slate-800 text-slate-400 border border-slate-700'
                        : 'bg-red-500/20 text-red-300 border border-red-500/40'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isPreempted
                          ? 'bg-emerald-400'
                          : is1KmAlert
                          ? 'bg-amber-400'
                          : isCleared
                          ? 'bg-slate-400'
                          : 'bg-red-400'
                      }`}
                    ></span>
                    <span>
                      {isPreempted
                        ? `GREEN (${sig.timerSeconds}s)`
                        : is1KmAlert
                        ? `1KM ALERT`
                        : isCleared
                        ? `CLEARED`
                        : `RED (${sig.timerSeconds}s)`}
                    </span>
                  </span>
                </div>

                {/* CCTV Camera Snapshot with Green Corridor Overlay */}
                <div className="relative rounded-lg overflow-hidden h-20 border border-slate-800 group cursor-pointer">
                  <img
                    src={sig.cameraImage}
                    alt={sig.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-90 contrast-110"
                  />
                  
                  {/* Neon Green Corridor Overlay Line if Preempted */}
                  {isPreempted && (
                    <div className="absolute inset-x-10 bottom-0 top-0 pointer-events-none flex flex-col items-center justify-center">
                      <div className="w-1.5 h-full bg-emerald-400/90 shadow-[0_0_15px_#10b981] animate-pulse"></div>
                    </div>
                  )}

                  {/* 1km Warning Pulse Banner */}
                  {is1KmAlert && (
                    <div className="absolute inset-0 bg-amber-950/60 flex items-center justify-center text-amber-300 text-[10px] font-mono font-bold uppercase tracking-wider backdrop-blur-[1px]">
                      ⚠️ 1KM V2X CLEARING IN PROGRESS
                    </div>
                  )}

                  {/* Camera overlay watermark */}
                  <div className="absolute top-1 left-1.5 bg-slate-950/80 px-1.5 py-0.5 rounded text-[8px] font-mono text-slate-300 border border-slate-700">
                    CAM-{idx + 1} &bull; {sig.intersectionName}
                  </div>

                  <div className="absolute bottom-1 right-1.5 bg-slate-950/80 p-1 rounded text-slate-400 hover:text-white border border-slate-700">
                    <Maximize2 className="w-2.5 h-2.5" />
                  </div>
                </div>

                {/* Preemption Status Info */}
                <div className="mt-1 flex items-center justify-between text-[9px] font-mono text-slate-400">
                  <span className="truncate">{sig.crossTrafficStatus}</span>
                  <span
                    className={
                      isPreempted
                        ? 'text-emerald-400 font-bold'
                        : is1KmAlert
                        ? 'text-amber-400 font-bold'
                        : isCleared
                        ? 'text-slate-400'
                        : 'text-red-400'
                    }
                  >
                    {isPreempted
                      ? '🟢 GREEN WAVE GRANTED'
                      : is1KmAlert
                      ? '🟡 1KM EARLY ALERT'
                      : isCleared
                      ? '⚪ PASSED'
                      : '🔴 STANDARD CYCLE'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
