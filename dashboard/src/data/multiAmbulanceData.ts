export type ApproachDirection = 'NORTH' | 'SOUTH' | 'EAST' | 'WEST';
export type TurnManeuver = 'STRAIGHT' | 'LEFT_TURN' | 'RIGHT_TURN';
export type ClearanceState = 'APPROACHING' | 'PRIORITY_ACTIVE' | 'PRIORITY_QUEUED' | 'CROSSING' | 'CLEARED';

export interface AmbulanceUnit {
  id: string;
  callsign: string;
  vehicleModel: string;
  color: string;
  themeColorHex: string;
  approachDirection: ApproachDirection;
  origin: string;
  destinationHospital: string;
  patientCondition: string;
  severityLevel: 1 | 2 | 3 | 4; // 1 = Immediate Life Threat, 4 = Urgent
  patientCriticalityScore: number; // 0 - 100
  turnManeuver: TurnManeuver;
  initialDistanceMeters: number;
  currentDistanceMeters: number;
  initialEtaSeconds: number;
  currentEtaSeconds: number;
  speedKmh: number;
  corridorCongestion: 'LIGHT' | 'MODERATE' | 'HEAVY';
  status: ClearanceState;
  priorityScore: number;
  progress: number; // 0 to 1
  waypoints: [number, number][]; // GPS path from approach road to post-intersection
}

export interface IntersectionScenario {
  id: string;
  name: string;
  description: string;
  intersectionName: string;
  centerCoords: [number, number];
  ambulances: AmbulanceUnit[];
}

// Center of Cyber Towers 4-Way Grand Junction in Hitec City, Hyderabad
export const CYBER_JUNCTION_CENTER: [number, number] = [17.4485, 78.3815];

// Helper to compute priority score according to multi-factor formula
export function calculateAmbulancePriority(amb: {
  patientCriticalityScore: number;
  severityLevel: number;
  currentEtaSeconds: number;
  currentDistanceMeters: number;
  corridorCongestion: 'LIGHT' | 'MODERATE' | 'HEAVY';
  queuedSeconds?: number;
}): number {
  // 1. Patient Criticality component (0 - 100) -> 35% weight
  const critComponent = amb.patientCriticalityScore * 0.35;

  // 2. Severity Level (Level 1: 100, Level 2: 75, Level 3: 50, Level 4: 25) -> 25% weight
  const sevScore = amb.severityLevel === 1 ? 100 : amb.severityLevel === 2 ? 75 : amb.severityLevel === 3 ? 50 : 25;
  const sevComponent = sevScore * 0.25;

  // 3. Proximity / ETA urgency (shorter ETA = higher urgency) -> 20% weight
  const etaScore = Math.max(0, Math.min(100, 100 - (amb.currentEtaSeconds / 30) * 100));
  const etaComponent = etaScore * 0.20;

  // 4. Congestion factor (Heavy congestion needs early green clearing) -> 10% weight
  const congScore = amb.corridorCongestion === 'HEAVY' ? 100 : amb.corridorCongestion === 'MODERATE' ? 60 : 30;
  const congComponent = congScore * 0.10;

  // 5. Queued bonus (prevent starvation) -> 10% weight
  const queueBonus = Math.min(100, (amb.queuedSeconds || 0) * 10) * 0.10;

  return Math.round((critComponent + sevComponent + etaComponent + congComponent + queueBonus) * 10) / 10;
}

