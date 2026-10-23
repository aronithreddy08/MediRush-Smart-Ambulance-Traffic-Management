import React from 'react';
import { Navigation, Cpu, TrafficCone, Building2 } from 'lucide-react';

export const ModularModulesPreview: React.FC = () => {
  const futureModules = [
    {
      title: 'Dynamic Routing Engine',
      description: 'Stage 2: Real-time congestion-aware emergency path calculation',
      icon: <Navigation className="w-4 h-4 text-sky-400" />,
      tag: 'Stage 2',
      color: 'border-sky-500/20 bg-sky-950/20 text-sky-400',
    },
    {
      title: 'Smart Traffic Signals',
      description: 'Stage 3: Automated Green Wave corridor preemption mesh',
      icon: <TrafficCone className="w-4 h-4 text-emerald-400" />,
      tag: 'Stage 3',
      color: 'border-emerald-500/20 bg-emerald-950/20 text-emerald-400',
    },
    {
      title: 'AI Corridor Coordination',
      description: 'Stage 4: Predictive AI dispatch & ETA optimization algorithms',
      icon: <Cpu className="w-4 h-4 text-purple-400" />,
      tag: 'Stage 4',
      color: 'border-purple-500/20 bg-purple-950/20 text-purple-400',
    },
    {
      title: 'Hospital Triage Sync',
      description: 'Stage 5: Live ICU bed allocation & ER readiness telemetry',
      icon: <Building2 className="w-4 h-4 text-amber-400" />,
      tag: 'Stage 5',
      color: 'border-amber-500/20 bg-amber-950/20 text-amber-400',
    },
  ];

  return (
    <div className="w-full pt-4">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <span>System Architecture Roadmap</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
            Modular Slots
          </span>
        </h3>
        <span className="text-[11px] text-slate-400 font-mono">
          Ready for Next Stage Integration
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {futureModules.map((m, idx) => (
          <div
            key={idx}
            className="glass-panel p-3.5 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-colors flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                {m.icon}
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${m.color}`}>
                {m.tag}
              </span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-200">{m.title}</h4>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                {m.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
