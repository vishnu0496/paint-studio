import { Room, Shade } from "../../../types";

export interface PackedMask {
  color: string;
  mask: string; // Base64 encoded bit-packed mask
  originalSize: number;
}

export interface PackedRoom extends Omit<Room, "paintedAreas"> {
  paintedAreas: PackedMask[];
}

export interface ProjectDataV2 {
  rooms: PackedRoom[];
  activeRoomId: string | null;
  projectPalette: Shade[];
}

export interface PersistenceOptions {
  getRoomsSnapshot: () => Room[];
  activeRoomId: string | null;
  projectPalette: Shade[];
  storageKey?: string;
}

export interface PersistenceResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

const DEFAULT_STORAGE_KEY = 'vishnu_paint_project_v2';

/**
 * Packs a Uint8Array mask into a bit-packed base64 string
 */
function packMask(mask: Uint8Array): { mask: string; originalSize: number } {
  const bitCount = mask.length;
  const byteCount = Math.ceil(bitCount / 8);
  const packed = new Uint8Array(byteCount);
  
  for (let i = 0; i < bitCount; i++) {
    if (mask[i] === 1) {
      packed[Math.floor(i / 8)] |= (1 << (i % 8));
    }
  }

  let binary = "";
  const CHUNK_SIZE = 0x4000;
  for (let i = 0; i < packed.length; i += CHUNK_SIZE) {
    const chunk = packed.slice(i, i + CHUNK_SIZE);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  
  return {
    mask: btoa(binary),
    originalSize: bitCount
  };
}

/**
 * Unpacks a bit-packed base64 string back into a Uint8Array mask
 */
function unpackMask(packedBase64: string, originalSize: number): Uint8Array {
  const binaryString = atob(packedBase64);
  const packed = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    packed[i] = binaryString.charCodeAt(i);
  }
  
  const mask = new Uint8Array(originalSize);
  for (let i = 0; i < originalSize; i++) {
    if ((packed[Math.floor(i / 8)] & (1 << (i % 8))) !== 0) {
      mask[i] = 1;
    }
  }
  return mask;
}

export interface LoadedProject {
  rooms: Room[];
  activeRoomId: string | null;
  projectPalette: Shade[];
}

export function useProjectPersistence(options: PersistenceOptions) {
  const { getRoomsSnapshot, activeRoomId, projectPalette, storageKey = DEFAULT_STORAGE_KEY } = options;

  const saveProject = (): PersistenceResult<void> => {
    try {
      const rooms = getRoomsSnapshot();
      if (rooms.length === 0) {
        return { ok: false, error: "No rooms to save." };
      }

      const roomsToSave: PackedRoom[] = rooms.map(room => ({
        ...room,
        paintedAreas: room.paintedAreas.map(area => {
          const { mask, originalSize } = packMask(area.mask);
          return { color: area.color, mask, originalSize };
        })
      }));

      const serialized = JSON.stringify({
        rooms: roomsToSave,
        activeRoomId,
        projectPalette
      });

      localStorage.setItem(storageKey, serialized);
      return { ok: true };
    } catch (e) {
      console.error("[Persistence] Save failed:", e);
      return { ok: false, error: "Failed to save. Project might be too large for local storage." };
    }
  };

  const loadProject = (): PersistenceResult<LoadedProject> => {
    const saved = localStorage.getItem(storageKey);
    if (!saved) {
      return { ok: false, error: "No saved project found." };
    }

    try {
      const data: ProjectDataV2 = JSON.parse(saved);
      
      const restoredRooms: Room[] = data.rooms.map(r => ({
        ...r,
        paintedAreas: r.paintedAreas.map(area => ({
          color: area.color,
          mask: unpackMask(area.mask, area.originalSize)
        }))
      }));

      return {
        ok: true,
        data: {
          rooms: restoredRooms,
          activeRoomId: data.activeRoomId,
          projectPalette: data.projectPalette
        }
      };
    } catch (e) {
      console.error("[Persistence] Load failed:", e);
      return { ok: false, error: "Load failed. The saved data might be corrupted." };
    }
  };

  return { saveProject, loadProject };
}
