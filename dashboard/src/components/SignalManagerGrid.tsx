import React from 'react';
import { TrafficCone, ShieldAlert, Check, Power, Radio } from 'lucide-react';

interface Signal {
  signal_id: string;
  name: string;
  latitude: number;
  longitude: number;
  current_state: 'RED' | 'YELLOW' | 'GREEN' | 'PREEMPTION_GREEN';
  is_preempted: boolean;
}

interface SignalManagerGridProps {
  signals: Signal[];
  onToggleOverride: (signalId: string, newState: 'RED' | 'GREEN') => void;
}

export const SignalManagerGrid: React.FC<SignalManagerGridProps> = ({
  signals,
  onToggleOverride
}) => {
  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <TrafficCone className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-bold text-slate-100">Smart Traffic Signals & Green Wave</h2>
        </div>
        <div className="flex items-center space-x-1.5 text-xs text-slate-400">
          <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="font-mono">ESP32 Mesh Sync</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[340px] overflow-y-auto pr-1">
        {signals.map((sig) => {
          const isGreen = sig.current_state === 'GREEN' || sig.current_state === 'PREEMPTION_GREEN' || sig.is_preempted;
          const isYellow = sig.current_state === 'YELLOW';

          return (
            <div
              key={sig.signal_id}
              className={`p-3.5 rounded-xl border transition-all ${
                sig.is_preempted
                  ? 'bg-emerald-950/40 border-emerald-500/50 shadow-md shadow-emerald-500/10'
                  : 'bg-slate-900/60 border-slate-800/80'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-200">{sig.name}</h4>
                  <p className="text-[10px] font-mono text-slate-500">{sig.signal_id}</p>
                </div>

                {/* State Bulb */}
                <div className="flex items-center space-x-1.5">
                  <span
                    className={`inline-block w-3 h-3 rounded-full ${
                      isGreen
                        ? 'bg-emerald-400 shadow-lg shadow-emerald-500 animate-pulse'
                        : isYellow
                        ? 'bg-amber-400 shadow-lg shadow-amber-500'
                        : 'bg-red-500 shadow-lg shadow-red-500'
                    }`}
                  />
                  <span className="text-[11px] font-bold font-mono text-slate-300 uppercase">
                    {sig.is_preempted ? 'PREEMPTED' : sig.current_state}
                  </span>
                </div>
              </div>

              {/* Status & Manual Action */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                <span className="text-[11px] text-slate-400">
                  {sig.is_preempted ? '🚨 Green Corridor Priority' : 'Cyclic Auto-Sync'}
                </span>

                <button
                  onClick={() => onToggleOverride(sig.signal_id, isGreen ? 'RED' : 'GREEN')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center space-x-1 transition-colors ${
                    isGreen
                      ? 'bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30'
                      : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  <Power className="w-3 h-3" />
                  <span>{isGreen ? 'Force Red' : 'Force Green'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
