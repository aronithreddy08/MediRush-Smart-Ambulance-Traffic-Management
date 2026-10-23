export interface TrafficSignal {
  id: string;
  name: string;
  intersectionName: string;
  coords: [number, number];
  distanceAlongRouteKm: number;
  currentState: 'RED' | 'YELLOW' | 'ALERT_1KM' | 'PREEMPTED_GREEN' | 'CLEARED';
  timerSeconds: number;
  cameraImage: string;
  crossTrafficStatus: string;
}

export interface RouteSegment {
  startIndex: number;
  endIndex: number;
  congestion: 'FREE_FLOW' | 'MODERATE' | 'HEAVY';
  color: string;
  speedLimitKmh: number;
  label: string;
}

export interface HospitalDestination {
  id: string;
  name: string;
  area: string;
  coords: [number, number];
  totalDistanceKm: number;
  estimatedTimeMin: number;
  availableBeds: number;
  specialization: string;
  primaryRoute: {
    waypoints: [number, number, string][];
    trafficSegments: RouteSegment[];
  };
  alternateRoute?: {
    name: string;
    waypoints: [number, number, string][];
    trafficSegments: RouteSegment[];
    distanceKm: number;
    estimatedTimeMin: number;
  };
  signals: TrafficSignal[];
}

export const HYDERABAD_DESTINATIONS: HospitalDestination[] = [
  {
    id: 'apollo_jubilee',
    name: 'Apollo Health City & Hospital',
    area: 'Jubilee Hills, Hyderabad',
    coords: [17.4245, 78.4138],
    totalDistanceKm: 5.6,
    estimatedTimeMin: 9,
    availableBeds: 14,
    specialization: 'Multi-Specialty & Level-1 Trauma Emergency',
    primaryRoute: {
      waypoints: [
        [17.4504, 78.3808, 'Cyber Towers Junction, Hitec City'],
        [17.4485, 78.3815, 'Cyber Gateway Tech Corridor'],
        [17.4460, 78.3830, 'Hitec City Main Road Overpass'],
        [17.4430, 78.3845, 'Mindspace Junction'],
        [17.4405, 78.3875, 'Inorbit Mall North Approach'],
        [17.4390, 78.3900, 'Inorbit Lake Road'],
        [17.4370, 78.3935, 'Durgam Cheruvu West Approach'],
        [17.4352, 78.3965, 'Durgam Cheruvu Cable-Stayed Bridge Entry'],
        [17.4340, 78.4005, 'Durgam Cheruvu Cable Bridge Center'],
        [17.4330, 78.4040, 'Durgam Cheruvu East Overpass'],
        [17.4318, 78.4072, 'Jubilee Hills Road No. 45 Interchange'],
        [17.4298, 78.4092, 'Road No. 36 Commercial Strip'],
        [17.4280, 78.4110, 'Jubilee Hills Check Post Signal'],
        [17.4262, 78.4128, 'Road No. 92 / Cancer Hospital Link'],
        [17.4245, 78.4138, 'Apollo Health City Main Emergency Trauma Bay'],
      ],
      trafficSegments: [
        { startIndex: 0, endIndex: 3, congestion: 'FREE_FLOW', color: '#10b981', speedLimitKmh: 65, label: 'Fast Moving (Green Corridor)' },
        { startIndex: 3, endIndex: 6, congestion: 'MODERATE', color: '#f59e0b', speedLimitKmh: 42, label: 'Moderate Traffic at Mall Rd' },
        { startIndex: 6, endIndex: 10, congestion: 'FREE_FLOW', color: '#10b981', speedLimitKmh: 60, label: 'Cable Bridge Cleared' },
        { startIndex: 10, endIndex: 12, congestion: 'HEAVY', color: '#ef4444', speedLimitKmh: 25, label: 'Congested at Check Post (Clearing)' },
        { startIndex: 12, endIndex: 14, congestion: 'FREE_FLOW', color: '#10b981', speedLimitKmh: 50, label: 'Hospital Access Clear' },
      ],
    },
    alternateRoute: {
      name: 'AI Smart Bypass via Madhapur 100ft Rd',
      distanceKm: 6.2,
      estimatedTimeMin: 8,
      waypoints: [
        [17.4504, 78.3808, 'Cyber Towers Junction, Hitec City'],
        [17.4490, 78.3860, 'Madhapur 100ft Road North'],
        [17.4460, 78.3930, 'Kavuri Hills Phase 1'],
        [17.4410, 78.3990, 'Durgam Cheruvu North Bypass'],
        [17.4350, 78.4050, 'Road No. 45 Express Flyover'],
        [17.4280, 78.4110, 'Jubilee Check Post (Flyover Drop)'],
        [17.4245, 78.4138, 'Apollo Health City Main Emergency Trauma Bay'],
      ],
      trafficSegments: [
        { startIndex: 0, endIndex: 3, congestion: 'FREE_FLOW', color: '#10b981', speedLimitKmh: 68, label: '100ft Road Clear' },
        { startIndex: 3, endIndex: 5, congestion: 'FREE_FLOW', color: '#10b981', speedLimitKmh: 70, label: 'Express Flyover Green Wave' },
        { startIndex: 5, endIndex: 6, congestion: 'FREE_FLOW', color: '#10b981', speedLimitKmh: 55, label: 'Direct ER Ramp' },
      ],
    },
    signals: [
      {
        id: 'sig_1',
        name: 'Cyber Gateway Jn',
        intersectionName: 'Cyber Towers - Hitec Main Rd',
        coords: [17.4485, 78.3815],
        distanceAlongRouteKm: 0.5,
        currentState: 'RED',
        timerSeconds: 15,
        cameraImage: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=300&q=80',
        crossTrafficStatus: 'High Volume (Madhapur)',
      },
      {
        id: 'sig_2',
        name: 'Mindspace Inorbit Jn',
        intersectionName: 'Mindspace - Inorbit Mall Rd',
        coords: [17.4430, 78.3845],
        distanceAlongRouteKm: 1.4,
        currentState: 'RED',
        timerSeconds: 20,
        cameraImage: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=300&q=80',
        crossTrafficStatus: 'IT Park Corridor Active',
      },
      {
        id: 'sig_3',
        name: 'Cable Bridge West Jn',
        intersectionName: 'Durgam Cheruvu Bridge Entrance',
        coords: [17.4352, 78.3965],
        distanceAlongRouteKm: 2.8,
        currentState: 'RED',
        timerSeconds: 25,
        cameraImage: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=300&q=80',
        crossTrafficStatus: 'Scenic Lake Overpass',
      },
      {
        id: 'sig_4',
        name: 'Jubilee Check Post',
        intersectionName: 'Road No. 36 - Check Post Circle',
        coords: [17.4280, 78.4110],
        distanceAlongRouteKm: 4.6,
        currentState: 'RED',
        timerSeconds: 18,
        cameraImage: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=300&q=80',
        crossTrafficStatus: 'Metro Arterial Junction',
      },
    ],
  },
  {
    id: 'kims_secunderabad',
    name: 'KIMS Hospitals',
    area: 'Minister Road, Secunderabad',
    coords: [17.4402, 78.4875],
    totalDistanceKm: 11.2,
    estimatedTimeMin: 18,
    availableBeds: 8,
    specialization: 'Super Specialty & Cardiac Emergency',
    primaryRoute: {
      waypoints: [
        [17.4504, 78.3808, 'Cyber Towers Junction, Hitec City'],
        [17.4480, 78.3920, 'Madhapur 100ft Road'],
        [17.4440, 78.4150, 'Yousufguda Main Road'],
        [17.4380, 78.4350, 'Ameerpet Junction'],
        [17.4410, 78.4550, 'Begumpet Flyover'],
        [17.4450, 78.4720, 'Paradise Circle'],
        [17.4402, 78.4875, 'KIMS Hospitals Emergency Wing'],
      ],
      trafficSegments: [
        { startIndex: 0, endIndex: 2, congestion: 'FREE_FLOW', color: '#10b981', speedLimitKmh: 60, label: 'Madhapur Clear' },
        { startIndex: 2, endIndex: 4, congestion: 'HEAVY', color: '#ef4444', speedLimitKmh: 28, label: 'Ameerpet High Density' },
        { startIndex: 4, endIndex: 6, congestion: 'FREE_FLOW', color: '#10b981', speedLimitKmh: 65, label: 'Begumpet Corridor' },
      ],
    },
    signals: [
      {
        id: 'kims_sig_1',
        name: 'Madhapur 100ft Jn',
        intersectionName: 'Madhapur - Jubilee Hills Link',
        coords: [17.4480, 78.3920],
        distanceAlongRouteKm: 1.4,
        currentState: 'RED',
        timerSeconds: 25,
        cameraImage: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=300&q=80',
        crossTrafficStatus: 'Heavy Commercial',
      },
      {
        id: 'kims_sig_2',
        name: 'Ameerpet Cross Roads',
        intersectionName: 'Ameerpet Metro Interchange',
        coords: [17.4380, 78.4350],
        distanceAlongRouteKm: 5.5,
        currentState: 'RED',
        timerSeconds: 30,
        cameraImage: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=300&q=80',
        crossTrafficStatus: 'Dense Urban Crossing',
      },
      {
        id: 'kims_sig_3',
        name: 'Begumpet Airport Jn',
        intersectionName: 'Begumpet - Secunderabad Corridor',
        coords: [17.4410, 78.4550],
        distanceAlongRouteKm: 8.2,
        currentState: 'RED',
        timerSeconds: 22,
        cameraImage: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=300&q=80',
        crossTrafficStatus: 'Highway Flow',
      },
    ],
  },
  {
    id: 'care_banjara',
    name: 'CARE Hospitals',
    area: 'Road No. 1, Banjara Hills',
    coords: [17.4165, 78.4485],
    totalDistanceKm: 7.8,
    estimatedTimeMin: 12,
    availableBeds: 11,
    specialization: 'Cardiology & Neuro Trauma',
    primaryRoute: {
      waypoints: [
        [17.4504, 78.3808, 'Cyber Towers Junction, Hitec City'],
        [17.4430, 78.3845, 'Mindspace Junction'],
        [17.4352, 78.3965, 'Durgam Cheruvu Cable Bridge'],
        [17.4300, 78.4090, 'Jubilee Hills Road No. 36'],
        [17.4210, 78.4320, 'Banjara Hills Road No. 12'],
        [17.4165, 78.4485, 'CARE Hospitals Emergency Gate'],
      ],
      trafficSegments: [
        { startIndex: 0, endIndex: 3, congestion: 'FREE_FLOW', color: '#10b981', speedLimitKmh: 65, label: 'Fast Flow' },
        { startIndex: 3, endIndex: 4, congestion: 'MODERATE', color: '#f59e0b', speedLimitKmh: 40, label: 'Banjara Rd 12' },
        { startIndex: 4, endIndex: 5, congestion: 'FREE_FLOW', color: '#10b981', speedLimitKmh: 55, label: 'Hospital Gate Clear' },
      ],
    },
    signals: [
      {
        id: 'care_sig_1',
        name: 'Mindspace Junction',
        intersectionName: 'Hitec City - Mindspace Bypass',
        coords: [17.4430, 78.3845],
        distanceAlongRouteKm: 1.2,
        currentState: 'RED',
        timerSeconds: 18,
        cameraImage: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=300&q=80',
        crossTrafficStatus: 'Moderate',
      },
      {
        id: 'care_sig_2',
        name: 'Banjara Hills Rd 12 Jn',
        intersectionName: 'Road 12 - Road 1 Junction',
        coords: [17.4210, 78.4320],
        distanceAlongRouteKm: 5.6,
        currentState: 'RED',
        timerSeconds: 24,
        cameraImage: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=300&q=80',
        crossTrafficStatus: 'VIP Corridor',
      },
    ],
  },
  {
    id: 'yashoda_somajiguda',
    name: 'Yashoda Hospitals',
    area: 'Somajiguda, Hyderabad',
    coords: [17.4258, 78.4580],
    totalDistanceKm: 8.9,
    estimatedTimeMin: 14,
    availableBeds: 19,
    specialization: 'Critical Care & Organ Transplant',
    primaryRoute: {
      waypoints: [
        [17.4504, 78.3808, 'Cyber Towers Junction, Hitec City'],
        [17.4475, 78.3820, 'Hitec City Main Road'],
        [17.4380, 78.4100, 'Kavuri Hills Junction'],
        [17.4320, 78.4380, 'Panjagutta Flyover'],
        [17.4258, 78.4580, 'Yashoda Hospitals Emergency Trauma Block'],
      ],
      trafficSegments: [
        { startIndex: 0, endIndex: 2, congestion: 'FREE_FLOW', color: '#10b981', speedLimitKmh: 62, label: 'Madhapur Clear' },
        { startIndex: 2, endIndex: 3, congestion: 'HEAVY', color: '#ef4444', speedLimitKmh: 22, label: 'Panjagutta Congestion' },
        { startIndex: 3, endIndex: 4, congestion: 'FREE_FLOW', color: '#10b981', speedLimitKmh: 58, label: 'Somajiguda Flyover' },
      ],
    },
    signals: [
      {
        id: 'yash_sig_1',
        name: 'Kavuri Hills Jn',
        intersectionName: 'Madhapur - Kavuri Hills Link',
        coords: [17.4380, 78.4100],
        distanceAlongRouteKm: 2.8,
        currentState: 'RED',
        timerSeconds: 15,
        cameraImage: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=300&q=80',
        crossTrafficStatus: 'High Volume',
      },
      {
        id: 'yash_sig_2',
        name: 'Panjagutta Junction',
        intersectionName: 'Panjagutta Circle & Flyover',
        coords: [17.4320, 78.4380],
        distanceAlongRouteKm: 6.8,
        currentState: 'RED',
        timerSeconds: 35,
        cameraImage: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=300&q=80',
        crossTrafficStatus: 'Major Arterial',
      },
    ],
  },
];
