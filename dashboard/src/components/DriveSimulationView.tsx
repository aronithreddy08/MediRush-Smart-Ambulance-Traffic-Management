import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import confetti from 'canvas-confetti';
import { HospitalDestination, TrafficSignal } from '../data/destinationsData';
import { createAmbulance3D, Ambulance3DInstance } from './ThreeAmbulanceModel';
import { 
  Zap, 
  Map as MapIcon, 
  RotateCcw, 
  Pause, 
  Play, 
  ArrowUp,
  ArrowLeft,
  ArrowRight,
  ShieldAlert,
  AlertTriangle,
  Radio,
  Sparkles,
  Activity,
  CheckCircle2
} from 'lucide-react';

interface DriveSimulationViewProps {
  ambulanceId: string;
  driverName: string;
  destination: HospitalDestination;
  signals: TrafficSignal[];
  isEmergencyActive: boolean;
  tripMode: 'MEDIRUSH_AI' | 'NORMAL_CASE';
  onSignalsUpdate: (signals: TrafficSignal[]) => void;
  onTripProgressUpdate: (progress: number, distanceRemainingKm: number, etaMin: number, speedKmh: number) => void;
  onAddAlert: (text: string, type?: 'info' | 'success' | 'alert') => void;
  onSwitchToMapView: () => void;
}

