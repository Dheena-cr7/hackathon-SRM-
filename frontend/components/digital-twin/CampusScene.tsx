'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CAMPUS_GEOJSON, CampusFeature } from '@/lib/campusGeojson';

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

  useEffect(() => {
    if (!mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight || 520;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617); // Slate-950
    scene.fog = new THREE.FogExp2(0x020617, 0.012);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 36, 48);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    sunLight.position.set(20, 45, 25);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);

    const blueFill = new THREE.DirectionalLight(0x38bdf8, 0.5);
    blueFill.position.set(-20, 20, -20);
    scene.add(blueFill);

    // 3. Ground & Grid Plane
    const gridHelper = new THREE.GridHelper(90, 45, 0x1e3a8a, 0x0f172a);
    gridHelper.position.y = -0.05;
    scene.add(gridHelper);

    const groundGeo = new THREE.PlaneGeometry(120, 120);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x050b14,
      roughness: 0.9,
      metalness: 0.1,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.y = -0.1;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // 4. Extrude GeoJSON Buildings
    const refLon = 80.0441;
    const refLat = 12.8232;
    const scale = 14000;

    const buildingMeshes: THREE.Mesh[] = [];

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

      const extrudeSettings = {
        depth: extrudeDepth,
        bevelEnabled: true,
        bevelSegments: 2,
        steps: 1,
        bevelSize: 0.12,
        bevelThickness: 0.12,
      };

      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      // Center geometry rotation to sit on ground
      geometry.rotateX(-Math.PI / 2);

      // Determine color by status
      const currentStatus = buildingStatusMap[feature.properties.building_id] || feature.properties.operational_status;
      let buildingColor = 0x0284c7; // default tech blue
      let emissiveColor = 0x0369a1;

      if (currentStatus === 'maintenance' || currentStatus === 'disrupted') {
        buildingColor = 0xd97706; // amber
        emissiveColor = 0x78350f;
      } else if (currentStatus === 'closed') {
        buildingColor = 0xdc2626; // red
        emissiveColor = 0x7f1d1d;
      }

      const material = new THREE.MeshStandardMaterial({
        color: buildingColor,
        roughness: 0.35,
        metalness: 0.45,
        emissive: emissiveColor,
        emissiveIntensity: 0.25,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = {
        feature,
        building_id: feature.properties.building_id,
        name: feature.properties.name,
        code: feature.properties.code,
        status: currentStatus,
        baseColor: buildingColor,
        baseEmissive: emissiveColor,
      };

      scene.add(mesh);
      buildingMeshes.push(mesh);

      // Add roof beacon / indicator pin
      const beaconGeo = new THREE.SphereGeometry(0.35, 12, 12);
      const beaconMat = new THREE.MeshBasicMaterial({
        color: currentStatus === 'normal' ? 0x38bdf8 : 0xf87171,
      });
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      
      // Calculate center of shape for beacon placement
      let sumX = 0, sumZ = 0;
      coords.forEach(([lon, lat]) => {
        sumX += (lon - refLon) * scale;
        sumZ += -(lat - refLat) * scale;
      });
      const centerX = sumX / coords.length;
      const centerZ = sumZ / coords.length;
      beacon.position.set(centerX, extrudeDepth + 0.6, centerZ);
      scene.add(beacon);
    });

    // 5. Interactive Mouse Orbit & Raycasting
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let targetRotationY = 0;
    let targetRotationX = 0.6;
    let currentRotationY = 0;
    let currentRotationX = 0.6;
    let zoomDistance = 45;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onPointerMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (isDragging) {
        const deltaX = e.clientX - prevMouseX;
        const deltaY = e.clientY - prevMouseY;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;

        targetRotationY += deltaX * 0.007;
        targetRotationX = Math.max(0.15, Math.min(1.2, targetRotationX + deltaY * 0.005));
      }

      // Hover Raycast
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(buildingMeshes);
      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        setHoveredBuilding(hit.userData.name || null);
        renderer.domElement.style.cursor = 'pointer';
      } else {
        setHoveredBuilding(null);
        renderer.domElement.style.cursor = 'default';
      }
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomDistance = Math.max(20, Math.min(80, zoomDistance + e.deltaY * 0.04));
    };

    const onClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(buildingMeshes);
      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        onSelectBuilding(hit.userData);
      }
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    domEl.addEventListener('wheel', onWheel, { passive: false });
    domEl.addEventListener('click', onClick);

    // 6. Resize Handler
    const onResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight || 520;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', onResize);

    // 7. Animation Loop with Pulsing Alert Glow
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth camera interpolation
      currentRotationY += (targetRotationY - currentRotationY) * 0.08;
      currentRotationX += (targetRotationX - currentRotationX) * 0.08;

      camera.position.x = Math.sin(currentRotationY) * Math.cos(currentRotationX) * zoomDistance;
      camera.position.y = Math.sin(currentRotationX) * zoomDistance;
      camera.position.z = Math.cos(currentRotationY) * Math.cos(currentRotationX) * zoomDistance;
      camera.lookAt(0, 4, 0);

      // Pulse alert materials for degraded or selected buildings
      buildingMeshes.forEach((mesh) => {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        const isSelected = mesh.userData.building_id === selectedBuildingId;
        const isCompromised = mesh.userData.status !== 'normal';

        if (isSelected) {
          mat.emissiveIntensity = 0.5 + Math.sin(elapsedTime * 6) * 0.35;
          mat.emissive.setHex(0x38bdf8);
        } else if (isCompromised) {
          mat.emissiveIntensity = 0.4 + Math.sin(elapsedTime * 4) * 0.3;
        } else {
          mat.emissiveIntensity = 0.2;
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      domEl.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      domEl.removeEventListener('wheel', onWheel);
      domEl.removeEventListener('click', onClick);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (container.contains(domEl)) {
        container.removeChild(domEl);
      }
    };
  }, [selectedBuildingId, buildingStatusMap]);

  return (
    <div className="relative w-full h-[540px] rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl">
      <div ref={mountRef} className="w-full h-full" />

      {/* Floating HUD Controls */}
      <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/80 text-[11px] text-slate-300 font-mono shadow-lg flex items-center space-x-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>Three.js Procedural Twin (WebGL)</span>
      </div>

      <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/80 text-[11px] text-slate-400 font-mono shadow-lg">
        Drag to rotate • Wheel to zoom
      </div>

      {hoveredBuilding && (
        <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-lg border border-blue-500/80 text-xs text-white shadow-xl flex items-center space-x-2 animate-in fade-in">
          <span className="font-bold">{hoveredBuilding}</span>
          <span className="text-[10px] text-blue-300 uppercase font-mono">(Click to inspect)</span>
        </div>
      )}

      {/* Zero Cost License Attribution Pill */}
      <div className="absolute bottom-2 right-4 text-[10px] text-slate-500 font-mono">
        Footprints © OpenStreetMap contributors (ODbL)
      </div>
    </div>
  );
}
