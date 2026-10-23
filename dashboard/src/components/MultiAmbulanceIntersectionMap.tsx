import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import confetti from 'canvas-confetti';
import { 
  AmbulanceUnit, 
  IntersectionScenario, 
  ClearanceState,
  checkTrajectoryConflict, 
  calculateAmbulancePriority,
  CYBER_JUNCTION_CENTER 
} from '../data/multiAmbulanceData';
import { getRealisticAmbulanceSvg } from './RealisticVehicleSvg';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Activity, 
  Radio, 
  Play, 
  Pause, 
  RotateCcw, 
  Zap, 
  ArrowRight, 
  CheckCircle2,
  Clock,
  Navigation,
  Crosshair,
  Lock
} from 'lucide-react';

interface MultiAmbulanceIntersectionMapProps {
  scenario: IntersectionScenario;
  onScenarioChange?: (scenarioId: string) => void;
  onAmbulancesUpdate: (ambulances: AmbulanceUnit[]) => void;
  onAddAlert: (text: string, type?: 'info' | 'success' | 'alert') => void;
}

function getBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos(lat1Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export const MultiAmbulanceIntersectionMap: React.FC<MultiAmbulanceIntersectionMapProps> = ({
  scenario,
  onAmbulancesUpdate,
  onAddAlert,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const vehicleMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const signalMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const roadLayersRef = useRef<L.Layer[]>([]);

  // Simulation playback state
  const [isPlaying, setIsPlaying] = useState(true);
  const ambulancesRef = useRef<AmbulanceUnit[]>(scenario.ambulances);
  const [ambulancesState, setAmbulancesState] = useState<AmbulanceUnit[]>(scenario.ambulances);
  const [clearancePhaseName, setClearancePhaseName] = useState<string>('PHASE 1: EVALUATING PRIORITY');
  const [activeClearingIds, setActiveClearingIds] = useState<string[]>([]);
  const [allCleared, setAllCleared] = useState(false);

  // Sync state when scenario changes
  useEffect(() => {
    const fresh = scenario.ambulances.map((a) => ({
      ...a,
      progress: 0,
      status: 'APPROACHING' as const,
      currentDistanceMeters: a.initialDistanceMeters,
      currentEtaSeconds: a.initialEtaSeconds,
      speedKmh: 55,
    }));
    ambulancesRef.current = fresh;
    setAmbulancesState(fresh);
    setActiveClearingIds([]);
    setAllCleared(false);
    setIsPlaying(true);
    onAddAlert(`Loaded 4-Way Scenario: ${scenario.name}`, 'info');
  }, [scenario]);

  // Determine Priority Queue order
  const priorityRankedAmbulances = useMemo(() => {
    return [...ambulancesState].sort((a, b) => b.priorityScore - a.priorityScore);
  }, [ambulancesState]);

  // 4 Signal positions relative to intersection center
  const signalConfigs = useMemo(() => {
    return [
      { id: 'sig_north', dir: 'NORTH', name: 'North Stop Line (Kondapur)', coords: [17.4502, 78.3815] as [number, number] },
      { id: 'sig_south', dir: 'SOUTH', name: 'South Stop Line (Mindspace)', coords: [17.4468, 78.3815] as [number, number] },
      { id: 'sig_east', dir: 'EAST', name: 'East Stop Line (Madhapur 100ft)', coords: [17.4485, 78.3832] as [number, number] },
      { id: 'sig_west', dir: 'WEST', name: 'West Stop Line (Inorbit)', coords: [17.4485, 78.3798] as [number, number] },
    ];
  }, []);

  // Helper: Create Physical Mast-Arm Signal Marker
  const createPhysicalSignalIcon = (sig: typeof signalConfigs[0], isGreen: boolean, isQueued: boolean) => {
    return L.divIcon({
      className: `custom-mast-signal-${sig.id}`,
      html: `
        <div class="relative flex flex-col items-center justify-center cursor-pointer select-none">
          <!-- Active Green Wave Halo -->
          ${isGreen ? '<div class="absolute -inset-4 rounded-full bg-emerald-500/40 animate-ping pointer-events-none"></div>' : ''}
          
          <!-- Cantilever Mast Arm Assembly -->
          <div class="flex items-center">
            <!-- Mast Pole -->
            <div class="w-1.5 h-14 bg-gradient-to-b from-slate-400 via-slate-600 to-slate-800 rounded-b shadow-2xl flex flex-col justify-end">
              <div class="w-2.5 h-1 bg-yellow-400 self-center"></div>
            </div>

            <!-- Signal Housing Box with Hood Visors -->
            <div class="w-6 h-13 rounded-md bg-[#020617] border-2 ${
              isGreen ? 'border-emerald-500 shadow-[0_0_15px_#10b981]' : isQueued ? 'border-amber-500 shadow-[0_0_10px_#f59e0b]' : 'border-red-600'
            } shadow-2xl flex flex-col items-center justify-between py-1 px-0.5 z-20">
              <!-- Red Light with Hood -->
              <div class="w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                !isGreen
                  ? 'bg-red-500 shadow-[0_0_10px_#ef4444] border border-red-300'
                  : 'bg-red-950/60 opacity-20'
              }"></div>
              <!-- Amber Light with Hood -->
              <div class="w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                isQueued
                  ? 'bg-amber-400 shadow-[0_0_10px_#f59e0b] border border-amber-200 animate-pulse'
                  : 'bg-amber-950/60 opacity-20'
              }"></div>
              <!-- Green Light with Hood -->
              <div class="w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                isGreen
                  ? 'bg-emerald-400 shadow-[0_0_14px_#10b981] border border-emerald-200 animate-pulse'
                  : 'bg-emerald-950/60 opacity-20'
              }"></div>
            </div>
          </div>

          <!-- Status Tag -->
          <div class="mt-1 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold whitespace-nowrap bg-[#020617]/95 border ${
            isGreen ? 'border-emerald-500 text-emerald-300' : isQueued ? 'border-amber-500 text-amber-300' : 'border-slate-800 text-slate-400'
          }">
            ${isGreen ? '🟢 GREEN WAVE' : isQueued ? '🔴 HOLD (QUEUED)' : '🔴 RED'}
          </div>
        </div>
      `,
      iconSize: [32, 60],
      iconAnchor: [16, 30],
    });
  };

  // --- 1. Initialize Leaflet Map with Real Road Geometry & Crosswalks ---
  useEffect(() => {
    if (!mapContainerRef.current) return;

    delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    const map = L.map(mapContainerRef.current, {
      center: scenario.centerCoords,
      zoom: 17,
      zoomControl: false,
    });
    mapInstanceRef.current = map;

    // Dark Map Tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Clear previous road layers
    roadLayersRef.current.forEach((l) => l.remove());
    roadLayersRef.current = [];

    // 1. Draw Real Asphalt Road Network Overlay (Wide Dual-Lane Road Corridors)
    const northSouthRoad = L.polyline(
      [
        [17.4580, 78.3815],
        [17.4390, 78.3815],
      ],
      { color: '#1e293b', weight: 36, opacity: 0.95, lineCap: 'square' }
    ).addTo(map);

    const eastWestRoad = L.polyline(
      [
        [17.4485, 78.3720],
        [17.4485, 78.3910],
      ],
      { color: '#1e293b', weight: 36, opacity: 0.95, lineCap: 'square' }
    ).addTo(map);

    // Center Yellow Dashed Divider Lines
    const nsDivider = L.polyline(
      [
        [17.4580, 78.3815],
        [17.4390, 78.3815],
      ],
      { color: '#eab308', weight: 2, dashArray: '8, 8', opacity: 0.8 }
    ).addTo(map);

    const ewDivider = L.polyline(
      [
        [17.4485, 78.3720],
        [17.4485, 78.3910],
      ],
      { color: '#eab308', weight: 2, dashArray: '8, 8', opacity: 0.8 }
    ).addTo(map);

    // 2. Intersection Conflict Box
    const bounds: L.LatLngBoundsExpression = [
      [scenario.centerCoords[0] - 0.0010, scenario.centerCoords[1] - 0.0010],
      [scenario.centerCoords[0] + 0.0010, scenario.centerCoords[1] + 0.0010],
    ];
    const conflictBox = L.rectangle(bounds, {
      color: '#f59e0b',
      weight: 2,
      dashArray: '6, 6',
      fillColor: '#f59e0b',
      fillOpacity: 0.08,
    }).addTo(map);

    // 3. Zebra Crosswalks at 4 Entrances
    const crosswalks = [
      // North Crosswalk
      L.polyline([[17.4502, 78.3807], [17.4502, 78.3823]], { color: '#ffffff', weight: 6, dashArray: '4, 4', opacity: 0.9 }).addTo(map),
      // South Crosswalk
      L.polyline([[17.4468, 78.3807], [17.4468, 78.3823]], { color: '#ffffff', weight: 6, dashArray: '4, 4', opacity: 0.9 }).addTo(map),
      // East Crosswalk
      L.polyline([[17.4477, 78.3832], [17.4493, 78.3832]], { color: '#ffffff', weight: 6, dashArray: '4, 4', opacity: 0.9 }).addTo(map),
      // West Crosswalk
      L.polyline([[17.4477, 78.3798], [17.4493, 78.3798]], { color: '#ffffff', weight: 6, dashArray: '4, 4', opacity: 0.9 }).addTo(map),
    ];

    roadLayersRef.current.push(northSouthRoad, eastWestRoad, nsDivider, ewDivider, conflictBox, ...crosswalks);

    // Center Junction Label
    const centerBadge = L.divIcon({
      className: 'custom-center-badge',
      html: `
        <div class="px-2.5 py-1 rounded-lg bg-[#020617]/95 border border-amber-500/60 text-[10px] font-mono font-bold text-amber-300 shadow-xl flex items-center gap-1.5 whitespace-nowrap select-none">
          <span class="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
          <span>4-WAY CONFLICT ZONE</span>
        </div>
      `,
      iconSize: [160, 26],
      iconAnchor: [80, 13],
    });
    L.marker(scenario.centerCoords, { icon: centerBadge }).addTo(map);

    return () => {
      map.remove();
    };
  }, [scenario]);

  // Interpolate position along waypoints
  const getAmbulancePoint = (amb: AmbulanceUnit, t: number) => {
    const pts = amb.waypoints;
    const clampedT = Math.max(0, Math.min(1, t));
    const totalSegments = pts.length - 1;
    const segFloat = clampedT * totalSegments;
    const segIdx = Math.min(Math.floor(segFloat), totalSegments - 1);
    const segT = segFloat - segIdx;

    const p1 = pts[segIdx];
    const p2 = pts[segIdx + 1];

    const lat = p1[0] + (p2[0] - p1[0]) * segT;
    const lng = p1[1] + (p2[1] - p1[1]) * segT;
    const heading = getBearing(p1[0], p1[1], p2[0], p2[1]);

    return { lat, lng, heading };
  };

  // --- 2. Multi-Ambulance Animation & Priority Loop ---
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();
    let parentUpdateThrottle = 0;

    const loop = (now: number) => {
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      if (isPlaying) {
        const currentList = ambulancesRef.current;
        
        // 1. Identify highest priority ambulance that hasn't finished clearing
        const pending = [...currentList]
          .filter((a) => a.status !== 'CLEARED')
          .sort((a, b) => b.priorityScore - a.priorityScore);

        if (pending.length === 0) {
          if (!allCleared) {
            setAllCleared(true);
            setClearancePhaseName('ALL AMBULANCES CLEARED SAFELY');
            confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
            onAddAlert('All ambulances cleared Cyber Towers intersection with 0 collisions!', 'success');
          }
        } else {
          const primaryLead = pending[0];
          const clearingGroup: AmbulanceUnit[] = [primaryLead];

          // Check if any other pending ambulance has non-conflicting parallel path
          for (let i = 1; i < pending.length; i++) {
            const candidate = pending[i];
            const hasConflict = clearingGroup.some((c) =>
              checkTrajectoryConflict(
                c.approachDirection,
                c.turnManeuver,
                candidate.approachDirection,
                candidate.turnManeuver
              )
            );
            if (!hasConflict) {
              clearingGroup.push(candidate);
            }
          }

          const clearingIds = clearingGroup.map((c) => c.id);
          setActiveClearingIds(clearingIds);

          if (clearingGroup.length > 1) {
            setClearancePhaseName(
              `DUAL CONCURRENT CLEARANCE: ${clearingGroup.map((c) => c.callsign.split(' ')[0]).join(' + ')} (Safe Parallel)`
            );
          } else {
            setClearancePhaseName(
              `PHASE CLEARANCE: ${primaryLead.callsign} (${primaryLead.approachDirection} → ${primaryLead.turnManeuver}) • Score: ${primaryLead.priorityScore}`
            );
          }

          // 2. Advance each ambulance along its real road route
          const stopLineProgress = 0.42; // Stop line before junction entrance

          const updatedList = currentList.map((amb) => {
            if (amb.status === 'CLEARED') return amb;

            const isGrantedPriority = clearingIds.includes(amb.id);
            let nextProgress = amb.progress;
            let nextStatus: ClearanceState = amb.status;
            let nextSpeed = amb.speedKmh;

            if (isGrantedPriority) {
              // Granted Green -> Smooth non-stop crossing
              nextProgress += delta * 0.09; // crossing speed
              nextSpeed = 62;

              if (nextProgress >= 0.95) {
                nextStatus = 'CLEARED';
                onAddAlert(`🟢 INTERSECTION CLEAR: ${amb.callsign} cleared junction safely`, 'success');
              } else if (nextProgress >= stopLineProgress) {
                nextStatus = 'CROSSING';
              } else {
                nextStatus = 'PRIORITY_ACTIVE';
              }
            } else {
              // Lower priority -> Must hold at red stop line!
              if (amb.progress < stopLineProgress) {
                nextProgress = Math.min(stopLineProgress, amb.progress + delta * 0.06);
                nextStatus = 'APPROACHING';
                nextSpeed = 40;
              } else {
                nextProgress = stopLineProgress;
                nextStatus = 'PRIORITY_QUEUED';
                nextSpeed = 0; // Stopped at red hold line
              }
            }

            const distRemaining = Math.max(0, Math.round((1 - nextProgress) * amb.initialDistanceMeters));
            const etaRemaining = Math.max(0, Math.round((1 - nextProgress) * amb.initialEtaSeconds));

            return {
              ...amb,
              progress: nextProgress,
              status: nextStatus,
              currentDistanceMeters: distRemaining,
              currentEtaSeconds: etaRemaining,
              speedKmh: nextSpeed,
            };
          });

          ambulancesRef.current = updatedList;

          // Throttled UI state sync (every 200ms)
          parentUpdateThrottle += delta;
          if (parentUpdateThrottle > 0.2) {
            parentUpdateThrottle = 0;
            setAmbulancesState(updatedList);
            onAmbulancesUpdate(updatedList);
          }
        }
      }

      // --- 3. Update Vehicle & Signal HTML Markers on Leaflet Map ---
      const map = mapInstanceRef.current;
      if (map) {
        // Update Signal Markers
        signalConfigs.forEach((sig) => {
          const isGreen = ambulancesRef.current.some(
            (a) => a.approachDirection === sig.dir && (a.status === 'PRIORITY_ACTIVE' || a.status === 'CROSSING')
          );
          const isQueued = ambulancesRef.current.some(
            (a) => a.approachDirection === sig.dir && a.status === 'PRIORITY_QUEUED'
          );

          let marker = signalMarkersRef.current.get(sig.id);
          if (!marker) {
            marker = L.marker(sig.coords, {
              icon: createPhysicalSignalIcon(sig, isGreen, isQueued),
            }).addTo(map);
            signalMarkersRef.current.set(sig.id, marker);
          } else {
            marker.setIcon(createPhysicalSignalIcon(sig, isGreen, isQueued));
          }
        });

        // Update Realistic Ambulance Vehicles
        ambulancesRef.current.forEach((amb) => {
          const pt = getAmbulancePoint(amb, amb.progress);
          const isClearing = amb.status === 'PRIORITY_ACTIVE' || amb.status === 'CROSSING';
          const isQueued = amb.status === 'PRIORITY_QUEUED';

          const vehicleHtml = `
            <div class="relative flex flex-col items-center justify-center cursor-pointer select-none">
              <!-- High-Detail Realistic Ambulance Model -->
              ${getRealisticAmbulanceSvg(pt.heading, amb.themeColorHex, isClearing, isQueued)}

              <!-- Callsign Tag Badge -->
              <div class="mt-1 px-2 py-0.5 rounded-md bg-[#020617]/95 border border-slate-700 shadow-2xl text-[9px] font-mono font-bold whitespace-nowrap flex items-center gap-1" style="color: ${amb.themeColorHex}">
                <span>${amb.callsign.split(' ')[0]}</span>
                <span class="text-white">(${amb.priorityScore})</span>
              </div>

              <!-- Status Indicator Pill -->
              <div class="px-1.5 py-0.2 rounded text-[7px] font-mono font-bold uppercase ${
                isClearing
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/60 animate-pulse'
                  : isQueued
                  ? 'bg-red-950 text-red-300 border border-red-500/60'
                  : 'bg-slate-900 text-slate-300 border border-slate-700'
              }">
                ${isClearing ? 'PRIORITY GREEN' : isQueued ? 'HOLDING AT STOP' : 'APPROACHING'}
              </div>
            </div>
          `;

          let marker = vehicleMarkersRef.current.get(amb.id);
          if (!marker) {
            marker = L.marker([pt.lat, pt.lng], {
              icon: L.divIcon({ className: `custom-amb-${amb.id}`, html: vehicleHtml, iconSize: [40, 72], iconAnchor: [20, 36] }),
            }).addTo(map);
            vehicleMarkersRef.current.set(amb.id, marker);
          } else {
            marker.setLatLng([pt.lat, pt.lng]);
            marker.setIcon(L.divIcon({ className: `custom-amb-${amb.id}`, html: vehicleHtml, iconSize: [40, 72], iconAnchor: [20, 36] }));
          }
        });
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, allCleared, signalConfigs]);

  const handleReset = () => {
    const fresh = scenario.ambulances.map((a) => ({
      ...a,
      progress: 0,
      status: 'APPROACHING' as const,
      currentDistanceMeters: a.initialDistanceMeters,
      currentEtaSeconds: a.initialEtaSeconds,
      speedKmh: 55,
    }));
    ambulancesRef.current = fresh;
    setAmbulancesState(fresh);
    setActiveClearingIds([]);
    setAllCleared(false);
    setIsPlaying(true);
    onAddAlert(`Intersection simulation reset to origin`, 'info');
  };

  return (
    <div className="relative w-full h-full min-h-[540px] flex-1 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-[#080d1a] flex flex-col select-none">
      
      {/* 1. Leaflet Tactical Map Canvas with Asphalt Roads */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />

      {/* 2. Top Sequence Phase Master HUD */}
      <div className="absolute top-3.5 inset-x-3.5 sm:inset-x-6 z-20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        
        <div className="bg-[#0f172a]/95 backdrop-blur-md border border-emerald-500/50 px-4 py-2.5 rounded-2xl shadow-2xl flex items-center space-x-3.5 max-w-xl">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/90 flex items-center justify-center text-white shadow-lg shadow-emerald-600/40 flex-shrink-0">
            <Zap className="w-5 h-5 fill-current animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                PRIORITY ENGINE ACTIVE
              </span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 text-[9px] font-mono border border-emerald-500/40">
                100% CONFLICT-FREE
              </span>
            </div>
            <h3 className="text-sm font-black text-white truncate mt-0.5">
              {clearancePhaseName}
            </h3>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center space-x-2 self-end sm:self-auto bg-[#0f172a]/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800 shadow-xl">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold uppercase transition-all shadow flex items-center space-x-1.5 cursor-pointer ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isPlaying ? 'PAUSE' : 'RESUME'}</span>
          </button>

          <button
            onClick={handleReset}
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Reset Simulation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. Bottom Real-time Approaching Leaderboard Pill Strip */}
      <div className="absolute bottom-3 inset-x-3.5 sm:inset-x-6 z-20 bg-[#0f172a]/95 backdrop-blur-md border border-slate-800 p-2.5 rounded-2xl shadow-2xl flex flex-wrap items-center justify-between gap-2.5 text-xs font-mono">
        
        <div className="flex items-center space-x-2">
          <span className="text-[10px] text-slate-400 uppercase font-bold">Clearance Order:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {priorityRankedAmbulances.map((amb, idx) => {
            const isClearing = amb.status === 'PRIORITY_ACTIVE' || amb.status === 'CROSSING';
            const isQueued = amb.status === 'PRIORITY_QUEUED';
            const isDone = amb.status === 'CLEARED';

            return (
              <div
                key={amb.id}
                className={`px-2.5 py-1.5 rounded-xl border flex items-center space-x-2 transition-all ${
                  isClearing
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 shadow-lg shadow-emerald-950/40 animate-pulse'
                    : isQueued
                    ? 'bg-amber-950/40 border-amber-500/60 text-amber-300'
                    : isDone
                    ? 'bg-slate-950/50 border-slate-800 text-slate-400 opacity-60'
                    : 'bg-slate-900/80 border-slate-700 text-slate-300'
                }`}
              >
                <span className="font-black text-[11px]">#{idx + 1}</span>
                <span className="font-bold text-white">{amb.callsign.split(' ')[0]}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-950 font-bold" style={{ color: amb.themeColorHex }}>
                  Score: {amb.priorityScore}
                </span>
                <span className="text-[9px] font-bold">
                  {isClearing ? '🟢 GREEN' : isQueued ? '🔴 QUEUED' : isDone ? '⚪ CLEARED' : 'APPROACH'}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center space-x-1.5 text-[10px] font-bold text-emerald-400">
          <Lock className="w-3.5 h-3.5" />
          <span>SAFETY INTERLOCK: ON</span>
        </div>
      </div>
    </div>
  );
};
