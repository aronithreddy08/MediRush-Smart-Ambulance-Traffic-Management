import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import * as THREE from 'three';
import confetti from 'canvas-confetti';
import { createAmbulance3D, Ambulance3DInstance } from './ThreeAmbulanceModel';
import { HospitalDestination, TrafficSignal, RouteSegment } from '../data/destinationsData';
import { getRealisticAmbulanceSvg } from './RealisticVehicleSvg';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Video, 
  ShieldAlert, 
  Navigation, 
  Building2, 
  Clock, 
  MapPin, 
  Gauge, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowRight,
  Compass, 
  Eye, 
  Radio, 
  Activity,
  Layers,
  AlertTriangle,
  Zap,
  CornerUpRight,
  RefreshCw,
  LocateFixed,
  Timer
} from 'lucide-react';

interface HyderabadEmergencyMapProps {
  ambulanceId: string;
  driverName: string;
  destination: HospitalDestination;
  signals: TrafficSignal[];
  isEmergencyActive: boolean;
  tripMode?: 'MEDIRUSH_AI' | 'NORMAL_CASE';
  onSignalsUpdate: (signals: TrafficSignal[]) => void;
  onTripProgressUpdate: (progress: number, distanceRemainingKm: number, etaMin: number, speedKmh: number) => void;
  onAddAlert: (text: string, type?: 'info' | 'success' | 'alert') => void;
}

// Distance helper in KM (Haversine)
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);

  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

function lerpAngle(a: number, b: number, t: number): number {
  let diff = (b - a) % 360;
  if (diff < -180) diff += 360;
  if (diff > 180) diff += 360;
  return (a + diff * t + 360) % 360;
}

