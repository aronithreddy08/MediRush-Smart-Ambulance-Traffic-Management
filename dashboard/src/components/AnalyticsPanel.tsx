import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { BarChart3, TrendingUp, Zap, Clock, ShieldCheck } from 'lucide-react';

interface AnalyticsData {
  system_status: string;
  total_emergency_runs: number;
  average_time_saved_minutes: number;
  average_time_saved_percentage: string;
  green_wave_clearance_rate: string;
  total_green_lights_preempted: number;
  reroutes_successfully_executed: number;
  ai_prediction_accuracy: string;
  benchmark_comparison: Array<{
    category: string;
    baseline_eta_min: number;
    medirush_eta_min: number;
    saved_min: number;
  }>;
  hourly_congestion_pattern: Array<{
    hour: string;
    standard_delay_min: number;
    ai_avoidance_min: number;
  }>;
}

interface AnalyticsPanelProps {
  data: AnalyticsData | null;
}

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ data }) => {
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Average Time Saved</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-black text-emerald-400 font-mono">
            {data.average_time_saved_minutes} <span className="text-sm font-normal text-slate-400">min/trip</span>
          </p>
          <p className="text-xs text-emerald-300 font-medium mt-1">
            ⚡ {data.average_time_saved_percentage} reduction in transit delay
          </p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Green Wave Clearance</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-black text-white font-mono">
            {data.green_wave_clearance_rate}
          </p>
          <p className="text-xs text-slate-400 font-medium mt-1">
            {data.total_green_lights_preempted} signals cleared on emergency run
          </p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>AI Congestion Accuracy</span>
            <TrendingUp className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-3xl font-black text-sky-300 font-mono">
            {data.ai_prediction_accuracy}
          </p>
          <p className="text-xs text-sky-400 font-medium mt-1">
            RandomForest + Gradient Boosting
          </p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Dynamic Reroutes</span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-black text-amber-300 font-mono">
            {data.reroutes_successfully_executed}
          </p>
          <p className="text-xs text-amber-400 font-medium mt-1">
            Bottlenecks dynamically bypassed
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Benchmark Comparison Bar Chart */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span>Response Time Benchmark: MediRush AI vs Standard GPS (min)</span>
          </h3>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.benchmark_comparison} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="category" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="baseline_eta_min" name="Standard GPS ETA" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="medirush_eta_min" name="MediRush AI Dynamic ETA" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hourly Congestion Trend Area Chart */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-sky-400" />
            <span>Peak Hour Delay Reduction Curve (Minutes Saved)</span>
          </h3>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.hourly_congestion_pattern} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDelay" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAvoid" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.7}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="hour" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Area type="monotone" dataKey="standard_delay_min" name="City Delay" stroke="#ef4444" fillOpacity={1} fill="url(#colorDelay)" />
                <Area type="monotone" dataKey="ai_avoidance_min" name="MediRush Time Saved" stroke="#10b981" fillOpacity={1} fill="url(#colorAvoid)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
