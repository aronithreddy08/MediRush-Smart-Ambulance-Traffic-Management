# 🚑 MediRush: AI-Powered Smart Ambulance Emergency Coordination, Dynamic Routing and Traffic Management System

**B.Tech Major Project**

MediRush is an intelligent emergency vehicle transit system designed for smart cities. It features real-time 1KM early V2X traffic preemption, Google Maps-grade arterial navigation, dynamic AI traffic bypass rerouting, and a 4-way multi-ambulance conflict resolution engine.

---

## 🌟 Key Features

1. **🗺️ Real-Road Emergency Navigation**:
   - Realistic ambulance vehicle model with emergency strobe flashers and forward headlights.
   - Real Hyderabad road network with multi-color traffic congestion flow (Green / Amber / Red).
   - Dynamic AI rerouting to bypass congestion via express corridors.
2. **📡 1 KM Early V2X Signal Preemption**:
   - Early proximity alerts at 1000m arming the traffic signal preemption mesh.
   - Automatic Green Wave corridor clearance at 600m.
3. **⚡ Dual Trip Simulation Demonstration**:
   - `1. MEDIRUSH AI TRIP`: Fast non-stop clearance with 1km preemption (0 red light stops, ~6 min ETA).
   - `2. NORMAL CASE TRIP`: Standard municipal traffic where the ambulance stops and waits for red light countdowns (~18 min ETA, +9.5 min traffic delay).
4. **🚦 4-Way Multi-Ambulance Priority Engine**:
   - Dynamic multi-factor priority scoring based on patient criticality, severity level, ETA, distance, and congestion.
   - 4x4 spatial trajectory conflict matrix ensuring zero-collision sequential clearance.

---

## 🚀 How to Run

### Method 1: One-Click Quick Start (Windows)
Double-click `start_medirush.bat` in this folder. It will start the server and open `http://localhost:5173` in your browser.

### Method 2: Manual Start (Terminal / VS Code)
```bash
# 1. Install dependencies (if needed)
npm install

# 2. Run the development server
npm run dev
```

Open your browser at **http://localhost:5173**.

---

## 🛠️ Tech Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Mapping & GIS**: Leaflet & OpenStreetMap (CartoDB Dark Matter)
- **3D Graphics**: Three.js WebGL
- **Styling**: Tailwind CSS & Lucide Icons