export const HyderabadEmergencyMap: React.FC<HyderabadEmergencyMapProps> = ({
  ambulanceId,
  driverName,
  destination,
  signals,
  isEmergencyActive,
  tripMode = 'MEDIRUSH_AI',
  onSignalsUpdate,
  onTripProgressUpdate,
  onAddAlert,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const signalMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const ambulanceMarkerRef = useRef<L.Marker | null>(null);
  const routePolylinesRef = useRef<L.Polyline[]>([]);

  // WebGL 3D Overlay References
  const threeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const threeSceneRef = useRef<THREE.Scene | null>(null);
  const threeCameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const threeRendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const ambulance3DRef = useRef<Ambulance3DInstance | null>(null);

  // Dynamic Route selection (Primary vs Alternate AI Bypass)
  const [useAlternateRoute, setUseAlternateRoute] = useState(false);

  // Active waypoints & traffic segments
  const activeRoute = useMemo(() => {
    if (useAlternateRoute && destination.alternateRoute) {
      return {
        waypoints: destination.alternateRoute.waypoints,
        trafficSegments: destination.alternateRoute.trafficSegments,
        name: destination.alternateRoute.name,
      };
    }
    return {
      waypoints: destination.primaryRoute.waypoints,
      trafficSegments: destination.primaryRoute.trafficSegments,
      name: 'Primary AI Corridor',
    };
  }, [destination, useAlternateRoute]);

  const waypoints = activeRoute.waypoints;

  // Trip Motion State (Starts only when isEmergencyActive is true!)
  const [tripStatus, setTripStatus] = useState<'READY' | 'MOVING' | 'PAUSED' | 'ARRIVED'>('READY');
  const [progress, setProgress] = useState(0.0);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [currentHeading, setCurrentHeading] = useState(0);
  const [currentLocationName, setCurrentLocationName] = useState('');
  const [nextTurnInstruction, setNextTurnInstruction] = useState('Standby — Press Emergency to Start');
  const [followCamera, setFollowCamera] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Normal mode signal waiting state
  const [waitingAtSignal, setWaitingAtSignal] = useState<TrafficSignal | null>(null);
  const [signalWaitSeconds, setSignalWaitSeconds] = useState(0);

  // Next upcoming signal
  const [nextSignal, setNextSignal] = useState<TrafficSignal | null>(null);
  const [distToNextSignalMeters, setDistToNextSignalMeters] = useState(0);

  // Precalculate cumulative distances along waypoints
  const routeDistances = useMemo(() => {
    const dists = [0];
    let total = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
      const [lat1, lon1] = waypoints[i];
      const [lat2, lon2] = waypoints[i + 1];
      const d = getDistanceKm(lat1, lon1, lat2, lon2);
      total += d;
      dists.push(total);
    }
    return { dists, totalKm: total };
  }, [waypoints]);

  // Compute exact position, heading from progress (0..1)
  const getInterpolatedPoint = (t: number) => {
    const clampedT = Math.max(0, Math.min(1, t));
    const targetDist = clampedT * routeDistances.totalKm;

    let segmentIdx = 0;
    while (
      segmentIdx < routeDistances.dists.length - 1 &&
      routeDistances.dists[segmentIdx + 1] < targetDist
    ) {
      segmentIdx++;
    }

    const segStartDist = routeDistances.dists[segmentIdx];
    const segEndDist = routeDistances.dists[segmentIdx + 1] || routeDistances.totalKm;
    const segLength = segEndDist - segStartDist;

    const segT = segLength > 0 ? (targetDist - segStartDist) / segLength : 0;

    const p1 = waypoints[segmentIdx];
    const p2 = waypoints[Math.min(segmentIdx + 1, waypoints.length - 1)];

    const lat = p1[0] + (p2[0] - p1[0]) * segT;
    const lng = p1[1] + (p2[1] - p1[1]) * segT;
    const heading = getBearing(p1[0], p1[1], p2[0], p2[1]);
    const streetName = p1[2];
    const nextStreet = p2[2];

    return { lat, lng, heading, streetName, nextStreet, segmentIdx, distanceCoveredKm: targetDist };
  };

  // Helper to create realistic Physical Traffic Signal Mast-Arm icon
  const createSignalIcon = (sig: TrafficSignal) => {
    const isGreen = sig.currentState === 'PREEMPTED_GREEN';
    const isAlert1Km = sig.currentState === 'ALERT_1KM';
    const isCleared = sig.currentState === 'CLEARED';

    return L.divIcon({
      className: `custom-traffic-signal-${sig.id}`,
      html: `
        <div class="relative flex flex-col items-center justify-center cursor-pointer group">
          <!-- 1KM Radar Pulse -->
          ${
            isAlert1Km && tripMode === 'MEDIRUSH_AI'
              ? `<div class="absolute -inset-6 rounded-full bg-amber-500/30 animate-ping pointer-events-none"></div>
                 <div class="absolute -inset-3 rounded-full bg-amber-400/40 animate-pulse pointer-events-none"></div>`
              : isGreen
              ? `<div class="absolute -inset-6 rounded-full bg-emerald-500/35 animate-ping pointer-events-none"></div>
                 <div class="absolute -inset-3 rounded-full bg-emerald-400/45 animate-pulse pointer-events-none"></div>`
              : ''
          }
          
          <!-- Realistic Signal Mast Arm Assembly -->
          <div class="flex items-center">
            <!-- Mast Post Pole -->
            <div class="w-1.5 h-16 bg-gradient-to-b from-slate-400 via-slate-600 to-slate-800 rounded-b shadow-2xl flex flex-col justify-end">
              <div class="w-2.5 h-1 bg-yellow-400 self-center"></div>
            </div>

            <!-- Cantilever Arm extending over road -->
            <div class="flex flex-col items-center -ml-0.5">
              <!-- Overhead Signal Housing Box with Sun Visors -->
              <div class="w-6 h-13 rounded-md bg-[#020617] border-2 ${
                isGreen ? 'border-emerald-500 shadow-[0_0_15px_#10b981]' : 'border-slate-700'
              } shadow-2xl flex flex-col items-center justify-between py-1 px-0.5 z-20">
                <!-- Red Light with Hood -->
                <div class="relative flex items-center justify-center">
                  <div class="w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                    !isGreen && !isAlert1Km && !isCleared
                      ? 'bg-red-500 shadow-[0_0_10px_#ef4444] border border-red-300'
                      : 'bg-red-950/60 opacity-25'
                  }"></div>
                </div>
                <!-- Yellow Light with Hood -->
                <div class="relative flex items-center justify-center">
                  <div class="w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                    isAlert1Km && tripMode === 'MEDIRUSH_AI'
                      ? 'bg-amber-400 shadow-[0_0_10px_#f59e0b] border border-amber-200 animate-pulse'
                      : 'bg-amber-950/60 opacity-25'
                  }"></div>
                </div>
                <!-- Green Light with Hood -->
                <div class="relative flex items-center justify-center">
                  <div class="w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                    isGreen
                      ? 'bg-emerald-400 shadow-[0_0_14px_#10b981] border border-emerald-200 animate-pulse'
                      : 'bg-emerald-950/60 opacity-25'
                  }"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Digital Countdown Pill -->
          <div class="mt-1 whitespace-nowrap bg-[#020617]/95 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border border-slate-700 text-slate-300 shadow">
            ${
              isGreen
                ? '🟢 GREEN WAVE'
                : isAlert1Km && tripMode === 'MEDIRUSH_AI'
                ? '🟡 1KM ALERT'
                : isCleared
                ? '⚪ CLEARED'
                : `🔴 RED (${sig.timerSeconds}s)`
            }
          </div>
        </div>
      `,
      iconSize: [32, 64],
      iconAnchor: [16, 32],
    });
  };

  // --- 1. Initialize Leaflet Map with Real Road Network ---
  useEffect(() => {
    if (!mapContainerRef.current) return;

    delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    const map = L.map(mapContainerRef.current, {
      center: [waypoints[0][0], waypoints[0][1]],
      zoom: 15,
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

    routePolylinesRef.current.forEach((p) => p.remove());
    routePolylinesRef.current = [];

    // Draw Multi-Colored Traffic Segments on the Real Road
    activeRoute.trafficSegments.forEach((seg) => {
      const segCoords = waypoints
        .slice(seg.startIndex, seg.endIndex + 1)
        .map(([lat, lng]) => [lat, lng] as [number, number]);

      if (segCoords.length >= 2) {
        const segColor = tripMode === 'NORMAL_CASE' && seg.congestion === 'HEAVY' ? '#ef4444' : seg.color;

        const glowLine = L.polyline(segCoords, {
          color: segColor,
          weight: 12,
          opacity: 0.35,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(map);

        const coreLine = L.polyline(segCoords, {
          color: segColor,
          weight: 6,
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(map);

        routePolylinesRef.current.push(glowLine, coreLine);
      }
    });

    // Origin Badge Pin
    const originIcon = L.divIcon({
      className: 'custom-origin-pin',
      html: `
        <div class="flex items-center space-x-1.5 bg-[#0f172a]/95 border-2 border-emerald-500 px-3 py-1 rounded-full shadow-2xl">
          <div class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></div>
          <span class="text-xs font-mono font-bold text-white whitespace-nowrap">Hitec City Origin</span>
        </div>
      `,
      iconSize: [110, 30],
      iconAnchor: [55, 15],
    });
    L.marker([waypoints[0][0], waypoints[0][1]], { icon: originIcon }).addTo(map);

    // Destination Hospital Pin
    const hospitalIcon = L.divIcon({
      className: 'custom-hospital-pin',
      html: `
        <div class="flex items-center space-x-1.5 bg-[#0f172a]/95 border-2 border-red-500 px-3.5 py-1.5 rounded-full shadow-2xl">
          <span class="text-base">🏥</span>
          <span class="text-xs font-bold text-white whitespace-nowrap">${destination.name}</span>
        </div>
      `,
      iconSize: [160, 34],
      iconAnchor: [80, 17],
    });
    L.marker([destination.coords[0], destination.coords[1]], { icon: hospitalIcon }).addTo(map);

    // Add Traffic Signal Markers
    signalMarkersRef.current.clear();
    signals.forEach((sig) => {
      const marker = L.marker(sig.coords, { icon: createSignalIcon(sig) }).addTo(map);
      signalMarkersRef.current.set(sig.id, marker);
    });

    // Create Realistic Ambulance Vector Marker directly on the road
    const p0 = waypoints[0];
    const initialHeading = getBearing(p0[0], p0[1], waypoints[1][0], waypoints[1][1]);
    const ambMarker = L.marker([p0[0], p0[1]], {
      icon: L.divIcon({
        className: 'custom-real-ambulance',
        html: getRealisticAmbulanceSvg(initialHeading, '#ef4444', isEmergencyActive, false),
        iconSize: [34, 66],
        iconAnchor: [17, 33],
      }),
    }).addTo(map);
    ambulanceMarkerRef.current = ambMarker;

    const fullCoords = waypoints.map(([lat, lng]) => [lat, lng] as [number, number]);
    map.fitBounds(L.polyline(fullCoords).getBounds(), { padding: [60, 60] });

    return () => {
      map.remove();
    };
  }, [destination, useAlternateRoute, tripMode]);

  // Update signal icons
  useEffect(() => {
    signals.forEach((sig) => {
      const marker = signalMarkersRef.current.get(sig.id);
      if (marker) {
        marker.setIcon(createSignalIcon(sig));
      }
    });
  }, [signals, tripMode]);

  // --- 2. Emergency Trigger: Start Trip ONLY when isEmergencyActive is true ---
  useEffect(() => {
    if (isEmergencyActive) {
      setTripStatus('MOVING');
      setCurrentSpeed(tripMode === 'MEDIRUSH_AI' ? 58 : 30);
      onAddAlert(`🚨 Emergency Dispatch: Ambulance started trip towards ${destination.name}`, 'alert');
    } else {
      setTripStatus('READY');
      setProgress(0);
      setCurrentSpeed(0);
      setWaitingAtSignal(null);
      setSignalWaitSeconds(0);
      onSignalsUpdate(destination.signals);
    }
  }, [isEmergencyActive, destination, tripMode]);

  // --- 3. Route Motion & Signal Simulation Loop ---
  const lastTimeRef = useRef<number>(performance.now());
  const smoothedHeadingRef = useRef<number>(0);
  const alerted1KmSetRef = useRef<Set<string>>(new Set());
  const preemptedSignalsSetRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let animationFrameId: number;

    const animate = (now: number) => {
      const delta = Math.min((now - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = now;

      const pt = getInterpolatedPoint(progress);
      const remainingKm = Math.max(0, routeDistances.totalKm * (1 - progress));
      const etaMin = currentSpeed > 5 ? (remainingKm / currentSpeed) * 60 : (remainingKm / 35) * 60;

      onTripProgressUpdate(progress, remainingKm, etaMin, currentSpeed);

      if (tripStatus === 'MOVING') {
        setElapsedSeconds((prev) => prev + delta);

        // Check if stopped waiting at a red signal in NORMAL CASE
        if (waitingAtSignal) {
          setSignalWaitSeconds((prev) => {
            const nextWait = prev - delta;
            if (nextWait <= 0) {
              onAddAlert(`🟢 Normal Cycle: Light turned GREEN at ${waitingAtSignal.name} after wait`, 'info');
              setWaitingAtSignal(null);
              return 0;
            }
            return nextWait;
          });
          setCurrentSpeed((prev) => Math.max(0, prev - prev * 0.15));
        } else {
          // Advance ambulance progress on the real road
          const tripSpeedFactor = tripMode === 'MEDIRUSH_AI' ? 0.022 : 0.012;
          setProgress((prev) => {
            const next = prev + delta * tripSpeedFactor;
            if (next >= 1.0) {
              setTripStatus('ARRIVED');
              confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
              onAddAlert(`Arrived at ${destination.name} Emergency Bay!`, 'success');
              return 1.0;
            }
            return next;
          });

          // Speed calculation
          const activeSeg = activeRoute.trafficSegments.find(
            (s) => pt.segmentIdx >= s.startIndex && pt.segmentIdx <= s.endIndex
          );
          const baseSpeed = activeSeg ? activeSeg.speedLimitKmh : 50;
          const targetSpeed = tripMode === 'MEDIRUSH_AI' ? baseSpeed : Math.min(baseSpeed * 0.65, 35);
          setCurrentSpeed((prev) => prev + (targetSpeed - prev) * 0.08);

          // SIGNAL PREEMPTION OR WAITING LOGIC
          let updatedAnySignal = false;
          const updatedSignals = signals.map((sig) => {
            const distToSignalKm = sig.distanceAlongRouteKm - pt.distanceCoveredKm;

            if (tripMode === 'MEDIRUSH_AI') {
              // 1. MEDIRUSH AI MODE
              if (distToSignalKm <= 1.0 && distToSignalKm > 0.6) {
                if (sig.currentState !== 'ALERT_1KM' && sig.currentState !== 'PREEMPTED_GREEN') {
                  if (!alerted1KmSetRef.current.has(sig.id)) {
                    alerted1KmSetRef.current.add(sig.id);
                    onAddAlert(`🚨 1KM PROXIMITY ALERT: ${sig.name} — V2X Preemption Armed`, 'alert');
                  }
                  updatedAnySignal = true;
                  return { ...sig, currentState: 'ALERT_1KM' as const, timerSeconds: 15 };
                }
              } else if (distToSignalKm <= 0.6 && distToSignalKm >= -0.1) {
                if (sig.currentState !== 'PREEMPTED_GREEN') {
                  if (!preemptedSignalsSetRef.current.has(sig.id)) {
                    preemptedSignalsSetRef.current.add(sig.id);
                    onAddAlert(`🟢 GREEN WAVE ACTIVE: ${sig.name} cleared for ambulance`, 'success');
                  }
                  updatedAnySignal = true;
                  return { ...sig, currentState: 'PREEMPTED_GREEN' as const, timerSeconds: 10 };
                }
              } else if (distToSignalKm < -0.1) {
                if (sig.currentState !== 'CLEARED') {
                  updatedAnySignal = true;
                  return { ...sig, currentState: 'CLEARED' as const, timerSeconds: 0 };
                }
              }
            } else {
              // 2. NORMAL CASE MODE
              if (distToSignalKm <= 0.06 && distToSignalKm >= 0 && sig.currentState !== 'CLEARED') {
                if (!waitingAtSignal && !preemptedSignalsSetRef.current.has(sig.id)) {
                  preemptedSignalsSetRef.current.add(sig.id);
                  setWaitingAtSignal(sig);
                  setSignalWaitSeconds(sig.timerSeconds);
                  onAddAlert(`🛑 NORMAL CASE: Stopped at Red Light at ${sig.name} (${sig.timerSeconds}s wait)`, 'alert');
                }
              } else if (distToSignalKm < -0.05) {
                if (sig.currentState !== 'CLEARED') {
                  updatedAnySignal = true;
                  return { ...sig, currentState: 'CLEARED' as const, timerSeconds: 0 };
                }
              }
            }

            return sig;
          });

          if (updatedAnySignal) {
            onSignalsUpdate(updatedSignals);
          }

          // Upcoming signal
          const upcoming = signals.find((s) => s.distanceAlongRouteKm > pt.distanceCoveredKm);
          if (upcoming) {
            setNextSignal(upcoming);
            setDistToNextSignalMeters(Math.max(0, Math.round((upcoming.distanceAlongRouteKm - pt.distanceCoveredKm) * 1000)));
          } else {
            setNextSignal(null);
          }
        }
      }

      // Update Realistic Ambulance Position on the Real Road
      const map = mapInstanceRef.current;
      if (map) {
        setCurrentLocationName(pt.streetName);

        smoothedHeadingRef.current = lerpAngle(smoothedHeadingRef.current, pt.heading, 0.14);
        setCurrentHeading(smoothedHeadingRef.current);

        if (ambulanceMarkerRef.current) {
          ambulanceMarkerRef.current.setLatLng([pt.lat, pt.lng]);
          ambulanceMarkerRef.current.setIcon(
            L.divIcon({
              className: 'custom-real-ambulance',
              html: getRealisticAmbulanceSvg(
                smoothedHeadingRef.current,
                '#ef4444',
                tripMode === 'MEDIRUSH_AI' && tripStatus === 'MOVING',
                waitingAtSignal !== null
              ),
              iconSize: [34, 66],
              iconAnchor: [17, 33],
            })
          );
        }

        if (followCamera && tripStatus === 'MOVING') {
          map.panTo([pt.lat, pt.lng], { animate: false });
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [tripStatus, progress, followCamera, currentSpeed, signals, destination, activeRoute, tripMode, waitingAtSignal]);

  const handleResetTrip = () => {
    setTripStatus('READY');
    setProgress(0);
    setCurrentSpeed(0);
    setWaitingAtSignal(null);
    setSignalWaitSeconds(0);
    alerted1KmSetRef.current.clear();
    preemptedSignalsSetRef.current.clear();
    onSignalsUpdate(destination.signals);
    if (mapInstanceRef.current) {
      const p0 = waypoints[0];
      mapInstanceRef.current.flyTo([p0[0], p0[1]], 15, { duration: 1 });
    }
  };

  return (
    <div className="relative w-full h-full min-h-[520px] flex-1 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-[#080d1a] flex flex-col select-none">
      
      {/* Real Road Map Canvas */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />

      {/* Top Navigation Banner */}
      <div className="absolute top-3.5 inset-x-3.5 sm:inset-x-6 z-20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        
        <div className={`p-3 rounded-2xl shadow-2xl flex items-center space-x-3.5 max-w-lg backdrop-blur-md border ${
          !isEmergencyActive
            ? 'bg-[#0f172a]/95 border-slate-700'
            : tripMode === 'MEDIRUSH_AI'
            ? 'bg-[#0f172a]/95 border-emerald-500/50'
            : 'bg-[#1a0f12]/95 border-red-500/60'
        }`}>
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-lg flex-shrink-0 ${
            !isEmergencyActive
              ? 'bg-slate-800 text-slate-400'
              : tripMode === 'MEDIRUSH_AI'
              ? 'bg-emerald-600 shadow-emerald-600/40'
              : 'bg-red-600 shadow-red-600/40 animate-pulse'
          }`}>
            {!isEmergencyActive ? <ShieldAlert className="w-6 h-6" /> : tripMode === 'MEDIRUSH_AI' ? <Zap className="w-6 h-6 fill-current" /> : <Timer className="w-6 h-6" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className={`text-xs font-mono font-bold uppercase tracking-wider ${
                !isEmergencyActive
                  ? 'text-slate-400'
                  : tripMode === 'MEDIRUSH_AI'
                  ? 'text-emerald-400'
                  : 'text-amber-400'
              }`}>
                {!isEmergencyActive
                  ? 'STANDBY — PRESS EMERGENCY TO DISPATCH'
                  : tripMode === 'MEDIRUSH_AI'
                  ? 'MEDIRUSH 1KM PREEMPTION ACTIVE'
                  : 'NORMAL CITY TRIP • NO PREEMPTION'}
              </span>
            </div>
            <h3 className="text-sm font-bold text-white truncate mt-0.5">
              {!isEmergencyActive
                ? 'Ambulance Stationed at Cyber Towers Hub'
                : waitingAtSignal
                ? `🛑 Stopped at ${waitingAtSignal.name} (${Math.ceil(signalWaitSeconds)}s remaining)`
                : currentLocationName || 'Hitec City Emergency Corridor'}
            </h3>
            <p className="text-[10px] text-slate-400 truncate">
              {!isEmergencyActive
                ? 'Click "TRIGGER EMERGENCY" to start the high-speed green wave trip'
                : tripMode === 'MEDIRUSH_AI'
                ? 'Automated Green Wave clearing all signals ahead'
                : 'Ambulance subject to city traffic red lights'}
            </p>
          </div>
        </div>

        {/* Camera Follow Mode Toggle */}
        <div className="flex items-center space-x-2 self-end sm:self-auto">
          <button
            onClick={() => setFollowCamera(!followCamera)}
            className={`p-2 rounded-xl text-xs font-mono font-bold uppercase transition-all shadow-xl flex items-center border backdrop-blur-md cursor-pointer ${
              followCamera
                ? 'bg-emerald-600 text-white border-emerald-400 shadow-emerald-600/40'
                : 'bg-slate-900/90 text-slate-300 border-slate-700 hover:bg-slate-800'
            }`}
            title="Toggle Camera Follow Mode"
          >
            <LocateFixed className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Floating Next-Signal HUD */}
      {isEmergencyActive && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 bg-[#0f172a]/95 backdrop-blur-md border border-slate-800 px-5 py-2.5 rounded-2xl shadow-2xl flex items-center space-x-6 text-xs font-mono">
          <div>
            <span className="text-[10px] text-slate-400 uppercase block">Next Signal</span>
            <span className="font-bold text-white text-sm truncate max-w-[200px] block">
              {nextSignal ? nextSignal.name : 'Destination Terminal'}
            </span>
            <span className="text-[10px] text-slate-400 block">
              Distance: {nextSignal ? `${distToNextSignalMeters} m` : 'At Hospital Bay'}
            </span>
          </div>

          <div className="h-8 w-px bg-slate-800"></div>

          <div className="flex items-center space-x-3">
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Status</span>
              <span
                className={`font-black text-sm flex items-center gap-1.5 ${
                  tripMode === 'MEDIRUSH_AI'
                    ? 'text-emerald-400 animate-pulse'
                    : waitingAtSignal
                    ? 'text-red-400 animate-pulse'
                    : 'text-amber-400'
                }`}
              >
                {tripMode === 'MEDIRUSH_AI'
                  ? '🟢 Green Wave (Cleared)'
                  : waitingAtSignal
                  ? `🔴 Red Light Wait (${Math.ceil(signalWaitSeconds)}s)`
                  : `🔴 Standard Cycle`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Status Bar */}
      <div className="absolute bottom-2.5 inset-x-2.5 sm:inset-x-4 z-20 bg-[#0f172a]/95 backdrop-blur-md border border-slate-800/90 py-2.5 px-4 rounded-2xl shadow-2xl flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center space-x-4">
          <div className="flex items-baseline space-x-1">
            <span className="text-xl font-black text-white">{Math.round(currentSpeed)}</span>
            <span className="text-[10px] text-slate-400 uppercase">KM/H</span>
          </div>

          <div className="h-6 w-px bg-slate-800 hidden sm:block"></div>

          <div>
            <span className="text-[10px] text-slate-400 block">Distance</span>
            <span className="font-bold text-white">{Math.max(0, routeDistances.totalKm * (1 - progress)).toFixed(1)} km</span>
          </div>

          <div className="h-6 w-px bg-slate-800 hidden sm:block"></div>

          <div>
            <span className="text-[10px] text-slate-400 block">ETA</span>
            <span className={`font-bold ${!isEmergencyActive ? 'text-slate-400' : tripMode === 'MEDIRUSH_AI' ? 'text-emerald-400' : 'text-amber-400'}`}>
              {!isEmergencyActive ? 'Ready' : tripStatus === 'ARRIVED' ? '00:00' : `${Math.ceil((routeDistances.totalKm * (1 - progress) / (currentSpeed || 35)) * 60)} min`}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {tripStatus === 'MOVING' && (
            <button
              onClick={() => setTripStatus('PAUSED')}
              className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold uppercase shadow-lg shadow-amber-600/30 flex items-center space-x-1.5 cursor-pointer"
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>PAUSE</span>
            </button>
          )}

          {tripStatus === 'PAUSED' && (
            <button
              onClick={() => setTripStatus('MOVING')}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase shadow-lg shadow-emerald-600/30 flex items-center space-x-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>RESUME</span>
            </button>
          )}

          <button
            onClick={handleResetTrip}
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Reset Trip"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ARRIVED CELEBRATION MODAL WITH TIME COMPARISON */}
      {tripStatus === 'ARRIVED' && (
        <div className="absolute inset-0 z-30 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#0f172a] p-6 sm:p-8 rounded-3xl border border-emerald-500/60 max-w-lg w-full text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/50 mx-auto flex items-center justify-center text-3xl shadow-lg shadow-emerald-500/30">
              🏥
            </div>

            <div>
              <h3 className="text-2xl font-black text-white tracking-wide">
                ARRIVED AT HOSPITAL
              </h3>
              <p className="text-sm text-emerald-300 font-semibold mt-1">
                {destination.name} &bull; {destination.area}
              </p>
            </div>

            {/* Performance Comparison Box */}
            <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-2 text-left">
              <span className="text-[11px] font-mono font-bold text-slate-300 uppercase block">
                Trip Performance Summary:
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40">
                  <span className="text-[9px] text-emerald-400 uppercase block">MediRush AI Mode</span>
                  <span className="text-base font-black text-emerald-300">0 Stops</span>
                  <span className="text-[10px] text-slate-300 block">Fast Green Wave</span>
                </div>
                <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-500/40">
                  <span className="text-[9px] text-red-400 uppercase block">Normal Case Mode</span>
                  <span className="text-base font-black text-red-300">4 Red Light Stops</span>
                  <span className="text-[10px] text-slate-300 block">+9.5 min Traffic Delay</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                onClick={handleResetTrip}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold uppercase tracking-wider shadow-lg shadow-emerald-600/40 transition-all active:scale-95 cursor-pointer"
              >
                RUN AGAIN
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