// Check if two trajectories spatially conflict within the 4-way intersection
export function checkTrajectoryConflict(
  dirA: ApproachDirection,
  maneuverA: TurnManeuver,
  dirB: ApproachDirection,
  maneuverB: TurnManeuver
): boolean {
  if (dirA === dirB) return true; // Same approach lane conflict

  // Opposing directions (North vs South or East vs West)
  const isOpposing =
    (dirA === 'NORTH' && dirB === 'SOUTH') ||
    (dirA === 'SOUTH' && dirB === 'NORTH') ||
    (dirA === 'EAST' && dirB === 'WEST') ||
    (dirA === 'WEST' && dirB === 'EAST');

  if (isOpposing) {
    // Both going straight = Non-conflicting (parallel lanes)
    if (maneuverA === 'STRAIGHT' && maneuverB === 'STRAIGHT') {
      return false;
    }
    // Both turning left (in Indian left-hand drive) = Non-conflicting
    if (maneuverA === 'LEFT_TURN' && maneuverB === 'LEFT_TURN') {
      return false;
    }
    // Right turns cross incoming opposing traffic = CONFLICT
    return true;
  }

  // Cross directions (e.g. North vs East, North vs West, South vs East, South vs West)
  // Cross straight movements always conflict
  if (maneuverA === 'STRAIGHT' || maneuverB === 'STRAIGHT') {
    return true;
  }

  // Cross left turns may not conflict if entering different exit legs
  return true;
}

