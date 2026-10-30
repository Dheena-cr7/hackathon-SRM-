# CAMPUSOPS — CAMPUS DIGITAL TWIN SPECIFICATION

## 1. Feature Definition & Visual Honesty
The CampusOps Campus Digital Twin is a **stylized 3D operational visualization** built using **React Three Fiber**, **Three.js**, and **@react-three/drei**.

### Visual Honesty Statement
> **This digital twin is a stylized spatial model based on campus geometry and persistent operational database records. It is not photographic satellite imagery or a detailed architectural BIM. Sensor and occupancy indicators reflect connected database state or clearly marked operational simulations.**

---

## 2. Geometry Pipeline & Coordinate Projection

```
OpenStreetMap (Overpass API)
            │
            ▼ (Offline Preparation)
   data/campus.geojson
   (ODbL 1.0 Attribution)
            │
            ▼ (Coordinate Normalization)
   Mercator Projection -> Centered Local Metres (0, 0, 0)
            │
            ▼ (Procedural Extrusion)
   Three.js ExtrudeGeometry + Instanced Meshes
            │
            ▼ (Operational State Bindings)
   Real-Time Status Glow (Normal, Warning, Critical)
```

### 2.1 Spatial Reference System (SRS)
- Geographic coordinates in `data/campus.geojson` are in WGS84 (`EPSG:4326`).
- A lightweight coordinate converter projects latitude and longitude into local Cartesian meters $(X, Z)$ relative to the campus centroid.
- $Y$ represents height above ground level (calculated as `floors * floor_height_meters`).

---

## 3. Procedural Scene Generation

### 3.1 Terrain & Infrastructure
- **Ground Plane:** Textured matte terrain with campus perimeter.
- **Pedestrian Walkways & Roads:** Projected planar ribbons connecting building footprints.
- **Vegetation & Lighting:** Instanced trees (`InstancedMesh`) and campus lamp posts positioned along pedestrian vectors to maximize rendering performance.

### 3.2 Stylized Building Extrusions
- Building shapes are extruded vertically from the GeoJSON polygon coordinates.
- Architectural roofs and subtle window banding textures are generated procedurally without large texture downloads.
- Shading: Ambient light, soft directional sunlight with shadow maps, and subtle edge outlines.
- Day and night lighting modes toggled via the HUD.

### 3.3 Operational Status Shading & Alert Glow

| Operational Status | Hex Color Code | Visual Presentation | Operational Condition |
| :--- | :--- | :--- | :--- |
| **Normal** | `#3B82F6` (Cool Blue) | Subtle metallic sheen | No active critical incidents; standard operations. |
| **Maintenance** | `#F59E0B` (Amber) | Pulsing warm outline | Active scheduled maintenance or minor work orders. |
| **Active Incident** | `#EF4444` (Coral Red) | Warning glow / pulse | High-priority defect or disrupted classroom equipment. |
| **Critical Disruption**| `#DC2626` (Crimson) | Alert beacon marker | Structural hazard, electrical blackout, or exam relocation. |

---

## 4. Real-Time HUD & Interactive Controls
- **Camera Orbit & Zoom:** Smooth OrbitControls with constrained azimuth and inclination angles.
- **Building Selection:** Clicking any building opens a slide-over HUD panel displaying:
  - Building Name, Code, and Total Floors
  - Departments housed within the building
  - Active incidents and assigned technicians
  - Room disruption count and upcoming booking schedule
- **Incident Markers:** 3D floating pins positioned over affected rooms or rooftops. Clicking a marker navigates directly to the incident's live detail record.
- **Floor-Exploded View:** Selecting a building allows users to "explode" floors vertically with a slider, revealing simplified interior room boxes, status badges, and asset locations.

---

## 5. Performance Engineering & Benchmarks
- **Target Framerate:** 30+ FPS on standard integrated GPUs (e.g. Intel Iris Xe / AMD Radeon Vega).
- **Interactive Load Time:** < 5.0 seconds from initial page load.
- **Techniques:**
  - `InstancedMesh` for trees, streetlights, and markers to keep draw calls < 80.
  - Geometry reuse for repeated room layouts.
  - Level-of-Detail (LOD) culling for distant geometry.
  - Code-split and lazy-loaded via Next.js dynamic import (`ssr: false`).

---

## 6. Accessible 2D Graceful Fallback
When WebGL is unavailable, GPU hardware acceleration is disabled, or the user clicks "Low-Graphics 2D Mode":
- The 3D canvas is replaced with an interactive **SVG Campus Site Plan**.
- The 2D view retains all operational capabilities: building selection, color-coded status badges, incident overlays, and room lists.
- Full screen-reader and keyboard accessibility (WCAG 2.1 AA compliant).
