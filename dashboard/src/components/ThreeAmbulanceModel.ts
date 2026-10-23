import * as THREE from 'three';

export interface Ambulance3DInstance {
  group: THREE.Group;
  update: (delta: number, isEmergency: boolean, speedKmh: number) => void;
  setWheelRotation: (angle: number) => void;
  destroy: () => void;
}

/**
 * Creates a high-detail procedural 3D Emergency Ambulance vehicle in Three.js
 * Complete with vehicle chassis, cab, tinted glass, wheels, bumpers, lightbar, and animated emergency strobes.
 */
export function createAmbulance3D(customScale: number = 1.0): Ambulance3DInstance {
  const group = new THREE.Group();

  // Scale: 1 unit ~ 1 meter. Realistic Ambulance: Length ~5.2m, Width ~2.1m, Height ~2.5m
  const scale = customScale;

  // 1. Materials
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.25,
    metalness: 0.15,
  });

  const redStripeMaterial = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    roughness: 0.3,
    metalness: 0.2,
  });

  const darkTrimMaterial = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.8,
    metalness: 0.1,
  });

  const glassMaterial = new THREE.MeshStandardMaterial({
    color: 0x0f2942,
    roughness: 0.1,
    metalness: 0.9,
  });

  const wheelMaterial = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.9,
    metalness: 0.05,
  });

  const rimMaterial = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    roughness: 0.2,
    metalness: 0.8,
  });

  const lightRedMat = new THREE.MeshStandardMaterial({
    color: 0xff0033,
    emissive: 0xff0033,
    emissiveIntensity: 0.2,
    roughness: 0.2,
  });

  const lightBlueMat = new THREE.MeshStandardMaterial({
    color: 0x0088ff,
    emissive: 0x0088ff,
    emissiveIntensity: 0.2,
    roughness: 0.2,
  });

  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xfffae0,
    emissive: 0xfffae0,
    emissiveIntensity: 0.9,
    roughness: 0.1,
  });

  const taillightMat = new THREE.MeshStandardMaterial({
    color: 0xff1100,
    emissive: 0xff1100,
    emissiveIntensity: 0.8,
    roughness: 0.2,
  });

  // --- 2. Main Vehicle Body Chassis ---
  // Lower chassis box
  const lowerBodyGeo = new THREE.BoxGeometry(2.1 * scale, 1.1 * scale, 5.2 * scale);
  const lowerBody = new THREE.Mesh(lowerBodyGeo, bodyMaterial);
  lowerBody.position.y = 0.85 * scale;
  lowerBody.castShadow = true;
  group.add(lowerBody);

  // Upper Patient Module (Boxier high-roof rear)
  const rearBoxGeo = new THREE.BoxGeometry(2.15 * scale, 1.4 * scale, 3.4 * scale);
  const rearBox = new THREE.Mesh(rearBoxGeo, bodyMaterial);
  rearBox.position.set(0, 1.85 * scale, -0.8 * scale);
  rearBox.castShadow = true;
  group.add(rearBox);

  // Front Cab (Slightly sloped roof)
  const cabGeo = new THREE.BoxGeometry(2.05 * scale, 1.05 * scale, 1.7 * scale);
  const cab = new THREE.Mesh(cabGeo, bodyMaterial);
  cab.position.set(0, 1.68 * scale, 1.65 * scale);
  cab.castShadow = true;
  group.add(cab);

  // Hood Nose
  const hoodGeo = new THREE.BoxGeometry(2.05 * scale, 0.45 * scale, 1.0 * scale);
  const hood = new THREE.Mesh(hoodGeo, bodyMaterial);
  hood.position.set(0, 1.15 * scale, 2.3 * scale);
  group.add(hood);

  // --- 3. Emergency Decals & Liveries ---
  // Red side stripes along both flanks
  const stripeGeo = new THREE.BoxGeometry(2.2 * scale, 0.3 * scale, 5.0 * scale);
  const sideStripe = new THREE.Mesh(stripeGeo, redStripeMaterial);
  sideStripe.position.set(0, 1.0 * scale, 0);
  group.add(sideStripe);

  // Roof Red Medical Cross
  const cross1Geo = new THREE.BoxGeometry(0.35 * scale, 0.05 * scale, 1.2 * scale);
  const cross1 = new THREE.Mesh(cross1Geo, redStripeMaterial);
  cross1.position.set(0, 2.58 * scale, -0.8 * scale);
  group.add(cross1);

  const cross2Geo = new THREE.BoxGeometry(1.2 * scale, 0.05 * scale, 0.35 * scale);
  const cross2 = new THREE.Mesh(cross2Geo, redStripeMaterial);
  cross2.position.set(0, 2.58 * scale, -0.8 * scale);
  group.add(cross2);

  // --- 4. Windshield & Windows ---
  // Front Windshield
  const windshieldGeo = new THREE.BoxGeometry(1.9 * scale, 0.65 * scale, 0.05 * scale);
  const windshield = new THREE.Mesh(windshieldGeo, glassMaterial);
  windshield.position.set(0, 1.8 * scale, 2.52 * scale);
  windshield.rotation.x = -0.35;
  group.add(windshield);

  // Side Cab Windows (Left & Right)
  const sideWinGeo = new THREE.BoxGeometry(2.12 * scale, 0.55 * scale, 0.9 * scale);
  const sideWin = new THREE.Mesh(sideWinGeo, glassMaterial);
  sideWin.position.set(0, 1.8 * scale, 1.65 * scale);
  group.add(sideWin);

  // Rear Patient Windows
  const rearWinGeo = new THREE.BoxGeometry(2.2 * scale, 0.45 * scale, 1.2 * scale);
  const rearWin = new THREE.Mesh(rearWinGeo, glassMaterial);
  rearWin.position.set(0, 1.95 * scale, -0.8 * scale);
  group.add(rearWin);

  // --- 5. Front Headlights & Rear Taillights ---
  // Headlights
  const hlGeo = new THREE.BoxGeometry(0.4 * scale, 0.25 * scale, 0.1 * scale);
  const hlLeft = new THREE.Mesh(hlGeo, headlightMat);
  hlLeft.position.set(-0.75 * scale, 1.05 * scale, 2.8 * scale);
  const hlRight = new THREE.Mesh(hlGeo, headlightMat);
  hlRight.position.set(0.75 * scale, 1.05 * scale, 2.8 * scale);
  group.add(hlLeft, hlRight);

  // Taillights
  const tlGeo = new THREE.BoxGeometry(0.25 * scale, 0.5 * scale, 0.08 * scale);
  const tlLeft = new THREE.Mesh(tlGeo, taillightMat);
  tlLeft.position.set(-0.95 * scale, 1.1 * scale, -2.52 * scale);
  const tlRight = new THREE.Mesh(tlGeo, taillightMat);
  tlRight.position.set(0.95 * scale, 1.1 * scale, -2.52 * scale);
  group.add(tlLeft, tlRight);

  // --- 6. Front & Rear Bumpers ---
  const frontBumperGeo = new THREE.BoxGeometry(2.15 * scale, 0.35 * scale, 0.3 * scale);
  const frontBumper = new THREE.Mesh(frontBumperGeo, darkTrimMaterial);
  frontBumper.position.set(0, 0.45 * scale, 2.75 * scale);
  group.add(frontBumper);

  const rearBumperGeo = new THREE.BoxGeometry(2.2 * scale, 0.35 * scale, 0.3 * scale);
  const rearBumper = new THREE.Mesh(rearBumperGeo, darkTrimMaterial);
  rearBumper.position.set(0, 0.45 * scale, -2.55 * scale);
  group.add(rearBumper);

  // --- 7. Rooftop Emergency Light Bar & Flashers ---
  const lightBarHousingGeo = new THREE.BoxGeometry(1.6 * scale, 0.15 * scale, 0.4 * scale);
  const lightBarHousing = new THREE.Mesh(lightBarHousingGeo, darkTrimMaterial);
  lightBarHousing.position.set(0, 2.28 * scale, 1.5 * scale);
  group.add(lightBarHousing);

  // Red Strobe Dome (Left)
  const redDomeGeo = new THREE.BoxGeometry(0.65 * scale, 0.22 * scale, 0.35 * scale);
  const redDome = new THREE.Mesh(redDomeGeo, lightRedMat);
  redDome.position.set(-0.45 * scale, 2.38 * scale, 1.5 * scale);
  group.add(redDome);

  // Blue Strobe Dome (Right)
  const blueDomeGeo = new THREE.BoxGeometry(0.65 * scale, 0.22 * scale, 0.35 * scale);
  const blueDome = new THREE.Mesh(blueDomeGeo, lightBlueMat);
  blueDome.position.set(0.45 * scale, 2.38 * scale, 1.5 * scale);
  group.add(blueDome);

  // Rear Emergency Flashers on Patient Roof
  const rearRedFlasher = new THREE.Mesh(new THREE.BoxGeometry(0.3 * scale, 0.15 * scale, 0.15 * scale), lightRedMat);
  rearRedFlasher.position.set(-0.85 * scale, 2.58 * scale, -2.48 * scale);
  const rearBlueFlasher = new THREE.Mesh(new THREE.BoxGeometry(0.3 * scale, 0.15 * scale, 0.15 * scale), lightBlueMat);
  rearBlueFlasher.position.set(0.85 * scale, 2.58 * scale, -2.48 * scale);
  group.add(rearRedFlasher, rearBlueFlasher);

  // Point Lights for flashing light glow reflection
  const redLight = new THREE.PointLight(0xff0033, 0, 15);
  redLight.position.set(-1.0 * scale, 3.0 * scale, 1.5 * scale);
  const blueLight = new THREE.PointLight(0x0088ff, 0, 15);
  blueLight.position.set(1.0 * scale, 3.0 * scale, 1.5 * scale);
  group.add(redLight, blueLight);

  // --- 8. 4 Realistic Wheels ---
  const wheelGeo = new THREE.CylinderGeometry(0.42 * scale, 0.42 * scale, 0.28 * scale, 16);
  wheelGeo.rotateZ(Math.PI / 2);

  const rimGeo = new THREE.CylinderGeometry(0.24 * scale, 0.24 * scale, 0.3 * scale, 12);
  rimGeo.rotateZ(Math.PI / 2);

  const wheels: THREE.Group[] = [];
  const wheelPositions = [
    [-1.0 * scale, 0.42 * scale, 1.6 * scale],  // Front Left
    [1.0 * scale, 0.42 * scale, 1.6 * scale],   // Front Right
    [-1.0 * scale, 0.42 * scale, -1.5 * scale], // Rear Left
    [1.0 * scale, 0.42 * scale, -1.5 * scale],  // Rear Right
  ];

  wheelPositions.forEach(([wx, wy, wz]) => {
    const wheelGroup = new THREE.Group();
    const tire = new THREE.Mesh(wheelGeo, wheelMaterial);
    const rim = new THREE.Mesh(rimGeo, rimMaterial);
    wheelGroup.add(tire, rim);
    wheelGroup.position.set(wx, wy, wz);
    group.add(wheelGroup);
    wheels.push(wheelGroup);
  });

  // --- 9. Soft Ground Shadow ---
  const shadowGeo = new THREE.PlaneGeometry(2.4 * scale, 5.6 * scale);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x020617,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });
  const groundShadow = new THREE.Mesh(shadowGeo, shadowMat);
  groundShadow.rotation.x = -Math.PI / 2;
  groundShadow.position.y = 0.02 * scale;
  group.add(groundShadow);

  let strobeTimer = 0;

  return {
    group,
    setWheelRotation: (angle: number) => {
      wheels.forEach((w) => {
        w.rotation.x = angle;
      });
    },
    update: (delta: number, isEmergency: boolean, speedKmh: number) => {
      // Animate wheels based on speed
      const rotSpeed = (speedKmh * delta * 2.5);
      wheels.forEach((w) => {
        w.rotation.x += rotSpeed;
      });

      // Flashing Emergency Strobes
      if (isEmergency) {
        strobeTimer += delta * 12; // 6Hz flash rate
        const phase = Math.floor(strobeTimer) % 2;

        if (phase === 0) {
          lightRedMat.emissiveIntensity = 2.8;
          redLight.intensity = 2.5;
          lightBlueMat.emissiveIntensity = 0.1;
          blueLight.intensity = 0.0;
        } else {
          lightRedMat.emissiveIntensity = 0.1;
          redLight.intensity = 0.0;
          lightBlueMat.emissiveIntensity = 2.8;
          blueLight.intensity = 2.5;
        }
      } else {
        lightRedMat.emissiveIntensity = 0.1;
        lightBlueMat.emissiveIntensity = 0.1;
        redLight.intensity = 0;
        blueLight.intensity = 0;
      }
    },
    destroy: () => {
      // Cleanup geometries & materials
      group.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
    },
  };
}
