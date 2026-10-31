/**
 * USAGE.tsx
 * Sample reference showing how to embed Campus3DReact or CampusThreeViewer
 * inside an existing campus management application.
 */

import React, { useState } from 'react';
import { Campus3DReact } from './Campus3DReact';
import { BuildingRecord, RoomRecord, SafetyAssetRecord } from './CampusThreeViewer';

export const CampusTwinIntegrationExample: React.FC = () => {
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingRecord | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<RoomRecord | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<SafetyAssetRecord | null>(null);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 relative">
        <Campus3DReact
          assetBasePath="/campus-models"
          initialMode="campus"
          onSelectBuilding={(bldg) => {
            console.log('Selected Building:', bldg);
            setSelectedBuilding(bldg);
          }}
          onSelectRoom={(rm) => {
            console.log('Selected Room:', rm);
            setSelectedRoom(rm);
          }}
          onSelectAsset={(ast) => {
            console.log('Selected Facility Asset:', ast);
            setSelectedAsset(ast);
          }}
        />
      </div>

      {/* Bridge into existing workflows */}
      {selectedRoom && (
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          <div>
            <h4 className="font-bold text-white">{selectedRoom.name}</h4>
            <p className="text-xs text-slate-400">Capacity: {selectedRoom.capacity} | Temp: {selectedRoom.temperature_c}°C</p>
          </div>
          <button 
            onClick={() => alert(`Navigating to booking for ${selectedRoom.name}`)}
            className="px-4 py-2 bg-cyan-500 text-slate-950 font-bold rounded-lg text-xs"
          >
            Book Room
          </button>
        </div>
      )}
    </div>
  );
};

