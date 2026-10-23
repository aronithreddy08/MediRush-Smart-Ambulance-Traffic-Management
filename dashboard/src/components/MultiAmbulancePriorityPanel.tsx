import React from 'react';
import { AmbulanceUnit, IntersectionScenario, SCENARIOS, checkTrajectoryConflict } from '../data/multiAmbulanceData';
import { 
  ShieldAlert, 
  Activity, 
  Heart, 
  Zap, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Radio, 
  Grid, 
  Layers, 
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

interface MultiAmbulancePriorityPanelProps {
  currentScenario: IntersectionScenario;
  onSelectScenario: (scenario: IntersectionScenario) => void;
  ambulances: AmbulanceUnit[];
}

export const MultiAmbulancePriorityPanel: React.FC<MultiAmbulancePriorityPanelProps> = ({
  currentScenario,
  onSelectScenario,
  ambulances,
}) => {
  // Sort ambulances by priority score
  const sortedAmbulances = [...ambulances].sort((a, b) => b.priorityScore - a.priorityScore);

  return (
    <div className="w-full flex flex-col space-y-3.5">
      {/* 1. SCENARIO SELECTOR STRIP */}
      <div className="bg-[#0f172a]/95 backdrop-blur-md rounded-2xl p-3 border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center space-x-2">
          <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
            Test Scenarios:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {SCENARIOS.map((sc) => {
            const isSelected = sc.id === currentScenario.id;
            return (
              <button
                key={sc.id}
                onClick={() => onSelectScenario(sc)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold uppercase transition-all shadow-md cursor-pointer border ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-emerald-600/40'
                    : 'bg-slate-900/90 text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {sc.name.split(' ')[0]} {sc.name.split(' ')[1] || ''}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. DYNAMIC PRIORITY LEADERBOARD & VEHICLE TELEMETRY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {sortedAmbulances.map((amb, idx) => {
          const isClearing = amb.status === 'PRIORITY_ACTIVE' || amb.status === 'CROSSING';
          const isQueued = amb.status === 'PRIORITY_QUEUED';
          const isDone = amb.status === 'CLEARED';

          return (
            <div
              key={amb.id}
              className={`rounded-2xl border p-3.5 flex flex-col justify-between transition-all duration-300 shadow-xl ${
                isClearing
                  ? 'border-emerald-500/80 bg-emerald-950/25 shadow-emerald-950/50 ring-1 ring-emerald-500/50'
                  : isQueued
                  ? 'border-amber-500/60 bg-amber-950/20 shadow-amber-950/30'
                  : isDone
                  ? 'border-slate-800/80 bg-slate-950/40 opacity-70'
                  : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
              }`}
            >
              {/* Header: Rank + Callsign + Priority Score */}
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center text-[10px] font-mono font-black text-white">
                      #{idx + 1}
                    </span>
                    <span className="text-xs font-bold text-white font-mono">{amb.callsign}</span>
                  </div>

                  {/* Priority Score Badge */}
                  <div className="px-2 py-0.5 rounded-lg bg-[#020617] border border-slate-700 text-right">
                    <span className="text-[8px] text-slate-400 uppercase font-mono block">Score</span>
                    <span className="text-xs font-mono font-black" style={{ color: amb.themeColorHex }}>
                      {amb.priorityScore}
                    </span>
                  </div>
                </div>

                {/* Patient Triage & Condition */}
                <div className="mt-2.5 space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-slate-400 uppercase">Criticality:</span>
                    <span className="font-bold text-red-400">{amb.patientCriticalityScore}/100</span>
                  </div>

                  <p className="text-[11px] font-semibold text-slate-200 line-clamp-2 leading-tight">
                    {amb.patientCondition}
                  </p>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1">
                    <span>Approach:</span>
                    <span className="font-bold text-slate-300">
                      {amb.approachDirection} → {amb.turnManeuver}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>Destination:</span>
                    <span className="font-bold text-slate-300 truncate max-w-[130px]">
                      {amb.destinationHospital.split(',')[0]}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Footer */}
              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
                <div className="text-[10px] font-mono text-slate-400">
                  <span>{amb.currentDistanceMeters}m</span> &bull; <span>ETA {amb.currentEtaSeconds}s</span>
                </div>

                {/* Live Action Pill */}
                <span
                  className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase flex items-center gap-1 ${
                    isClearing
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse'
                      : isQueued
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : isDone
                      ? 'bg-slate-800 text-slate-400'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isClearing ? 'bg-emerald-400' : isQueued ? 'bg-amber-400' : isDone ? 'bg-slate-500' : 'bg-blue-400'
                    }`}
                  ></span>
                  <span>{isClearing ? 'EM-GREEN' : isQueued ? 'QUEUED' : isDone ? 'CLEARED' : 'APPROACH'}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. CONFLICT DETECTION MATRIX & SAFETY VERIFICATION CARD */}
      <div className="bg-[#0f172a]/90 backdrop-blur-md rounded-2xl p-4 border border-slate-800 shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        
        {/* Left Explanation */}
        <div className="lg:col-span-4 space-y-1">
          <div className="flex items-center space-x-2 text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              V2X Conflict Resolution Engine
            </h4>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Multi-ambulance collision prevention matrix continuously evaluates crossing vectors and enforces strict sequential clearance when trajectories overlap.
          </p>
        </div>

        {/* Center Conflict Grid Visualizer */}
        <div className="lg:col-span-8 overflow-x-auto">
          <div className="min-w-[450px] bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <div className="grid grid-cols-5 gap-1.5 text-center font-mono text-[9px]">
              <div className="font-bold text-slate-500 p-1">CONFLICT</div>
              {ambulances.map((a) => (
                <div key={a.id} className="font-bold text-slate-300 p-1 truncate" style={{ color: a.themeColorHex }}>
                  {a.callsign.split(' ')[0]}
                </div>
              ))}

              {ambulances.map((rowAmb) => (
                <React.Fragment key={rowAmb.id}>
                  <div className="font-bold text-slate-300 p-1 truncate text-left" style={{ color: rowAmb.themeColorHex }}>
                    {rowAmb.callsign.split(' ')[0]}
                  </div>

                  {ambulances.map((colAmb) => {
                    const isSelf = rowAmb.id === colAmb.id;
                    const hasConflict = checkTrajectoryConflict(
                      rowAmb.approachDirection,
                      rowAmb.turnManeuver,
                      colAmb.approachDirection,
                      colAmb.turnManeuver
                    );

                    return (
                      <div
                        key={colAmb.id}
                        className={`p-1 rounded font-bold transition-all ${
                          isSelf
                            ? 'bg-slate-900 text-slate-600'
                            : hasConflict
                            ? 'bg-red-950/70 text-red-400 border border-red-900/60'
                            : 'bg-emerald-950/70 text-emerald-300 border border-emerald-900/60'
                        }`}
                      >
                        {isSelf ? '—' : hasConflict ? 'CONFLICT' : 'CLEAR'}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