// Distance helper
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
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export const DriveSimulationView: React.FC<DriveSimulationViewProps> = ({
  ambulanceId,
  driverName,
  destination,
  signals,
  isEmergencyActive,
  tripMode,
  onSignalsUpdate,
  onTripProgressUpdate,
  onAddAlert,
  onSwitchToMapView,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Three.js Core Refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const ambulance3DRef = useRef<Ambulance3DInstance | null>(null);
  const splineCurveRef = useRef<THREE.CatmullRomCurve3 | null>(null);

  // 3D Objects
  const trafficVehicles3DRef = useRef<{ 
    mesh: THREE.Group; 
    lane: number; 
    offset: number; 
    speed: number; 
    hazardFlashers: THREE.Mesh[];
  }[]>([]);
  
  const signalGantries3DRef = useRef<Map<string, { 
    group: THREE.Group; 
    redBulbs: THREE.Mesh[]; 
    amberBulbs: THREE.Mesh[]; 
    greenBulbs: THREE.Mesh[]; 
    roadLights: THREE.PointLight[];
  }>>(new Map());

  // Interactive Driving Controls State
  const [isGasPressed, setIsGasPressed] = useState(false);
  const [isBrakePressed, setIsBrakePressed] = useState(false);
  const [steerInput, setSteerInput] = useState<number>(0); // -1 (Left), 0 (Center), +1 (Right)
  const [laneOffset, setLaneOffset] = useState<number>(0); // Lateral offset in meters (-4.5m to +4.5m)

  // Simulation State
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0.0);
  const [currentSpeed, setCurrentSpeed] = useState(tripMode === 'MEDIRUSH_AI' ? 64 : 32);
  const [activeIntersectionPhase, setActiveIntersectionPhase] = useState<string | null>(null);
  const [waitingAtSignal, setWaitingAtSignal] = useState<TrafficSignal | null>(null);
  const [isArrived, setIsArrived] = useState(false);
  const [currentIncident, setCurrentIncident] = useState<string>('PATIENT DISPATCH: Priority-1 Emergency Corridor active');

  const waypoints = destination.primaryRoute.waypoints;

  // Convert GPS (Lat, Lng) to smooth 3D World Coordinates (X, Z) relative to route origin
  const gpsToWorld3D = useCallback((lat: number, lng: number) => {
    const originLat = waypoints[0][0];
    const originLng = waypoints[0][1];
    const metersPerLat = 111320;
    const metersPerLng = 111320 * Math.cos((originLat * Math.PI) / 180);
    const x = (lng - originLng) * metersPerLng;
    const z = -(lat - originLat) * metersPerLat;
    return new THREE.Vector3(x, 0, z);
  }, [waypoints]);

  // Build high-resolution smooth CatmullRom Curve through all waypoints
  const splineCurve = useMemo(() => {
    const points: THREE.Vector3[] = [];
    waypoints.forEach((wp) => {
      points.push(gpsToWorld3D(wp[0], wp[1]));
    });
    // Tension 0.35 ensures natural road curves without sharp kinks
    const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.35);
    splineCurveRef.current = curve;
    return curve;
  }, [waypoints, gpsToWorld3D]);

  // Total road length in meters
  const totalRoadLengthMeters = useMemo(() => {
    return splineCurve.getLength();
  }, [splineCurve]);

  // Upcoming Next Signal calculation
  const nextUpcomingSignal = useMemo(() => {
    const currentDistKm = progress * destination.totalDistanceKm;
    return signals.find((s) => s.distanceAlongRouteKm > currentDistKm) || null;
  }, [progress, signals, destination.totalDistanceKm]);

  const distToNextSignalM = useMemo(() => {
    if (!nextUpcomingSignal) return 0;
    const currentDistKm = progress * destination.totalDistanceKm;
    return Math.max(0, Math.round((nextUpcomingSignal.distanceAlongRouteKm - currentDistKm) * 1000));
  }, [progress, nextUpcomingSignal, destination.totalDistanceKm]);

  // Realistic incident broadcasts trigger dynamically based on trip milestones
  useEffect(() => {
    if (progress < 0.25) {
      setCurrentIncident('🚨 108 DISPATCH: Patient in critical cardiac state. Apollo Jubilee Hills alerted.');
    } else if (progress < 0.55) {
      setCurrentIncident('⚠️ TRAFFIC POLICE V2X: Mindspace Arterial bottleneck detected — Preempting signal 2 & 3.');
    } else if (progress < 0.85) {
      setCurrentIncident('🟢 GREEN CORRIDOR ACTIVE: Civilian traffic yielding. Center lane open.');
    } else {
      setCurrentIncident('🏥 APPROACHING HOSPITAL: Emergency Trauma Bay 1 preparing triage team.');
    }
  }, [progress]);

  // --- KEYBOARD CONTROLS LISTENER ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) {
        setIsGasPressed(true);
      } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
        setIsBrakePressed(true);
      } else if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        setSteerInput(-1);
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        setSteerInput(1);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) {
        setIsGasPressed(false);
      } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
        setIsBrakePressed(false);
      } else if (['ArrowLeft', 'KeyA', 'ArrowRight', 'KeyD'].includes(e.code)) {
        setSteerInput(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // --- 1. INITIALIZE HIGH-QUALITY 3D ENVIRONMENT ---
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const width = containerRef.current.clientWidth || window.innerWidth;
    const height = containerRef.current.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c1626);
    scene.fog = new THREE.FogExp2(0x0f1d33, 0.0022);
    sceneRef.current = scene;

    // Dr. Driving Perspective Camera
    const camera = new THREE.PerspectiveCamera(52, width / height, 0.5, 1200);
    camera.position.set(0, 3.8, -7.5);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // High Quality Lighting
    const ambientLight = new THREE.AmbientLight(0xdbeafe, 1.8);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff6ed, 2.8);
    sunLight.position.set(120, 220, 100);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    scene.add(sunLight);

    // Ground Plane
    const groundGeo = new THREE.PlaneGeometry(4000, 4000);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x060c18, roughness: 0.95 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.06;
    ground.receiveShadow = true;
    scene.add(ground);

    // =========================================================================
    // 2. BUILD CONTINUOUS HIGH-PRECISION 4-LANE HIGHWAY RIBBON ALONG SPLINE
    // =========================================================================
    const curve = splineCurve;
    const totalSamples = Math.max(300, Math.floor(totalRoadLengthMeters / 4));
    const roadWidth = 16.0; // 4 lanes (each 4m wide)
    const sidewalkWidth = 3.2;

    const roadVertices: number[] = [];
    const roadIndices: number[] = [];
    const roadUvs: number[] = [];

    const dividerVertices: number[] = [];
    const dividerIndices: number[] = [];

    const sidewalkLVertices: number[] = [];
    const sidewalkLIndices: number[] = [];
    const sidewalkRVertices: number[] = [];
    const sidewalkRIndices: number[] = [];

    for (let i = 0; i <= totalSamples; i++) {
      const t = i / totalSamples;
      const point = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      // Asphalt Road (Left Edge to Right Edge)
      const leftEdge = point.clone().addScaledVector(normal, -roadWidth / 2);
      const rightEdge = point.clone().addScaledVector(normal, roadWidth / 2);

      roadVertices.push(leftEdge.x, 0.01, leftEdge.z);
      roadVertices.push(rightEdge.x, 0.01, rightEdge.z);
      roadUvs.push(0, t * 150);
      roadUvs.push(1, t * 150);

      // Yellow Center Divider (Width 0.45m)
      const divL = point.clone().addScaledVector(normal, -0.25);
      const divR = point.clone().addScaledVector(normal, 0.25);
      dividerVertices.push(divL.x, 0.02, divL.z);
      dividerVertices.push(divR.x, 0.02, divR.z);

      // Left Sidewalk
      const swLOuter = point.clone().addScaledVector(normal, -roadWidth / 2 - sidewalkWidth);
      sidewalkLVertices.push(swLOuter.x, 0.2, swLOuter.z);
      sidewalkLVertices.push(leftEdge.x, 0.2, leftEdge.z);

      // Right Sidewalk
      const swROuter = point.clone().addScaledVector(normal, roadWidth / 2 + sidewalkWidth);
      sidewalkRVertices.push(rightEdge.x, 0.2, rightEdge.z);
      sidewalkRVertices.push(swROuter.x, 0.2, swROuter.z);

      if (i < totalSamples) {
        const v = i * 2;
        // Two triangles per quad
        roadIndices.push(v, v + 1, v + 2);
        roadIndices.push(v + 1, v + 3, v + 2);

        dividerIndices.push(v, v + 1, v + 2);
        dividerIndices.push(v + 1, v + 3, v + 2);

        sidewalkLIndices.push(v, v + 1, v + 2);
        sidewalkLIndices.push(v + 1, v + 3, v + 2);

        sidewalkRIndices.push(v, v + 1, v + 2);
        sidewalkRIndices.push(v + 1, v + 3, v + 2);
      }
    }

    // Asphalt Road Mesh
    const roadGeo = new THREE.BufferGeometry();
    roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadVertices, 3));
    roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(roadUvs, 2));
    roadGeo.setIndex(roadIndices);
    roadGeo.computeVertexNormals();

    const roadMat = new THREE.MeshStandardMaterial({ 
      color: 0x1e293b, 
      roughness: 0.65, 
      metalness: 0.1 
    });
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.receiveShadow = true;
    scene.add(roadMesh);

    // Yellow Double Center Divider Mesh
    const dividerGeo = new THREE.BufferGeometry();
    dividerGeo.setAttribute('position', new THREE.Float32BufferAttribute(dividerVertices, 3));
    dividerGeo.setIndex(dividerIndices);
    dividerGeo.computeVertexNormals();
    const dividerMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const dividerMesh = new THREE.Mesh(dividerGeo, dividerMat);
    scene.add(dividerMesh);

    // Sidewalk Meshes
    const swMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
    const swLGeo = new THREE.BufferGeometry();
    swLGeo.setAttribute('position', new THREE.Float32BufferAttribute(sidewalkLVertices, 3));
    swLGeo.setIndex(sidewalkLIndices);
    swLGeo.computeVertexNormals();
    scene.add(new THREE.Mesh(swLGeo, swMat));

    const swRGeo = new THREE.BufferGeometry();
    swRGeo.setAttribute('position', new THREE.Float32BufferAttribute(sidewalkRVertices, 3));
    swRGeo.setIndex(sidewalkRIndices);
    swRGeo.computeVertexNormals();
    scene.add(new THREE.Mesh(swRGeo, swMat));

    // Roadside City Architecture (Skyscrapers, Tech Parks & Streetlights)
    const buildingMat1 = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3, metalness: 0.7 });
    const buildingMat2 = new THREE.MeshStandardMaterial({ color: 0x0f233a, roughness: 0.2, metalness: 0.8 });
    const treeTrunkMat = new THREE.MeshStandardMaterial({ color: 0x5a3d28, roughness: 0.9 });
    const treeLeavesMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });

    const totalBuildings = Math.floor(totalRoadLengthMeters / 45);
    for (let b = 1; b < totalBuildings; b++) {
      const t = b / totalBuildings;
      const point = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      // Left High-Rise Tower
      const hL = 40 + Math.random() * 75;
      const bL = new THREE.Mesh(new THREE.BoxGeometry(22, hL, 22), b % 2 === 0 ? buildingMat1 : buildingMat2);
      const posL = point.clone().addScaledVector(normal, -roadWidth / 2 - sidewalkWidth - 14);
      bL.position.set(posL.x, hL / 2, posL.z);
      bL.castShadow = true;
      scene.add(bL);

      // Right High-Rise Tower
      const hR = 45 + Math.random() * 80;
      const bR = new THREE.Mesh(new THREE.BoxGeometry(22, hR, 22), b % 3 === 0 ? buildingMat2 : buildingMat1);
      const posR = point.clone().addScaledVector(normal, roadWidth / 2 + sidewalkWidth + 14);
      bR.position.set(posR.x, hR / 2, posR.z);
      bR.castShadow = true;
      scene.add(bR);

      // Palm Trees on Sidewalks
      const trunkL = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 4.5), treeTrunkMat);
      const leavesL = new THREE.Mesh(new THREE.ConeGeometry(2.0, 3.5, 7), treeLeavesMat);
      leavesL.position.y = 3.5;
      const treeL = new THREE.Group();
      treeL.add(trunkL, leavesL);
      const posTreeL = point.clone().addScaledVector(normal, -roadWidth / 2 - 1.5);
      treeL.position.set(posTreeL.x, 2.25, posTreeL.z);
      scene.add(treeL);

      const trunkR = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 4.5), treeTrunkMat);
      const leavesR = new THREE.Mesh(new THREE.ConeGeometry(2.0, 3.5, 7), treeLeavesMat);
      leavesR.position.y = 3.5;
      const treeR = new THREE.Group();
      treeR.add(trunkR, leavesR);
      const posTreeR = point.clone().addScaledVector(normal, roadWidth / 2 + 1.5);
      treeR.position.set(posTreeR.x, 2.25, posTreeR.z);
      scene.add(treeR);
    }

    // =========================================================================
    // 3. BUILD 3D PROMINENT OVERHEAD TRAFFIC SIGNAL GANTRIES ACROSS ALL LANES
    // =========================================================================
    signalGantries3DRef.current.clear();
    const trussMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9, roughness: 0.2 });
    const boxMat = new THREE.MeshStandardMaterial({ color: 0x020617, roughness: 0.5 });
    const bulbGeo = new THREE.SphereGeometry(0.52, 20, 20); // Large prominent glowing bulbs

    signals.forEach((sig) => {
      // Find curve parameter t matching distance
      const sigFraction = Math.min(0.98, Math.max(0.02, sig.distanceAlongRouteKm / destination.totalDistanceKm));
      const gantryPos = curve.getPointAt(sigFraction);
      const tangent = curve.getTangentAt(sigFraction).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      const gantryGroup = new THREE.Group();
      gantryGroup.position.copy(gantryPos);
      
      // Orient gantry so it faces directly into the road
      const angle = Math.atan2(tangent.x, tangent.z);
      gantryGroup.rotation.y = angle;

      // Heavy Duty Steel Truss spanning 20 meters across the 4 lanes
      const truss = new THREE.Mesh(new THREE.BoxGeometry(20.0, 0.8, 0.8), trussMat);
      truss.position.set(0, 7.8, 0);
      gantryGroup.add(truss);

      // Left & Right Support Pillars
      const pillarL = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 8.5, 16), trussMat);
      pillarL.position.set(-9.8, 4.25, 0);
      const pillarR = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 8.5, 16), trussMat);
      pillarR.position.set(9.8, 4.25, 0);
      gantryGroup.add(pillarL, pillarR);

      // 3 Overhead Signal Heads (Left Lane, Center Lane, Right Lane)
      const lanePositions = [-4.5, 0, 4.5];
      const redBulbs: THREE.Mesh[] = [];
      const amberBulbs: THREE.Mesh[] = [];
      const greenBulbs: THREE.Mesh[] = [];
      const roadLights: THREE.PointLight[] = [];

      lanePositions.forEach((xPos) => {
        // Signal Head Box
        const headBox = new THREE.Mesh(new THREE.BoxGeometry(1.6, 4.2, 1.0), boxMat);
        headBox.position.set(xPos, 6.2, 0);
        gantryGroup.add(headBox);

        // Sun visors over bulbs
        const visorGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.45, 16, 1, true, 0, Math.PI);
        const visor = new THREE.Mesh(visorGeo, boxMat);
        visor.rotation.x = Math.PI / 2;
        visor.position.set(xPos, 7.4, -0.6);
        gantryGroup.add(visor);

        // Red Bulb (Upper) - Facing backwards along road (-Z local)
        const redB = new THREE.Mesh(
          bulbGeo,
          new THREE.MeshStandardMaterial({ 
            color: 0xef4444, 
            emissive: 0xef4444, 
            emissiveIntensity: 2.2 
          })
        );
        redB.position.set(xPos, 7.4, -0.55);

        // Amber Bulb (Middle)
        const amberB = new THREE.Mesh(
          bulbGeo,
          new THREE.MeshStandardMaterial({ 
            color: 0xf59e0b, 
            emissive: 0xf59e0b, 
            emissiveIntensity: 0.1 
          })
        );
        amberB.position.set(xPos, 6.2, -0.55);

        // Green Bulb (Lower)
        const greenB = new THREE.Mesh(
          bulbGeo,
          new THREE.MeshStandardMaterial({ 
            color: 0x10b981, 
            emissive: 0x10b981, 
            emissiveIntensity: 0.1 
          })
        );
        greenB.position.set(xPos, 5.0, -0.55);

        // Downward road illumination light
        const roadLight = new THREE.PointLight(0xef4444, 2.5, 25);
        roadLight.position.set(xPos, 5.5, -2.5);

        gantryGroup.add(redB, amberB, greenB, roadLight);
        redBulbs.push(redB);
        amberBulbs.push(amberB);
        greenBulbs.push(greenB);
        roadLights.push(roadLight);
      });

      // Road Surface Zebra Crosswalk & Stop Line (Local -Z is in front of gantry)
      const zebra = new THREE.Mesh(
        new THREE.PlaneGeometry(16, 4.5),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 })
      );
      zebra.rotation.x = -Math.PI / 2;
      zebra.position.set(0, 0.03, -4.5);
      gantryGroup.add(zebra);

      const stopLine = new THREE.Mesh(
        new THREE.PlaneGeometry(16, 0.8),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      stopLine.rotation.x = -Math.PI / 2;
      stopLine.position.set(0, 0.03, -8.0);
      gantryGroup.add(stopLine);

      scene.add(gantryGroup);
      signalGantries3DRef.current.set(sig.id, {
        group: gantryGroup,
        redBulbs,
        amberBulbs,
        greenBulbs,
        roadLights,
      });
    });

    // =========================================================================
    // 4. BUILD 3D DESTINATION HOSPITAL LANDMARK AT ROUTE END
    // =========================================================================
    const endPoint = curve.getPointAt(1.0);
    const endTangent = curve.getTangentAt(1.0).normalize();
    const endNormal = new THREE.Vector3(-endTangent.z, 0, endTangent.x).normalize();

    const hospitalGroup = new THREE.Group();
    hospitalGroup.position.copy(endPoint);
    hospitalGroup.rotation.y = Math.atan2(endTangent.x, endTangent.z);

    const hospMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2, metalness: 0.3 });
    const hospRedCrossMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 1.5 });

    const hospMain = new THREE.Mesh(new THREE.BoxGeometry(65, 50, 40), hospMat);
    hospMain.position.set(0, 25, 45);
    hospitalGroup.add(hospMain);

    // Glowing Red Medical Cross
    const crossV = new THREE.Mesh(new THREE.BoxGeometry(4, 16, 1.0), hospRedCrossMat);
    crossV.position.set(0, 36, 24.8);
    const crossH = new THREE.Mesh(new THREE.BoxGeometry(16, 4, 1.0), hospRedCrossMat);
    crossH.position.set(0, 36, 24.8);
    hospitalGroup.add(crossV, crossH);

    // Emergency Bay Glass Canopy
    const canopy = new THREE.Mesh(
      new THREE.BoxGeometry(28, 0.8, 16),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.1 })
    );
    canopy.position.set(0, 8, 20);
    hospitalGroup.add(canopy);

    scene.add(hospitalGroup);

    // =========================================================================
    // 5. ADD 3D PLAYER EMERGENCY AMBULANCE (LIFE-SIZED 1.0 SCALE)
    // =========================================================================
    const ambulance = createAmbulance3D(1.0);
    ambulance3DRef.current = ambulance;
    scene.add(ambulance.group);

    // =========================================================================
    // 6. ADD DIVERSE 3D TRAFFIC VEHICLES (SEDANS, AUTOS, BUSES, SUVS)
    // =========================================================================
    trafficVehicles3DRef.current = [];
    const carTypes = [
      { name: 'sedan', color: 0xdc2626, w: 2.1, h: 1.2, l: 4.5 },
      { name: 'auto', color: 0xfacc15, w: 1.8, h: 1.6, l: 2.8 }, // Hyderabad Yellow Auto
      { name: 'suv', color: 0x0284c7, w: 2.3, h: 1.6, l: 4.8 },
      { name: 'bus', color: 0xb91c1c, w: 2.8, h: 2.8, l: 9.5 }, // TSRTC City Bus
      { name: 'silver_car', color: 0x94a3b8, w: 2.1, h: 1.2, l: 4.4 },
    ];

    for (let c = 0; c < 15; c++) {
      const type = carTypes[c % carTypes.length];
      const carGroup = new THREE.Group();
      
      const bodyMat = new THREE.MeshStandardMaterial({ color: type.color, roughness: 0.3, metalness: 0.5 });
      const body = new THREE.Mesh(new THREE.BoxGeometry(type.w, type.h, type.l), bodyMat);
      body.position.y = type.h / 2 + 0.35;
      body.castShadow = true;
      carGroup.add(body);

      // Glass Windows
      const glass = new THREE.Mesh(
        new THREE.BoxGeometry(type.w * 0.9, type.h * 0.5, type.l * 0.5),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1 })
      );
      glass.position.set(0, type.h * 0.9, -0.2);
      carGroup.add(glass);

      // Amber Hazard Blinkers (Activated when yielding to ambulance)
      const hazardL = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0 })
      );
      hazardL.position.set(-type.w / 2 - 0.05, type.h / 2, -type.l / 2);

      const hazardR = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0 })
      );
      hazardR.position.set(type.w / 2 + 0.05, type.h / 2, -type.l / 2);

      carGroup.add(hazardL, hazardR);
      scene.add(carGroup);

      // 4 Lanes: -5.5m (Left), -1.8m (Center-Left), +1.8m (Center-Right), +5.5m (Right)
      const laneChoice = (c % 4 === 0) ? -5.5 : (c % 4 === 1) ? -1.8 : (c % 4 === 2) ? 1.8 : 5.5;

      trafficVehicles3DRef.current.push({
        mesh: carGroup,
        lane: laneChoice,
        offset: (c / 15),
        speed: 36 + Math.random() * 14,
        hazardFlashers: [hazardL, hazardR],
      });
    }

    const handleResize = () => {
      if (!containerRef.current || !renderer || !camera) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      ambulance.destroy();
      renderer.dispose();
    };
  }, [destination, splineCurve, totalRoadLengthMeters, signals]);

  // --- 2. 60 FPS ARCADE DRIVING & CAMERA FOLLOW LOOP ---
  const lastTimeRef = useRef<number>(performance.now());
  const cameraPosLerp = useRef<THREE.Vector3>(new THREE.Vector3(0, 3.8, -7.5));
  const cameraLookLerp = useRef<THREE.Vector3>(new THREE.Vector3(0, 1.2, 24));

  useEffect(() => {
    let animationFrameId: number;

    const animate = (now: number) => {
      const delta = Math.min((now - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = now;

      const curve = splineCurveRef.current;
      const ambulance = ambulance3DRef.current;
      const camera = cameraRef.current;
      const renderer = rendererRef.current;
      const scene = sceneRef.current;

      const remainingKm = Math.max(0, destination.totalDistanceKm * (1 - progress));
      const etaMin = currentSpeed > 5 ? (remainingKm / currentSpeed) * 60 : (remainingKm / 35) * 60;
      onTripProgressUpdate(progress, remainingKm, etaMin, currentSpeed);

      if (isPlaying && isEmergencyActive && curve && ambulance && camera && renderer && scene) {
        
        // 1. Smooth Lateral Steering Input (A/D or on-screen steering)
        if (steerInput !== 0) {
          setLaneOffset((prev) => Math.max(-5.5, Math.min(5.5, prev + steerInput * delta * 7.5)));
        }

        // 2. Realistic Speed Physics (W/S or Autopilot Cruise)
        if (isGasPressed) {
          setCurrentSpeed((prev) => Math.min(84, prev + delta * 28)); // Smooth acceleration
        } else if (isBrakePressed) {
          setCurrentSpeed((prev) => Math.max(0, prev - delta * 48)); // Firm braking
        } else {
          // Cruise Target Speed
          const targetCruise = tripMode === 'MEDIRUSH_AI' ? 68 : 34;
          setCurrentSpeed((prev) => prev + (targetCruise - prev) * 0.08);
        }

        // 3. Red Signal Stop Check (Normal Case Mode)
        if (waitingAtSignal) {
          setCurrentSpeed((prev) => Math.max(0, prev - prev * 0.2));
        } else {
          // Advance Ambulance Progress along continuous spline curve
          const velocityMps = (currentSpeed * 1000) / 3600;
          const deltaDistanceM = velocityMps * delta;
          const deltaProgress = deltaDistanceM / totalRoadLengthMeters;

          setProgress((prev) => {
            const next = prev + deltaProgress;
            if (next >= 1.0) {
              setIsArrived(true);
              confetti({ particleCount: 180, spread: 85, origin: { y: 0.6 } });
              onAddAlert(`🚑 ARRIVED at ${destination.name} Emergency Bay!`, 'success');
              return 1.0;
            }
            return next;
          });

          // 4. V2X Signal Preemption Logic along the curve
          const currentDistKm = progress * destination.totalDistanceKm;
          let updatedAnySignal = false;

          const updatedSignals = signals.map((sig) => {
            const distToSignalKm = sig.distanceAlongRouteKm - currentDistKm;
            const gantryData = signalGantries3DRef.current.get(sig.id);

            if (tripMode === 'MEDIRUSH_AI') {
              if (distToSignalKm <= 1.0 && distToSignalKm > 0.45) {
                if (sig.currentState !== 'ALERT_1KM' && sig.currentState !== 'PREEMPTED_GREEN') {
                  setActiveIntersectionPhase(`🚨 1KM PROXIMITY ALERT: ${sig.name} • V2X ARMED`);
                  onAddAlert(`🚨 1KM ALERT: ${sig.name} — V2X Preemption Armed`, 'alert');
                  updatedAnySignal = true;
                  return { ...sig, currentState: 'ALERT_1KM' as const, timerSeconds: 15 };
                }
              } else if (distToSignalKm <= 0.45 && distToSignalKm >= -0.1) {
                if (sig.currentState !== 'PREEMPTED_GREEN') {
                  setActiveIntersectionPhase(`🟢 GREEN WAVE ACTIVE: ${sig.name} CLEARED`);
                  onAddAlert(`🟢 GREEN WAVE: ${sig.name} cleared for ambulance`, 'success');
                  updatedAnySignal = true;
                  return { ...sig, currentState: 'PREEMPTED_GREEN' as const, timerSeconds: 10 };
                }
              } else if (distToSignalKm < -0.1) {
                if (sig.currentState !== 'CLEARED') {
                  setActiveIntersectionPhase(null);
                  updatedAnySignal = true;
                  return { ...sig, currentState: 'CLEARED' as const, timerSeconds: 0 };
                }
              }
            } else {
              // Normal Case Mode
              if (distToSignalKm <= 0.06 && distToSignalKm >= 0 && sig.currentState !== 'CLEARED') {
                if (!waitingAtSignal) {
                  setWaitingAtSignal(sig);
                  setActiveIntersectionPhase(`🛑 STOPPED AT RED LIGHT: ${sig.name}`);
                  onAddAlert(`🛑 NORMAL CASE: Stopped at Red Light at ${sig.name}`, 'alert');
                }
              } else if (distToSignalKm < -0.05) {
                if (sig.currentState !== 'CLEARED') {
                  setWaitingAtSignal(null);
                  updatedAnySignal = true;
                  return { ...sig, currentState: 'CLEARED' as const, timerSeconds: 0 };
                }
              }
            }

            // Update 3D Gantry Bulb Emissives & Road Lighting
            if (gantryData) {
              const isGreen = sig.currentState === 'PREEMPTED_GREEN';
              const isAlert = sig.currentState === 'ALERT_1KM';

              gantryData.redBulbs.forEach((bulb) => {
                (bulb.material as THREE.MeshStandardMaterial).emissiveIntensity = !isGreen && !isAlert ? 2.5 : 0.05;
              });
              gantryData.amberBulbs.forEach((bulb) => {
                (bulb.material as THREE.MeshStandardMaterial).emissiveIntensity = isAlert ? 2.5 : 0.05;
              });
              gantryData.greenBulbs.forEach((bulb) => {
                (bulb.material as THREE.MeshStandardMaterial).emissiveIntensity = isGreen ? 3.0 : 0.05;
              });

              gantryData.roadLights.forEach((light) => {
                if (isGreen) {
                  light.color.setHex(0x10b981);
                  light.intensity = 4.0;
                } else if (isAlert) {
                  light.color.setHex(0xf59e0b);
                  light.intensity = 3.5;
                } else {
                  light.color.setHex(0xef4444);
                  light.intensity = 3.5;
                }
              });
            }

            return sig;
          });

          if (updatedAnySignal) {
            onSignalsUpdate(updatedSignals);
          }
        }

        // =======================================================================
        // 5. UPDATE AMBULANCE POSITION & SMOOTH ROAD ALIGNMENT
        // =======================================================================
        const clampedT = Math.max(0, Math.min(1, progress));
        const ambCenterPos = curve.getPointAt(clampedT);
        const ambTangent = curve.getTangentAt(clampedT).normalize();
        const ambNormal = new THREE.Vector3(-ambTangent.z, 0, ambTangent.x).normalize();

        // Apply lateral lane offset perpendicular to curve tangent
        const ambWorldPos = ambCenterPos.clone().addScaledVector(ambNormal, laneOffset);
        ambulance.group.position.copy(ambWorldPos);

        // Orient ambulance along curve heading + slight roll when steering
        const headingAngle = Math.atan2(ambTangent.x, ambTangent.z);
        ambulance.group.rotation.set(0, headingAngle, -steerInput * 0.05);

        ambulance.update(delta, isEmergencyActive && isPlaying && !waitingAtSignal, currentSpeed);

        // =======================================================================
        // 6. UPDATE MOVING TRAFFIC & REALISTIC EMERGENCY YIELDING
        // =======================================================================
        trafficVehicles3DRef.current.forEach((tv) => {
          let nextOffset = tv.offset + (delta * (tv.speed * 1000) / 3600) / totalRoadLengthMeters;
          if (nextOffset >= 1.0) nextOffset = 0;
          tv.offset = nextOffset;

          const tvPos = curve.getPointAt(nextOffset);
          const tvTangent = curve.getTangentAt(nextOffset).normalize();
          const tvNormal = new THREE.Vector3(-tvTangent.z, 0, tvTangent.x).normalize();

          // Emergency Yield Behavior: Cars ahead in ambulance lane pull over to outer shoulder
          const distToAmb = Math.abs(nextOffset - progress);
          const isAheadInCorridor = (nextOffset > progress) && distToAmb < 0.12;
          const shouldYield = (tripMode === 'MEDIRUSH_AI') && isAheadInCorridor;

          const targetLane = shouldYield ? (tv.lane <= 0 ? -6.8 : 6.8) : tv.lane;
          const finalTvPos = tvPos.clone().addScaledVector(tvNormal, targetLane);

          tv.mesh.position.copy(finalTvPos);
          tv.mesh.rotation.y = Math.atan2(tvTangent.x, tvTangent.z);

          // Flash amber hazard blinkers when yielding
          const hazardIntensity = shouldYield ? (Math.sin(now * 0.012) > 0 ? 2.5 : 0.1) : 0;
          tv.hazardFlashers.forEach((flasher) => {
            (flasher.material as THREE.MeshStandardMaterial).emissiveIntensity = hazardIntensity;
          });
        });

        // =======================================================================
        // 7. DR. DRIVING CHASE CAMERA (ELEVATED BEHIND AMBULANCE DOWN ROAD)
        // =======================================================================
        // Camera sits 7.5m behind ambulance (-ambTangent) and 3.6m above
        const camTargetPos = ambWorldPos.clone()
          .addScaledVector(ambTangent, -7.5)
          .add(new THREE.Vector3(0, 3.6, 0));

        // Camera looks 24m ahead down the road
        const lookTargetPos = ambWorldPos.clone()
          .addScaledVector(ambTangent, 24.0)
          .add(new THREE.Vector3(0, 1.2, 0));

        cameraPosLerp.current.lerp(camTargetPos, 0.18);
        camera.position.copy(cameraPosLerp.current);

        cameraLookLerp.current.lerp(lookTargetPos, 0.20);
        camera.lookAt(cameraLookLerp.current);

        renderer.render(scene, camera);
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, isEmergencyActive, progress, currentSpeed, signals, destination, tripMode, waitingAtSignal, isGasPressed, isBrakePressed, steerInput, laneOffset, totalRoadLengthMeters, onSignalsUpdate, onTripProgressUpdate, onAddAlert]);

  const handleResetTrip = () => {
    setProgress(0);
    setWaitingAtSignal(null);
    setLaneOffset(0);
    setIsArrived(false);
    onSignalsUpdate(destination.signals);
    onAddAlert(`Simulation reset to origin station`, 'info');
  };

  return (
    <div ref={containerRef} className="relative w-full h-full flex-1 rounded-3xl overflow-hidden border-2 border-slate-800 shadow-[0_0_60px_rgba(0,0,0,0.85)] bg-[#050b14] flex flex-col select-none">
      
      {/* 3D WebGL Driving Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0 cursor-grab active:cursor-grabbing" />

      {/* ========================================================================= */}
      {/* REALISTIC EMERGENCY DRIVING GAME HUD */}
      {/* ========================================================================= */}

      {/* 1. TOP BAR: STATUS, DESTINATION & 3 GREEN FORWARD ARROWS */}
      <div className="absolute top-3.5 inset-x-4 z-20 flex items-start justify-between pointer-events-none">
        
        {/* Top-Left: Emergency System Badge */}
        <div className="bg-[#0f172a]/95 backdrop-blur-md border border-slate-800 px-4 py-2 rounded-2xl shadow-2xl flex items-center space-x-2.5 text-xs font-mono pointer-events-auto">
          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></div>
          <div>
            <span className="text-[9px] font-bold text-slate-400 block uppercase">MEDIRUSH AI DISPATCH</span>
            <span className="font-black text-emerald-400 text-xs">
              {tripMode === 'MEDIRUSH_AI' ? 'EMERGENCY CORRIDOR' : 'STANDARD PATROL'}
            </span>
          </div>
        </div>

        {/* Top-Center: Green Wave Forward Arrows + Upcoming Signal */}
        <div className="flex flex-col items-center space-y-1">
          {/* 3 Green Forward Arrows over road lanes */}
          <div className="flex items-center space-x-6">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white shadow-lg ${
              tripMode === 'MEDIRUSH_AI' ? 'bg-emerald-500 shadow-emerald-500/50 animate-bounce' : 'bg-slate-800 opacity-40'
            }`}>
              <ArrowUp className="w-5 h-5 stroke-[3]" />
            </div>
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white shadow-xl ${
              tripMode === 'MEDIRUSH_AI' ? 'bg-emerald-500 shadow-emerald-500/60 animate-bounce delay-75' : 'bg-slate-800 opacity-40'
            }`}>
              <ArrowUp className="w-6 h-6 stroke-[3]" />
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white shadow-lg ${
              tripMode === 'MEDIRUSH_AI' ? 'bg-emerald-500 shadow-emerald-500/50 animate-bounce delay-150' : 'bg-slate-800 opacity-40'
            }`}>
              <ArrowUp className="w-5 h-5 stroke-[3]" />
            </div>
          </div>

          <div className="bg-[#0f172a]/95 backdrop-blur-md border border-slate-800 px-4 py-1.5 rounded-full shadow-2xl text-xs font-mono font-bold text-white flex items-center space-x-2 pointer-events-auto">
            <span>🏥 {destination.name}</span>
            {nextUpcomingSignal && (
              <>
                <span className="text-slate-500">&bull;</span>
                <span className="text-emerald-400 font-bold">Signal: {nextUpcomingSignal.name} ({distToNextSignalM}m)</span>
              </>
            )}
          </div>
        </div>

        {/* Top-Right: Return to Map View Button */}
        <div className="flex items-center space-x-2.5 pointer-events-auto">
          <button
            onClick={onSwitchToMapView}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-black uppercase tracking-wider shadow-lg shadow-emerald-600/40 flex items-center space-x-1.5 cursor-pointer active:scale-95 transition-all"
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>COMMAND MAP</span>
          </button>
        </div>
      </div>

      {/* 2. REALISTIC INCIDENT / DISPATCH BROADCAST TICKER */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 max-w-xl w-full px-4 pointer-events-none">
        <div className="bg-slate-950/90 backdrop-blur-md border border-emerald-500/50 text-emerald-300 px-4 py-1.5 rounded-full text-xs font-mono font-bold shadow-2xl flex items-center justify-center space-x-2 text-center">
          <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse flex-shrink-0" />
          <span className="truncate">{activeIntersectionPhase || currentIncident}</span>
        </div>
      </div>

      {/* 3. BOTTOM-LEFT: STEERING CONTROLS */}
      <div className="absolute bottom-4 left-6 z-20 flex flex-col items-center select-none">
        <div className="flex items-center space-x-3 mb-1">
          <button
            onMouseDown={() => setSteerInput(-1)}
            onMouseUp={() => setSteerInput(0)}
            onTouchStart={() => setSteerInput(-1)}
            onTouchEnd={() => setSteerInput(0)}
            className="w-11 h-11 rounded-2xl bg-slate-900/90 border border-slate-700 hover:border-emerald-400 text-white flex items-center justify-center cursor-pointer active:scale-90 shadow-xl"
            title="Steer Left"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            onMouseDown={() => setSteerInput(1)}
            onMouseUp={() => setSteerInput(0)}
            onTouchStart={() => setSteerInput(1)}
            onTouchEnd={() => setSteerInput(0)}
            className="w-11 h-11 rounded-2xl bg-slate-900/90 border border-slate-700 hover:border-emerald-400 text-white flex items-center justify-center cursor-pointer active:scale-90 shadow-xl"
            title="Steer Right"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Steering Wheel Graphic */}
        <svg
          style={{ transform: `rotate(${steerInput * 28 + (laneOffset * 3.5)}deg)` }}
          width="150"
          height="115"
          viewBox="0 0 200 150"
          className="drop-shadow-[0_15px_30px_rgba(0,0,0,0.9)] transition-transform duration-100 opacity-90 pointer-events-none"
        >
          <ellipse cx="100" cy="110" rx="85" ry="70" fill="none" stroke="#0f172a" strokeWidth="18" />
          <ellipse cx="100" cy="110" rx="85" ry="70" fill="none" stroke="#334155" strokeWidth="4" />
          <rect x="25" y="102" width="60" height="14" rx="3" fill="#1e293b" />
          <rect x="115" y="102" width="60" height="14" rx="3" fill="#1e293b" />
          <rect x="92" y="110" width="16" height="35" rx="3" fill="#1e293b" />
          <circle cx="100" cy="108" r="28" fill="#020617" stroke="#475569" strokeWidth="2" />
          <text x="100" y="113" textAnchor="middle" fill="#ef4444" fontSize="11" fontWeight="bold" fontFamily="monospace">
            🚑 108
          </text>
        </svg>
      </div>

      {/* 4. BOTTOM-CENTER: SPEEDOMETER & MISSION TELEMETRY */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-5 bg-[#0f172a]/95 backdrop-blur-md border border-slate-800 py-2.5 px-6 rounded-2xl shadow-2xl text-xs font-mono">
        <div className="flex items-baseline space-x-1">
          <span className="text-3xl font-black text-white leading-none">
            {Math.round(currentSpeed)}
          </span>
          <span className="text-[9px] text-slate-400 uppercase">KM/H</span>
        </div>

        <div className="h-7 w-px bg-slate-800"></div>

        <div>
          <span className="text-[8px] text-slate-400 uppercase block">Distance</span>
          <span className="text-sm font-black text-white">
            {Math.max(0, destination.totalDistanceKm * (1 - progress)).toFixed(1)} KM
          </span>
        </div>

        <div className="h-7 w-px bg-slate-800"></div>

        <div>
          <span className="text-[8px] text-slate-400 uppercase block">ETA</span>
          <span className={`text-sm font-black ${tripMode === 'MEDIRUSH_AI' ? 'text-emerald-400' : 'text-amber-400'}`}>
            {isArrived ? '00:00' : `${Math.ceil((destination.totalDistanceKm * (1 - progress) / (currentSpeed || 35)) * 60)} MIN`}
          </span>
        </div>
      </div>

      {/* 5. BOTTOM-RIGHT: GAS & BRAKE PEDALS */}
      <div className="absolute bottom-4 right-6 z-20 flex items-end space-x-3 select-none">
        {/* Brake Pedal */}
        <button
          onMouseDown={() => setIsBrakePressed(true)}
          onMouseUp={() => setIsBrakePressed(false)}
          onTouchStart={() => setIsBrakePressed(true)}
          onTouchEnd={() => setIsBrakePressed(false)}
          className={`w-14 h-18 rounded-2xl border-2 shadow-2xl flex flex-col justify-around p-1.5 items-center cursor-pointer transition-all active:scale-95 ${
            isBrakePressed
              ? 'bg-red-950 border-red-500 shadow-red-600/50'
              : 'bg-gradient-to-b from-slate-800 to-slate-950 border-slate-600'
          }`}
          title="Hold to Brake"
        >
          <div className="w-8 h-1.5 bg-slate-500 rounded"></div>
          <div className="w-8 h-1.5 bg-slate-500 rounded"></div>
          <div className="w-8 h-1.5 bg-slate-500 rounded"></div>
          <span className="text-[9px] font-mono font-black text-slate-300">BRAKE</span>
        </button>

        {/* Accelerator Gas Pedal */}
        <button
          onMouseDown={() => setIsGasPressed(true)}
          onMouseUp={() => setIsGasPressed(false)}
          onTouchStart={() => setIsGasPressed(true)}
          onTouchEnd={() => setIsGasPressed(false)}
          className={`w-12 h-24 rounded-2xl border-2 shadow-2xl flex flex-col justify-around p-1.5 items-center cursor-pointer transition-all active:scale-95 ${
            isGasPressed
              ? 'bg-emerald-950 border-emerald-400 shadow-emerald-600/50'
              : 'bg-gradient-to-b from-slate-800 to-slate-950 border-emerald-500/60'
          }`}
          title="Hold to Accelerate"
        >
          <div className="w-6 h-1.5 bg-emerald-400 rounded"></div>
          <div className="w-6 h-1.5 bg-emerald-400 rounded"></div>
          <div className="w-6 h-1.5 bg-emerald-400 rounded"></div>
          <div className="w-6 h-1.5 bg-emerald-400 rounded"></div>
          <span className="text-[9px] font-mono font-black text-emerald-400">GAS</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 6. ARRIVAL SEQUENCE MODAL (PATIENT DESTINATION REACHED) */}
      {/* ========================================================================= */}
      {isArrived && (
        <div className="absolute inset-0 z-40 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#0f172a] p-6 sm:p-8 rounded-3xl border-2 border-emerald-500/60 max-w-lg w-full text-center space-y-4 shadow-[0_0_50px_rgba(16,185,129,0.35)]">
            
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/50 mx-auto flex items-center justify-center text-3xl shadow-lg shadow-emerald-500/30">
              🏥
            </div>

            <div>
              <span className="text-[10px] font-mono font-black text-emerald-400 uppercase tracking-widest block">
                EMERGENCY TRIP COMPLETE
              </span>
              <h3 className="text-2xl font-black text-white tracking-wide mt-1">
                PATIENT DESTINATION REACHED
              </h3>
              <p className="text-sm text-emerald-300 font-semibold mt-0.5">
                {destination.name} &bull; Emergency Bay 1
              </p>
            </div>

            {/* Performance Results Summary */}
            <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-2 text-left text-xs font-mono">
              <span className="text-[11px] font-bold text-slate-300 uppercase block">
                MediRush AI Performance Report:
              </span>
              
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40">
                  <span className="text-[9px] text-emerald-400 uppercase block">Total Distance</span>
                  <span className="text-base font-black text-white">{destination.totalDistanceKm} km</span>
                  <span className="text-[10px] text-slate-400 block">Corridor Traversed</span>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40">
                  <span className="text-[9px] text-emerald-400 uppercase block">Time Saved</span>
                  <span className="text-base font-black text-emerald-300">+9.5 min</span>
                  <span className="text-[10px] text-slate-400 block">vs Standard Traffic</span>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40">
                  <span className="text-[9px] text-emerald-400 uppercase block">Green Wave Preemption</span>
                  <span className="text-base font-black text-emerald-300">4 / 4 Signals</span>
                  <span className="text-[10px] text-slate-400 block">100% Non-Stop Clear</span>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40">
                  <span className="text-[9px] text-emerald-400 uppercase block">Traffic Clearance</span>
                  <span className="text-base font-black text-emerald-300">Optimal</span>
                  <span className="text-[10px] text-slate-400 block">Corridor Yield Active</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                onClick={handleResetTrip}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-bold uppercase transition-all cursor-pointer"
              >
                DRIVE AGAIN
              </button>

              <button
                onClick={onSwitchToMapView}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-600/40 transition-all active:scale-95 cursor-pointer"
              >
                RETURN TO MAP VIEW
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
