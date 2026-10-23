export function getRealisticAmbulanceSvg(
  headingDeg: number,
  themeColor: string = '#ef4444',
  isPriorityGreen: boolean = false,
  isHolding: boolean = false
): string {
  return `
    <div style="transform: rotate(${headingDeg}deg);" class="relative flex flex-col items-center justify-center transition-transform duration-75 select-none pointer-events-none">
      
      <!-- Forward Headlight Cones onto Asphalt -->
      <div class="absolute -top-12 inset-x-0 flex justify-between px-1.5 pointer-events-none">
        <div class="w-4 h-12 bg-gradient-to-t from-yellow-200/50 via-yellow-100/20 to-transparent rounded-t-full blur-[1px]"></div>
        <div class="w-4 h-12 bg-gradient-to-t from-yellow-200/50 via-yellow-100/20 to-transparent rounded-t-full blur-[1px]"></div>
      </div>

      <!-- Ground Emergency Lightbar Strobe Halo -->
      ${
        isPriorityGreen
          ? '<div class="absolute -inset-6 rounded-full bg-emerald-500/35 animate-ping pointer-events-none"></div>'
          : isHolding
          ? '<div class="absolute -inset-4 rounded-full bg-red-500/25 animate-pulse pointer-events-none"></div>'
          : '<div class="absolute -inset-4 rounded-full bg-blue-500/20 animate-pulse pointer-events-none"></div>'
      }

      <!-- Realistic Ambulance Body Container -->
      <svg width="34" height="66" viewBox="0 0 34 66" class="drop-shadow-[0_10px_15px_rgba(0,0,0,0.85)]">
        <!-- Chassis Drop Shadow -->
        <rect x="2" y="3" width="30" height="60" rx="6" fill="#020617" opacity="0.9" />

        <!-- 4 Rubber Tires with Rims -->
        <!-- Front-Left Tire -->
        <rect x="0" y="10" width="3.5" height="10" rx="1.5" fill="#0f172a" />
        <rect x="0.5" y="12" width="2.5" height="6" rx="1" fill="#475569" />
        <!-- Front-Right Tire -->
        <rect x="30.5" y="10" width="3.5" height="10" rx="1.5" fill="#0f172a" />
        <rect x="31" y="12" width="2.5" height="6" rx="1" fill="#475569" />
        <!-- Rear-Left Tire -->
        <rect x="0" y="46" width="3.5" height="11" rx="1.5" fill="#0f172a" />
        <rect x="0.5" y="48" width="2.5" height="7" rx="1" fill="#475569" />
        <!-- Rear-Right Tire -->
        <rect x="30.5" y="46" width="3.5" height="11" rx="1.5" fill="#0f172a" />
        <rect x="31" y="48" width="2.5" height="7" rx="1" fill="#475569" />

        <!-- Main Body Hull (Crisp White Medical Grade Finish) -->
        <rect x="3" y="4" width="28" height="58" rx="5" fill="#f8fafc" stroke="#334155" stroke-width="1" />

        <!-- Front Hood & Windshield -->
        <path d="M5 16 L29 16 L27 8 L7 8 Z" fill="#0f172a" stroke="#1e293b" stroke-width="0.75" />
        <!-- Windshield Glass Tint Reflection -->
        <path d="M7 15 L27 15 L25 10 L9 10 Z" fill="#38bdf8" opacity="0.65" />

        <!-- Side Mirrors -->
        <rect x="1" y="14" width="2.5" height="4" rx="1" fill="#0f172a" />
        <rect x="30.5" y="14" width="2.5" height="4" rx="1" fill="#0f172a" />

        <!-- Red Medical Cross Livery on Roof -->
        <rect x="6" y="32" width="22" height="4" rx="1" fill="${themeColor}" />
        <rect x="15" y="23" width="4" height="22" rx="1" fill="${themeColor}" />

        <!-- Rear Medical Bay Roof Hatch -->
        <rect x="7" y="48" width="20" height="12" rx="2" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="0.5" />
        <line x1="17" y1="48" x2="17" y2="60" stroke="#94a3b8" stroke-width="1" />

        <!-- Aerodynamic Rooftop LED Emergency Lightbar -->
        <rect x="7" y="18" width="20" height="4.5" rx="1.5" fill="#0f172a" stroke="#475569" stroke-width="0.5" />
        <!-- Red Flasher -->
        <rect x="8" y="19" width="8.5" height="2.5" rx="1" fill="#ef4444">
          <animate attributeName="opacity" values="1;0.2;1" dur="0.25s" repeatCount="indefinite" />
        </rect>
        <!-- Blue Flasher -->
        <rect x="17.5" y="19" width="8.5" height="2.5" rx="1" fill="#3b82f6">
          <animate attributeName="opacity" values="0.2;1;0.2" dur="0.25s" repeatCount="indefinite" />
        </rect>

        <!-- Front Headlight Projectors -->
        <circle cx="6.5" cy="5.5" r="1.75" fill="#fef08a" />
        <circle cx="27.5" cy="5.5" r="1.75" fill="#fef08a" />

        <!-- Rear Brake LEDs -->
        <rect x="5" y="60.5" width="4" height="1.5" rx="0.5" fill="#ef4444" />
        <rect x="25" y="60.5" width="4" height="1.5" rx="0.5" fill="#ef4444" />
      </svg>
    </div>
  `;
}