// Preset Scenario 1: 4-Way Quadruple Emergency Convergence
export const SCENARIOS: IntersectionScenario[] = [
  {
    id: 'four_way_convergence',
    name: '4-Way Quadruple Emergency Convergence',
    description: 'Four ambulances approach Cyber Towers 4-Way Junction simultaneously from North, South, East, and West with varying patient criticality.',
    intersectionName: 'Cyber Towers - Mindspace 4-Way Grand Junction',
    centerCoords: CYBER_JUNCTION_CENTER,
    ambulances: [
      {
        id: 'amb_01',
        callsign: 'MED-01 (Delta Red)',
        vehicleModel: 'Force Traveller ALS (Advanced Cardiac)',
        color: 'RED',
        themeColorHex: '#ef4444',
        approachDirection: 'NORTH',
        origin: 'Kondapur Trauma Center',
        destinationHospital: 'Apollo Health City, Jubilee Hills',
        patientCondition: 'Acute STEMI (Cardiac Arrest) - CPR In Progress',
        severityLevel: 1,
        patientCriticalityScore: 98,
        turnManeuver: 'STRAIGHT',
        initialDistanceMeters: 650,
        currentDistanceMeters: 650,
        initialEtaSeconds: 12,
        currentEtaSeconds: 12,
        speedKmh: 65,
        corridorCongestion: 'HEAVY',
        status: 'APPROACHING',
        priorityScore: 96.4,
        progress: 0,
        waypoints: [
          [17.4560, 78.3815], // North approach (Kondapur Rd)
          [17.4520, 78.3815],
          [17.4495, 78.3815], // North Stop Bar
          [17.4485, 78.3815], // Junction Center
          [17.4450, 78.3815], // South exit (Mindspace Rd)
          [17.4410, 78.3815],
        ],
      },
      {
        id: 'amb_02',
        callsign: 'MED-02 (Echo Blue)',
        vehicleModel: 'Mercedes Sprinter Neuro Unit',
        color: 'BLUE',
        themeColorHex: '#3b82f6',
        approachDirection: 'SOUTH',
        origin: 'Mindspace SEZ Tech Zone',
        destinationHospital: 'KIMS Hospital, Secunderabad',
        patientCondition: 'Acute Hemorrhagic Stroke (GCS 6)',
        severityLevel: 1,
        patientCriticalityScore: 89,
        turnManeuver: 'STRAIGHT',
        initialDistanceMeters: 700,
        currentDistanceMeters: 700,
        initialEtaSeconds: 14,
        currentEtaSeconds: 14,
        speedKmh: 60,
        corridorCongestion: 'MODERATE',
        status: 'APPROACHING',
        priorityScore: 88.2,
        progress: 0,
        waypoints: [
          [17.4410, 78.3815], // South approach
          [17.4450, 78.3815],
          [17.4475, 78.3815], // South Stop Bar
          [17.4485, 78.3815], // Junction Center
          [17.4520, 78.3815], // North exit
          [17.4560, 78.3815],
        ],
      },
      {
        id: 'amb_03',
        callsign: 'MED-03 (Alpha Emerald)',
        vehicleModel: 'Tata Winger Critical Trauma',
        color: 'GREEN',
        themeColorHex: '#10b981',
        approachDirection: 'EAST',
        origin: 'Madhapur Metro Corridor',
        destinationHospital: 'CARE Hospitals, Banjara Hills',
        patientCondition: 'Severe Polytrauma & Crush Injury',
        severityLevel: 2,
        patientCriticalityScore: 82,
        turnManeuver: 'STRAIGHT',
        initialDistanceMeters: 620,
        currentDistanceMeters: 620,
        initialEtaSeconds: 13,
        currentEtaSeconds: 13,
        speedKmh: 58,
        corridorCongestion: 'HEAVY',
        status: 'APPROACHING',
        priorityScore: 81.5,
        progress: 0,
        waypoints: [
          [17.4485, 78.3890], // East approach (100ft Road)
          [17.4485, 78.3850],
          [17.4485, 78.3825], // East Stop Bar
          [17.4485, 78.3815], // Junction Center
          [17.4485, 78.3775], // West exit (Hitec City Flyover)
          [17.4485, 78.3740],
        ],
      },
      {
        id: 'amb_04',
        callsign: 'MED-04 (Bravo Amber)',
        vehicleModel: 'Mahindra Bolero Neo EMS',
        color: 'AMBER',
        themeColorHex: '#f59e0b',
        approachDirection: 'WEST',
        origin: 'Inorbit Mall Lake Rd',
        destinationHospital: 'Yashoda Hospital, Somajiguda',
        patientCondition: 'Pediatric Status Asthmaticus (Stable)',
        severityLevel: 3,
        patientCriticalityScore: 68,
        turnManeuver: 'RIGHT_TURN',
        initialDistanceMeters: 750,
        currentDistanceMeters: 750,
        initialEtaSeconds: 16,
        currentEtaSeconds: 16,
        speedKmh: 52,
        corridorCongestion: 'LIGHT',
        status: 'APPROACHING',
        priorityScore: 66.8,
        progress: 0,
        waypoints: [
          [17.4485, 78.3740], // West approach
          [17.4485, 78.3780],
          [17.4485, 78.3805], // West Stop Bar
          [17.4485, 78.3815], // Junction Center
          [17.4520, 78.3815], // Turn North onto Kondapur Rd
          [17.4560, 78.3815],
        ],
      },
    ],
  },
  {
    id: 'cardiac_vs_pediatric',
    name: 'Cardiac Arrest vs Severe Stroke Duel',
    description: 'Northbound Cardiac Arrest ambulance directly conflicts with Eastbound Stroke patient across the main arterial box.',
    intersectionName: 'Cyber Towers - Mindspace 4-Way Grand Junction',
    centerCoords: CYBER_JUNCTION_CENTER,
    ambulances: [
      {
        id: 'amb_duel_01',
        callsign: 'MED-01 (Delta Red)',
        vehicleModel: 'Force Traveller ALS (Advanced Cardiac)',
        color: 'RED',
        themeColorHex: '#ef4444',
        approachDirection: 'NORTH',
        origin: 'Kondapur Hospital',
        destinationHospital: 'Apollo Hospital Jubilee Hills',
        patientCondition: 'Ventricular Fibrillation (Cardiac Arrest)',
        severityLevel: 1,
        patientCriticalityScore: 99,
        turnManeuver: 'STRAIGHT',
        initialDistanceMeters: 550,
        currentDistanceMeters: 550,
        initialEtaSeconds: 10,
        currentEtaSeconds: 10,
        speedKmh: 65,
        corridorCongestion: 'HEAVY',
        status: 'APPROACHING',
        priorityScore: 98.1,
        progress: 0,
        waypoints: [
          [17.4560, 78.3815],
          [17.4520, 78.3815],
          [17.4495, 78.3815],
          [17.4485, 78.3815],
          [17.4450, 78.3815],
          [17.4410, 78.3815],
        ],
      },
      {
        id: 'amb_duel_02',
        callsign: 'MED-03 (Alpha Emerald)',
        vehicleModel: 'Tata Winger Critical Care',
        color: 'GREEN',
        themeColorHex: '#10b981',
        approachDirection: 'EAST',
        origin: 'Madhapur Hub',
        destinationHospital: 'CARE Hospitals',
        patientCondition: 'Acute Ischemic Stroke (LVO - 2.5h window)',
        severityLevel: 1,
        patientCriticalityScore: 92,
        turnManeuver: 'STRAIGHT',
        initialDistanceMeters: 520,
        currentDistanceMeters: 520,
        initialEtaSeconds: 9,
        currentEtaSeconds: 9,
        speedKmh: 62,
        corridorCongestion: 'MODERATE',
        status: 'APPROACHING',
        priorityScore: 92.5,
        progress: 0,
        waypoints: [
          [17.4485, 78.3890],
          [17.4485, 78.3850],
          [17.4485, 78.3825],
          [17.4485, 78.3815],
          [17.4485, 78.3775],
          [17.4485, 78.3740],
        ],
      },
    ],
  },
  {
    id: 'parallel_non_conflicting',
    name: 'Non-Conflicting Parallel Safe Clearance',
    description: 'North-to-South and South-to-North straight ambulances proceed simultaneously without crossing conflict.',
    intersectionName: 'Cyber Towers - Mindspace 4-Way Grand Junction',
    centerCoords: CYBER_JUNCTION_CENTER,
    ambulances: [
      {
        id: 'amb_par_01',
        callsign: 'MED-01 (Delta Red)',
        vehicleModel: 'Force Traveller ALS',
        color: 'RED',
        themeColorHex: '#ef4444',
        approachDirection: 'NORTH',
        origin: 'Kondapur',
        destinationHospital: 'Apollo Hospital',
        patientCondition: 'Emergency STEMI Unit',
        severityLevel: 1,
        patientCriticalityScore: 95,
        turnManeuver: 'STRAIGHT',
        initialDistanceMeters: 600,
        currentDistanceMeters: 600,
        initialEtaSeconds: 11,
        currentEtaSeconds: 11,
        speedKmh: 62,
        corridorCongestion: 'LIGHT',
        status: 'APPROACHING',
        priorityScore: 92.0,
        progress: 0,
        waypoints: [
          [17.4560, 78.3815],
          [17.4520, 78.3815],
          [17.4495, 78.3815],
          [17.4485, 78.3815],
          [17.4450, 78.3815],
          [17.4410, 78.3815],
        ],
      },
      {
        id: 'amb_par_02',
        callsign: 'MED-02 (Echo Blue)',
        vehicleModel: 'Mercedes Sprinter Neuro',
        color: 'BLUE',
        themeColorHex: '#3b82f6',
        approachDirection: 'SOUTH',
        origin: 'Mindspace',
        destinationHospital: 'KIMS Hospital',
        patientCondition: 'Neuro Trauma Critical Unit',
        severityLevel: 1,
        patientCriticalityScore: 91,
        turnManeuver: 'STRAIGHT',
        initialDistanceMeters: 600,
        currentDistanceMeters: 600,
        initialEtaSeconds: 11,
        currentEtaSeconds: 11,
        speedKmh: 62,
        corridorCongestion: 'LIGHT',
        status: 'APPROACHING',
        priorityScore: 89.5,
        progress: 0,
        waypoints: [
          [17.4410, 78.3815],
          [17.4450, 78.3815],
          [17.4475, 78.3815],
          [17.4485, 78.3815],
          [17.4520, 78.3815],
          [17.4560, 78.3815],
        ],
      },
    ],
  },
];
