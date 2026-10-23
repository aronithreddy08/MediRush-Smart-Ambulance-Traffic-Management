import React, { useState } from 'react';
import { 
  Building2, 
  BedDouble, 
  ArrowRight, 
  CheckCircle2, 
  Award, 
  Heart, 
  Flame, 
  Baby, 
  Activity, 
  AlertCircle 
} from 'lucide-react';

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

interface RankedHospital {
  hospital: Hospital;
  distance_km: number;
  estimated_eta_min: number;
  specialty_match: boolean;
  icu_availability_ratio: number;
  suitability_score: number;
  is_recommended: boolean;
  recommendation_reason: string;
}

interface HospitalTriageScreenProps {
  rankedHospitals: RankedHospital[];
  onConfirmHospital: (hospital: Hospital, condition: string) => void;
  onCancel: () => void;
}

const CONDITIONS = [
  { id: 'CARDIAC_ARREST', label: 'Cardiac Arrest', icon: Heart, color: 'text-red-400' },
  { id: 'TRAUMA', label: 'Trauma & Accident', icon: AlertCircle, color: 'text-amber-400' },
  { id: 'STROKE', label: 'Acute Stroke', icon: Activity, color: 'text-purple-400' },
  { id: 'BURN', label: 'Severe Burn', icon: Flame, color: 'text-orange-400' },
  { id: 'PEDIATRIC', label: 'Pediatric Critical', icon: Baby, color: 'text-sky-400' }
];

export const HospitalTriageScreen: React.FC<HospitalTriageScreenProps> = ({
  rankedHospitals,
  onConfirmHospital,
  onCancel
}) => {
  const [selectedCondition, setSelectedCondition] = useState<string>('CARDIAC_ARREST');
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>(
    rankedHospitals[0]?.hospital?.id || ''
  );

  const selectedHospital = rankedHospitals.find((r) => r.hospital.id === selectedHospitalId)?.hospital || rankedHospitals[0]?.hospital;

  return (
    <div className="flex-1 flex flex-col justify-between p-5 max-w-md mx-auto w-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-white">Emergency Triage & Hospital</h2>
          <p className="text-xs text-slate-400">AI-ranked by Proximity, Specialty & ICU</p>
        </div>
        <button
          onClick={onCancel}
          className="text-xs font-semibold text-slate-400 hover:text-slate-200 px-2 py-1"
        >
          Cancel
        </button>
      </div>

      {/* Patient Condition Selector Chips */}
      <div className="space-y-1.5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
          Patient Condition
        </p>
        <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-none">
          {CONDITIONS.map((cond) => {
            const Icon = cond.icon;
            const isSelected = selectedCondition === cond.id;
            return (
              <button
                key={cond.id}
                onClick={() => setSelectedCondition(cond.id)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                    : 'glass-card text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : cond.color}`} />
                <span>{cond.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Hospital Ranking Cards List */}
      <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[380px] pr-1">
        {rankedHospitals.map((item) => {
          const hosp = item.hospital;
          const isSelected = hosp.id === selectedHospitalId;
          const isTopMatch = item.is_recommended;

          return (
            <div
              key={hosp.id}
              onClick={() => setSelectedHospitalId(hosp.id)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-sky-950/40 border-sky-500/70 shadow-lg shadow-sky-500/10'
                  : 'glass-card border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between mb-1.5">
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-bold text-slate-100">{hosp.name}</h4>
                  {isTopMatch && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center space-x-1">
                      <Award className="w-2.5 h-2.5" />
                      <span>TOP MATCH</span>
                    </span>
                  )}
                </div>

                <span className="text-xs font-bold font-mono text-emerald-400">
                  {item.suitability_score}%
                </span>
              </div>

              {/* Stats & Beds */}
              <div className="flex items-center space-x-4 text-xs text-slate-300 mb-2">
                <span className="font-mono">{item.distance_km} km</span>
                <span className="font-bold text-sky-400 font-mono">ETA: {item.estimated_eta_min} min</span>
                <span className="flex items-center space-x-1 text-amber-400 font-mono font-semibold">
                  <BedDouble className="w-3.5 h-3.5" />
                  <span>{hosp.available_icu_beds} ICU Free</span>
                </span>
              </div>

              {item.recommendation_reason && (
                <p className="text-[11px] text-slate-400 italic">
                  💡 {item.recommendation_reason}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Confirm & Launch Route Button */}
      <button
        onClick={() => selectedHospital && onConfirmHospital(selectedHospital, selectedCondition)}
        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-sm shadow-xl shadow-red-600/30 flex items-center justify-center space-x-2 active:scale-98 transition-all"
      >
        <span>Lock Destination & Launch Corridor</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};
