'use client';

import React from 'react';
import { Campus3DViewer, RoomTwinData } from './Campus3DViewer';

export interface CampusSceneProps {
  onSelectBuilding?: (building: any) => void;
  selectedBuildingId?: string | null;
  buildingStatusMap?: Record<string, string>;
  onRoomSelect?: (room: RoomTwinData) => void;
  disruptionTriggered?: boolean;
}

/**
 * CampusScene — Upgraded 3D Spatial Digital Twin
 * Powered by high-fidelity Three.js GLB cutaways, cinematic drone flyovers,
 * multi-level furnished floor slabs, and interactive room inspection.
 */
export default function CampusScene({
  onSelectBuilding,
  selectedBuildingId,
  buildingStatusMap = {},
  onRoomSelect,
  disruptionTriggered,
}: CampusSceneProps) {
  const isDisrupted = disruptionTriggered || Object.values(buildingStatusMap).some(s => s !== 'normal');

  return (
    <div className="relative w-full h-[740px] rounded-2xl overflow-hidden bg-[#070B14] border border-white/10 shadow-glaido-card">
      <Campus3DViewer
        onSelectBuilding={(bldg) => {
          if (onSelectBuilding) {
            onSelectBuilding({
              ...bldg,
              operational_status: bldg.status,
              active_incidents_count: bldg.id === 'academic' && isDisrupted ? 1 : 0
            });
          }
        }}
        onRoomSelect={(room) => {
          if (onRoomSelect) onRoomSelect(room);
          if (onSelectBuilding) {
            onSelectBuilding({
              ...room,
              name: room.room_number ? `Room ${room.room_number}` : room.room_type,
              code: room.room_number || room.id,
              status: room.has_active_outage ? 'disrupted' : 'normal',
              building_id: 'academic',
              total_floors: 3,
              active_incidents_count: room.has_active_outage ? 1 : 0,
            });
          }
        }}
        disruptionTriggered={isDisrupted}
      />
    </div>
  );
}

export { Campus3DViewer };
