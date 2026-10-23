import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { Route, Zap, ShieldCheck, Activity, CheckCircle2 } from 'lucide-react';

interface BottomAnalyticsProps {
  selectedDistanceKm: number;
  selectedTimeMin: number;
  alerts: { time: string; text: string; type?: 'info' | 'success' | 'alert' }[];
}

const TRAFFIC_PREDICTION_DATA = [
  { time: 'Now', congestion: 45 },
  { time: '+15m', congestion: 52 },
  { time: '+30m', congestion: 78 },
  { time: '+45m', congestion: 64 },
  { time: '+60m', congestion: 85 },
];

export const BottomAnalytics: React.FC<BottomAnalyticsProps> = ({
  selectedDistanceKm,
  selectedTimeMin,
  alerts,
}) => {
  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-2">
      
      {/* 1. AI Route Analysis (Matching Reference) */}
      <div className="bg-[#0f172a]/90 backdrop-blur-md rounded-2xl p-4 border border-slate-800 shadow-xl flex flex-col justify-between">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
            AI Route Analysis
          </span>
          <span className="text-[10px] font-mono text-emerald-400">Optimal</span>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2">
          {/* Best Route */}
          <div className="bg-emerald-950/30 border border-emerald-500/40 p-2.5 rounded-xl">
            <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase block">
              Best Route (Selected)
            </span>
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              <span className="text-base font-black text-white font-mono">{selectedDistanceKm.toFixed(1)} km</span>
              <span className="text-xs font-bold text-emerald-400 font-mono">{selectedTimeMin} min</span>
            </div>
            <span className="text-[9px] font-mono text-emerald-300">Fastest corridor</span>
          </div>

          {/* Alternate Routes */}
          <div className="bg-slate-900/60 border border-slate-800 p-2.5 rounded-xl flex flex-col justify-between">
            <div>
              <span className="text-[9px] font-mono text-slate-400 uppercase block">Alternate Route 1</span>
              <span className="text-xs font-bold text-slate-300 font-mono">{(selectedDistanceKm * 1.3).toFixed(1)} km &bull; {selectedTimeMin + 4} min</span>
            </div>
            <div className="mt-1 pt-1 border-t border-slate-800/80">
              <span className="text-[9px] font-mono text-slate-400 uppercase block">Alternate Route 2</span>
              <span className="text-xs font-bold text-slate-400 font-mono">{(selectedDistanceKm * 1.5).toFixed(1)} km &bull; {selectedTimeMin + 7} min</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Traffic Prediction (AI) Sparkline */}
      <div className="bg-[#0f172a]/90 backdrop-blur-md rounded-2xl p-4 border border-slate-800 shadow-xl flex flex-col justify-between">
        <div className="flex items-center justify-between pb-1 border-b border-slate-800">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
            Traffic Prediction (AI)
          </span>
          <span className="text-[10px] font-mono text-amber-400">+60m Forecast</span>
        </div>

        <div className="h-20 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={TRAFFIC_PREDICTION_DATA} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 9 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 9 }} domain={[30, 100]} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 10 }}
                formatter={(val) => [`${val}% Congestion`, 'AI Forecast']}
              />
              <Line
                type="monotone"
                dataKey="congestion"
                stroke="#f97316"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#f97316' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. System Status (Online Checklist) */}
      <div className="bg-[#0f172a]/90 backdrop-blur-md rounded-2xl p-4 border border-slate-800 shadow-xl flex flex-col justify-between">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
            System Status
          </span>
          <span className="text-[10px] font-mono text-emerald-400">All Systems Nominal</span>
        </div>

        <div className="space-y-1.5 pt-1 text-[11px] font-mono">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">GPS Tracking</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Online
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Traffic Signal Control</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Online
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">AI Traffic Prediction</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Online
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Server Connection</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Online
            </span>
          </div>
        </div>
      </div>

      {/* 4. Recent Alerts Live Log */}
      <div className="bg-[#0f172a]/90 backdrop-blur-md rounded-2xl p-4 border border-slate-800 shadow-xl flex flex-col justify-between">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
            Recent Alerts
          </span>
          <span className="text-[10px] font-mono text-red-400">Live Log</span>
        </div>

        <div className="space-y-1.5 pt-1 overflow-y-auto max-h-24 pr-1 text-[10px] font-mono">
          {alerts.map((alert, idx) => (
            <div key={idx} className="flex items-start space-x-2">
              <span className="text-slate-500 flex-shrink-0">{alert.time}</span>
              <span
                className={`truncate ${
                  alert.type === 'success'
                    ? 'text-emerald-400 font-semibold'
                    : alert.type === 'alert'
                    ? 'text-amber-300 font-semibold'
                    : 'text-slate-300'
                }`}
              >
                {alert.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