export function getRealisticCarSvg(
  headingDeg: number,
  type: 'SEDAN' | 'SUV' | 'AUTO' | 'BIKE' | 'BUS',
  color: string = '#ffffff'
): string {
  if (type === 'AUTO') {
    // Hyderabad Auto-Rickshaw (Yellow Canvas Roof, Green Bottom Chassis)
    return `
      <div style="transform: rotate(${headingDeg}deg);" class="relative flex flex-col items-center justify-center transition-transform duration-75 select-none pointer-events-none">
        <svg width="22" height="38" viewBox="0 0 22 38" class="drop-shadow-[0_4px_8px_rgba(0,0,0,0.7)]">
          <!-- 3 Wheels -->
          <rect x="9.5" y="2" width="3" height="7" rx="1" fill="#0f172a" />
          <rect x="1" y="25" width="3" height="8" rx="1" fill="#0f172a" />
          <rect x="18" y="25" width="3" height="8" rx="1" fill="#0f172a" />

          <!-- Auto Cabin Hull (Green Body) -->
          <rect x="3" y="8" width="16" height="27" rx="3.5" fill="#15803d" stroke="#14532d" stroke-width="0.75" />
          <!-- Yellow Canvas Roof -->
          <rect x="4" y="14" width="14" height="19" rx="2" fill="#eab308" stroke="#ca8a04" stroke-width="0.5" />
          <!-- Windshield -->
          <path d="M5 14 L17 14 L15 9 L7 9 Z" fill="#38bdf8" opacity="0.75" />
          <!-- Single Front Center Headlight -->
          <circle cx="11" cy="5" r="1.5" fill="#fef08a" />
        </svg>
      </div>
    `;
  }

  if (type === 'BIKE') {
    // Motorcycle with Rider
    return `
      <div style="transform: rotate(${headingDeg}deg);" class="relative flex flex-col items-center justify-center transition-transform duration-75 select-none pointer-events-none">
        <svg width="16" height="32" viewBox="0 0 16 32" class="drop-shadow-[0_4px_6px_rgba(0,0,0,0.8)]">
          <!-- Front & Rear Wheels -->
          <rect x="7" y="1" width="2" height="8" rx="1" fill="#0f172a" />
          <rect x="7" y="23" width="2" height="8" rx="1" fill="#0f172a" />

          <!-- Bike Frame -->
          <rect x="6.5" y="8" width="3" height="16" rx="1" fill="${color}" />
          <!-- Handlebars -->
          <line x1="2" y1="9" x2="14" y2="9" stroke="#0f172a" stroke-width="1.5" stroke-linecap="round" />
          <!-- Rider Helmet -->
          <circle cx="8" cy="15" r="3.2" fill="#1e293b" stroke="#475569" stroke-width="0.75" />
          <!-- Headlight -->
          <circle cx="8" cy="3" r="1.2" fill="#fef08a" />
        </svg>
      </div>
    `;
  }

  if (type === 'BUS') {
    // Hyderabad City Transit Bus
    return `
      <div style="transform: rotate(${headingDeg}deg);" class="relative flex flex-col items-center justify-center transition-transform duration-75 select-none pointer-events-none">
        <svg width="30" height="74" viewBox="0 0 30 74" class="drop-shadow-[0_8px_16px_rgba(0,0,0,0.9)]">
          <!-- 6 Wheels -->
          <rect x="0.5" y="12" width="3" height="10" rx="1" fill="#0f172a" />
          <rect x="26.5" y="12" width="3" height="10" rx="1" fill="#0f172a" />
          <rect x="0.5" y="52" width="3" height="10" rx="1" fill="#0f172a" />
          <rect x="26.5" y="52" width="3" height="10" rx="1" fill="#0f172a" />

          <!-- Bus Body (Red / White Transit) -->
          <rect x="2.5" y="3" width="25" height="68" rx="4" fill="#dc2626" stroke="#991b1b" stroke-width="1" />
          <!-- White Roof -->
          <rect x="4" y="14" width="22" height="52" rx="2" fill="#f8fafc" />
          <!-- AC Unit on Roof -->
          <rect x="8" y="28" width="14" height="18" rx="2" fill="#cbd5e1" stroke="#94a3b8" stroke-width="0.5" />

          <!-- Front Windshield & Destination Board -->
          <rect x="5" y="5" width="20" height="3" rx="0.5" fill="#020617" />
          <rect x="4.5" y="9" width="21" height="5" rx="1" fill="#38bdf8" opacity="0.8" />
          <!-- Headlights -->
          <circle cx="5.5" cy="4.5" r="1.5" fill="#fef08a" />
          <circle cx="24.5" cy="4.5" r="1.5" fill="#fef08a" />
        </svg>
      </div>
    `;
  }

  // Realistic Sedan / SUV
  const isSuv = type === 'SUV';
  const width = isSuv ? 26 : 24;
  const height = isSuv ? 52 : 48;

  return `
    <div style="transform: rotate(${headingDeg}deg);" class="relative flex flex-col items-center justify-center transition-transform duration-75 select-none pointer-events-none">
      <svg width="${width}" height="${height}" viewBox="0 0 24 48" class="drop-shadow-[0_6px_12px_rgba(0,0,0,0.8)]">
        <!-- 4 Tires -->
        <rect x="0" y="8" width="3" height="8" rx="1" fill="#0f172a" />
        <rect x="21" y="8" width="3" height="8" rx="1" fill="#0f172a" />
        <rect x="0" y="32" width="3" height="8" rx="1" fill="#0f172a" />
        <rect x="21" y="32" width="3" height="8" rx="1" fill="#0f172a" />

        <!-- Car Body -->
        <rect x="2.5" y="3" width="19" height="42" rx="4" fill="${color}" stroke="#334155" stroke-width="0.75" />

        <!-- Front Windshield Glass -->
        <path d="M4.5 13 L19.5 13 L18 8 L6 8 Z" fill="#0f172a" />
        <path d="M5.5 12 L18.5 12 L17 9 L7 9 Z" fill="#38bdf8" opacity="0.7" />

        <!-- Roof Top -->
        <rect x="4.5" y="14" width="15" height="18" rx="2" fill="${color}" opacity="0.9" />

        <!-- Rear Glass -->
        <path d="M4.5 32 L19.5 32 L18 36 L6 36 Z" fill="#0f172a" />
        <path d="M5.5 33 L18.5 33 L17 35 L7 35 Z" fill="#38bdf8" opacity="0.6" />

        <!-- Headlights -->
        <circle cx="5.5" cy="4.5" r="1.5" fill="#fef08a" />
        <circle cx="18.5" cy="4.5" r="1.5" fill="#fef08a" />

        <!-- Taillights -->
        <rect x="4" y="43" width="3.5" height="1.2" rx="0.5" fill="#ef4444" />
        <rect x="16.5" y="43" width="3.5" height="1.2" rx="0.5" fill="#ef4444" />
      </svg>
    </div>
  `;
}
