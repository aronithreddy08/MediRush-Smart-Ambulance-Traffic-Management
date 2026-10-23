export type VehicleType = 'CAR' | 'BIKE' | 'AUTO' | 'BUS' | 'SUV';

export interface TrafficVehicle {
  id: string;
  type: VehicleType;
  color: string;
  lane: 'LEFT' | 'RIGHT' | 'OPPOSING';
  segmentIndex: number;
  offsetT: number; // 0 to 1 along waypoint segment
  speedKmh: number;
  targetSpeedKmh: number;
  isYielding: boolean; // pulled over to side of road
  lateralShift: number; // lateral offset in meters (-1 for left shoulder, +1 for right shoulder)
  label: string;
}

export interface RoadTrafficState {
  vehicles: TrafficVehicle[];
}

// Generate realistic Hyderabad traffic fleet along the route waypoints
export function generateInitialTrafficFleet(waypointsCount: number): TrafficVehicle[] {
  const fleet: TrafficVehicle[] = [];
  const types: { type: VehicleType; color: string; speed: number; label: string }[] = [
    { type: 'CAR', color: '#e2e8f0', speed: 42, label: 'White Sedan' },
    { type: 'AUTO', color: '#eab308', speed: 32, label: 'Auto Rickshaw' },
    { type: 'BIKE', color: '#ef4444', speed: 48, label: 'Motorbike' },
    { type: 'SUV', color: '#0284c7', speed: 45, label: 'Cab SUV' },
    { type: 'CAR', color: '#64748b', speed: 38, label: 'Grey Hatchback' },
    { type: 'BIKE', color: '#10b981', speed: 50, label: 'Scooter' },
    { type: 'AUTO', color: '#eab308', speed: 30, label: 'Auto Rickshaw' },
    { type: 'BUS', color: '#dc2626', speed: 28, label: 'City Transit Bus' },
    { type: 'CAR', color: '#f8fafc', speed: 40, label: 'Sedan' },
    { type: 'BIKE', color: '#f97316', speed: 46, label: 'Delivery Bike' },
    { type: 'SUV', color: '#1e293b', speed: 44, label: 'Black SUV' },
    { type: 'AUTO', color: '#eab308', speed: 33, label: 'Auto' },
    { type: 'CAR', color: '#dc2626', speed: 42, label: 'Red Car' },
    { type: 'BIKE', color: '#3b82f6', speed: 52, label: 'Bike' },
  ];

  for (let i = 0; i < types.length; i++) {
    const t = types[i];
    const segmentIdx = Math.floor((i / types.length) * (waypointsCount - 1));
    const offsetT = (i % 3) * 0.33 + 0.1;
    const isOpposing = i % 3 === 0;

    fleet.push({
      id: `traffic_${i + 1}`,
      type: t.type,
      color: t.color,
      lane: isOpposing ? 'OPPOSING' : i % 2 === 0 ? 'LEFT' : 'RIGHT',
      segmentIndex: segmentIdx,
      offsetT,
      speedKmh: t.speed,
      targetSpeedKmh: t.speed,
      isYielding: false,
      lateralShift: 0,
      label: t.label,
    });
  }

  return fleet;
}
