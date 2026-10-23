import React from 'react';
import { Building2, BedDouble, Stethoscope, CheckCircle, Award } from 'lucide-react';

interface Hospital {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  available_icu_beds: number;
  total_icu_beds: number;
  readiness_score: number;
  specializations: string;
}

interface RankedHospitalData {
  hospital: Hospital;
  distance_km: number;
  estimated_eta_min: number;
  specialty_match: boolean;
  icu_availability_ratio: number;
  suitability_score: number;
  is_recommended: boolean;
  recommendation_reason: string;
}

interface HospitalTriageGridProps {
  rankedHospitals: RankedHospitalData[];
  selectedHospitalId: string;
  onSelectHospital: (hospital: Hospital) => void;
}

export const HospitalTriageGrid: React.FC<HospitalTriageGridProps> = ({
  rankedHospitals,
  selectedHospitalId,
  onSelectHospital
}) => {
  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Building2 className="w-5 h-5 text-sky-400" />
          <h2 className="text-base font-bold text-slate-100">Hospital Triage Matrix (MCDM)</h2>
        </div>
        <span className="text-xs font-mono text-slate-400">
          {rankedHospitals.length} Connected Facilities
        </span>
      </div>

      <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
        {rankedHospitals.map((item) => {
          const hosp = item.hospital;
          const isSelected = hosp.id === selectedHospitalId;
          const isTopMatch = item.is_recommended;

          return (
            <div
              key={hosp.id}
              onClick={() => onSelectHospital(hosp)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-sky-950/40 border-sky-500/60 shadow-lg shadow-sky-500/10'
                  : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-850 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-bold text-slate-100">{hosp.name}</h3>
                  {isTopMatch && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center space-x-1">
                      <Award className="w-3 h-3" />
                      <span>AI Top Match</span>
                    </span>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-400 font-mono">
                    {item.suitability_score}% Match
                  </span>
                </div>
              </div>

              {/* Stats badges */}
              <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                <div className="flex items-center space-x-1 text-slate-400">
                  <span className="font-mono text-slate-200">{item.distance_km} km</span>
                </div>
                <div className="flex items-center space-x-1 text-slate-400">
                  <span>ETA:</span>
                  <span className="font-mono font-bold text-sky-300">{item.estimated_eta_min}m</span>
                </div>
                <div className="flex items-center space-x-1 text-slate-400">
                  <BedDouble className="w-3.5 h-3.5 text-amber-400" />
                  <span className={`font-mono font-bold ${hosp.available_icu_beds > 3 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {hosp.available_icu_beds}/{hosp.total_icu_beds} ICU
                  </span>
                </div>
              </div>

              {/* Recommendation Reason */}
              {item.recommendation_reason && (
                <p className="text-[11px] text-slate-400 italic bg-slate-950/50 px-2 py-1 rounded border border-slate-800">
                  💡 {item.recommendation_reason}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
