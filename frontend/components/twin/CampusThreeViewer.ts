/**
 * CampusThreeViewer.ts
 * High-Performance Architectural GIS & Spatial Digital Twin Engine
 * Built with Three.js (v0.173+)
 * Supports cinematic parabolic drone flyovers between campus blocks,
 * multi-zone visual filtering, glowing floor slab highlighting (The Solenne style),
 * automated cinematic tour sequence, and 3D furnished room inspections.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export type ViewerMode = 'campus' | 'building' | 'floor';

export interface CameraPreset {
  position: [number, number, number];
  target: [number, number, number];
  fov?: number;
}

export interface ZoneRecord {
  id: string;
  name: string;
  color: string;
  description: string;
}

export interface BuildingRecord {
  id: string;
  name: string;
  code: string;
  center: [number, number, number];
  bounds?: { width: number; height: number; depth: number };
  has_detailed_interior: boolean;
  floors: string[];
  status: string;
  departments?: string[];
  primary_zone?: string;
  notice?: string | null;
}

export interface RoomRecord {
  id: string;
  mesh_name: string;
  building_id: string;
  floor: string;
  name: string;
  type: string;
  zone?: string;
  capacity: number;
  current_occupancy: number;
  power_status: string;
  hvac_status: string;
  temperature_c: number;
  disrupted: boolean;
  equipment: string[];
  camera_focus?: [number, number, number];
}

export interface SafetyAssetRecord {
  id: string;
  type: 'fire_extinguisher' | 'aed' | 'security_camera' | 'first_aid';
  label: string;
  building_id: string;
  floor: string;
  position: [number, number, number];
  status: string;
}

export interface CampusMetadata {
  spatial_reference: any;
  camera_presets: Record<string, CameraPreset>;
  zones?: ZoneRecord[];
  buildings: BuildingRecord[];
  rooms: RoomRecord[];
  safety_assets: SafetyAssetRecord[];
}

export interface CampusThreeViewerOptions {
  container: HTMLElement;
  assetBasePath?: string;
  initialMode?: ViewerMode;
  onSelectBuilding?: (building: BuildingRecord | null) => void;
  onSelectRoom?: (room: RoomRecord | null) => void;
  onSelectAsset?: (asset: SafetyAssetRecord | null) => void;
  onModeChange?: (mode: ViewerMode) => void;
  onLoadingChange?: (loading: boolean, label?: string) => void;
  onError?: (error: Error) => void;
}

export class CampusThreeViewer {
  public container: HTMLElement;
  public assetBasePath: string;
  public mode: ViewerMode = 'campus';
  public selectedBuildingId: string | null = null;
  public selectedFloor: string = '0';
  public selectedRoomId: string | null = null;
  public selectedZoneId: string | null = null;
  public showSafetyAssets: boolean = true;
  public assetFilter: string = 'all';

  private scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private loader: GLTFLoader;

  private activeModelGroup: THREE.Group;
  private markerGroup: THREE.Group;
  private highlightGroup: THREE.Group;
  private zoneGroup: THREE.Group;
  private slabGroup: THREE.Group;

  private modelCache: Map<string, THREE.Group> = new Map();
  public metadata: CampusMetadata | null = null;

  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private mouse: THREE.Vector2 = new THREE.Vector2(-999, -999);

  private animFrameId: number | null = null;
  private isTweening: boolean = false;
  private camStartPos: THREE.Vector3 = new THREE.Vector3();
  private camEndPos: THREE.Vector3 = new THREE.Vector3();
  private targetStartPos: THREE.Vector3 = new THREE.Vector3();
  private targetEndPos: THREE.Vector3 = new THREE.Vector3();
  private tweenProgress: number = 0;
  private tweenDuration: number = 1.0;
  private tweenArcHeight: number = 0;

  private tourInterval: any = null;
  private tourStep: number = 0;

  private callbacks: Partial<CampusThreeViewerOptions>;

  constructor(options: CampusThreeViewerOptions) {
    this.container = options.container;
    this.assetBasePath = (options.assetBasePath || '/campus-models').replace(/\/$/, '');
    this.mode = options.initialMode || 'campus';
    this.callbacks = options;

    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 600;

    // 1. Scene Setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x070B14);
    this.scene.fog = new THREE.FogExp2(0x070B14, 0.007);

    // 2. Camera Setup
    this.camera = new THREE.PerspectiveCamera(44, width / height, 0.1, 1000);
    this.camera.position.set(0, 95, 110);

    // 3. Renderer Setup (DPI capped at 2, soft shadows)
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    this.container.appendChild(this.renderer.domElement);

    // 4. Orbit Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.05;
    this.controls.minDistance = 4;
    this.controls.maxDistance = 250;
    this.controls.target.set(0, 4, 0);

    // 5. Lighting Rig
    this.setupLighting();

    // 6. Object Groups
    this.activeModelGroup = new THREE.Group();
    this.markerGroup = new THREE.Group();
    this.highlightGroup = new THREE.Group();
    this.zoneGroup = new THREE.Group();
    this.slabGroup = new THREE.Group();

    this.scene.add(this.activeModelGroup);
    this.scene.add(this.markerGroup);
    this.scene.add(this.highlightGroup);
    this.scene.add(this.zoneGroup);
    this.scene.add(this.slabGroup);

    // 7. GLTF Loader
    this.loader = new GLTFLoader();

    // 8. Event Listeners & Loop
    this.bindEvents();
    this.animate = this.animate.bind(this);
    this.animate();

    // 9. Load Metadata & Initial Scene
    this.init();
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0xE2E8F0, 1.4);
    this.scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xFFFFFF, 1.8);
    sunLight.position.set(70, 110, 60);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 300;
    const d = 110;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0004;
    this.scene.add(sunLight);

    const hemiLight = new THREE.HemisphereLight(0x38BDF8, 0x0F172A, 0.7);
    this.scene.add(hemiLight);

    const rimLight = new THREE.DirectionalLight(0x06B6D4, 0.6);
    rimLight.position.set(-60, 40, -80);
    this.scene.add(rimLight);
  }

  private async init(): Promise<void> {
    try {
      this.callbacks.onLoadingChange?.(true, 'Loading campus spatial metadata...');
      const res = await fetch(`${this.assetBasePath}/campus_metadata.json?t=${Date.now()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status} loading campus_metadata.json`);
      this.metadata = await res.json();
      this.callbacks.onLoadingChange?.(false);

      await this.setMode(this.mode);
      const presetKey = this.mode === 'campus' ? 'campus_aerial' : (this.mode === 'building' ? 'academic_cutaway' : `floor_${this.selectedFloor}`);
      const p = this.metadata?.camera_presets?.[presetKey];
      if (p) {
        this.camera.position.set(...p.position);
        this.controls.target.set(...p.target);
        this.camera.lookAt(this.controls.target);
      }
    } catch (err: any) {
      console.warn('[CampusThreeViewer] Metadata fetch error:', err);
      this.callbacks.onError?.(err);
      this.callbacks.onLoadingChange?.(false);
    }
  }

  // -------------------------------------------------------------
  // Mode Transitions: Campus -> Building -> Floor
  // -------------------------------------------------------------
  public async setMode(newMode: ViewerMode, buildingId?: string, floorId?: string): Promise<void> {
    this.mode = newMode;
    this.callbacks.onModeChange?.(newMode);

    if (newMode === 'campus') {
      this.selectedBuildingId = buildingId || null;
      this.selectedRoomId = null;
      await this.loadCampusOverview();
      if (buildingId) {
        this.flyToBuilding(buildingId);
      } else {
        this.tweenCameraToPreset('campus_aerial', 1.4);
      }
    } else if (newMode === 'building') {
      this.selectedBuildingId = buildingId || this.selectedBuildingId || 'academic';
      this.selectedRoomId = null;
      await this.loadAcademicCutaway();
      this.tweenCameraToPreset('academic_cutaway', 1.4);
    } else if (newMode === 'floor') {
      this.selectedBuildingId = buildingId || this.selectedBuildingId || 'academic';
      this.selectedFloor = floorId || this.selectedFloor || '0';
      await this.loadAcademicFloor(this.selectedFloor);
      this.tweenCameraToPreset(`floor_${this.selectedFloor}`, 1.2);
    }

    this.rebuildSafetyMarkers();
    if (this.selectedZoneId) {
      this.applyZoneHighlight(this.selectedZoneId);
    }
  }

  public setFloor(floorId: string): void {
    this.selectedFloor = floorId;
    if (this.mode === 'floor') {
      this.loadAcademicFloor(floorId);
      this.tweenCameraToPreset(`floor_${floorId}`, 1.2);
      this.rebuildSafetyMarkers();
      if (this.selectedZoneId) {
        this.applyZoneHighlight(this.selectedZoneId);
      }
    }
  }

  // -------------------------------------------------------------
  // Solenne-Style Glowing Floor Slab Highlighter
  // -------------------------------------------------------------
  public highlightFloorSlab(floorLevel: number | null, buildingId: string = 'academic'): void {
    while (this.slabGroup.children.length > 0) {
      this.slabGroup.remove(this.slabGroup.children[0]);
    }
    // Strictly only display floor slab volume on campus exterior aerial mode!
    if (floorLevel === null || this.mode !== 'campus') return;

    const bldg = this.metadata?.buildings.find((b) => b.id === buildingId);
    const [bx, by, bz] = bldg ? bldg.center : [-16, 0, 2];
    const width = bldg?.bounds?.width || 32;
    const depth = bldg?.bounds?.depth || 26;
    const slabY = by + (floorLevel * 4.2) + 2.1;

    // Glowing translucent volume
    const geo = new THREE.BoxGeometry(width + 0.8, 3.8, depth + 0.8);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xF59E0B, // Golden amber glow matching reference
      transparent: true,
      opacity: 0.22,
    });
    const slab = new THREE.Mesh(geo, mat);
    slab.position.set(bx, slabY, bz);

    // Clean perimeter border without diagonal cross rails
    const wireGeo = new THREE.EdgesGeometry(geo);
    const wireMat = new THREE.LineBasicMaterial({
      color: 0xFBBF24,
      linewidth: 2,
      transparent: true,
      opacity: 0.85,
    });
    const wire = new THREE.LineSegments(wireGeo, wireMat);
    wire.position.set(bx, slabY, bz);

    this.slabGroup.add(slab, wire);
  }

  // -------------------------------------------------------------
  // Screen Coordinate Projector for Floating Hotspot Cards
  // -------------------------------------------------------------
  public getScreenCoordinates(worldPos: THREE.Vector3): { x: number; y: number; visible: boolean } {
    if (!this.container || !this.renderer) return { x: -999, y: -999, visible: false };
    const v = worldPos.clone().project(this.camera);
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    const x = ((v.x + 1) * width) / 2;
    const y = ((-v.y + 1) * height) / 2;
    const visible = v.z < 1.0 && x >= 0 && x <= width && y >= 0 && y <= height;
    return { x, y, visible };
  }

  // -------------------------------------------------------------
  // Automated Cinematic Tour Sequence
  // -------------------------------------------------------------
  public startCinematicTour(onStepChange?: (stepName: string) => void): void {
    this.stopCinematicTour();
    const tourSequence = [
      { mode: 'campus', bldg: 'academic', label: 'Academic & AI Computing Center' },
      { mode: 'building', bldg: 'academic', label: '3D Stacked Cutaway' },
      { mode: 'floor', bldg: 'academic', floor: '1', label: 'Level 01: AI Vision Lab' },
      { mode: 'floor', bldg: 'academic', floor: '2', label: 'Level 02: Neural Lab & Senate' },
      { mode: 'campus', bldg: 'innovation', label: 'AI Innovation Research Hub' },
      { mode: 'campus', bldg: 'engineering', label: 'Engineering & Robotics Hall' },
      { mode: 'campus', bldg: null, label: 'Campus Aerial Overview' }
    ];

    this.tourStep = 0;
    const runNext = async () => {
      const current = tourSequence[this.tourStep];
      onStepChange?.(current.label);
      if (current.mode === 'campus') {
        if (current.bldg) {
          await this.flyToBuilding(current.bldg);
        } else {
          await this.setMode('campus');
        }
      } else if (current.mode === 'building') {
        await this.setMode('building');
      } else if (current.mode === 'floor') {
        await this.setMode('floor', 'academic', current.floor);
      }
      this.tourStep = (this.tourStep + 1) % tourSequence.length;
    };

    runNext();
    this.tourInterval = setInterval(runNext, 5000);
  }

  public stopCinematicTour(): void {
    if (this.tourInterval) {
      clearInterval(this.tourInterval);
      this.tourInterval = null;
    }
  }

  // -------------------------------------------------------------
  // GLB Model Loading & Caching Pipeline
  // -------------------------------------------------------------
  private async loadGLB(filename: string): Promise<THREE.Group> {
    const url = `${this.assetBasePath}/${filename}`;
    if (this.modelCache.has(url)) {
      return this.modelCache.get(url)!.clone();
    }

    this.callbacks.onLoadingChange?.(true, `Loading 3D asset: ${filename}...`);

    return new Promise((resolve, reject) => {
      this.loader.load(
        url,
        (gltf) => {
          const model = gltf.scene;
          model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          this.modelCache.set(url, model);
          this.callbacks.onLoadingChange?.(false);
          resolve(model.clone());
        },
        undefined,
        (err) => {
          this.callbacks.onLoadingChange?.(false);
          this.callbacks.onError?.(new Error(`Failed to load 3D model ${filename}`));
          reject(err);
        }
      );
    });
  }

  private clearActiveModel(): void {
    while (this.activeModelGroup.children.length > 0) {
      const child = this.activeModelGroup.children[0];
      this.activeModelGroup.remove(child);
    }
    this.clearHighlight();
    while (this.slabGroup.children.length > 0) {
      this.slabGroup.remove(this.slabGroup.children[0]);
    }
  }

  private async loadCampusOverview(): Promise<void> {
    this.clearActiveModel();
    try {
      const model = await this.loadGLB('campus_overview.glb');
      this.activeModelGroup.add(model);
    } catch (e) {
      console.error('[CampusThreeViewer] Campus model failed to load:', e);
    }
  }

  private async loadAcademicCutaway(): Promise<void> {
    this.clearActiveModel();
    try {
      const model = await this.loadGLB('academic_building_cutaway.glb');
      this.activeModelGroup.add(model);
    } catch (e) {
      console.error('[CampusThreeViewer] Building cutaway model failed to load:', e);
    }
  }

  private async loadAcademicFloor(floorNumber: string): Promise<void> {
    this.clearActiveModel();
    try {
      const filename = `academic_floor_${floorNumber}.glb`;
      const model = await this.loadGLB(filename);
      this.activeModelGroup.add(model);
    } catch (e) {
      console.error('[CampusThreeViewer] Floor model failed to load:', e);
    }
  }

  public async flyToBuilding(buildingId: string): Promise<void> {
    if (this.mode !== 'campus') {
      await this.loadCampusOverview();
      this.mode = 'campus';
      this.callbacks.onModeChange?.('campus');
    }

    this.selectedBuildingId = buildingId;
    const bldg = this.metadata?.buildings.find((b) => b.id === buildingId);
    if (!bldg) return;

    this.callbacks.onSelectBuilding?.(bldg);
    this.highlightBuildingMesh(buildingId);

    const presetKey = `${buildingId}_block`;
    if (this.metadata?.camera_presets && this.metadata.camera_presets[presetKey]) {
      const p = this.metadata.camera_presets[presetKey];
      this.tweenCamera(
        new THREE.Vector3(...p.position),
        new THREE.Vector3(...p.target),
        1.5,
        18
      );
    } else {
      const [bx, by, bz] = bldg.center;
      const target = new THREE.Vector3(bx, by + 4, bz);
      const camPos = new THREE.Vector3(bx + 32, by + 28, bz + 36);
      this.tweenCamera(camPos, target, 1.5, 20);
    }
  }

  public setZoneFilter(zoneId: string | null): void {
    this.selectedZoneId = zoneId;
    this.applyZoneHighlight(zoneId);
  }

  // -------------------------------------------------------------
  // Camera Inversion / 180° Reverse View
  // -------------------------------------------------------------
  public reverseCameraAngle(duration: number = 1.0): void {
    const target = this.controls.target.clone();
    const offset = this.camera.position.clone().sub(target);
    // Invert horizontal direction (X and Z) while preserving elevation Y and distance
    const reversedPos = new THREE.Vector3(target.x - offset.x, this.camera.position.y, target.z - offset.z);
    this.tweenCamera(reversedPos, target, duration, 2);
  }

  // -------------------------------------------------------------
  // Dynamic Room Disruption State Toggle / Reversal (Room 204)
  // -------------------------------------------------------------
  public toggleRoomDisruption(roomId: string = 'ROOM_ACAD_204', forceState?: boolean): boolean {
    const room = this.metadata?.rooms?.find((r) => r.id === roomId);
    if (!room) return false;

    const newState = forceState !== undefined ? forceState : !room.disrupted;
    room.disrupted = newState;
    room.power_status = newState ? 'OUTAGE' : 'NORMAL';
    room.hvac_status = newState ? 'DEGRADED' : 'NORMAL';
    room.temperature_c = newState ? 24.6 : 21.0;

    // Dynamically update the 3D meshes in activeModelGroup
    const activeColor = newState ? 0xEF4444 : 0x10B981; // Red if disrupted, Emerald if restored
    this.activeModelGroup.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.name === `GLOW_${roomId}` || mesh.name === roomId) {
          if (mesh.material && !Array.isArray(mesh.material)) {
            (mesh.material as THREE.MeshBasicMaterial).color?.setHex(activeColor);
          }
        }
        if (mesh.name === 'SCREEN_DISRUPTED_204' || mesh.name === 'SCREEN_NOMINAL') {
          // If restored, illuminate the screen cyan/blue!
          if (mesh.material && !Array.isArray(mesh.material)) {
            (mesh.material as THREE.MeshBasicMaterial).color?.setHex(newState ? 0x0F172A : 0x06B6D4);
          }
        }
        if (mesh.name === 'LED_DISRUPTED_204') {
          if (mesh.material && !Array.isArray(mesh.material)) {
            (mesh.material as THREE.MeshBasicMaterial).color?.setHex(newState ? 0xEF4444 : 0x10B981);
          }
        }
      }
    });

    if (this.selectedZoneId) {
      this.applyZoneHighlight(this.selectedZoneId);
    }

    return newState;
  }

  private applyZoneHighlight(zoneId: string | null): void {
    while (this.zoneGroup.children.length > 0) {
      this.zoneGroup.remove(this.zoneGroup.children[0]);
    }

    if (!zoneId || !this.metadata?.rooms) return;

    const targetRooms = this.metadata.rooms.filter((r) => r.zone === zoneId);
    if (targetRooms.length === 0) return;

    const zoneMeta = this.metadata.zones?.find((z) => z.id === zoneId);
    let colorHex = zoneMeta?.color ? parseInt(zoneMeta.color.replace('#', '0x'), 16) : 0x06B6D4;

    // If INCIDENT zone has been restored/reversed to nominal, use emerald green!
    if (zoneId === 'INCIDENT') {
      const rm204 = this.metadata.rooms.find((r) => r.id === 'ROOM_ACAD_204');
      if (rm204 && !rm204.disrupted && rm204.power_status === 'NORMAL') {
        colorHex = 0x10B981;
      }
    }

    this.activeModelGroup.traverse((child) => {
      if ((child as THREE.Mesh).isMesh && child.name && child.name.startsWith('ROOM_')) {
        const isTarget = targetRooms.some((r) => r.id === child.name);
        if (isTarget) {
          const mesh = child as THREE.Mesh;
          // Clean 4-edge floor boundary outline (grounded, no diagonal cross-rails)
          const wireGeo = new THREE.EdgesGeometry(mesh.geometry);
          const wireMat = new THREE.LineBasicMaterial({
            color: colorHex,
            linewidth: 2,
            transparent: true,
            opacity: 0.95
          });
          const wire = new THREE.LineSegments(wireGeo, wireMat);
          wire.position.copy(mesh.getWorldPosition(new THREE.Vector3()));
          wire.position.y += 0.02; // Grounded right along the floor surface
          wire.quaternion.copy(mesh.getWorldQuaternion(new THREE.Quaternion()));
          wire.scale.copy(mesh.getWorldScale(new THREE.Vector3()));

          // Soft translucent ground glow plane
          const fillMat = new THREE.MeshBasicMaterial({
            color: colorHex,
            transparent: true,
            opacity: 0.20,
            depthWrite: false
          });
          const fillMesh = new THREE.Mesh(mesh.geometry.clone(), fillMat);
          fillMesh.position.copy(wire.position);
          fillMesh.quaternion.copy(wire.quaternion);
          fillMesh.scale.copy(wire.scale);

          this.zoneGroup.add(wire, fillMesh);
        }
      }
    });
  }

  public setSafetyAssetsVisible(visible: boolean, filter: string = 'all'): void {
    this.showSafetyAssets = visible;
    this.assetFilter = filter;
    this.markerGroup.visible = visible;
    this.rebuildSafetyMarkers();
  }

  private rebuildSafetyMarkers(): void {
    while (this.markerGroup.children.length > 0) {
      this.markerGroup.remove(this.markerGroup.children[0]);
    }

    if (!this.showSafetyAssets || !this.metadata?.safety_assets) return;

    const filtered = this.metadata.safety_assets.filter((a) => {
      if (this.mode === 'floor' && a.floor !== this.selectedFloor) return false;
      if (this.assetFilter !== 'all' && a.type !== this.assetFilter) return false;
      return true;
    });

    filtered.forEach((asset) => {
      const pin = this.createAssetPin(asset);
      this.markerGroup.add(pin);
    });
  }

  private createAssetPin(asset: SafetyAssetRecord): THREE.Group {
    const grp = new THREE.Group();
    // In floor mode, all floor meshes are at ground level y = 0. Pin sits at y = 0.4 on floor!
    const posY = this.mode === 'floor' ? 0.4 : asset.position[1];
    grp.position.set(asset.position[0], posY, asset.position[2]);
    grp.name = `MARKER_${asset.id}`;
    grp.userData = { isAssetMarker: true, asset };

    let pinColor = 0x38BDF8;
    if (asset.type === 'fire_extinguisher') pinColor = 0xEF4444;
    else if (asset.type === 'aed') pinColor = 0xEC4899;

    const beaconGeo = new THREE.SphereGeometry(0.35, 16, 16);
    const beaconMat = new THREE.MeshStandardMaterial({
      color: pinColor,
      emissive: pinColor,
      emissiveIntensity: 0.7,
      roughness: 0.2
    });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.y = 0.5;

    const stemGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.5, 8);
    const stemMat = new THREE.MeshBasicMaterial({ color: 0xF8FAFC });
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.y = 0.25;

    grp.add(beacon, stem);
    return grp;
  }

  private bindEvents(): void {
    const dom = this.renderer.domElement;
    dom.addEventListener('pointermove', this.onPointerMove.bind(this));
    dom.addEventListener('click', this.onPointerClick.bind(this));
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  private onPointerMove(e: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private onPointerClick(e: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    if (this.showSafetyAssets) {
      const markerHits = this.raycaster.intersectObjects(this.markerGroup.children, true);
      if (markerHits.length > 0) {
        let root = markerHits[0].object;
        while (root.parent && root.parent !== this.markerGroup) {
          root = root.parent;
        }
        if (root.userData?.asset) {
          this.callbacks.onSelectAsset?.(root.userData.asset);
          return;
        }
      }
    }

    const hits = this.raycaster.intersectObjects(this.activeModelGroup.children, true);
    if (hits.length === 0) return;

    if (this.mode === 'campus') {
      let bldgHit = hits.find((h) => {
        let cur: THREE.Object3D | null = h.object;
        while (cur && cur !== this.activeModelGroup) {
          if (cur.userData?.buildingId) return true;
          cur = cur.parent;
        }
        return false;
      });

      if (bldgHit) {
        let cur: THREE.Object3D | null = bldgHit.object;
        let bldgId: string | null = null;
        while (cur && cur !== this.activeModelGroup) {
          if (cur.userData?.buildingId) {
            bldgId = cur.userData.buildingId;
            break;
          }
          cur = cur.parent;
        }

        if (bldgId) {
          this.flyToBuilding(bldgId);
        }
      }
    } else if (this.mode === 'floor' || this.mode === 'building') {
      const roomHit = hits.find((h) => h.object.name && h.object.name.startsWith('ROOM_'));
      if (roomHit) {
        const roomId = roomHit.object.name;
        this.selectedRoomId = roomId;
        const room = this.metadata?.rooms.find((r) => r.id === roomId) || null;
        this.callbacks.onSelectRoom?.(room);
        this.highlightObject(roomHit.object as THREE.Mesh, 0x06B6D4);

        if (room?.camera_focus) {
          this.focusRoomCamera(room.camera_focus);
        }
      }
    }
  }

  public highlightBuildingMesh(buildingId: string): void {
    while (this.highlightGroup.children.length > 0) {
      this.highlightGroup.remove(this.highlightGroup.children[0]);
    }

    this.activeModelGroup.traverse((child) => {
      let cur: THREE.Object3D | null = child;
      while (cur && cur !== this.activeModelGroup) {
        if (cur.userData?.buildingId === buildingId) {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            const wireGeo = new THREE.EdgesGeometry(mesh.geometry);
            const wireMat = new THREE.LineBasicMaterial({
              color: 0x06B6D4,
              linewidth: 2,
              transparent: true,
              opacity: 0.85
            });
            const wire = new THREE.LineSegments(wireGeo, wireMat);
            wire.position.copy(mesh.getWorldPosition(new THREE.Vector3()));
            wire.quaternion.copy(mesh.getWorldQuaternion(new THREE.Quaternion()));
            wire.scale.copy(mesh.getWorldScale(new THREE.Vector3()));
            this.highlightGroup.add(wire);
          }
          break;
        }
        cur = cur.parent;
      }
    });
  }

  public highlightObject(mesh: THREE.Mesh, colorHex: number = 0x06B6D4): void {
    while (this.highlightGroup.children.length > 0) {
      this.highlightGroup.remove(this.highlightGroup.children[0]);
    }

    if (!mesh.geometry) return;

    // Clean boundary outline without diagonal cross rails
    const wireGeo = new THREE.EdgesGeometry(mesh.geometry);
    const wireMat = new THREE.LineBasicMaterial({ color: colorHex, linewidth: 2 });
    const wire = new THREE.LineSegments(wireGeo, wireMat);
    wire.position.copy(mesh.getWorldPosition(new THREE.Vector3()));
    wire.quaternion.copy(mesh.getWorldQuaternion(new THREE.Quaternion()));
    wire.scale.copy(mesh.getWorldScale(new THREE.Vector3()));

    this.highlightGroup.add(wire);
  }

  public highlightRoomById(roomId: string, colorHex: number = 0x06B6D4): void {
    this.activeModelGroup.traverse((child) => {
      if ((child as THREE.Mesh).isMesh && child.name === roomId) {
        this.highlightObject(child as THREE.Mesh, colorHex);
      }
    });
  }

  public clearHighlight(): void {
    while (this.highlightGroup.children.length > 0) {
      this.highlightGroup.remove(this.highlightGroup.children[0]);
    }
  }

  public tweenCamera(
    targetPos: THREE.Vector3,
    lookAtTarget: THREE.Vector3,
    duration: number = 1.3,
    arcHeight?: number
  ): void {
    this.camStartPos.copy(this.camera.position);
    this.camEndPos.copy(targetPos);
    this.targetStartPos.copy(this.controls.target);
    this.targetEndPos.copy(lookAtTarget);

    const horizDist = Math.hypot(targetPos.x - this.camera.position.x, targetPos.z - this.camera.position.z);
    this.tweenArcHeight = arcHeight !== undefined ? arcHeight : Math.min(Math.max(horizDist * 0.28, 8), 35);

    this.tweenProgress = 0;
    this.tweenDuration = Math.max(duration, 0.6);
    this.isTweening = true;
  }

  public tweenCameraToPreset(presetKey: string, duration: number = 1.3): void {
    if (!this.metadata?.camera_presets) return;
    const preset = this.metadata.camera_presets[presetKey];
    if (preset) {
      this.tweenCamera(
        new THREE.Vector3(...preset.position),
        new THREE.Vector3(...preset.target),
        duration
      );
    }
  }

  public focusRoomCamera(roomCenter: [number, number, number]): void {
    const targetY = this.mode === 'floor' ? 0.6 : roomCenter[1];
    const target = new THREE.Vector3(roomCenter[0], targetY, roomCenter[2]);
    const camPos = new THREE.Vector3(target.x + 6, targetY + 6.5, target.z + 8.5);
    this.tweenCamera(camPos, target, 1.1, 3);
  }

  private onWindowResize(): void {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (width === 0 || height === 0) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private animate(): void {
    this.animFrameId = requestAnimationFrame(this.animate);

    if (this.isTweening) {
      this.tweenProgress += 0.025 / this.tweenDuration;
      if (this.tweenProgress >= 1.0) {
        this.tweenProgress = 1.0;
        this.isTweening = false;
        this.camera.position.copy(this.camEndPos);
        this.controls.target.copy(this.targetEndPos);
      } else {
        const t = this.tweenProgress;
        const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

        this.camera.position.lerpVectors(this.camStartPos, this.camEndPos, ease);

        const arcElevation = Math.sin(Math.PI * t) * this.tweenArcHeight;
        this.camera.position.y += arcElevation;

        this.controls.target.lerpVectors(this.targetStartPos, this.targetEndPos, ease);
      }
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  public dispose(): void {
    this.stopCinematicTour();

    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    window.removeEventListener('resize', this.onWindowResize);
    const dom = this.renderer?.domElement;
    if (dom) {
      dom.removeEventListener('pointermove', this.onPointerMove);
      dom.removeEventListener('click', this.onPointerClick);
      if (dom.parentElement) {
        dom.parentElement.removeChild(dom);
      }
    }

    this.controls?.dispose();

    this.modelCache.forEach((group) => {
      group.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const m = obj as THREE.Mesh;
          m.geometry?.dispose();
          if (Array.isArray(m.material)) {
            m.material.forEach((mat) => mat.dispose());
          } else if (m.material) {
            m.material.dispose();
          }
        }
      });
    });
    this.modelCache.clear();

    this.renderer?.dispose();
    console.log('[CampusThreeViewer] Successfully disposed.');
  }
}
