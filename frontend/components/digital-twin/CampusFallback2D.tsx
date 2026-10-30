'use client';

import React from 'react';
import { CAMPUS_GEOJSON, CampusFeature } from '@/lib/campusGeojson';
import { Building2, ShieldAlert } from 'lucide-react';

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
  const minLon = 80.0415;
  const maxLon = 80.0465;
  const minLat = 12.8210;
  const maxLat = 12.8255;

  const svgWidth = 800;
  const svgHeight = 540;

  // Project geo coordinates to SVG coordinates
  const projectPoint = (lon: number, lat: number) => {
    const x = ((lon - minLon) / (maxLon - minLon)) * (svgWidth - 120) + 60;
    // Invert Y because SVG coordinates increase downwards
    const y = ((maxLat - lat) / (maxLat - minLat)) * (svgHeight - 120) + 60;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  };

  return (
    <div className="relative w-full h-[540px] rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl p-4 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700 text-[11px] text-slate-300 font-mono flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-blue-400" />
          <span>Accessible 2D SVG Site Plan</span>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">
          Click any facility to inspect
        </span>
      </div>

      <div className="flex-1 w-full h-full relative">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full"
          role="img"
          aria-label="Campus 2D Map of SRM Kattankulathur"
        >
          {/* Subtle Ground Grid Lines */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Building Polygons */}
          {CAMPUS_GEOJSON.features.map((feature: CampusFeature) => {
            const coords = feature.geometry.coordinates[0];
            const pointsStr = coords.map(([lon, lat]) => projectPoint(lon, lat)).join(' ');

            const bldId = feature.properties.building_id;
            const currentStatus = buildingStatusMap[bldId] || feature.properties.operational_status;
            const isSelected = selectedBuildingId === bldId;

            let fillColor = '#0284c7'; // default blue
            let strokeColor = '#38bdf8';

            if (currentStatus === 'maintenance' || currentStatus === 'disrupted') {
              fillColor = '#d97706';
              strokeColor = '#f59e0b';
            } else if (currentStatus === 'closed') {
              fillColor = '#dc2626';
              strokeColor = '#ef4444';
            }

            // Calculate label center point
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
                onClick={() => onSelectBuilding({ ...feature.properties, feature })}
                className="cursor-pointer group"
              >
                <polygon
                  points={pointsStr}
                  fill={fillColor}
                  fillOpacity={isSelected ? 0.9 : 0.65}
                  stroke={isSelected ? '#ffffff' : strokeColor}
                  strokeWidth={isSelected ? 3 : 1.5}
                  className="transition-all duration-200 group-hover:fill-opacity-90"
                />
                <circle
                  cx={centerX}
                  cy={centerY - 10}
                  r="12"
                  fill="#0f172a"
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
                <text
                  x={centerX}
                  y={centerY + 16}
                  textAnchor="middle"
                  fill="#e2e8f0"
                  fontSize="10"
                  fontWeight="600"
                  className="pointer-events-none drop-shadow"
                >
                  {feature.properties.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="text-[10px] text-slate-500 font-mono text-right mt-1">
        Data © OpenStreetMap contributors (ODbL 1.0)
      </div>
    </div>
  );
}
