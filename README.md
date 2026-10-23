# MediRush — AI-Powered Smart Ambulance Traffic Management System

[![Frontend](https://img.shields.io/badge/Frontend-React_18_%7C_TypeScript_%7C_Three.js_%7C_Vite-blue)](https://vitejs.dev/)
[![Backend](https://img.shields.io/badge/Backend-FastAPI_%7C_Python_3.11_%7C_SQLite-green)](https://fastapi.tiangolo.com/)
[![Hardware](https://img.shields.io/badge/Hardware-ESP32_C%2B%2B_Firmware-orange)](https://www.espressif.com/)

An intelligent emergency vehicle preemption (EVP) and traffic management platform designed to dynamically clear green corridors for emergency medical vehicles through V2X communication, arterial route optimization, multi-ambulance conflict resolution, and an immersive 3D third-person driving simulation.

---

## 📑 Table of Contents
1. [Project Overview & Key Features](#-project-overview--key-features)
2. [System Architecture](#-system-architecture)
3. [Technology Stack](#-technology-stack)
4. [Project Directory Structure](#-project-directory-structure)
5. [Prerequisites](#-prerequisites)
6. [Installation & Setup](#-installation--setup)
7. [Running the Application](#-running-the-application)
8. [Database Schema & Setup](#-database-schema--setup)
9. [Hardware & IoT Integration](#-hardware--iot-integration)
10. [Transparent Implementation Notes](#-transparent-implementation-notes)

---

## 🌟 Project Overview & Key Features

### 1. 🗺️ Command Center Map View (2D Operational)
- **Real Road Arterial Routing**: Live path planning connecting Cyber Towers Hitec City station to Apollo Health City & Jubilee Hills hospital.
- **1KM V2X Proximity Preemption**: Real-time distance tracking alerting intersections 1KM in advance and locking green waves 500m ahead.
- **Congestion Heatmap**: Road segment traffic classification (Free Flow, Moderate, Heavy Congestion).

### 2. 🎮 3D Driver View (Dr. Driving-Style Third-Person Simulation)
- **Continuous 4-Lane Highway Ribbon**: Procedural asphalt highway with yellow double center divider, white lane markings, curbs, palm trees, and city skyscrapers.
- **Prominent Overhead Traffic Signals**: Steel cantilever gantries spanning all lanes with high-visibility glowing LED signal heads that dynamically transition from `RED` $\rightarrow$ `🟢 GREEN WAVE`.
- **Life-Sized 3D Ambulance**: 1:1 scale emergency ambulance model with flashing rooftop red/blue LED lightbars, headlights, brake lights, and wheel animation.
- **Arcade Driving Controls**: Keyboard (`W/A/S/D` or Arrow Keys) and on-screen steering wheel and pedals with smooth acceleration, braking, lane changes, and autopilot cruise.
- **Yielding Traffic Incidents**: Civilian vehicles (sedans, auto-rickshaws, TSRTC buses) activate hazard blinkers and pull over to the shoulder when the ambulance siren approaches.

### 3. 🚦 4-Way Multi-Ambulance Priority Engine
- **Conflict Resolution Matrix**: Handles simultaneous 4-way convergence at the Cyber Towers grand junction.
- **Multi-Factor Urgency Scoring**: Prioritizes ambulances by Patient Criticality (0-100), Severity Level (Triage Level 1 to 4), Proximity, and Lane Congestion to eliminate gridlocks.

### 4. ⚡ FastAPI Backend & ML Congestion Engine
- REST APIs & WebSocket real-time feeds for ambulance telemetry, hospital bed availability, and signal status.
- Machine Learning traffic congestion classifier predicting bottleneck severity.

---

## 🏗️ System Architecture

```text
 ┌────────────────────────────────────────────────────────┐
 │                      MEDIRUSH                          │
 └──────────────────────────┬─────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            ▼                               ▼
 ┌─────────────────────┐         ┌─────────────────────┐
 │ 2D Command Center   │         │ 3D Driver View      │
 │ (Tactical Map View) │         │ (Simulation View)   │
 └──────────┬──────────┘         └──────────┬──────────┘
            │                               │
            └───────────────┬───────────────┘
                            ▼
 ┌────────────────────────────────────────────────────────┐
 │             V2X TRAFFIC PREEMPTION ENGINE              │
 │  • 1KM Early Proximity Arming                         │
 │  • Dynamic Green Wave Signal Clearing                 │
 │  • Multi-Ambulance Urgency Leaderboard (4-Way Engine) │
 └──────────────────────────┬─────────────────────────────┘
                            │
         ┌──────────────────┴──────────────────┐
         ▼                                     ▼
┌──────────────────┐                 ┌──────────────────┐
│ FastAPI Backend  │                 │ ESP32 IoT Signal │
│ & SQLite Database│                 │ Hardware Bridge  │
└──────────────────┘                 └──────────────────┘
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend Dashboard** | React 18, TypeScript, Three.js, Vite, Tailwind CSS, Lucide Icons, Leaflet |
| **Backend API** | FastAPI, Python 3.11, Uvicorn, SQLite, SQLAlchemy / Pydantic |
| **Machine Learning** | Scikit-learn, NumPy, Pandas (Traffic congestion prediction model) |
| **Hardware / IoT** | ESP32, Arduino C++, FreeRTOS, MQTT, WebSockets |
| **Mobile PWA** | React 18, TypeScript, Tailwind CSS, Vite |

---

## 📁 Project Directory Structure

```text
MediRush/
├── dashboard/               # Main Command Center & 3D Driving Simulation
│   ├── src/
│   │   ├── components/      # UI components (DriveSimulationView, HyderabadEmergencyMap, etc.)
│   │   ├── data/            # Hospital routes, coordinates, signals, and 4-way scenarios
│   │   ├── services/        # V2X preemption calculation engines
│   │   ├── App.tsx          # Master state coordinator
│   │   └── main.tsx         # Application entry point
│   ├── dist/                # Production optimized build bundle
│   ├── server.js            # Zero-dependency local Node server
│   ├── start_medirush.bat   # 1-Click launcher script
│   ├── package.json         # Node dependencies
│   └── vite.config.ts       # Vite bundler configuration
│
├── backend/                 # FastAPI REST API & WebSocket Server
│   ├── app/
│   │   ├── api/             # API route controllers
│   │   ├── core/            # Config, security, and logging
│   │   ├── data/            # Database access layer
│   │   ├── engines/         # Signal priority and V2X algorithms
│   │   ├── models/          # SQLAlchemy ORM database models
│   │   └── schemas/         # Pydantic request/response schemas
│   ├── ml/                  # Machine learning traffic congestion models
│   ├── tests/               # Pytest suite
│   ├── medirush.db          # SQLite database instance
│   ├── schema.sql           # Complete SQL export script
│   ├── main.py              # FastAPI server entry point
│   ├── requirements.txt     # Python dependencies
│   └── .env.example         # Environment template
│
├── hardware/                # IoT Signal Controller Firmware & Simulator
│   ├── esp32_traffic_signal.ino       # ESP32 Arduino C++ firmware
│   └── virtual_hardware_simulator.py  # Python virtual hardware bridge
│
├── mobile/                  # Paramedic Mobile In-Cab Navigation PWA
│   ├── src/                 # Mobile UI components
│   └── package.json         # Dependencies
│
├── start_medirush.bat       # Master project launcher
└── README.md                # Complete project documentation
```

---

## 💻 Prerequisites

Ensure you have the following installed on your laptop:
- **Node.js** (v18.0.0 or higher): [https://nodejs.org/](https://nodejs.org/)
- **Python** (v3.10 or higher): [https://www.python.org/](https://www.python.org/)
- (Optional) **Arduino IDE** if uploading firmware to physical ESP32 boards.

---

## ⚙️ Installation & Setup

### 1. Dashboard (Frontend)
```bash
cd dashboard
npm install
```

### 2. Backend (Python API)
```bash
cd backend
python -m venv .venv

# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
```

---

## 🚀 Running the Application

### Method A: 1-Click Instant Launch (Recommended for Windows)
Simply double-click:
```text
start_medirush.bat
```
This automatically starts the local server and opens your browser at `http://localhost:5173`.

### Method B: Manual Command-Line Launch

#### 1. Start the Frontend Dashboard:
```bash
cd dashboard
npm run dev
# Dashboard opens on http://localhost:5173
```

#### 2. Start the Backend API (Optional):
```bash
cd backend
.venv\Scripts\activate
uvicorn main:app --reload --port 8000
# API documentation available at http://localhost:8000/docs
```

#### 3. Start the Virtual Hardware Simulator (Optional):
```bash
cd hardware
python virtual_hardware_simulator.py
```

---

## 🗄️ Database Schema & Setup

The backend utilizes SQLite with full relational tables. A complete SQL dump is included in `backend/schema.sql`.

### Included Tables:
- `ambulances`: Fleet vehicle details, callsigns, equipment level (ALS/BLS).
- `hospitals`: Emergency facilities, coordinates, bed availability, trauma tier.
- `signals`: Intersection nodes, geographic coordinates, current phase, countdown.
- `trips`: Active and historical emergency dispatch trips, routes, timestamps.
- `traffic_logs`: Historical speed, density, and congestion telemetry.

To inspect or regenerate the database from scratch:
```bash
cd backend
sqlite3 medirush.db < schema.sql
```

---

## 📡 Hardware & IoT Integration

The `hardware/` directory contains firmware for connecting physical traffic signals via ESP32 microcontrollers:
- **`esp32_traffic_signal.ino`**: Connects to the MediRush V2X server over Wi-Fi / WebSockets. Upon receiving a priority grant payload, it triggers relays to force physical traffic LEDs to Green.
- **`virtual_hardware_simulator.py`**: Simulates 4 physical LED traffic controllers locally for testing without physical breadboards.

---

## 🔍 Transparent Implementation Notes

In accordance with academic standards and transparency:
- **Routing & Coordinates**: Based on genuine GPS waypoints across the Hitec City to Jubilee Hills corridor in Hyderabad, India.
- **Traffic & Preemption Simulation**: The dashboard uses a high-fidelity algorithmic V2X preemption engine adhering to NTCIP 1211 emergency vehicle preemption standards.
- **3D Graphics**: Rendered via WebGL/Three.js with procedural asset generation for optimal browser performance without external game engines.
- **Live Municipal Infrastructure**: In a commercial deployment, the system would interface with the city SCATS / SCOOT urban traffic control center. In this demonstration project, all signals operate against the local MediRush state engine.

---

## 👥 Authors & Academic Attribution
Developed as an advanced engineering capstone project:
- **Project**: MediRush — AI-Powered Smart Ambulance Traffic Management System
- **Focus**: Intelligent Transportation Systems (ITS) & Emergency Vehicle Priority (EVP)
