import React, { useState } from 'react';
import { DashboardHeader } from './components/DashboardHeader';
import { LeftSidebar } from './components/LeftSidebar';
import { HyderabadEmergencyMap } from './components/HyderabadEmergencyMap';
import { DriveSimulationView } from './components/DriveSimulationView';
import { RightSidebar } from './components/RightSidebar';
import { BottomAnalytics } from './components/BottomAnalytics';
import { MultiAmbulanceIntersectionMap } from './components/MultiAmbulanceIntersectionMap';
import { MultiAmbulancePriorityPanel } from './components/MultiAmbulancePriorityPanel';
import { EmergencyTransitionOverlay } from './components/EmergencyTransitionOverlay';
import { HYDERABAD_DESTINATIONS, HospitalDestination, TrafficSignal } from './data/destinationsData';
import { SCENARIOS, IntersectionScenario, AmbulanceUnit } from './data/multiAmbulanceData';

export const App: React.FC = () => {
  // Mode 1: Single Arterial Corridor vs Mode 2: Multi-Ambulance 4-Way Conflict
  const [activeMode, setActiveMode] = useState<'CORRIDOR_NAVIGATION' | 'MULTI_AMBULANCE_PRIORITY'>('CORRIDOR_NAVIGATION');

  // Visualization View Mode: MAP VIEW (2D Operational) vs DRIVE VIEW (3D Dr. Driving Simulation)
  const [viewMode, setViewMode] = useState<'MAP_VIEW' | 'DRIVE_VIEW'>('MAP_VIEW');
  const [showTransitionOverlay, setShowTransitionOverlay] = useState(false);

  // Mode 1 States
  const [selectedDestination, setSelectedDestination] = useState<HospitalDestination>(HYDERABAD_DESTINATIONS[0]);
  const [isEmergencyActive, setIsEmergencyActive] = useState<boolean>(false);
  const [tripMode, setTripMode] = useState<'MEDIRUSH_AI' | 'NORMAL_CASE'>('MEDIRUSH_AI');
  const [signals, setSignals] = useState<TrafficSignal[]>(HYDERABAD_DESTINATIONS[0].signals);
  const [activeSignalId, setActiveSignalId] = useState<string | null>(null);

  // Trip Progress State
  const [tripProgress, setTripProgress] = useState<number>(0.0);
  const [distanceRemainingKm, setDistanceRemainingKm] = useState<number>(HYDERABAD_DESTINATIONS[0].totalDistanceKm);
  const [etaMinutes, setEtaMinutes] = useState<number>(HYDERABAD_DESTINATIONS[0].estimatedTimeMin);
  const [currentSpeedKmh, setCurrentSpeedKmh] = useState<number>(0);

  // Mode 2 States
  const [currentScenario, setCurrentScenario] = useState<IntersectionScenario>(SCENARIOS[0]);
  const [multiAmbulances, setMultiAmbulances] = useState<AmbulanceUnit[]>(SCENARIOS[0].ambulances);

  // System Live Alerts Log
  const [alerts, setAlerts] = useState<Array<{ id: string; time: string; text: string; type: 'info' | 'alert' | 'success' }>>([
    {
      id: '1',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: 'MediRush V2X Network initialized across Cyberabad Smart Traffic Grid.',
      type: 'info',
    },
    {
      id: '2',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: 'Ambulance TS 09 AB 1234 on standby at Cyber Towers station.',
      type: 'info',
    },
  ]);

  const addAlert = (text: string, type: 'info' | 'alert' | 'success' = 'info') => {
    const newAlert = {
      id: Math.random().toString(36).substring(2, 9),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      text,
      type,
    };
    setAlerts((prev) => [newAlert, ...prev.slice(0, 25)]);
  };

  // Switch destination & reset signals
  const handleSelectDestination = (dest: HospitalDestination) => {
    setSelectedDestination(dest);
    setSignals(dest.signals);
    setDistanceRemainingKm(dest.totalDistanceKm);
    setEtaMinutes(dest.estimatedTimeMin);
    setTripProgress(0.0);
    addAlert(`Routing destination set to: ${dest.name} (${dest.totalDistanceKm} km)`, 'info');
  };

  // Toggle Emergency / Start Trip
  const toggleEmergency = () => {
    if (!isEmergencyActive) {
      setIsEmergencyActive(true);
      setShowTransitionOverlay(true);
      addAlert(
        `🚨 EMERGENCY DISPATCH ACTIVATED: Route to ${selectedDestination.name}. AI Green Wave corridor initializing...`,
        'alert'
      );
    } else {
      setIsEmergencyActive(false);
      setShowTransitionOverlay(false);
      setViewMode('MAP_VIEW');
      setTripProgress(0.0);
      setDistanceRemainingKm(selectedDestination.totalDistanceKm);
      setEtaMinutes(selectedDestination.estimatedTimeMin);
      setCurrentSpeedKmh(0);
      setSignals(selectedDestination.signals);
      addAlert('Emergency trip concluded. Ambulance returned to standby state.', 'info');
    }
  };

  // Select Trip Mode (MediRush AI vs Normal Case)
  const handleSelectTripMode = (mode: 'MEDIRUSH_AI' | 'NORMAL_CASE') => {
    setTripMode(mode);
    if (mode === 'MEDIRUSH_AI') {
      addAlert('Trip mode set to: MEDIRUSH AI GREEN WAVE (Full V2X Signal Preemption & Route Clearing).', 'success');
    } else {
      addAlert('Trip mode set to: NORMAL CASE (Standard city signals, red light stops, peak traffic delays).', 'alert');
    }
  };

  // Update trip progress from Map or Drive View
  const handleTripProgressUpdate = (progress: number, distRemKm: number, etaMin: number, speedKmh: number) => {
    setTripProgress(progress);
    setDistanceRemainingKm(distRemKm);
    setEtaMinutes(etaMin);
    setCurrentSpeedKmh(speedKmh);
  };

  // Mode 2 Scenario Selector
  const handleSelectScenario = (sc: IntersectionScenario) => {
    setCurrentScenario(sc);
    setMultiAmbulances(sc.ambulances);
    addAlert(`Multi-Ambulance scenario changed to: ${sc.name}`, 'info');
  };

  return (
    <div className="min-h-screen bg-[#050b14] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      
      {/* Pre-Trip Diagnostic Transition Overlay */}
      {showTransitionOverlay && (
        <EmergencyTransitionOverlay
          destination={selectedDestination}
          tripMode={tripMode}
          onComplete={() => {
            setShowTransitionOverlay(false);
            setViewMode('DRIVE_VIEW');
          }}
        />
      )}

      {/* 1. Top Dashboard Header with View Switcher (MAP vs DRIVE) & Mode Switcher */}
      <DashboardHeader
        isEmergencyActive={isEmergencyActive}
        onToggleEmergency={toggleEmergency}
        alertCount={alerts.length}
        activeMode={activeMode}
        onModeChange={setActiveMode}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* 2. Main Content Area */}
      <main className="flex-1 w-full max-w-[1850px] mx-auto px-3 sm:px-5 py-3 flex flex-col">
        
        {/* ========================================================================= */}
        {/* VIEW MODE 1: IMMERSIVE 3D DRIVE VIEW (OCCUPIES 85-90% USABLE SCREEN) */}
        {/* ========================================================================= */}
        {activeMode === 'CORRIDOR_NAVIGATION' && viewMode === 'DRIVE_VIEW' && (
          <div className="flex-1 w-full h-[calc(100vh-85px)] min-h-[620px] flex flex-col">
            <DriveSimulationView
              ambulanceId="TS 09 AB 1234"
              driverName="Ramesh Kumar (EMT-P)"
              destination={selectedDestination}
              signals={signals}
              isEmergencyActive={isEmergencyActive}
              tripMode={tripMode}
              onSignalsUpdate={setSignals}
              onTripProgressUpdate={handleTripProgressUpdate}
              onAddAlert={addAlert}
              onSwitchToMapView={() => setViewMode('MAP_VIEW')}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW MODE 2: 2D COMMAND-CENTER MAP VIEW (FULL MULTI-PANEL DASHBOARD) */}
        {/* ========================================================================= */}
        {activeMode === 'CORRIDOR_NAVIGATION' && viewMode === 'MAP_VIEW' && (
          <div className="flex-1 flex flex-col space-y-3.5">
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch min-h-[560px]">
              
              {/* Left Sidebar */}
              <div className="lg:col-span-3 flex">
                <LeftSidebar
                  ambulanceId="TS 09 AB 1234"
                  driverName="Ramesh Kumar (EMT-P)"
                  selectedDestination={selectedDestination}
                  onSelectDestination={handleSelectDestination}
                  isEmergencyActive={isEmergencyActive}
                  onToggleEmergency={toggleEmergency}
                  distanceRemainingKm={distanceRemainingKm}
                  etaMinutes={etaMinutes}
                  currentSpeedKmh={currentSpeedKmh}
                  tripMode={tripMode}
                  onSelectTripMode={handleSelectTripMode}
                />
              </div>

              {/* Center 2D Map View */}
              <div className="lg:col-span-6 flex flex-col min-h-[520px]">
                <HyderabadEmergencyMap
                  ambulanceId="TS 09 AB 1234"
                  driverName="Ramesh Kumar"
                  destination={selectedDestination}
                  signals={signals}
                  isEmergencyActive={isEmergencyActive}
                  tripMode={tripMode}
                  onSignalsUpdate={setSignals}
                  onTripProgressUpdate={handleTripProgressUpdate}
                  onAddAlert={addAlert}
                />
              </div>

              {/* Right Sidebar */}
              <div className="lg:col-span-3 flex">
                <RightSidebar signals={signals} activeSignalId={activeSignalId} />
              </div>
            </div>

            {/* Bottom Analytics */}
            <BottomAnalytics
              selectedDistanceKm={selectedDestination.totalDistanceKm}
              selectedTimeMin={selectedDestination.estimatedTimeMin}
              alerts={alerts}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODE B: 4-WAY MULTI-AMBULANCE INTERSECTION PRIORITY ENGINE */}
        {/* ========================================================================= */}
        {activeMode === 'MULTI_AMBULANCE_PRIORITY' && (
          <div className="flex-1 flex flex-col space-y-3.5">
            <div className="w-full h-[520px] rounded-2xl overflow-hidden shadow-2xl">
              <MultiAmbulanceIntersectionMap
                scenario={currentScenario}
                onAmbulancesUpdate={setMultiAmbulances}
                onAddAlert={addAlert}
              />
            </div>

            <MultiAmbulancePriorityPanel
              currentScenario={currentScenario}
              onSelectScenario={handleSelectScenario}
              ambulances={multiAmbulances}
            />
          </div>
        )}
      </main>
    </div>
  );
};
