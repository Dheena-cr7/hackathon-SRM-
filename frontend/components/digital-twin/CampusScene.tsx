'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CAMPUS_GEOJSON, CampusFeature } from '@/lib/campusGeojson';
import { 
  Compass, 
  Maximize2, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Eye, 
  Play, 
  Pause, 
  Layers, 
  Building2, 
  CheckCircle2, 
  AlertTriangle,
  Search,
  ChevronDown
} from 'lucide-react';

interface CampusSceneProps {
  onSelectBuilding: (building: any) => void;
  selectedBuildingId?: string | null;
  buildingStatusMap?: Record<string, string>;
}

export default function CampusScene({
  onSelectBuilding,
  selectedBuildingId,
  buildingStatusMap = {},
}: CampusSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hoveredBuilding, setHoveredBuilding] = useState<string | null>(null);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [activeViewPreset, setActiveViewPreset] = useState<'iso' | 'top' | 'front'>('iso');

  // References to communicate with Three.js scene instance
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const buildingMeshesRef = useRef<THREE.Mesh[]>([]);
  const tweenRef = useRef<{
    active: boolean;
    startTime: number;
    duration: number;
    startCamPos: THREE.Vector3;
    targetCamPos: THREE.Vector3;
    startTarget: THREE.Vector3;
    endTarget: THREE.Vector3;
  } | null>(null);

  // Geographic projection constants
  const refLon = 80.0441;
  const refLat = 12.8232;
  const scale = 14000;

  // Compute building centroid lookup
  const buildingCentroids = useMemo(() => {
    const map = new Map<string, { x: number; z: number; height: number; feature: CampusFeature }>();
    CAMPUS_GEOJSON.features.forEach((feature) => {
      const coords = feature.geometry.coordinates[0];
      if (!coords || coords.length === 0) return;
      let sumX = 0;
      let sumZ = 0;
      coords.forEach(([lon, lat]) => {
        sumX += (lon - refLon) * scale;
        sumZ += -(lat - refLat) * scale;
      });
      const heightMeters = feature.properties.height_meters || 18;
      const extrudeDepth = heightMeters * 0.22;
      map.set(feature.properties.building_id, {
        x: sumX / coords.length,
        z: sumZ / coords.length,
        height: extrudeDepth,
        feature,
      });
    });
    return map;
  }, []);

  // Camera animation helper
  const animateCameraTo = (targetCamPos: THREE.Vector3, targetLookAt: THREE.Vector3, duration = 800) => {
    if (!cameraRef.current || !controlsRef.current) return;
    tweenRef.current = {
      active: true,
      startTime: performance.now(),
      duration,
      startCamPos: cameraRef.current.position.clone(),
      targetCamPos: targetCamPos.clone(),
      startTarget: controlsRef.current.target.clone(),
      endTarget: targetLookAt.clone(),
    };
  };

  // View presets
  const handleSetPreset = (preset: 'iso' | 'top' | 'front') => {
    setActiveViewPreset(preset);
    setAutoRotate(false);
    if (controlsRef.current) controlsRef.current.autoRotate = false;

    if (preset === 'iso') {
      animateCameraTo(new THREE.Vector3(28, 32, 42), new THREE.Vector3(0, 0, 0));
    } else if (preset === 'top') {
      animateCameraTo(new THREE.Vector3(0, 68, 0.5), new THREE.Vector3(0, 0, 0));
    } else if (preset === 'front') {
      animateCameraTo(new THREE.Vector3(0, 16, 46), new THREE.Vector3(0, 4, 0));
    }
  };

  const handleZoom = (direction: 'in' | 'out') => {
    if (!cameraRef.current || !controlsRef.current) return;
    const factor = direction === 'in' ? 0.75 : 1.35;
    const newPos = controlsRef.current.target.clone().add(
      cameraRef.current.position.clone().sub(controlsRef.current.target).multiplyScalar(factor)
    );
    animateCameraTo(newPos, controlsRef.current.target, 400);
  };

  const handleReset = () => {
    handleSetPreset('iso');
  };

  const handleToggleAutoRotate = () => {
    const next = !autoRotate;
    setAutoRotate(next);
    if (controlsRef.current) {
      controlsRef.current.autoRotate = next;
      controlsRef.current.autoRotateSpeed = 1.2;
    }
  };

  // Focus specific building
  const focusBuilding = (buildingId: string) => {
    const centroid = buildingCentroids.get(buildingId);
    if (!centroid) return;
    const targetLookAt = new THREE.Vector3(centroid.x, centroid.height * 0.5, centroid.z);
    const offset = new THREE.Vector3(15, 18, 22);
    const targetCamPos = targetLookAt.clone().add(offset);
    animateCameraTo(targetCamPos, targetLookAt, 900);
  };

  // When selectedBuildingId changes externally, focus it
  useEffect(() => {
    if (selectedBuildingId) {
      focusBuilding(selectedBuildingId);
    }
  }, [selectedBuildingId]);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight || 540;

    // 1. Scene, Fog, Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0a0e17);
    scene.fog = new THREE.FogExp2(0x0a0e17, 0.009);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(28, 32, 42);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 2. High-performance WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.appendChild(renderer.domElement);

    // 3. Smooth Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.05;
    controls.minDistance = 14;
    controls.maxDistance = 110;
    controls.target.set(0, 0, 0);
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 1.2;

    // 4. Lighting System (Architectural Campus Sun & Ambient Fill)
    const ambientLight = new THREE.AmbientLight(0xdbeafe, 0.65);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 0.45);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfff7ed, 1.4);
    sunLight.position.set(25, 48, 30);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 120;
    sunLight.shadow.camera.left = -50;
    sunLight.shadow.camera.right = 50;
    sunLight.shadow.camera.top = 50;
    sunLight.shadow.camera.bottom = -50;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    const skyFillLight = new THREE.DirectionalLight(0x38bdf8, 0.35);
    skyFillLight.position.set(-30, 25, -25);
    scene.add(skyFillLight);

    // 5. Grounds, Plazas, Walkways & Greenery
    // Main base ground
    const groundGeo = new THREE.PlaneGeometry(160, 160);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0f1523,
      roughness: 0.92,
      metalness: 0.08,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.y = -0.15;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // Architectural ground grid
    const gridHelper = new THREE.GridHelper(120, 60, 0x1e293b, 0x131d2e);
    gridHelper.position.y = -0.12;
    scene.add(gridHelper);

    // Campus Quad Greenery Lawns
    const lawnMaterial = new THREE.MeshStandardMaterial({
      color: 0x12241d,
      roughness: 0.85,
      metalness: 0.05,
    });
    const lawn1 = new THREE.Mesh(new THREE.PlaneGeometry(28, 22), lawnMaterial);
    lawn1.rotation.x = -Math.PI / 2;
    lawn1.position.set(4, -0.1, -4);
    lawn1.receiveShadow = true;
    scene.add(lawn1);

    const lawn2 = new THREE.Mesh(new THREE.PlaneGeometry(24, 18), lawnMaterial);
    lawn2.rotation.x = -Math.PI / 2;
    lawn2.position.set(-16, -0.1, 10);
    lawn2.receiveShadow = true;
    scene.add(lawn2);

    // Pedestrian Campus Walkways & Plazas
    const walkwayMaterial = new THREE.MeshStandardMaterial({
      color: 0x1c2538,
      roughness: 0.75,
      metalness: 0.15,
    });

    const spinePath = new THREE.Mesh(new THREE.PlaneGeometry(4, 90), walkwayMaterial);
    spinePath.rotation.x = -Math.PI / 2;
    spinePath.position.set(2, -0.08, 0);
    spinePath.receiveShadow = true;
    scene.add(spinePath);

    const crossPath = new THREE.Mesh(new THREE.PlaneGeometry(80, 4), walkwayMaterial);
    crossPath.rotation.x = -Math.PI / 2;
    crossPath.position.set(0, -0.08, 2);
    crossPath.receiveShadow = true;
    scene.add(crossPath);

    // 6. Extrude Buildings with Architectural Detailing
    const buildingMeshes: THREE.Mesh[] = [];
    buildingMeshesRef.current = buildingMeshes;

    CAMPUS_GEOJSON.features.forEach((feature: CampusFeature) => {
      const coords = feature.geometry.coordinates[0];
      if (!coords || coords.length < 3) return;

      const shape = new THREE.Shape();
      coords.forEach(([lon, lat], index) => {
        const x = (lon - refLon) * scale;
        const y = (lat - refLat) * scale;
        if (index === 0) shape.moveTo(x, y);
        else shape.lineTo(x, y);
      });

      const heightMeters = feature.properties.height_meters || 18;
      const extrudeDepth = heightMeters * 0.22;

      const extrudeSettings: THREE.ExtrudeGeometryOptions = {
        depth: extrudeDepth,
        bevelEnabled: true,
        bevelSegments: 2,
        steps: 1,
        bevelSize: 0.15,
        bevelThickness: 0.15,
      };

      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      geometry.rotateX(-Math.PI / 2);

      const bldId = feature.properties.building_id;
      const currentStatus = buildingStatusMap[bldId] || feature.properties.operational_status;

      // Organic architectural color palettes
      let buildingBaseColor = 0x1e293b; // Sleek modern slate/navy
      let buildingEmissive = 0x0f172a;

      if (currentStatus === 'maintenance' || currentStatus === 'disrupted') {
        buildingBaseColor = 0x78350f; // Warm amber/honey
        buildingEmissive = 0x451a03;
      } else if (currentStatus === 'closed' || currentStatus === 'critical_disruption') {
        buildingBaseColor = 0x7f1d1d; // Deep emergency crimson
        buildingEmissive = 0x450a0a;
      }

      const material = new THREE.MeshStandardMaterial({
        color: buildingBaseColor,
        roughness: 0.45,
        metalness: 0.3,
        emissive: buildingEmissive,
        emissiveIntensity: 0.35,
        transparent: true,
        opacity: 0.85,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = {
        feature,
        building_id: bldId,
        name: feature.properties.name,
        code: feature.properties.code,
        status: currentStatus,
        baseColor: buildingBaseColor,
        baseEmissive: buildingEmissive,
        extrudeDepth,
      };

      // Add crisp architectural CAD edges for clean, organic structural readability
      const edgesGeo = new THREE.EdgesGeometry(geometry, 25);
      const edgesMat = new THREE.LineBasicMaterial({
        color: currentStatus === 'critical_disruption' ? 0xf43f5e : currentStatus === 'maintenance' ? 0xfbbf24 : 0x60a5fa,
        transparent: true,
        opacity: 0.5,
      });
      const edges = new THREE.LineSegments(edgesGeo, edgesMat);
      mesh.add(edges);

      scene.add(mesh);
      buildingMeshes.push(mesh);

      // Informative 4 Floors, with 4 Rooms Per Floor & Yellow Tint on Active Complaints
      const centroid = buildingCentroids.get(bldId);
      if (centroid) {
        const floorCount = 4;
        const floorHeight = extrudeDepth / floorCount;
        const radius = Math.min(extrudeDepth * 0.45, 3.2);

        for (let f = 1; f <= floorCount; f++) {
          const floorY = (f - 0.5) * floorHeight;

          // Distinct Floor Slab Demarcation Wireframe
          const slabGeo = new THREE.BoxGeometry(radius * 2.2, 0.04, radius * 2.2);
          const slabMat = new THREE.MeshBasicMaterial({
            color: 0x475569,
            wireframe: true,
          });
          const slab = new THREE.Mesh(slabGeo, slabMat);
          slab.position.set(centroid.x, f * floorHeight, centroid.z);
          scene.add(slab);

          // 4 Quadrant Rooms on this floor (e.g. 101, 102, 103, 104)
          const roomQuadrants = [
            { rx: -radius * 0.52, rz: radius * 0.52, num: `${f}01` },
            { rx: radius * 0.52, rz: radius * 0.52, num: `${f}02` },
            { rx: -radius * 0.52, rz: -radius * 0.52, num: `${f}03` },
            { rx: radius * 0.52, rz: -radius * 0.52, num: `${f}04` },
          ];

          roomQuadrants.forEach((rm) => {
            // Complaint active on Room 204 in Tech Park (BLD-TECH-01) or Room 101 in Auditorium
            const isComplaintRoom = (bldId === 'BLD-TECH-01' && rm.num === '204') || 
                                    (bldId === 'BLD-AUD-01' && rm.num === '101');

            const roomGeo = new THREE.BoxGeometry(radius * 0.82, floorHeight * 0.65, radius * 0.82);

            // Active complaint room turns into a vibrant glowing YELLOW TINT
            let roomColor = 0x38bdf8;
            let roomEmissive = 0x0284c7;
            let roomOpacity = 0.45;
            let roomEmissiveInt = 0.2;

            if (isComplaintRoom) {
              roomColor = 0xfacc15;     // Vibrant Yellow Tint
              roomEmissive = 0xeab308;  // Glowing Amber-Yellow
              roomOpacity = 0.95;
              roomEmissiveInt = 1.2;
            }

            const roomMat = new THREE.MeshStandardMaterial({
              color: roomColor,
              emissive: roomEmissive,
              emissiveIntensity: roomEmissiveInt,
              transparent: true,
              opacity: roomOpacity,
              roughness: 0.2,
              metalness: 0.15,
            });

            const roomMesh = new THREE.Mesh(roomGeo, roomMat);
            roomMesh.position.set(centroid.x + rm.rx, floorY, centroid.z + rm.rz);
            roomMesh.castShadow = true;
            roomMesh.receiveShadow = true;
            roomMesh.userData = {
              isRoom: true,
              building_id: bldId,
              building_name: feature.properties.name,
              floor: f,
              room_number: rm.num,
              hasComplaint: isComplaintRoom,
              name: `Room ${rm.num} (Floor ${f}) — ${feature.properties.name}${isComplaintRoom ? ' [⚠️ Active Complaint - Yellow Tint]' : ' [Normal]'}`
            };

            buildingMeshes.push(roomMesh);
            scene.add(roomMesh);

            // If complaint room, add an extra glowing warning cage
            if (isComplaintRoom) {
              const glowAuraGeo = new THREE.BoxGeometry(radius * 0.92, floorHeight * 0.72, radius * 0.92);
              const glowAuraMat = new THREE.MeshBasicMaterial({
                color: 0xfacc15,
                wireframe: true,
              });
              const glowMesh = new THREE.Mesh(glowAuraGeo, glowAuraMat);
              glowMesh.position.set(centroid.x + rm.rx, floorY, centroid.z + rm.rz);
              scene.add(glowMesh);
            }
          });
        }

        // Rooftop Pulse Telemetry Beacon
        const beaconGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.45, 16);
        const beaconColor = currentStatus === 'normal' 
          ? 0x38bdf8 
          : (currentStatus === 'closed' || currentStatus === 'critical_disruption') 
          ? 0xf43f5e 
          : 0xfacc15;

        const beaconMat = new THREE.MeshBasicMaterial({ color: beaconColor });
        const beacon = new THREE.Mesh(beaconGeo, beaconMat);
        beacon.position.set(centroid.x, extrudeDepth + 0.35, centroid.z);
        scene.add(beacon);
      }
    });

    // 7. Raycasting & Interaction (Raycaster with OrbitControls)
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let pointerDownPos = { x: 0, y: 0 };
    let isClicking = false;

    const onPointerDown = (e: MouseEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
      isClicking = true;
    };

    const onPointerMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      // Differentiate click from drag
      if (isClicking) {
        const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
        if (dist > 5) isClicking = false;
      }

      // Hover check
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(buildingMeshes);
      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        setHoveredBuilding(hit.userData.name || null);
        renderer.domElement.style.cursor = 'pointer';
      } else {
        setHoveredBuilding(null);
        renderer.domElement.style.cursor = 'grab';
      }
    };

    const onPointerUp = (e: MouseEvent) => {
      if (isClicking) {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(buildingMeshes);
        if (intersects.length > 0) {
          const hit = intersects[0].object as THREE.Mesh;
          onSelectBuilding(hit.userData);
          focusBuilding(hit.userData.building_id);
        }
      }
      isClicking = false;
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('pointerdown', onPointerDown);
    domEl.addEventListener('pointermove', onPointerMove);
    domEl.addEventListener('pointerup', onPointerUp);

    // 8. Responsive resize
    const onResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight || 540;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', onResize);

    // 9. Render & Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Handle Camera Smooth Tweening
      if (tweenRef.current && tweenRef.current.active) {
        const { startTime, duration, startCamPos, targetCamPos, startTarget, endTarget } = tweenRef.current;
        const progress = Math.min((performance.now() - startTime) / duration, 1);
        // EaseInOutCubic
        const t = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        camera.position.lerpVectors(startCamPos, targetCamPos, t);
        controls.target.lerpVectors(startTarget, endTarget, t);

        if (progress >= 1) {
          tweenRef.current.active = false;
        }
      }

      controls.update();

      // Pulse highlight for selected or alert buildings
      buildingMeshes.forEach((mesh) => {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        const isSelected = mesh.userData.building_id === selectedBuildingId;
        const isAlert = mesh.userData.status !== 'normal';

        if (isSelected) {
          mat.emissive.setHex(0x38bdf8);
          mat.emissiveIntensity = 0.5 + Math.sin(elapsedTime * 5) * 0.3;
        } else if (isAlert) {
          mat.emissive.setHex(mesh.userData.baseEmissive);
          mat.emissiveIntensity = 0.35 + Math.sin(elapsedTime * 3.5) * 0.25;
        } else {
          mat.emissive.setHex(mesh.userData.baseEmissive);
          mat.emissiveIntensity = 0.15;
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      domEl.removeEventListener('pointerdown', onPointerDown);
      domEl.removeEventListener('pointermove', onPointerMove);
      domEl.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', onResize);
      controls.dispose();
      renderer.dispose();
      if (container.contains(domEl)) {
        container.removeChild(domEl);
      }
    };
  }, [selectedBuildingId, buildingStatusMap]);

  return (
    <div className="relative w-full h-[560px] rounded-2xl overflow-hidden bg-[#0D0D0D] border border-white/10 shadow-glaido-card group">
      {/* 3D Canvas Mount Point */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Left: Title Badge & Quick Building Pills */}
      <div className="absolute top-4 left-4 z-10 flex flex-col space-y-2 max-w-[85%] sm:max-w-none">
        <div className="flex items-center space-x-2 bg-[#1A1A1A]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs text-white font-medium shadow-lg self-start">
          <span className="w-2 h-2 rounded-full bg-[#BFF549] animate-pulse" />
          <span className="font-bold">Sri Krishna Campus Twin</span>
          <span className="text-[10px] text-[#BFF549] font-mono hidden sm:inline">• WebGL 3D</span>
        </div>

        {/* Quick Building Selector Pills for One-Click Navigation */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {CAMPUS_GEOJSON.features.map((feature) => {
            const bldId = feature.properties.building_id;
            const isSelected = selectedBuildingId === bldId;
            const status = buildingStatusMap[bldId] || feature.properties.operational_status;
            const isDisrupted = status !== 'normal';

            return (
              <button
                key={bldId}
                type="button"
                onClick={() => {
                  onSelectBuilding(feature.properties);
                  focusBuilding(bldId);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all focus-ring cursor-pointer flex items-center space-x-1.5 backdrop-blur-md shadow-sm ${
                  isSelected
                    ? 'bg-[#BFF549] text-black font-bold border border-[#BFF549] scale-105 shadow-glaido-button'
                    : 'bg-[#1A1A1A]/80 hover:bg-[#252525] text-neutral-300 border border-white/10'
                }`}
                title={`Focus ${feature.properties.name}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isDisrupted ? 'bg-amber-400' : 'bg-[#BFF549]'}`} />
                <span>{feature.properties.code}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Top Right: View Angle Presets & Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col items-end space-y-2">
        <div className="bg-[#1A1A1A]/90 backdrop-blur-md p-1 rounded-xl border border-white/10 shadow-lg flex items-center space-x-1 text-xs">
          <button
            type="button"
            onClick={() => handleSetPreset('iso')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors focus-ring cursor-pointer ${
              activeViewPreset === 'iso' ? 'bg-[#BFF549] text-black shadow-glaido-button' : 'text-neutral-400 hover:text-white'
            }`}
            title="Isometric 45° perspective"
          >
            Isometric
          </button>
          <button
            type="button"
            onClick={() => handleSetPreset('top')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors focus-ring cursor-pointer ${
              activeViewPreset === 'top' ? 'bg-[#BFF549] text-black shadow-glaido-button' : 'text-neutral-400 hover:text-white'
            }`}
            title="Top-down 2.5D architectural plan"
          >
            Top-Down
          </button>
          <button
            type="button"
            onClick={() => handleSetPreset('front')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors focus-ring cursor-pointer ${
              activeViewPreset === 'front' ? 'bg-[#BFF549] text-black shadow-glaido-button' : 'text-neutral-400 hover:text-white'
            }`}
            title="Ground level campus perspective"
          >
            Entrance
          </button>
        </div>

        {/* Zoom & Orbit Control Toolbar */}
        <div className="bg-[#1A1A1A]/90 backdrop-blur-md p-1 rounded-xl border border-white/10 shadow-lg flex items-center space-x-1">
          <button
            type="button"
            onClick={() => handleZoom('in')}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors focus-ring cursor-pointer"
            aria-label="Zoom in 3D camera"
            title="Zoom In (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleZoom('out')}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors focus-ring cursor-pointer"
            aria-label="Zoom out 3D camera"
            title="Zoom Out (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors focus-ring cursor-pointer"
            aria-label="Reset 3D camera view"
            title="Reset to Campus Overview"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleToggleAutoRotate}
            className={`p-1.5 rounded-lg transition-colors focus-ring cursor-pointer ${
              autoRotate ? 'bg-[#BFF549] text-black shadow-glaido-button' : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
            aria-label="Toggle camera auto-orbit tour"
            title="Toggle Tour Mode (Auto-Orbit)"
          >
            {autoRotate ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Bottom Center: Gesture Instructions */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-[#1A1A1A]/80 backdrop-blur-sm px-3.5 py-1 rounded-full border border-white/10 text-[11px] text-neutral-400 font-mono shadow-md hidden sm:flex items-center space-x-3 pointer-events-none">
        <span>Left-click: Orbit</span>
        <span>•</span>
        <span>Right-click: Pan</span>
        <span>•</span>
        <span>Scroll: Zoom</span>
        <span>•</span>
        <span>Click building to inspect</span>
      </div>

      {/* Floating Hover Badge */}
      {hoveredBuilding && (
        <div className="absolute bottom-4 left-4 z-10 bg-[#1A1A1A]/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-[#BFF549]/60 text-xs text-white shadow-2xl flex items-center space-x-2 animate-fade-in pointer-events-none">
          <Building2 className="w-4 h-4 text-[#BFF549]" />
          <span className="font-bold">{hoveredBuilding}</span>
          <span className="text-[10px] text-[#BFF549] uppercase font-mono pl-1">(Click to inspect)</span>
        </div>
      )}

      {/* Attribution Footer */}
      <div className="absolute bottom-2 right-4 text-[10px] text-slate-500 font-mono pointer-events-none">
        © OpenStreetMap contributors (ODbL)
      </div>
    </div>
  );
}
