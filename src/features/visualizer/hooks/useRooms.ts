import { useState, ChangeEvent } from "react";
import { Room } from "../../../types";

export const ROOM_PRESETS: { label: string; type: NonNullable<Room["type"]> }[] = [
  { label: "Hall (Empty)", type: "hall" },
  { label: "Bedroom (Empty)", type: "bedroom" },
  { label: "Kitchen (Empty)", type: "kitchen" },
  { label: "Exterior Wall", type: "exterior" }
];

interface UseRoomsDependencies {
  image: string | null;
  paintedAreas: { mask: Uint8Array, color: string }[];
  intensity: number;
  texturePreservation: number;
  ceilingBoundaryLine: number | null;
  setImage: (img: string | null) => void;
  setPaintedAreas: (areas: { mask: Uint8Array, color: string }[]) => void;
  setPaintHistory: (history: { mask: Uint8Array, color: string }[][]) => void;
  setIntensity: (i: number) => void;
  setTexturePreservation: (tp: number) => void;
  setCeilingBoundaryLine: (cb: number | null) => void;
  setZoom: (z: number) => void;
}

export function useRooms(deps: UseRoomsDependencies) {
  const {
    image,
    paintedAreas,
    intensity,
    texturePreservation,
    ceilingBoundaryLine,
    setImage,
    setPaintedAreas,
    setPaintHistory,
    setIntensity,
    setTexturePreservation,
    setCeilingBoundaryLine,
    setZoom
  } = deps;

  const [rooms, setRooms] = useState<Room[]>([
    {
      id: "living-room",
      name: "Living Room",
      type: "hall",
      image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=1200",
      paintedAreas: [],
      intensity: 85,
      texturePreservation: 50
    },
    {
      id: "bedroom",
      name: "Master Bedroom",
      type: "bedroom",
      image: "https://images.unsplash.com/photo-1616594111350-475224f24af2?auto=format&fit=crop&q=80&w=1200",
      paintedAreas: [],
      intensity: 85,
      texturePreservation: 50
    }
  ]);
  const [activeRoomId, setActiveRoomId] = useState<string>("living-room");

  const syncCurrentRoom = () => {
    setRooms(prev => prev.map(r => r.id === activeRoomId ? {
      ...r,
      image: image || r.image,
      paintedAreas: [...paintedAreas],
      intensity,
      texturePreservation,
      ceilingBoundaryLine
    } : r));
  };

  const getRoomsSnapshot = (currentRooms: Room[] = rooms) => {
    return currentRooms.map(r => r.id === activeRoomId ? {
      ...r,
      image: image || r.image,
      paintedAreas: [...paintedAreas],
      intensity,
      texturePreservation,
      ceilingBoundaryLine
    } : r);
  };

  const updateActiveRoomMeta = (updates: Partial<Pick<Room, "name" | "type">>) => {
    setRooms(prev => prev.map(r => r.id === activeRoomId ? { ...r, ...updates } : r));
  };

  const handleSwitchRoom = (roomId: string, currentRooms?: Room[]) => {
    const list = currentRooms || rooms;
    
    // First, sync current state to the rooms list
    setRooms(prev => prev.map(r => r.id === activeRoomId ? {
      ...r,
      image: image || r.image,
      paintedAreas: [...paintedAreas],
      intensity,
      texturePreservation,
      ceilingBoundaryLine
    } : r));

    // Then load the new room
    const targetRoom = list.find(r => r.id === roomId);
    if (targetRoom) {
      setActiveRoomId(roomId);
      setImage(targetRoom.image);
      setPaintedAreas([...targetRoom.paintedAreas]);
      setPaintHistory([]);
      setIntensity(targetRoom.intensity);
      setTexturePreservation(targetRoom.texturePreservation);
      setCeilingBoundaryLine(targetRoom.ceilingBoundaryLine ?? null);
      setZoom(1);
    }
  };

  const handleAddRoom = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newRooms: Room[] = [];
    let processed = 0;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const id = Math.random().toString(36).substr(2, 9);
        const preset = ROOM_PRESETS[Math.min(rooms.length + processed, ROOM_PRESETS.length - 1)];
        const nameMap: Record<number, string> = { 0: "Exterior Elevation", 1: "Hall", 2: "Kitchen", 3: "Bedroom 1", 4: "Bedroom 2" };

        newRooms.push({
          id,
          name: nameMap[rooms.length + processed] || "Other Room",
          type: preset.type,
          image: event.target?.result as string,
          paintedAreas: [],
          intensity: 85,
          texturePreservation: 50
        });

        processed++;
        if (processed === files.length) {
          // Update the full rooms list including current snapshot
          const snapshot = getRoomsSnapshot();
          const finalRooms = [...snapshot, ...newRooms];
          setRooms(finalRooms);
          
          // Switch to the first newly added room
          const firstNew = newRooms[0];
          setActiveRoomId(firstNew.id);
          setImage(firstNew.image);
          setPaintedAreas([]);
          setPaintHistory([]);
          setIntensity(85);
          setTexturePreservation(50);
          setCeilingBoundaryLine(null);
          setZoom(1);
        }
      };
      reader.readAsDataURL(file as unknown as Blob);
    });
  };

  const paintedRoomCount = rooms.filter(r => {
    if (r.id === activeRoomId) return paintedAreas.length > 0;
    return r.paintedAreas.length > 0;
  }).length;

  return {
    rooms,
    setRooms,
    activeRoomId,
    setActiveRoomId,
    activeRoom: rooms.find(r => r.id === activeRoomId),
    syncCurrentRoom,
    getRoomsSnapshot,
    updateActiveRoomMeta,
    handleSwitchRoom,
    handleAddRoom,
    paintedRoomCount
  };
}
