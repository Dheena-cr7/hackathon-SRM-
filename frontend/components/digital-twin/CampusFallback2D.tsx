'use client';

import React, { useState } from 'react';
import { CAMPUS_GEOJSON, CampusFeature } from '@/lib/campusGeojson';
import { Building2, ShieldAlert, CheckCircle2, AlertTriangle, Layers, Info } from 'lucide-react';

interface CampusFallback2DProps {
  onSelectBuilding: (building: any) => void;
  selectedBuildingId?: string | null;
  buildingStatusMap?: Record<string, string>;
}

export default function CampusFallback2D({
  onSelectBuilding,
  selectedBuildingId,
  buildingStatusMap = {},
}: CampusFallback2DProps) {
  const [hoveredBuilding, setHoveredBuilding] = useState<string | null>(null);

  const minLon = 80.0415;
  const maxLon = 80.0465;
  const minLat = 12.8210;
  const maxLat = 12.8255;

  const svgWidth = 840;
  const svgHeight = 560;

  // Project geo coordinates to SVG coordinates
  const projectPoint = (lon: number, lat: number) => {
    const x = ((lon - minLon) / (maxLon - minLon)) * (svgWidth - 140) + 70;
    const y = ((maxLat - lat) / (maxLat - minLat)) * (svgHeight - 140) + 70;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  };

  return (
    <div className="relative w-full h-[560px] rounded-2xl overflow-hidden bg-[#0D0D0D] border border-white/[0.08] shadow-glaido-card p-4 flex flex-col justify-between">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2 z-10">
        <div className="bg-[#1A1A1A]/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/[0.10] text-xs text-white font-medium flex items-center space-x-2 shadow-glaido-card card-sheen">
          <Layers className="w-4 h-4 text-[#BFF549]" />
          <span className="font-bold">Accessible 2D Campus Site Plan</span>
          <span className="text-[10px] text-neutral-400 font-mono hidden sm:inline">• Vector SVG</span>
        </div>

        {/* Quick building select pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {CAMPUS_GEOJSON.features.map((feature) => {
            const bldId = feature.properties.building_id;
            const isSelected = selectedBuildingId === bldId;
            const status = buildingStatusMap[bldId] || feature.properties.operational_status;
            const isDisrupted = status !== 'normal';

            return (
              <button
                key={bldId}
                type="button"
                onClick={() => onSelectBuilding(feature.properties)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all focus-ring cursor-pointer flex items-center space-x-1.5 ${
                  isSelected
                    ? 'bg-[#BFF549] text-black shadow-glaido-button'
                    : 'bg-[#1A1A1A] hover:bg-[#242424] text-neutral-300 border border-white/[0.08]'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isDisrupted ? 'bg-[#FF8A1F]' : 'bg-[#BFF549]'}`} />
                <span>{feature.properties.code}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="flex-1 w-full h-full relative rounded-xl overflow-hidden bg-[#121212] border border-white/[0.08]">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full"
          role="img"
          aria-label="Campus 2D Map of Sri Krishna"
        >
          {/* Subtle Grid and Background */}
          <defs>
            <pattern id="siteGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1a2333" strokeWidth="0.8" />
            </pattern>
            {/* Campus Lawn Zones */}
            <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="#1b2a3f" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#siteGrid)" />

          {/* Campus Spine & Walkway Paths */}
          <line x1="420" y1="40" x2="420" y2="520" stroke="#1f2c42" strokeWidth="18" strokeLinecap="round" />
          <line x1="120" y1="280" x2="720" y2="280" stroke="#1f2c42" strokeWidth="16" strokeLinecap="round" />

          {/* Green Quad Grounds */}
          <rect x="440" y="240" width="200" height="120" rx="8" fill="#13241d" stroke="#1e3a2f" strokeWidth="1.5" />
          <text x="540" y="305" textAnchor="middle" fill="#34d399" fontSize="10" fontFamily="sans-serif" fontWeight="bold" opacity="0.6">
            CENTRAL CAMPUS QUAD
          </text>

          {/* Building Polygons */}
          {CAMPUS_GEOJSON.features.map((feature: CampusFeature) => {
            const coords = feature.geometry.coordinates[0];
            const pointsStr = coords.map(([lon, lat]) => projectPoint(lon, lat)).join(' ');

            const bldId = feature.properties.building_id;
            const currentStatus = buildingStatusMap[bldId] || feature.properties.operational_status;
            const isSelected = selectedBuildingId === bldId;
            const isHovered = hoveredBuilding === bldId;

            let fillColor = '#1e2d4a'; // Corporate slate navy
            let strokeColor = '#3b82f6';

            if (currentStatus === 'maintenance' || currentStatus === 'disrupted') {
              fillColor = '#854d0e';
              strokeColor = '#f59e0b';
            } else if (currentStatus === 'closed') {
              fillColor = '#991b1b';
              strokeColor = '#ef4444';
            }

            if (isSelected) {
              fillColor = '#2563eb';
              strokeColor = '#93c5fd';
            }

            // Centroid for label
            let sumX = 0, sumY = 0;
            coords.forEach(([lon, lat]) => {
              const [px, py] = projectPoint(lon, lat).split(',').map(Number);
              sumX += px;
              sumY += py;
            });
            const centerX = sumX / coords.length;
            const centerY = sumY / coords.length;

            return (
              <g
                key={bldId}
                onClick={() => onSelectBuilding(feature.properties)}
                onMouseEnter={() => setHoveredBuilding(bldId)}
                onMouseLeave={() => setHoveredBuilding(null)}
                className="cursor-pointer transition-all duration-150"
                tabIndex={0}
                role="button"
                aria-label={`Facility: ${feature.properties.name}, Status: ${currentStatus}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectBuilding(feature.properties);
                  }
                }}
              >
                {/* Building Footprint */}
                <polygon
                  points={pointsStr}
                  fill={fillColor}
                  fillOpacity={isSelected ? 0.95 : isHovered ? 0.85 : 0.75}
                  stroke={isSelected ? '#ffffff' : strokeColor}
                  strokeWidth={isSelected ? 3.5 : isHovered ? 2.5 : 1.5}
                  strokeDasharray={currentStatus === 'maintenance' ? '4 2' : 'none'}
                />

                {/* Building Code Badge */}
                <circle
                  cx={centerX}
                  cy={centerY - 10}
                  r="13"
                  fill="#0b111c"
                  stroke={strokeColor}
                  strokeWidth="1.5"
                />
                <text
                  x={centerX}
                  y={centerY - 6}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {feature.properties.code}
                </text>

                {/* Building Name */}
                <text
                  x={centerX}
                  y={centerY + 16}
                  textAnchor="middle"
                  fill={isSelected ? '#ffffff' : '#e2e8f0'}
                  fontSize="11"
                  fontWeight="600"
                  fontFamily="sans-serif"
                  className="pointer-events-none drop-shadow"
                >
                  {feature.properties.name}
                </text>

                {/* Status Dot */}
                <circle
                  cx={centerX + 22}
                  cy={centerY - 18}
                  r="4"
                  fill={currentStatus === 'normal' ? '#10b981' : '#f59e0b'}
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
        <span className="flex items-center space-x-1.5">
          <Info className="w-3.5 h-3.5 text-blue-400" />
          <span>Click any facility polygon or code pill to view real-time telemetry</span>
        </span>
        <span className="font-mono text-slate-500">Map Data © OpenStreetMap contributors (ODbL 1.0)</span>
      </div>
    </div>
  );
}
