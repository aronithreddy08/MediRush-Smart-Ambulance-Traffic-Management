import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Compass, RotateCw, ZoomIn, ZoomOut, ShieldAlert, Sparkles, Navigation2, CheckCircle2 } from 'lucide-react';

interface Point {
  lat: number;
  lng: number;
}

interface Signal {
  signal_id: string;
  name: string;
  latitude: number;
  longitude: number;
  current_state: 'RED' | 'YELLOW' | 'GREEN' | 'PREEMPTION_GREEN';
  is_preempted: boolean;
}

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

interface RouteOption {
  route_id: string;
  route_name: string;
  route_type: string;
  distance_km: number;
  estimated_time_min: number;
  congestion_score: number;
  traffic_level_label: string;
  coordinates: number[][]; // [[lat, lng], ...]
  is_selected: boolean;
  time_saved_vs_baseline_min: number;
}

interface Map3DViewProps {
  signals: Signal[];
  hospitals: Hospital[];
  routes: RouteOption[];
  activeRouteId: string;
  ambulancePosition: { lat: number; lng: number; heading: number; speed_kmh: number } | null;
  onSignalClick?: (signal: Signal) => void;
  onHospitalClick?: (hospital: Hospital) => void;
  isSimulating: boolean;
  rerouteAlert: string | null;
}

export const Map3DView: React.FC<Map3DViewProps> = ({
  signals,
  hospitals,
  routes,
  activeRouteId,
  ambulancePosition,
  onSignalClick,
  onHospitalClick,
  isSimulating,
  rerouteAlert
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [tilt, setTilt] = useState(true); // 2.5D perspective tilt

  // Geographic bounds of the simulated metropolitan area (approx. Connaught / Central Hub coords)
  const bounds = useMemo(() => {
    return {
      minLat: 28.6050,
      maxLat: 28.6480,
      minLng: 77.1950,
      maxLng: 77.2400
    };
  }, []);

  // Convert GPS (lat, lng) to Canvas (x, y)
  const gpsToCanvas = (lat: number, lng: number, width: number, height: number) => {
    const latSpan = bounds.maxLat - bounds.minLat;
    const lngSpan = bounds.maxLng - bounds.minLng;

    const normX = (lng - bounds.minLng) / lngSpan;
    const normY = 1.0 - (lat - bounds.minLat) / latSpan; // Invert Y for canvas

    const cx = width / 2 + pan.x;
    const cy = height / 2 + pan.y;

    const plotW = (width * 0.82) * zoom;
    const plotH = (height * 0.82) * zoom;

    const x = cx - plotW / 2 + normX * plotW;
    const y = cy - plotH / 2 + normY * plotH;

    return { x, y };
  };

  // Main Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const render = () => {
      time += 0.03;
      const width = (canvas.width = canvas.parentElement?.clientWidth || 800);
      const height = (canvas.height = canvas.parentElement?.clientHeight || 600);

      // Dark futuristic slate background
      ctx.fillStyle = '#080c14';
      ctx.fillRect(0, 0, width, height);

      // Draw subtle neon grid
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
      ctx.lineWidth = 1;
      const gridSize = 40 * zoom;
      const startX = (pan.x % gridSize);
      const startY = (pan.y % gridSize);

      ctx.beginPath();
      for (let x = startX; x < width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = startY; y < height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Render 3D Perspective Grid glow horizon if tilt enabled
      if (tilt) {
        const horizonGrad = ctx.createLinearGradient(0, 0, 0, height);
        horizonGrad.addColorStop(0, 'rgba(6, 182, 212, 0.06)');
        horizonGrad.addColorStop(0.5, 'rgba(15, 23, 42, 0)');
        horizonGrad.addColorStop(1, 'rgba(239, 68, 68, 0.04)');
        ctx.fillStyle = horizonGrad;
        ctx.fillRect(0, 0, width, height);
      }

      // 1. Draw Route Lines
      routes.forEach((route) => {
        if (!route.coordinates || route.coordinates.length < 2) return;
        const isActive = route.route_id === activeRouteId;

        ctx.beginPath();
        const firstPt = gpsToCanvas(route.coordinates[0][0], route.coordinates[0][1], width, height);
        ctx.moveTo(firstPt.x, firstPt.y);

        for (let i = 1; i < route.coordinates.length; i++) {
          const pt = gpsToCanvas(route.coordinates[i][0], route.coordinates[i][1], width, height);
          ctx.lineTo(pt.x, pt.y);
        }

        if (isActive) {
          // AI OPTIMAL ROUTE - Glowing Emerald / Neon Cyan with animated dashes
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 6 * zoom;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.shadowColor = '#10b981';
          ctx.shadowBlur = 18;
          ctx.stroke();

          // Core bright line
          ctx.strokeStyle = '#6ee7b7';
          ctx.lineWidth = 2.5 * zoom;
          ctx.shadowBlur = 0;
          ctx.stroke();

          // Animated dynamic pulse along route
          ctx.save();
          ctx.setLineDash([12 * zoom, 18 * zoom]);
          ctx.lineDashOffset = -time * 30;
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2 * zoom;
          ctx.stroke();
          ctx.restore();
        } else {
          // Alternative routes
          ctx.strokeStyle = route.route_type === 'HIGHWAY_CORRIDOR' ? 'rgba(245, 158, 11, 0.5)' : 'rgba(239, 68, 68, 0.35)';
          ctx.lineWidth = 3.5 * zoom;
          ctx.setLineDash([6, 6]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      });

      // 2. Draw Smart Traffic Signal Intersections
      signals.forEach((sig) => {
        const { x, y } = gpsToCanvas(sig.latitude, sig.longitude, width, height);

        // Preemption Green Wave Radar Halo
        if (sig.is_preempted || sig.current_state === 'PREEMPTION_GREEN') {
          const pulseRadius = (20 + Math.sin(time * 6) * 8) * zoom;
          ctx.beginPath();
          ctx.arc(x, y, pulseRadius, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
          ctx.fill();

          ctx.beginPath();
          ctx.arc(x, y, pulseRadius + 10 * zoom, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.6)';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Signal outer housing
        ctx.beginPath();
        ctx.arc(x, y, 9 * zoom, 0, Math.PI * 2);
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();

        // Signal light state color
        let lightColor = '#ef4444'; // RED
        let glowColor = 'rgba(239, 68, 68, 0.8)';
        if (sig.current_state === 'GREEN' || sig.current_state === 'PREEMPTION_GREEN' || sig.is_preempted) {
          lightColor = '#10b981';
          glowColor = 'rgba(16, 185, 129, 0.9)';
        } else if (sig.current_state === 'YELLOW') {
          lightColor = '#f59e0b';
          glowColor = 'rgba(245, 158, 11, 0.9)';
        }

        ctx.beginPath();
        ctx.arc(x, y, 5.5 * zoom, 0, Math.PI * 2);
        ctx.fillStyle = lightColor;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Label
        ctx.fillStyle = '#94a3b8';
        ctx.font = `600 ${Math.max(10, 11 * zoom)}px Outfit`;
        ctx.fillText(sig.name.split(' ')[0], x + 12 * zoom, y + 4 * zoom);
      });

      // 3. Draw Hospitals
      hospitals.forEach((hosp) => {
        const { x, y } = gpsToCanvas(hosp.latitude, hosp.longitude, width, height);

        // Building base shadow
        ctx.beginPath();
        ctx.arc(x, y + 2, 16 * zoom, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fill();

        // Hospital icon circle
        ctx.beginPath();
        ctx.arc(x, y, 14 * zoom, 0, Math.PI * 2);
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.5 * zoom;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Red cross in center
        ctx.fillStyle = '#ef4444';
        const crossSize = 7 * zoom;
        const crossThick = 2.5 * zoom;
        ctx.fillRect(x - crossSize / 2, y - crossThick / 2, crossSize, crossThick);
        ctx.fillRect(x - crossThick / 2, y - crossSize / 2, crossThick, crossSize);

        // Hospital Name & ICU Bed Badge
        ctx.fillStyle = '#f8fafc';
        ctx.font = `700 ${Math.max(11, 12 * zoom)}px Outfit`;
        ctx.fillText(hosp.name, x - 30 * zoom, y - 20 * zoom);

        // Bed availability pill
        ctx.fillStyle = hosp.available_icu_beds > 4 ? '#10b981' : '#f59e0b';
        ctx.font = `600 ${Math.max(9, 10 * zoom)}px JetBrains Mono`;
        ctx.fillText(`ICU: ${hosp.available_icu_beds}/${hosp.total_icu_beds} Free`, x - 30 * zoom, y - 8 * zoom);
      });

      // 4. Draw 3D Animated Moving Ambulance
      if (ambulancePosition) {
        const { x, y } = gpsToCanvas(ambulancePosition.lat, ambulancePosition.lng, width, height);
        const headingRad = ((ambulancePosition.heading - 90) * Math.PI) / 180;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(headingRad);

        // Emergency siren light rays (alternating Red / Blue)
        const sirenPhase = Math.floor(time * 12) % 2 === 0;
        const sirenColor = sirenPhase ? 'rgba(239, 68, 68, 0.4)' : 'rgba(59, 130, 246, 0.4)';
        const sirenGlow = sirenPhase ? '#ef4444' : '#3b82f6';

        ctx.beginPath();
        ctx.arc(0, 0, 32 * zoom, 0, Math.PI * 2);
        ctx.fillStyle = sirenColor;
        ctx.fill();

        // 3D Chassis shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(-16 * zoom + 3, -10 * zoom + 3, 32 * zoom, 20 * zoom);

        // Ambulance Body (White & Emergency Red Striping)
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-16 * zoom, -9 * zoom, 32 * zoom, 18 * zoom, 4 * zoom);
        ctx.fill();
        ctx.stroke();

        // Windshield (Cabin glass)
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.roundRect(4 * zoom, -7 * zoom, 8 * zoom, 14 * zoom, 2 * zoom);
        ctx.fill();

        // Red emergency cross on roof
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-6 * zoom, -2 * zoom, 8 * zoom, 4 * zoom);
        ctx.fillRect(-4 * zoom, -4 * zoom, 4 * zoom, 8 * zoom);

        // Siren Light Bar on Roof
        ctx.beginPath();
        ctx.arc(-1 * zoom, 0, 3.5 * zoom, 0, Math.PI * 2);
        ctx.fillStyle = sirenGlow;
        ctx.shadowColor = sirenGlow;
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Front Headlights
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(15 * zoom, -7 * zoom, 2 * zoom, 3 * zoom);
        ctx.fillRect(15 * zoom, 4 * zoom, 2 * zoom, 3 * zoom);

        ctx.restore();

        // Live speed badge under ambulance
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(x - 32 * zoom, y + 24 * zoom, 64 * zoom, 18 * zoom, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.font = `700 ${Math.max(10, 10 * zoom)}px JetBrains Mono`;
        ctx.fillText(`🚑 ${Math.round(ambulancePosition.speed_kmh)} km/h`, x - 26 * zoom, y + 36 * zoom);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [signals, hospitals, routes, activeRouteId, ambulancePosition, zoom, pan, tilt, bounds]);

  // Mouse Handlers for Drag & Pan
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div className="relative w-full h-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />

      {/* Floating HUD Top Banner */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        <div className="flex items-center space-x-3 pointer-events-auto">
          <div className="glass-panel px-4 py-2 rounded-xl flex items-center space-x-2.5 border border-emerald-500/30">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold tracking-wider text-emerald-400 uppercase font-mono">
              {isSimulating ? 'Live Emergency Run Active' : 'Fleet Standby & Radar Active'}
            </span>
          </div>

          {rerouteAlert && (
            <div className="glass-panel-glow-red px-4 py-2 rounded-xl flex items-center space-x-2 text-xs font-semibold text-red-300 animate-pulse">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span>{rerouteAlert}</span>
            </div>
          )}
        </div>

        {/* Map View Controls */}
        <div className="flex items-center space-x-2 pointer-events-auto">
          <button
            onClick={() => setTilt(!tilt)}
            className={`p-2.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              tilt ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-lg shadow-cyan-500/20' : 'glass-panel text-slate-400 hover:text-white'
            }`}
            title="Toggle 2.5D Perspective"
          >
            <Compass className="w-4 h-4" />
            <span>3D Tilt</span>
          </button>
          <button
            onClick={() => setZoom((z) => Math.min(2.2, z + 0.15))}
            className="p-2.5 glass-panel rounded-xl text-slate-300 hover:text-white transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.6, z - 0.15))}
            className="p-2.5 glass-panel rounded-xl text-slate-300 hover:text-white transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setZoom(1.0);
              setPan({ x: 0, y: 0 });
            }}
            className="p-2.5 glass-panel rounded-xl text-slate-300 hover:text-white transition-colors"
            title="Reset View"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 left-4 glass-panel px-4 py-3 rounded-xl flex items-center space-x-5 text-xs text-slate-300 pointer-events-none">
        <div className="flex items-center space-x-2">
          <div className="w-3.5 h-1.5 bg-emerald-400 rounded-full shadow-sm shadow-emerald-400"></div>
          <span className="font-semibold text-emerald-300">MediRush AI Corridor</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3.5 h-1.5 bg-amber-400 rounded-full"></div>
          <span>Arterial Alternate</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></div>
          <span>Green Wave Preemption</span>
        </div>
      </div>
    </div>
  );
};
