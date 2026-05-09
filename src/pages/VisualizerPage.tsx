/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect, ChangeEvent, MouseEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FilesetResolver, InteractiveSegmenter } from "@mediapipe/tasks-vision";
import { JSW_PAINTS_COLLECTIONS, CONTACT_INFO } from "../constants";
import { Shade, Collection, Room } from "../types";
import VisualizerCanvas from "../components/VisualizerCanvas";
import { ShadePickerPanel } from '../components/ShadePickerPanel';
import { ProjectManager } from '../components/ProjectManager';
import { PaintCalculator } from '../components/PaintCalculator';

const BLOCKED_SURFACE_LABELS = new Set([
  "bed",
  "chair",
  "sofa",
  "table",
  "coffee table",
  "cushion",
  "pillow",
  "curtain",
  "door",
  "windowpane",
  "cabinet",
  "shelf",
  "plant",
  "floor",
  "rug",
  "carpet",
  "painting",
  "mirror",
  "light",
  "lamp",
  "person"
]);

const ROOM_PRESETS: { label: string; type: NonNullable<Room["type"]> }[] = [
  { label: "Hall (Empty)", type: "hall" },
  { label: "Bedroom (Empty)", type: "bedroom" },
  { label: "Kitchen (Empty)", type: "kitchen" },
  { label: "Exterior Wall", type: "exterior" }
];

export default function VisualizerPage() {
  const [selectedShade, setSelectedShade] = useState<Shade>(JSW_PAINTS_COLLECTIONS[0].shades[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showBefore, setShowBefore] = useState(false);
  const [activePanel, setActivePanel] = useState<'shades' | 'projects' | 'calculator'>('shades');
  const [projectPalette, setProjectPalette] = useState<Shade[]>([]);
  const [eyedropperActive, setEyedropperActive] = useState(false);
  const [toast, setToast] = useState<{ message: string; type?: 'info' | 'success' | 'error' } | null>(null);

  // Multi-room Project State
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

  // Active room editing state
  const [image, setImage] = useState<string | null>(rooms[0].image);
  const [paintedAreas, setPaintedAreas] = useState<{ mask: Uint8Array, color: string }[]>([]);
  const [paintHistory, setPaintHistory] = useState<{ mask: Uint8Array, color: string }[][]>([]);
  const [intensity, setIntensity] = useState(85);
  const [texturePreservation, setTexturePreservation] = useState(50);

  // Selection tools state
  const [selectionMode, setSelectionMode] = useState<"brush" | "magic" | "polygon">("brush");
  const [polygonPoints, setPolygonPoints] = useState<{ x: number; y: number }[]>([]);
  const [isEraser, setIsEraser] = useState(false);
  const [brushSize, setBrushSize] = useState(32);
  const [surfaceType, setSurfaceType] = useState<"wall" | "ceiling" | "general">("general");
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ x: number; y: number } | null>(null);
  const [lastCalculatorSummary, setLastCalculatorSummary] = useState('');
  const [photoStage, setPhotoStage] = useState<"idle" | "capturing" | "finished">("finished");
  const [refineMode, setRefineMode] = useState(false);
  const [magicSensitivity, setMagicSensitivity] = useState(45);

  // AI Worker State
  const workerRef = useRef<Worker | null>(null);
  const [aiStatus, setAiStatus] = useState<"idle" | "loading" | "ready" | "processing" | "error" | "complete">("idle");
  const [aiProgress, setAiProgress] = useState(0);
  const [aiMessage, setAiMessage] = useState("");
  const [aiMasks, setAiMasks] = useState<any[]>([]);
  const [aiUnavailable, setAiUnavailable] = useState(false);
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);
  const [canvasWidth, setCanvasWidth] = useState(0);
  const [canvasHeight, setCanvasHeight] = useState(0);
  const [ceilingBoundaryLine, setCeilingBoundaryLine] = useState<number | null>(null);
  const [lastProcessedImage, setLastProcessedImage] = useState<string | null>(null);
  const [currentBrushMask, setCurrentBrushMask] = useState<Uint8Array | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const interactiveSegmenterRef = useRef<InteractiveSegmenter | null>(null);
  const [interactiveStatus, setInteractiveStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;

    const loadInteractiveSegmenter = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        const segmenter = await InteractiveSegmenter.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-tasks/interactive_segmenter/ptm_512_hdt_ptm_woid.tflite"
          },
          outputConfidenceMasks: true,
          outputCategoryMask: false
        });

        if (cancelled) {
          segmenter.close();
          return;
        }

        interactiveSegmenterRef.current = segmenter;
        setInteractiveStatus("ready");
      } catch (error) {
        console.error("Interactive segmenter failed:", error);
        if (!cancelled) setInteractiveStatus("error");
      }
    };

    loadInteractiveSegmenter();

    return () => {
      cancelled = true;
      interactiveSegmenterRef.current?.close();
      interactiveSegmenterRef.current = null;
    };
  }, []);

  useEffect(() => {
        // Capability Check
        const memory = (navigator as any).deviceMemory;
        const connection = (navigator as any).connection;
        const isLowEnd = (memory && memory < 4) || (connection && (connection.effectiveType === '2g' || connection.effectiveType === '3g'));

        if (isLowEnd) {
          setAiUnavailable(true);
          setAiMessage('AI unavailable on this device — using Smart Fill instead.');
          return;
        }

        workerRef.current = new Worker(new URL('../workers/segmentationWorker.ts', import.meta.url), { type: 'module' });

        workerRef.current.onmessage = (event) => {
          const { status, message, progress, results, error } = event.data;
          console.log('[Main] Worker message:', status, message);

          if (status === 'progress') {
            if (progress !== undefined) setAiProgress(progress / 100);
            return;
          }

          setAiStatus(status);
          if (message) setAiMessage(message);

          if (status === 'complete' && results) {
            setAiMasks(results);
            setAiMessage('AI mapping complete!');
            setTimeout(() => setAiMessage(''), 3000);
          } else if (status === 'error') {
            setAiMessage(`AI Error: ${error}`);
            console.error('[Main] AI Error:', error);
          }
        };

        // Give the worker a moment to start before sending INIT
        const initTimeout = setTimeout(() => {
          console.log('[Main] Sending INIT to worker');
          workerRef.current?.postMessage({ type: 'INIT' });
        }, 500);

        // Fallback: If still idle after 5 seconds, try re-sending INIT once
        const retryTimeout = setTimeout(() => {
          setAiStatus(prev => {
            if (prev === 'idle') {
              console.log('[Main] AI still idle, retrying INIT...');
              workerRef.current?.postMessage({ type: 'INIT' });
            }
            return prev;
          });
        }, 5000);

        return () => {
          clearTimeout(initTimeout);
          clearTimeout(retryTimeout);
          workerRef.current?.terminate();
        };
      }, []);



      useEffect(() => {
        // Only trigger if we have an image, valid canvas dimensions, and AI is ready/finished
        if (image && canvasWidth > 0 && canvasHeight > 0 &&
          image !== lastProcessedImage &&
          (aiStatus === 'ready' || aiStatus === 'complete' || aiStatus === 'error')) {

          // Small timeout to ensure UI updates before heavy worker postMessage
          const timeoutId = setTimeout(() => {
            setLastProcessedImage(image);
            setAiStatus('processing');
            setAiMessage('AI is analyzing the room...');

            workerRef.current?.postMessage({
              type: 'SEGMENT',
              payload: {
                image,
                targetWidth: Math.floor(canvasWidth),
                targetHeight: Math.floor(canvasHeight)
              }
            });
            setAiMasks([]);
          }, 500);
          return () => clearTimeout(timeoutId);
        }
      }, [image, aiStatus, lastProcessedImage, canvasWidth, canvasHeight]);



      const allShades = JSW_PAINTS_COLLECTIONS[0].shades;

      const filteredShades = searchQuery.trim() === ""
        ? []
        : allShades.filter(s =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.jswCode.includes(searchQuery)
        ).slice(0, 5);

      const activeRoom = rooms.find(r => r.id === activeRoomId);
      const paintedRoomCount = rooms.filter(r => {
        if (r.id === activeRoomId) return paintedAreas.length > 0;
        return r.paintedAreas.length > 0;
      }).length;

      useEffect(() => {
        if (!image) {
          setLoadedImage(null);
          setCeilingBoundaryLine(null);
          return;
        }
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = image;
        img.onload = () => {
          setLoadedImage(img);
          // Reset boundary on new image
          setCeilingBoundaryLine(null);
        };
      }, [image]);

      useEffect(() => {
        if (loadedImage) {
          const maxWidth = 1200;
          const scale = Math.min(1, maxWidth / loadedImage.width);
          setCanvasWidth(loadedImage.width * scale);
          setCanvasHeight(loadedImage.height * scale);
        }
      }, [loadedImage]);

      // Sync active room changes to the rooms collection
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

      const updateActiveRoomMeta = (updates: Partial<Pick<Room, "name" | "type">>) => {
        setRooms(prev => prev.map(r => r.id === activeRoomId ? { ...r, ...updates } : r));
      };

      const getRoomsSnapshot = () => {
        return rooms.map(r => r.id === activeRoomId ? {
          ...r,
          image: image || r.image,
          paintedAreas: [...paintedAreas],
          intensity,
          texturePreservation,
          ceilingBoundaryLine
        } : r);
      };

      const getShadeForColor = (hex: string) => {
        return allShades.find(s => s.code.toLowerCase() === hex.toLowerCase());
      };

      const getProjectSummary = () => {
        const snapshot = getRoomsSnapshot();
        const usedRooms = snapshot
          .map(room => {
            const shades = room.paintedAreas
              .map(area => getShadeForColor(area.color) || { name: "Custom Color", jswCode: area.color.toUpperCase(), code: area.color })
              .filter((shade, index, arr) => arr.findIndex(s => s.code === shade.code) === index);

            return { room, shades };
          })
          .filter(item => item.shades.length > 0);

        const allUsedShades = usedRooms
          .flatMap(item => item.shades)
          .filter((shade, index, arr) => arr.findIndex(s => s.code === shade.code) === index);

        return { usedRooms, allUsedShades };
      };

      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
      };

      const findNearestJSWShade = (r: number, g: number, b: number) => {
        let minDistance = Infinity;
        let closestShade = JSW_PAINTS_COLLECTIONS[0].shades[0];

        JSW_PAINTS_COLLECTIONS.forEach(collection => {
          collection.shades.forEach(shade => {
            const shadeRgb = hexToRgb(shade.code);
            const distance = Math.sqrt(
              Math.pow(r - shadeRgb.r, 2) +
              Math.pow(g - shadeRgb.g, 2) +
              Math.pow(b - shadeRgb.b, 2)
            );
            if (distance < minDistance) {
              minDistance = distance;
              closestShade = shade;
            }
          });
        });
        return closestShade;
      };

      const handleSwitchRoom = (roomId: string) => {
        // First, save current work to the array
        syncCurrentRoom();

        // Then load the new room
        const targetRoom = rooms.find(r => r.id === roomId);
        if (targetRoom) {
          setActiveRoomId(roomId);
          setImage(targetRoom.image);
          setPaintedAreas([...targetRoom.paintedAreas]);
          setPaintHistory([]);
          setIntensity(targetRoom.intensity);
          setTexturePreservation(targetRoom.texturePreservation);
          setCeilingBoundaryLine(targetRoom.ceilingBoundaryLine || null);
          setZoom(1);
        }
      };

      const handleAddRoom = (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const newRooms: Room[] = [];
        let processed = 0;

        Array.from(files).forEach((file, index) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            const id = Math.random().toString(36).substr(2, 9);
            const preset = ROOM_PRESETS[Math.min(rooms.length + processed, ROOM_PRESETS.length - 1)];
            const nameMap: Record<number, string> = { 0: "Exterior Elevation", 1: "Hall", 2: "Kitchen", 3: "Bedroom 1", 4: "Bedroom 2" };

            newRooms.push({
              id,
              name: nameMap[rooms.length + processed] || `Room ${rooms.length + processed + 1}`,
              type: preset.type,
              image: event.target?.result as string,
              paintedAreas: [],
              intensity: 65,
              texturePreservation: 50,
              ceilingBoundaryLine: null
            });

            processed++;
            if (processed === files.length) {
              setRooms(prev => [...prev, ...newRooms]);
              // Switch directly to the first newly added room. The rooms state update
              // above is async, so handleSwitchRoom cannot see the new entry yet.
              if (newRooms.length > 0) {
                const firstNewRoom = newRooms[0];
                setActiveRoomId(firstNewRoom.id);
                setImage(firstNewRoom.image);
                setPaintedAreas([]);
                setPaintHistory([]);
                setIntensity(firstNewRoom.intensity);
                setTexturePreservation(firstNewRoom.texturePreservation);
                setCeilingBoundaryLine(firstNewRoom.ceilingBoundaryLine || null);
                setZoom(1);
              }
            }
          };
          reader.readAsDataURL(file as unknown as Blob);
        });
      };

      const currentRoomPalette = Array.from(new Set(paintedAreas.map(a => a.color)));
      const shadePalette = currentRoomPalette.map(hex => allShades.find(s => s.code === hex) || { name: "Custom Color", code: hex, jswCode: "0000" });

      const clonePaintedAreas = (areas: { mask: Uint8Array, color: string }[]) => {
        return areas.map(area => ({ color: area.color, mask: new Uint8Array(area.mask) }));
      };

      const maskHasPaint = (mask: Uint8Array) => {
        for (let i = 0; i < mask.length; i++) {
          if (mask[i] === 1) return true;
        }
        return false;
      };

      const getMaskCoverage = (mask: Uint8Array) => {
        let painted = 0;
        for (let i = 0; i < mask.length; i++) {
          if (mask[i] === 1) painted++;
        }
        return painted / mask.length;
      };

      const applyPaintedAreas = (nextAreas: { mask: Uint8Array, color: string }[]) => {
        setPaintHistory(prev => [...prev.slice(-19), clonePaintedAreas(paintedAreas)]);
        setPaintedAreas(nextAreas);
      };

      const mergeMask = (base: Uint8Array, addition: Uint8Array, subtract: boolean) => {
        const result = new Uint8Array(base.length);
        for (let i = 0; i < base.length; i++) {
          if (subtract) {
            result[i] = base[i] === 1 && addition[i] === 0 ? 1 : 0;
          } else {
            result[i] = base[i] === 1 || addition[i] === 1 ? 1 : 0;
          }
        }
        return result;
      };

      const updatePaintedAreas = (newMask: Uint8Array) => {
        if (isEraser) {
          const updated = paintedAreas
            .map(area => ({ ...area, mask: mergeMask(area.mask, newMask, true) }))
            .filter(area => maskHasPaint(area.mask));
          applyPaintedAreas(updated);
          return;
        }

        const existingAreaIdx = paintedAreas.findIndex(a => a.color === selectedShade.code);
        if (existingAreaIdx > -1) {
          const updated = clonePaintedAreas(paintedAreas);
          updated[existingAreaIdx].mask = mergeMask(updated[existingAreaIdx].mask, newMask, false);
          applyPaintedAreas(updated);
        } else {
          applyPaintedAreas([...clonePaintedAreas(paintedAreas), { mask: newMask, color: selectedShade.code }]);
        }
      };

      const areaToRgba = (hex: string, alpha: number) => {
        const rgb = hexToRgb(hex);
        return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
      };

      const drawLineOnMask = (mask: Uint8Array, x0: number, y0: number, x1: number, y1: number, radius: number, width: number, height: number) => {
        const distance = Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2));
        // Use a much smaller step (1px or radius/10) for perfect smoothness
        const stepSize = Math.max(1, radius / 8);
        const steps = Math.max(1, Math.ceil(distance / stepSize));

        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const curX = x0 + (x1 - x0) * t;
          const curY = y0 + (y1 - y0) * t;
          drawCircleOnMask(mask, curX, curY, radius, width, height);
        }
      };

      const drawCircleOnMask = (mask: Uint8Array, centerX: number, centerY: number, radius: number, width: number, height: number) => {
        const r2 = radius * radius;
        const startX = Math.max(0, Math.floor(centerX - radius));
        const endX = Math.min(width - 1, Math.ceil(centerX + radius));
        const startY = Math.max(0, Math.floor(centerY - radius));
        const endY = Math.min(height - 1, Math.ceil(centerY + radius));

        for (let y = startY; y <= endY; y++) {
          for (let x = startX; x <= endX; x++) {
            const dx = x - centerX;
            const dy = y - centerY;
            if (dx * dx + dy * dy <= r2) {
              mask[y * width + x] = 1;
            }
          }
        }
      };

      const handleFillPolygon = () => {
        if (polygonPoints.length < 3 || canvasWidth === 0 || canvasHeight === 0) {
          setPolygonPoints([]);
          return;
        }

        const width = canvasWidth;
        const height = canvasHeight;

        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = width;
        tempCanvas.height = height;
        const ctx = tempCanvas.getContext("2d")!;

        ctx.beginPath();
        ctx.moveTo(polygonPoints[0].x, polygonPoints[0].y);
        for (let i = 1; i < polygonPoints.length; i++) {
          ctx.lineTo(polygonPoints[i].x, polygonPoints[i].y);
        }
        ctx.closePath();
        ctx.fillStyle = "black";
        ctx.fill();

        const imageData = ctx.getImageData(0, 0, width, height).data;
        const newMask = new Uint8Array(width * height);
        for (let i = 0; i < width * height; i++) {
          if (imageData[i * 4 + 3] > 0) { // If alpha > 0
            newMask[i] = 1;
          }
        }

        updatePaintedAreas(newMask);
        setPolygonPoints([]);
      };

      const handleCompletePolygon = () => {
        if (polygonPoints.length < 3 || !loadedImage) return;
        
        const width = canvasWidth;
        const height = canvasHeight;
        const mask = new Uint8Array(width * height);
        
        // Use a temporary canvas to draw the filled polygon - 100% reliable
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const ctx = tempCanvas.getContext('2d');
        if (ctx) {
          ctx.beginPath();
          ctx.moveTo(polygonPoints[0].x, polygonPoints[0].y);
          for (let i = 1; i < polygonPoints.length; i++) {
            ctx.lineTo(polygonPoints[i].x, polygonPoints[i].y);
          }
          ctx.closePath();
          ctx.fill();
          
          const data = ctx.getImageData(0, 0, width, height).data;
          for (let i = 0; i < mask.length; i++) {
            if (data[i * 4 + 3] > 128) {
              mask[i] = 1;
            }
          }
        }
        
        updatePaintedAreas(mask);
        setPolygonPoints([]);
        setToast({ message: "Custom area applied!" });
        setTimeout(() => setToast(null), 2000);
      };

      const handleMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
        if (showBefore || !image) return;
        const canvas = e.currentTarget;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = Math.floor(((e.clientX - rect.left) / rect.width) * canvasWidth);
        const y = Math.floor(((e.clientY - rect.top) / rect.height) * canvasHeight);

        if (eyedropperActive && loadedImage) {
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = canvasWidth;
          tempCanvas.height = canvasHeight;
          const ctx = tempCanvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(loadedImage, 0, 0, canvasWidth, canvasHeight);
            const pixel = ctx.getImageData(x, y, 1, 1).data;
            const matchedShade = findNearestJSWShade(pixel[0], pixel[1], pixel[2]);
            handleSelectShade(matchedShade);
            setToast({ message: `Closest JSW match: ${matchedShade.name} · JSW ${matchedShade.jswCode}` });
            setTimeout(() => setToast(null), 3000);
            setEyedropperActive(false);
          }
          setIsDragging(false);
          return;
        }

        setIsDragging(true);
        setLastPoint({ x, y });

        if (selectionMode === "brush") {
          const mask = new Uint8Array(canvasWidth * canvasHeight);
          drawCircleOnMask(mask, x, y, brushSize / 2, canvasWidth, canvasHeight);
          setCurrentBrushMask(mask);
        } else if (selectionMode === "polygon") {
          setPolygonPoints(prev => [...prev, { x, y }]);
          // Keep dragging enabled for visual line following if needed, 
          // but for points we don't need the rectangle drag
          setIsDragging(false);
        } else if (selectionMode === "magic") {
          handleMagicWand(x, y);
          setIsDragging(false);
        } else {
          // Default to rectangle/drag mode
          setDragStart({ x, y });
          setDragCurrent({ x, y });
          setIsDragging(true);
        }
      };

      const handleFillGaps = () => {
        if (canvasWidth === 0 || canvasHeight === 0 || !loadedImage) return;
        if (paintedAreas.length === 0) return;

        const width = canvasWidth;
        const height = canvasHeight;

        // Find the currently active mask
        const activeMaskIdx = paintedAreas.findIndex(a => a.color === selectedShade.code);
        if (activeMaskIdx === -1) return;

        const baseMask = paintedAreas[activeMaskIdx].mask;
        const newMask = new Uint8Array(baseMask); // Copy

        // Stronger closing: fill small pinholes and one-pixel broken lines.
        for (let pass = 0; pass < 3; pass++) {
          const source = new Uint8Array(newMask);
          for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
              const idx = y * width + x;
              if (source[idx] === 1) continue;

              let paintedNeighbors = 0;
              for (let yy = -1; yy <= 1; yy++) {
                for (let xx = -1; xx <= 1; xx++) {
                  if (xx === 0 && yy === 0) continue;
                  if (source[(y + yy) * width + (x + xx)] === 1) paintedNeighbors++;
                }
              }

              const bridgesHorizontal = source[idx - 1] === 1 && source[idx + 1] === 1;
              const bridgesVertical = source[idx - width] === 1 && source[idx + width] === 1;
              if (paintedNeighbors >= 5 || bridgesHorizontal || bridgesVertical) {
                newMask[idx] = 1;
              }
            }
          }
        }

        const updatedAreas = clonePaintedAreas(paintedAreas);
        updatedAreas[activeMaskIdx] = { ...updatedAreas[activeMaskIdx], mask: newMask };
        applyPaintedAreas(updatedAreas);
      };

      const handlePaintAllWalls = async () => {
        if (rooms.length === 0) return;
        setIsProcessingAll(true);

        try {
          // Helper to process a single room image
          const processRoom = (room: Room): Promise<Room> => {
            return new Promise((resolve) => {
              const img = new Image();
              img.crossOrigin = "anonymous";
              img.src = room.image;
              img.onload = () => {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d")!;
                const maxWidth = 1200;
                const scale = Math.min(1, maxWidth / img.width);
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
                const width = canvas.width;
                const height = canvas.height;

                let boundary = room.ceilingBoundaryLine ?? null;
                if (boundary === null) {
                  const scanLimit = Math.floor(height * 0.40);
                  let bestLine = Math.floor(height * 0.15);
                  let maxScore = 0;
                  for (let y = 15; y < scanLimit; y++) {
                    let lineEdge = 0, lC = 0, lW = 0;
                    for (let x = Math.floor(width * 0.1); x < Math.floor(width * 0.9); x++) {
                      const idx = (y * width + x) * 4;
                      const upIdx = ((y - 5) * width + x) * 4;
                      const downIdx = ((y + 5) * width + x) * 4;
                      lineEdge += Math.abs((pixels[downIdx] * 0.299 + pixels[downIdx + 1] * 0.587 + pixels[downIdx + 2] * 0.114) - (pixels[upIdx] * 0.299 + pixels[upIdx + 1] * 0.587 + pixels[upIdx + 2] * 0.114));
                      lC += (pixels[upIdx] * 0.299 + pixels[upIdx + 1] * 0.587 + pixels[upIdx + 2] * 0.114);
                      lW += (pixels[downIdx] * 0.299 + pixels[downIdx + 1] * 0.587 + pixels[downIdx + 2] * 0.114);
                    }
                    const score = (lineEdge / (width * 0.8)) + ((Math.abs(lC - lW) / (width * 0.8)) * 1.5);
                    if (score > maxScore) { maxScore = score; bestLine = y; }
                  }
                  boundary = bestLine;
                }

                const newMask = new Uint8Array(width * height);
                const targetColor = selectedShade.code;

                // Seed color for furniture skip (sample a safe wall area)
                const seedX = Math.floor(width / 2);
                const seedY = Math.floor((boundary + height * 0.65) / 2);
                const sIdx = (seedY * width + seedX) * 4;
                const cr = pixels[sIdx], cg = pixels[sIdx + 1], cb = pixels[sIdx + 2];

                for (let y = 0; y < height; y++) {
                  for (let x = 0; x < width; x++) {
                    const idx = y * width + x;
                    if (y > boundary) {
                      const pIdx = idx * 4;
                      const r = pixels[pIdx], g = pixels[pIdx + 1], b = pixels[pIdx + 2];
                      if (y > height * 0.65) continue;
                      if (r > 235 && g > 235 && b > 235) continue;
                      if (y > height * 0.4) {
                        const dist = Math.abs(r - cr) + Math.abs(g - cg) + Math.abs(b - cb);
                        if (dist > 150) continue;
                      }
                      newMask[idx] = 1;
                    }
                  }
                }

                const existingIdx = room.paintedAreas.findIndex(a => a.color === targetColor);
                let updatedAreas = [...room.paintedAreas];
                if (existingIdx > -1) {
                  const base = updatedAreas[existingIdx].mask;
                  const merged = new Uint8Array(base.length);
                  for (let i = 0; i < base.length; i++) merged[i] = base[i] === 1 || newMask[i] === 1 ? 1 : 0;
                  updatedAreas[existingIdx] = { ...updatedAreas[existingIdx], mask: merged };
                } else {
                  updatedAreas.push({ mask: newMask, color: targetColor });
                }

                resolve({ ...room, paintedAreas: updatedAreas, ceilingBoundaryLine: boundary });
              };
              img.onerror = () => resolve(room);
            });
          };

          const updatedRooms = await Promise.all(rooms.map(room => processRoom(room)));
          setRooms(updatedRooms);

          // Update active room states too
          const current = updatedRooms.find(r => r.id === activeRoomId);
          if (current) {
            setPaintHistory(prev => [...prev.slice(-19), clonePaintedAreas(paintedAreas)]);
            setPaintedAreas(current.paintedAreas);
            setCeilingBoundaryLine(current.ceilingBoundaryLine || null);
          }
        } catch (err) {
          console.error("Bulk paint failed:", err);
        } finally {
          setIsProcessingAll(false);
        }
      };

      const fillPinholes = (mask: Uint8Array, width: number, height: number, passes = 2) => {
        let result = new Uint8Array(mask);
        for (let pass = 0; pass < passes; pass++) {
          const next = new Uint8Array(result);
          for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
              const idx = y * width + x;
              if (result[idx] === 1) continue;

              let neighbors = 0;
              for (let yy = -1; yy <= 1; yy++) {
                for (let xx = -1; xx <= 1; xx++) {
                  if (xx === 0 && yy === 0) continue;
                  if (result[(y + yy) * width + (x + xx)] === 1) neighbors++;
                }
              }
              if (neighbors >= 5) next[idx] = 1;
            }
          }
          result = next;
        }
        return result;
      };

      const removeSmallMaskIslands = (mask: Uint8Array, width: number, height: number, minPixels: number) => {
        const result = new Uint8Array(mask);
        const visited = new Uint8Array(mask.length);
        const queue = new Int32Array(mask.length);
        const component = new Int32Array(mask.length);
        const dirs = [-width, width, -1, 1];

        for (let i = 0; i < mask.length; i++) {
          if (mask[i] !== 1 || visited[i]) continue;

          let qHead = 0;
          let qTail = 0;
          let compSize = 0;
          queue[qTail++] = i;
          visited[i] = 1;

          while (qHead < qTail) {
            const idx = queue[qHead++];
            const x = idx % width;
            component[compSize++] = idx;

            for (const dir of dirs) {
              const nextIdx = idx + dir;
              if (nextIdx < 0 || nextIdx >= mask.length) continue;
              if (dir === -1 && x === 0) continue;
              if (dir === 1 && x === width - 1) continue;
              if (visited[nextIdx] || mask[nextIdx] !== 1) continue;

              visited[nextIdx] = 1;
              queue[qTail++] = nextIdx;
            }
          }

          if (compSize < minPixels) {
            for (let j = 0; j < compSize; j++) {
              result[component[j]] = 0;
            }
          }
        }

        return result;
      };

      const keepTopConnectedMask = (mask: Uint8Array, width: number, height: number) => {
        const result = new Uint8Array(mask.length);
        const visited = new Uint8Array(mask.length);
        const queue = new Int32Array(mask.length);
        const dirs = [-width, width, -1, 1];
        let qHead = 0;
        let qTail = 0;
        const seedRows = Math.max(2, Math.floor(height * 0.08));

        for (let y = 0; y < seedRows; y++) {
          for (let x = 0; x < width; x++) {
            const idx = y * width + x;
            if (mask[idx] === 1 && !visited[idx]) {
              visited[idx] = 1;
              queue[qTail++] = idx;
            }
          }
        }

        while (qHead < qTail) {
          const idx = queue[qHead++];
          const x = idx % width;
          result[idx] = 1;

          for (const dir of dirs) {
            const nextIdx = idx + dir;
            if (nextIdx < 0 || nextIdx >= mask.length) continue;
            if (dir === -1 && x === 0) continue;
            if (dir === 1 && x === width - 1) continue;
            if (visited[nextIdx] || mask[nextIdx] !== 1) continue;
            visited[nextIdx] = 1;
            queue[qTail++] = nextIdx;
          }
        }

        return result;
      };

      const removeCeilingDrips = (mask: Uint8Array, width: number, height: number, boundaryMap?: Int32Array) => {
        const result = new Uint8Array(mask);
        const maxRunWidth = Math.max(8, Math.floor(width * 0.018));

        for (let y = Math.floor(height * 0.16); y < Math.floor(height * 0.58); y++) {
          let x = 0;
          while (x < width) {
            const idx = y * width + x;
            if (result[idx] !== 1) {
              x++;
              continue;
            }

            const start = x;
            while (x < width && result[y * width + x] === 1) x++;
            const end = x - 1;
            const runWidth = end - start + 1;
            if (runWidth > maxRunWidth) continue;

            const mid = Math.floor((start + end) / 2);
            const boundary = boundaryMap ? boundaryMap[mid] + 10 : height * 0.28;
            if (y <= boundary) continue;

            let verticalDepth = 0;
            for (let yy = y; yy < Math.min(height, y + 80); yy++) {
              let rowPainted = 0;
              for (let xx = start; xx <= end; xx++) {
                if (result[yy * width + xx] === 1) rowPainted++;
              }
              if (rowPainted === 0) break;
              verticalDepth++;
            }

            if (verticalDepth > 14) {
              for (let yy = y; yy < Math.min(height, y + verticalDepth + 4); yy++) {
                for (let xx = Math.max(0, start - 2); xx <= Math.min(width - 1, end + 2); xx++) {
                  result[yy * width + xx] = 0;
                }
              }
            }
          }
        }

        return result;
      };

      const protectDetailedObjects = (mask: Uint8Array, width: number, height: number, label: "wall" | "ceiling") => {
        if (!loadedImage) return mask;

        const sourceCanvas = document.createElement("canvas");
        sourceCanvas.width = width;
        sourceCanvas.height = height;
        const sourceCtx = sourceCanvas.getContext("2d", { willReadFrequently: true });
        if (!sourceCtx) return mask;

        sourceCtx.drawImage(loadedImage, 0, 0, width, height);
        const pixels = sourceCtx.getImageData(0, 0, width, height).data;
        const result = new Uint8Array(mask);
        const block = 8;
        const edgeLimit = label === "wall" ? 34 : 44;
        const chromaLimit = label === "wall" ? 58 : 70;

        for (let by = 1; by < height - 1; by += block) {
          for (let bx = 1; bx < width - 1; bx += block) {
            let painted = 0;
            let edgeSum = 0;
            let chromaSum = 0;
            let samples = 0;

            for (let y = by; y < Math.min(height - 1, by + block); y++) {
              for (let x = bx; x < Math.min(width - 1, bx + block); x++) {
                const idx = y * width + x;
                if (mask[idx] !== 1) continue;

                const p = idx * 4;
                const left = (idx - 1) * 4;
                const right = (idx + 1) * 4;
                const up = (idx - width) * 4;
                const down = (idx + width) * 4;
                const lumaLeft = pixels[left] * 0.299 + pixels[left + 1] * 0.587 + pixels[left + 2] * 0.114;
                const lumaRight = pixels[right] * 0.299 + pixels[right + 1] * 0.587 + pixels[right + 2] * 0.114;
                const lumaUp = pixels[up] * 0.299 + pixels[up + 1] * 0.587 + pixels[up + 2] * 0.114;
                const lumaDown = pixels[down] * 0.299 + pixels[down + 1] * 0.587 + pixels[down + 2] * 0.114;
                const r = pixels[p];
                const g = pixels[p + 1];
                const b = pixels[p + 2];

                edgeSum += Math.abs(lumaRight - lumaLeft) + Math.abs(lumaDown - lumaUp);
                chromaSum += Math.max(r, g, b) - Math.min(r, g, b);
                painted++;
                samples++;
              }
            }

            if (samples === 0) continue;
            const paintedRatio = painted / (block * block);
            const detailScore = edgeSum / samples;
            const chromaScore = chromaSum / samples;
            if (paintedRatio < 0.75 && (detailScore > edgeLimit || chromaScore > chromaLimit)) {
              for (let y = by; y < Math.min(height, by + block); y++) {
                for (let x = bx; x < Math.min(width, bx + block); x++) {
                  result[y * width + x] = 0;
                }
              }
            }
          }
        }

        return result;
      };

      const protectExistingPaint = (mask: Uint8Array) => {
        const result = new Uint8Array(mask);
        paintedAreas.forEach(area => {
          if (area.color === selectedShade.code || area.mask.length !== result.length) return;
          for (let i = 0; i < result.length; i++) {
            if (area.mask[i] === 1) result[i] = 0;
          }
        });
        return result;
      };

      const buildTopConnectedCeilingGuard = (width: number, height: number) => {
        if (!loadedImage) return new Uint8Array(width * height);

        const sourceCanvas = document.createElement("canvas");
        sourceCanvas.width = width;
        sourceCanvas.height = height;
        const sourceCtx = sourceCanvas.getContext("2d", { willReadFrequently: true });
        if (!sourceCtx) return new Uint8Array(width * height);

        sourceCtx.drawImage(loadedImage, 0, 0, width, height);
        const pixels = sourceCtx.getImageData(0, 0, width, height).data;

        const ceilingRefs: { r: number; g: number; b: number }[] = [];
        const sampleRows = [
          Math.max(2, Math.floor(height * 0.04)),
          Math.max(2, Math.floor(height * 0.08)),
          Math.max(2, Math.floor(height * 0.12))
        ];

        for (const sampleY of sampleRows) {
          for (let band = 0; band < 8; band++) {
            const startX = Math.floor(width * (band / 8));
            const endX = Math.floor(width * ((band + 1) / 8));
            let refR = 0;
            let refG = 0;
            let refB = 0;
            let samples = 0;

            for (let x = startX; x < endX; x += 3) {
              const idx = (sampleY * width + x) * 4;
              const r = pixels[idx];
              const g = pixels[idx + 1];
              const b = pixels[idx + 2];
              const chroma = Math.max(r, g, b) - Math.min(r, g, b);
              const luma = r * 0.299 + g * 0.587 + b * 0.114;
              if (luma < 95 || chroma > 92) continue;
              refR += r;
              refG += g;
              refB += b;
              samples++;
            }

            if (samples > 0) {
              ceilingRefs.push({ r: refR / samples, g: refG / samples, b: refB / samples });
            }
          }
        }

        if (ceilingRefs.length === 0) return new Uint8Array(width * height);

        const isCeilingLike = (x: number, y: number) => {
          if (y > height * 0.65) return false;
          const idx = (y * width + x) * 4;
          const r = pixels[idx];
          const g = pixels[idx + 1];
          const b = pixels[idx + 2];
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const luma = r * 0.299 + g * 0.587 + b * 0.114;
          const chroma = max - min;
          if (luma < 105 || chroma > 95) return false;

          let bestDistance = Infinity;
          for (const ref of ceilingRefs) {
            const distance = Math.abs(r - ref.r) + Math.abs(g - ref.g) + Math.abs(b - ref.b);
            if (distance < bestDistance) bestDistance = distance;
          }

          return bestDistance < 96 || (luma > 190 && chroma < 58);
        };

        const buildBoundaryMap = () => {
          const boundary = new Int32Array(width);
          const minY = Math.max(10, Math.floor(height * 0.08));
          const maxY = Math.floor(height * 0.65);

          for (let x = 0; x < width; x++) {
            let bestY = Math.floor(height * 0.24);
            let bestScore = -Infinity;

            for (let y = minY; y < maxY; y++) {
              const above = Math.max(1, y - 4);
              const below = Math.min(height - 2, y + 4);
              const a = (above * width + x) * 4;
              const b = (below * width + x) * 4;
              const lumaA = pixels[a] * 0.299 + pixels[a + 1] * 0.587 + pixels[a + 2] * 0.114;
              const lumaB = pixels[b] * 0.299 + pixels[b + 1] * 0.587 + pixels[b + 2] * 0.114;
              const colorJump =
                Math.abs(pixels[b] - pixels[a]) +
                Math.abs(pixels[b + 1] - pixels[a + 1]) +
                Math.abs(pixels[b + 2] - pixels[a + 2]);
              const centerBias = -Math.abs(y - height * 0.24) * 0.08;
              const score = Math.abs(lumaB - lumaA) + colorJump * 0.35 + centerBias;

              if (score > bestScore) {
                bestScore = score;
                bestY = y;
              }
            }

            boundary[x] = bestY;
          }

          for (let pass = 0; pass < 4; pass++) {
            const next = new Int32Array(boundary);
            for (let x = 2; x < width - 2; x++) {
              next[x] = Math.round((boundary[x - 2] + boundary[x - 1] + boundary[x] * 2 + boundary[x + 1] + boundary[x + 2]) / 6);
            }
            boundary.set(next);
          }

          return boundary;
        };

        const boundaryMap = buildBoundaryMap();
        (window as any)._ceilingBoundaryMap = boundaryMap;

        const guard = new Uint8Array(width * height);
        const visited = new Uint8Array(width * height);
        const queue = new Int32Array(width * height);
        let qHead = 0;
        let qTail = 0;
        const dirs = [-width, width, -1, 1];

        for (let x = 0; x < width; x++) {
          if (isCeilingLike(x, 0)) {
            const idx = x;
            queue[qTail++] = idx;
            visited[idx] = 1;
          }
        }

        while (qHead < qTail) {
          const idx = queue[qHead++];
          const x = idx % width;
          const y = Math.floor(idx / width);
          if (y > Math.min(boundaryMap[x] + 10, height * 0.34)) continue;
          guard[idx] = 1;

          for (let i = 0; i < dirs.length; i++) {
            const nextIdx = idx + dirs[i];
            const nx = nextIdx % width;
            const ny = Math.floor(nextIdx / width);
            if (nextIdx < 0 || nextIdx >= width * height) continue;
            if (dirs[i] === -1 && x === 0) continue;
            if (dirs[i] === 1 && x === width - 1) continue;
            if (visited[nextIdx] || !isCeilingLike(nx, ny)) continue;
            if (ny > Math.min(boundaryMap[nx] + 10, height * 0.34)) continue;

            visited[nextIdx] = 1;
            queue[qTail++] = nextIdx;
          }
        }

        return fillPinholes(guard, width, height, 2);
      };

      const buildAiSurfaceMask = (
        label: "wall" | "ceiling",
        width: number,
        height: number,
        seed?: { x: number; y: number }
      ) => {
        if (!loadedImage || !aiMasks || aiMasks.length === 0) return null;

        const canvasSize = width * height;
        const candidate = new Uint8Array(canvasSize);

        // 1. Build full target surface mask from AI
        const targetMasks = aiMasks.filter((m: any) => m.label === label);
        if (targetMasks.length === 0) return null;

        for (const m of targetMasks) {
          for (let y = 0; y < height; y++) {
            const maskY = Math.floor(y * (m.height / height));
            const maskYOffset = maskY * m.width;
            const candYOffset = y * width;
            for (let x = 0; x < width; x++) {
              const mX = Math.floor(x * (m.width / width));
              if (m.maskData[maskYOffset + mX] > 0) {
                candidate[candYOffset + x] = 1;
              }
            }
          }
        }

        // 2. Subtract opposite surface
        const oppLabel = label === "wall" ? "ceiling" : "wall";
        const oppMasks = aiMasks.filter((m: any) => m.label === oppLabel);
        for (const m of oppMasks) {
          for (let y = 0; y < height; y++) {
            const maskY = Math.floor(y * (m.height / height));
            const maskYOffset = maskY * m.width;
            const candYOffset = y * width;
            for (let x = 0; x < width; x++) {
              const mX = Math.floor(x * (m.width / width));
              if (m.maskData[maskYOffset + mX] > 0) {
                candidate[candYOffset + x] = 0;
              }
            }
          }
        }

        // 3. Subtract specific blocked objects only
        const blockedLabels = new Set([
          "window", "windowpane", "door", "curtain", "painting", "picture", "frame",
          "mirror", "clock", "shelf", "plant", "sofa", "chair", "table", "furniture",
          "cabinet", "wardrobe", "bed", "cushion", "pillow", "rug", "carpet"
        ]);
        if (label === "ceiling") {
          blockedLabels.add("light");
          blockedLabels.add("fan");
          blockedLabels.add("chandelier");
        }

        for (const m of aiMasks) {
          if (!blockedLabels.has(m.label)) continue;
          for (let y = 0; y < height; y++) {
            const maskY = Math.floor(y * (m.height / height));
            const maskYOffset = maskY * m.width;
            const candYOffset = y * width;
            for (let x = 0; x < width; x++) {
              const mX = Math.floor(x * (m.width / width));
              if (m.maskData[maskYOffset + mX] > 0) {
                candidate[candYOffset + x] = 0;
              }
            }
          }
        }

        // 4. Advanced boundary cleanup
        const ceilingGuard = buildTopConnectedCeilingGuard(width, height);
        if (label === "wall") {
          // For wall: only subtract ceiling guard in top 20%
          const topBoundary = height * 0.20;
          if (ceilingGuard) {
            for (let i = 0; i < canvasSize; i++) {
              const y = Math.floor(i / width);
              if (y < topBoundary && ceilingGuard[i] === 1) {
                candidate[i] = 0;
              }
            }
          }
        } else if (label === "ceiling") {
          // For ceiling: use the top-connected ceiling plane as a fallback because
          // generic AI often misses sloped or shaded ceiling sections.
          const boundaryMap = (window as any)._ceilingBoundaryMap as Int32Array | undefined;
          for (let i = 0; i < canvasSize; i++) {
            candidate[i] = ceilingGuard[i] === 1 ? 1 : 0;
          }

          const cutoff = height * 0.65;
          let maskPixelCount = 0;
          for (let i = 0; i < canvasSize; i++) {
            const y = Math.floor(i / width);
            const x = i % width;
            const inGuard = ceilingGuard ? ceilingGuard[i] === 1 : false;
            const belowCeilingLine = boundaryMap ? y > Math.min(boundaryMap[x] + 12, height * 0.65) : false;
            if (belowCeilingLine || (!inGuard && y > height * 0.65) || y > cutoff) {
              candidate[i] = 0;
            } else if (candidate[i] === 1) {
              maskPixelCount++;
            }
          }
          
          // Low confidence check: if detected area is tiny compared to image size
          if (maskPixelCount < (canvasSize * 0.02)) {
            (window as any)._aiLowConfidence = true;
          } else {
            (window as any)._aiLowConfidence = false;
          }
        }

        // 5. Click verification
        if (seed) {
          const sx = Math.max(0, Math.min(width - 1, Math.floor(seed.x)));
          const sy = Math.max(0, Math.min(height - 1, Math.floor(seed.y)));
          if (candidate[sy * width + sx] !== 1) return null;
        }

        // 6. Fill small surface gaps, then remove object-like islands and detail-heavy regions.
        const fillRadius = label === "wall" ? 2 : 3;
        let cleanedMask = protectDetailedObjects(
          fillPinholes(candidate, width, height, fillRadius),
          width,
          height,
          label
        );

        if (label === "ceiling") {
          const boundaryMap = (window as any)._ceilingBoundaryMap as Int32Array | undefined;
          cleanedMask = removeCeilingDrips(
            keepTopConnectedMask(cleanedMask, width, height),
            width,
            height,
            boundaryMap
          );
        }

        cleanedMask = removeSmallMaskIslands(
          cleanedMask,
          width,
          height,
          Math.max(90, Math.floor(canvasSize * 0.0012))
        );

        // CRITICAL: Always protect existing paint to prevent overwriting
        return protectExistingPaint(
          cleanedMask
        );
      };

      const handleCompleteDetectedSurface = (targetSurface?: "wall" | "ceiling") => {
        if (canvasWidth === 0 || canvasHeight === 0 || !loadedImage) return;

        const label = targetSurface || (surfaceType === "ceiling" ? "ceiling" : "wall");
        if (label === "ceiling" && photoStage !== "finished") {
          const siteMask = buildSiteCeilingMask(canvasWidth, canvasHeight);
          if (siteMask && maskHasPaint(siteMask)) {
            updatePaintedAreas(siteMask);
            setSurfaceType("ceiling");
            setSelectionMode("brush");
            setIsEraser(false);
            setRefineMode(false);
            setAiMessage("Site ceiling filled automatically. Use Brush/Eraser only for small corrections.");
            setTimeout(() => setAiMessage(''), 4000);
            return;
          }
        }

        setSurfaceType(label);
        setSelectionMode("magic");
        setIsEraser(false);
        setPolygonPoints([]);
        setRefineMode(false);
        setAiMessage(label === "ceiling"
          ? "Click inside the ceiling. Click missed ceiling patches to add them."
          : "Click inside a wall. Click other wall sections to add them."
        );
        setTimeout(() => setAiMessage(''), 5000);
      };

      const buildTargetedFloodMask = (
        startX: number,
        startY: number,
        targetSurface: "wall" | "ceiling" | "general",
        width: number,
        height: number
      ) => {
        if (!loadedImage) return null;

        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tCtx = tempCanvas.getContext("2d", { willReadFrequently: true });
        if (!tCtx) return null;

        tCtx.drawImage(loadedImage, 0, 0, width, height);
        const pixels = tCtx.getImageData(0, 0, width, height).data;

        startX = Math.max(0, Math.min(width - 1, Math.floor(startX)));
        startY = Math.max(0, Math.min(height - 1, Math.floor(startY)));
        const startIdx = startY * width + startX;
        const pStartIdx = startIdx * 4;
        const startR = pixels[pStartIdx];
        const startG = pixels[pStartIdx + 1];
        const startB = pixels[pStartIdx + 2];
        const startLuma = startR * 0.299 + startG * 0.587 + startB * 0.114;
        const startChroma = Math.max(startR, startG, startB) - Math.min(startR, startG, startB);
        const ceilingGuard = buildTopConnectedCeilingGuard(width, height);

        const canAcceptPixel = (idx: number) => {
          const x = idx % width;
          const y = Math.floor(idx / width);
          
          if (targetSurface === "ceiling") {
            if (y > Math.min(height * 0.34, startY + height * 0.12)) return false;
          }
          
          if (targetSurface === "wall") {
            if (y < height * 0.10) return false;
            // Prevent wall fill from bleeding into the detected ceiling in the top 65% of the image
            if (y < height * 0.65 && ceilingGuard && ceilingGuard[idx] === 1) return false;
          }

          const p = idx * 4;
          const r = pixels[p];
          const g = pixels[p + 1];
          const b = pixels[p + 2];
          const luma = r * 0.299 + g * 0.587 + b * 0.114;
          const chroma = Math.max(r, g, b) - Math.min(r, g, b);
          const colorDist = Math.abs(r - startR) + Math.abs(g - startG) + Math.abs(b - startB);
          const lumaDist = Math.abs(luma - startLuma);
          const chromaDist = Math.abs(chroma - startChroma);

          if (targetSurface === "ceiling") {
            return colorDist <= 150 && lumaDist <= 72 && chroma <= 100;
          }
          if (targetSurface === "wall") {
            return colorDist <= 130 && lumaDist <= 65 && chromaDist <= 55;
          }
          return colorDist <= magicSensitivity * 1.2;
        };

        const newMask = new Uint8Array(width * height);
        const visited = new Uint8Array(width * height);
        const queue = new Int32Array(width * height);
        const dirs = [-width, width, -1, 1];
        let qHead = 0;
        let qTail = 0;

        queue[qTail++] = startIdx;
        visited[startIdx] = 1;

        while (qHead < qTail) {
          const idx = queue[qHead++];
          const x = idx % width;
          if (!canAcceptPixel(idx)) continue;
          newMask[idx] = 1;

          for (const dir of dirs) {
            const nextIdx = idx + dir;
            if (nextIdx < 0 || nextIdx >= width * height) continue;
            if (dir === -1 && x === 0) continue;
            if (dir === 1 && x === width - 1) continue;
            if (visited[nextIdx]) continue;
            visited[nextIdx] = 1;
            queue[qTail++] = nextIdx;
          }
        }

        const repairedMask = removeSmallMaskIslands(
          protectDetailedObjects(
            fillPinholes(newMask, width, height, targetSurface === "ceiling" ? 3 : 2),
            width,
            height,
            targetSurface === "ceiling" ? "ceiling" : "wall"
          ),
          width,
          height,
          Math.max(40, Math.floor(width * height * 0.0005))
        );

        return protectExistingPaint(repairedMask);
      };

      const buildInteractiveMask = async (
        startX: number,
        startY: number,
        targetSurface: "wall" | "ceiling" | "general",
        width: number,
        height: number
      ) => {
        const segmenter = interactiveSegmenterRef.current;
        if (!segmenter || !loadedImage || interactiveStatus !== "ready") return null;

        const normalizedX = Math.max(0, Math.min(1, startX / width));
        const normalizedY = Math.max(0, Math.min(1, startY / height));

        const result = await new Promise<any>((resolve, reject) => {
          try {
            segmenter.segment(
              loadedImage,
              { keypoint: { x: normalizedX, y: normalizedY } },
              (segmentationResult) => resolve(segmentationResult)
            );
          } catch (error) {
            reject(error);
          }
        });

        const masks = result.confidenceMasks || [];
        if (masks.length === 0) {
          result.close?.();
          return null;
        }

        const openSitePhoto = photoStage !== "finished";
        const threshold = targetSurface === "ceiling" ? 0.48 : targetSurface === "wall" ? 0.45 : openSitePhoto ? 0.26 : 0.30;
        const maxCoverage = targetSurface === "ceiling" ? 0.24 : targetSurface === "wall" ? 0.95 : 0.50;
        const minCoverage = 0.004;
        let bestCandidate: Uint8Array | null = null;
        let bestCandidateScore = -Infinity;

        masks.forEach((candidateMask: any, index: number) => {
          const maskData = candidateMask.getAsFloat32Array();
          const maskWidth = candidateMask.width;
          const maskHeight = candidateMask.height;
          const binaryMask = new Uint8Array(width * height);

          for (let y = 0; y < height; y++) {
            const my = Math.min(maskHeight - 1, Math.floor((y / height) * maskHeight));
            const maskRow = my * maskWidth;
            const row = y * width;
            for (let x = 0; x < width; x++) {
              const mx = Math.min(maskWidth - 1, Math.floor((x / width) * maskWidth));
              if (maskData[maskRow + mx] >= threshold) {
                binaryMask[row + x] = 1;
              }
            }
          }

          const seedIdx = Math.floor(startY) * width + Math.floor(startX);
          if (binaryMask[seedIdx] !== 1) return;

          let cleaned = binaryMask;
          
            // --- NEW: Sharp-Corner Expansion ---
            // Instead of rounding with morphClose, we use a targeted flood fill 
            // that expands the AI's "blob" into the corners by following color similarity.
            const expanded = new Uint8Array(cleaned.length);
            const pixels = (loadedImage ? (()=>{
              const c = document.createElement('canvas');
              c.width = width; c.height = height;
              const x = c.getContext('2d')!;
              x.drawImage(loadedImage, 0, 0, width, height);
              return x.getImageData(0, 0, width, height).data;
            })() : new Uint8ClampedArray(0));

            const startIdx = Math.floor(startY) * width + Math.floor(startX);
            const sr = pixels[startIdx * 4], sg = pixels[startIdx * 4 + 1], sb = pixels[startIdx * 4 + 2];
            
            const q = [startIdx];
            const v = new Uint8Array(width * height);
            v[startIdx] = 1;
            expanded[startIdx] = 1;
            
            let head = 0;
            while(head < q.length && q.length < width * height * 0.9) {
              const idx = q[head++];
              const x = idx % width, y = idx / width | 0;
              
              for (const [dx, dy] of [[0,1],[0,-1],[1,0],[-1,0]]) {
                const nx = x + dx, ny = y + dy;
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                  const ni = ny * width + nx;
                  if (!v[ni]) {
                    v[ni] = 1;
                    const p = ni * 4;
                    
                    // --- NEW: Gradient-Aware Expansion ---
                    // Calculate local color gradient (edge strength)
                    const pRight = (nx < width - 1) ? ni + 1 : ni;
                    const pDown = (ny < height - 1) ? ni + width : ni;
                    const r1 = pixels[p], g1 = pixels[p+1], b1 = pixels[p+2];
                    const r2 = pixels[pRight * 4], g2 = pixels[pRight * 4 + 1], b2 = pixels[pRight * 4 + 2];
                    const r3 = pixels[pDown * 4], g3 = pixels[pDown * 4 + 1], b3 = pixels[pDown * 4 + 2];
                    
                    const edgeX = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
                    const edgeY = Math.abs(r1 - r3) + Math.abs(g1 - g3) + Math.abs(b1 - b3);
                    const edgeStrength = Math.sqrt(edgeX * edgeX + edgeY * edgeY);

                    const dr = Math.abs(r1 - sr), dg = Math.abs(g1 - sg), db = Math.abs(b1 - sb);
                    const colorDiff = dr + dg + db;
                    
                    // Stop if edge is very sharp (likely a corner or frame)
                    // Expand if: AI is confident OR (color is similar AND edge is weak)
                    const isSharpEdge = edgeStrength > 45;
                    const isColorMatch = colorDiff < 60;
                    
                    if (binaryMask[ni] === 1 || (!isSharpEdge && colorDiff < 55)) {
                      expanded[ni] = 1;
                      q.push(ni);
                    }
                  }
                }
              }
            }
            
            // Cleanup: Close small holes in the expansion
            cleaned = fillPinholes(expanded, width, height, 2);
            cleaned = removeSmallMaskIslands(cleaned, width, height, targetSurface === "wall" ? 200 : 80);

          if (!openSitePhoto || targetSurface === "ceiling") {
            cleaned = protectDetailedObjects(cleaned, width, height, targetSurface === "ceiling" ? "ceiling" : "wall");
          }
          
          cleaned = removeSmallMaskIslands(cleaned, width, height, targetSurface === "wall" ? 300 : 120);

          if (targetSurface === "ceiling") {
            for (let i = 0; i < cleaned.length; i++) {
              const y = Math.floor(i / width);
              if (y > height * 0.40) cleaned[i] = 0;
            }
          }

          const coverage = getMaskCoverage(cleaned);
          if (coverage < minCoverage || coverage > maxCoverage) return;

          const quality = result.qualityScores?.[index] ?? 0.5;
          const idealCoverage = targetSurface === "ceiling" ? 0.14 : targetSurface === "wall" ? 0.85 : 0.22;
          const score = quality - Math.abs(coverage - idealCoverage) * (targetSurface === "wall" ? 0.2 : 1.8);
          if (score > bestCandidateScore) {
            bestCandidateScore = score;
            bestCandidate = cleaned;
          }
        });

        result.close?.();
        return bestCandidate ? protectExistingPaint(bestCandidate) : null;
      };

      const buildSiteCeilingMask = (width: number, height: number) => {
        if (!loadedImage) return null;

        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = width;
        tempCanvas.height = height;
        const ctx = tempCanvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return null;

        ctx.drawImage(loadedImage, 0, 0, width, height);
        const pixels = ctx.getImageData(0, 0, width, height).data;
        const topY = Math.max(2, Math.floor(height * 0.08));
        let refR = 0;
        let refG = 0;
        let refB = 0;
        let samples = 0;

        for (let y = Math.max(2, topY - 8); y <= topY + 8; y += 2) {
          for (let x = Math.floor(width * 0.35); x < Math.floor(width * 0.65); x += 3) {
            const idx = (y * width + x) * 4;
            const r = pixels[idx];
            const g = pixels[idx + 1];
            const b = pixels[idx + 2];
            const luma = r * 0.299 + g * 0.587 + b * 0.114;
            if (luma < 60) continue;
            refR += r;
            refG += g;
            refB += b;
            samples++;
          }
        }

        if (samples === 0) return null;
        refR /= samples;
        refG /= samples;
        refB /= samples;

        const mask = new Uint8Array(width * height);
        const visited = new Uint8Array(width * height);
        const queue = new Int32Array(width * height);
        const dirs = [-width, width, -1, 1];
        const maxY = Math.floor(height * 0.42);
        let qHead = 0;
        let qTail = 0;

        const isCeilingPixel = (idx: number) => {
          const y = Math.floor(idx / width);
          if (y > maxY) return false;
          const p = idx * 4;
          const r = pixels[p];
          const g = pixels[p + 1];
          const b = pixels[p + 2];
          const luma = r * 0.299 + g * 0.587 + b * 0.114;
          const chroma = Math.max(r, g, b) - Math.min(r, g, b);
          const colorDist = Math.abs(r - refR) + Math.abs(g - refG) + Math.abs(b - refB);
          return luma > 65 && chroma < 95 && colorDist < 145;
        };

        for (let x = Math.floor(width * 0.18); x < Math.floor(width * 0.82); x += 4) {
          const seed = topY * width + x;
          if (isCeilingPixel(seed) && !visited[seed]) {
            visited[seed] = 1;
            queue[qTail++] = seed;
          }
        }

        while (qHead < qTail) {
          const idx = queue[qHead++];
          const x = idx % width;
          mask[idx] = 1;

          for (const dir of dirs) {
            const nextIdx = idx + dir;
            if (nextIdx < 0 || nextIdx >= width * height) continue;
            if (dir === -1 && x === 0) continue;
            if (dir === 1 && x === width - 1) continue;
            if (visited[nextIdx] || !isCeilingPixel(nextIdx)) continue;
            visited[nextIdx] = 1;
            queue[qTail++] = nextIdx;
          }
        }

        const cleaned = removeSmallMaskIslands(
          fillPinholes(mask, width, height, 2),
          width,
          height,
          Math.max(60, Math.floor(width * height * 0.0008))
        );

        return maskHasPaint(cleaned) ? protectExistingPaint(cleaned) : null;
      };

      const handleMagicWand = async (startX: number, startY: number) => {
        if (canvasWidth === 0 || canvasHeight === 0 || !loadedImage) return;

        const width = canvasWidth;
        const height = canvasHeight;

        if (interactiveStatus === "ready") {
          setAiStatus("processing");
          setAiMessage("Finding clicked surface...");
          try {
            const mediaPipeMask = await buildInteractiveMask(startX, startY, surfaceType, width, height);
            if (mediaPipeMask && maskHasPaint(mediaPipeMask)) {
              updatePaintedAreas(mediaPipeMask);
              setSelectionMode("brush");
              setIsEraser(false);
              setBrushSize(18);
              setRefineMode(false);
              setAiStatus("complete");
              setAiMessage("Surface selected. Click another patch to add more, or use Eraser only if needed.");
              setTimeout(() => setAiMessage(''), 3500);
              return;
            }
            setAiMessage("That selection was too large or unclear. Click a flatter wall/ceiling area, or use Custom.");
            setTimeout(() => setAiMessage(''), 3500);
            setAiStatus("complete");
            return;
          } catch (error) {
            console.error("Interactive segmentation failed:", error);
            setInteractiveStatus("error");
          }
        }

        // --- PATH 1: AI MASK (when Wall or Ceiling preset is active and AI is ready) ---
        if ((surfaceType === "wall" || surfaceType === "ceiling") && aiMasks && aiMasks.length > 0) {
          const clickSeed = { x: startX, y: startY };
          const mask = buildAiSurfaceMask(surfaceType, width, height, clickSeed);
          if (mask) {
            updatePaintedAreas(mask);
            setSelectionMode("brush");
            setIsEraser(true);
            setBrushSize(18);
            setRefineMode(true);
            setAiMessage(`AI applied! Brush tool activated for quick cleanup.`);
            setTimeout(() => setAiMessage(''), 3000);
            return;
          }

          const fallbackMask = buildTargetedFloodMask(startX, startY, surfaceType, width, height);
          if (fallbackMask && maskHasPaint(fallbackMask)) {
            updatePaintedAreas(fallbackMask);
            setSelectionMode("brush");
            setIsEraser(true);
            setBrushSize(18);
            setRefineMode(true);
            setAiMessage(`Added missed ${surfaceType} patch. Use Eraser for tiny edges.`);
            setTimeout(() => setAiMessage(''), 3500);
            return;
          }

          setAiMessage(`Could not safely fill that ${surfaceType}. Use Custom or Brush.`);
          setTimeout(() => setAiMessage(''), 2500);
          return;
        }

        // --- PATH 2: FLOOD FILL (general mode or when AI is not available) ---
        const newMask = buildTargetedFloodMask(startX, startY, "general", width, height);
        if (newMask && maskHasPaint(newMask)) {
          updatePaintedAreas(newMask);
        }
      };

      const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
        const canvas = e.currentTarget;
        const rect = canvas.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * canvasWidth;
        const y = ((e.clientY - rect.top) / rect.height) * canvasHeight;

        if (selectionMode === "polygon" && polygonPoints.length > 0) {
          setDragCurrent({ x, y });
        }

        if (!isDragging) return;

        if (selectionMode === "brush" && currentBrushMask && lastPoint) {
          // PERFORMANCE OPTIMIZATION: Mutate the mask instead of creating new ones
          drawLineOnMask(currentBrushMask, lastPoint.x, lastPoint.y, x, y, brushSize / 2, canvasWidth, canvasHeight);
          // Trigger a re-render by creating a shallow copy only after mutation if needed, 
          // but here we rely on the state update pattern below
          setCurrentBrushMask(new Uint8Array(currentBrushMask));
          setLastPoint({ x, y });
        } else {
          setDragCurrent({ x, y });
        }
      };

      const handleMouseUp = () => {
        if (!isDragging || canvasWidth === 0 || canvasHeight === 0) {
          setIsDragging(false);
          return;
        }

        if (selectionMode === "rectangle" && dragStart && dragCurrent) {
          const width = canvasWidth;
          const height = canvasHeight;
          const newMask = new Uint8Array(width * height);
          const xMin = Math.floor(Math.min(dragStart.x, dragCurrent.x));
          const xMax = Math.floor(Math.max(dragStart.x, dragCurrent.x));
          const yMin = Math.floor(Math.min(dragStart.y, dragCurrent.y));
          const yMax = Math.floor(Math.max(dragStart.y, dragCurrent.y));

          for (let y = yMin; y <= yMax; y++) {
            for (let x = xMin; x <= xMax; x++) {
              if (x >= 0 && x < width && y >= 0 && y < height) {
                newMask[y * width + x] = 1;
              }
            }
          }

          if (isEraser) {
            updatePaintedAreas(newMask);
          } else {
            updatePaintedAreas(newMask);
          }
        } else if (selectionMode === "brush" && currentBrushMask) {
          updatePaintedAreas(currentBrushMask);
          setCurrentBrushMask(null);
        }

        setIsDragging(false);
        setDragStart(null);
        setDragCurrent(null);
        setLastPoint(null);
      };

      const handleUndo = () => {
        const previous = paintHistory[paintHistory.length - 1];
        if (!previous) {
          setAiMessage("Nothing to undo yet.");
          setTimeout(() => setAiMessage(''), 1800);
          return;
        }
        setPaintedAreas(clonePaintedAreas(previous));
        setPaintHistory(prev => prev.slice(0, -1));
      };

      const [showClearConfirm, setShowClearConfirm] = useState(false);

      const handleClearAll = () => {
        if (paintedAreas.length === 0) return;
        if (!showClearConfirm) {
          setShowClearConfirm(true);
          // Auto-reset confirmation after 3 seconds
          setTimeout(() => setShowClearConfirm(false), 3000);
          return;
        }
        setPaintHistory(prev => [...prev.slice(-19), clonePaintedAreas(paintedAreas)]);
        setPaintedAreas([]);
        setShowClearConfirm(false);
      };

      const handleSaveProject = () => {
        if (!image) return;
        try {
          const roomsToSave = getRoomsSnapshot().map(roomToSave => {
            return {
              ...roomToSave,
              paintedAreas: roomToSave.paintedAreas.map(area => {
                const bitCount = area.mask.length;
                const byteCount = Math.ceil(bitCount / 8);
                const packed = new Uint8Array(byteCount);
                for (let i = 0; i < bitCount; i++) {
                  if (area.mask[i] === 1) packed[Math.floor(i / 8)] |= (1 << (i % 8));
                }

                let binary = "";
                const CHUNK_SIZE = 0x4000; // Safer chunk size for stack
                for (let i = 0; i < packed.length; i += CHUNK_SIZE) {
                  const chunk = packed.slice(i, i + CHUNK_SIZE);
                  binary += String.fromCharCode.apply(null, Array.from(chunk));
                }
                return { color: area.color, mask: btoa(binary), originalSize: bitCount };
              })
            };
          });

          const serialized = JSON.stringify({
            rooms: roomsToSave,
            activeRoomId,
            projectPalette
          });
          localStorage.setItem('vishnu_paint_project_v2', serialized);
          alert("All rooms saved successfully!");
        } catch (e) {
          console.error(e);
          alert("Failed to save. Project might be too large.");
        }
      };

      const handleLoadProject = () => {
        const saved = localStorage.getItem('vishnu_paint_project_v2');
        if (!saved) {
          alert("No saved project found.");
          return;
        }

        try {
          const data = JSON.parse(saved);
          const restoredRooms = data.rooms.map((r: any) => ({
            ...r,
            paintedAreas: r.paintedAreas.map((area: any) => {
              const binaryString = atob(area.mask);
              const packed = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) packed[i] = binaryString.charCodeAt(i);
              const bitCount = area.originalSize;
              const mask = new Uint8Array(bitCount);
              for (let i = 0; i < bitCount; i++) {
                if ((packed[Math.floor(i / 8)] & (1 << (i % 8))) !== 0) mask[i] = 1;
              }
              return { color: area.color, mask };
            })
          }));

          setRooms(restoredRooms);
          if (data.projectPalette) {
            setProjectPalette(data.projectPalette);
          }
          const active = restoredRooms.find((r: any) => r.id === data.activeRoomId) || (restoredRooms.length > 0 ? restoredRooms[0] : null);
          if (active) {
            setActiveRoomId(active.id);
            setImage(active.image);
            setPaintedAreas([...active.paintedAreas]);
            setPaintHistory([]);
            setIntensity(active.intensity);
            setTexturePreservation(active.texturePreservation);
          }

          alert("Project loaded!");
        } catch (e) {
          console.error(e);
          alert("Load failed.");
        }
      };

      const handleSelectShade = (shade: Shade) => {
        setSelectedShade(shade);
        setSearchQuery("");
        // Automatically add to palette if not already there
        if (!projectPalette.find(s => s.code === shade.code)) {
          setProjectPalette(prev => [...prev, shade]);
        }
      };

      const removeFromPalette = (code: string) => {
        setProjectPalette(prev => prev.filter(s => s.code !== code));
        if (selectedShade.code === code) {
          setSelectedShade(projectPalette.find(s => s.code !== code) || JSW_PAINTS_COLLECTIONS[0].shades[0]);
        }
      };

      const handleBook = () => {
        const { usedRooms, allUsedShades } = getProjectSummary();
        const roomLines = usedRooms.map(({ room, shades }) => {
          const shadeText = shades.map(shade => `${shade.name} (JSW ${shade.jswCode})`).join(", ");
          return `- ${room.name}: ${shadeText}`;
        });
        const message = usedRooms.length > 0
          ? `In-shop colour preview - Vishnu Paints\n\nRooms:\n${roomLines.join("\n")}\n\nTotal photos: ${rooms.length}\nSelected shades: ${allUsedShades.length}\nNext step: prepare estimate and confirm paint availability.`
          : `In-shop colour preview - Vishnu Paints\n\nSelected shade: ${selectedShade.name} (JSW ${selectedShade.jswCode})\nNext step: help customer compare this shade on a room photo.`;
        window.open(`https://wa.me/${CONTACT_INFO.whatsapp}?text=${encodeURIComponent(message)}`, '_blank');
      };

  return (
    <div className="fixed inset-0 bg-[#f8f9ff] flex flex-col overflow-hidden font-inter text-[#0b1c30]">
      {/* --- TOP NAVIGATION BAR --- */}
      <header className="fixed top-0 z-50 w-full h-16 px-8 flex justify-between items-center bg-white/70 backdrop-blur-3xl border-b border-white/30">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#00113a] rounded-lg flex items-center justify-center shadow-lg shadow-[#00113a]/20">
            <span className="material-symbols-outlined text-white text-xl">format_paint</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#00113a] leading-none tracking-tight font-outfit">Lumina Studio <span className="text-[#d92128]">Pro</span></h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowBefore(!showBefore)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all border ${showBefore ? 'bg-[#00113a] text-white border-[#00113a]' : 'bg-white text-[#00113a] border-black/5 hover:bg-black/5'}`}
          >
            <span className="material-symbols-outlined text-sm">{showBefore ? 'visibility_off' : 'compare'}</span>
            {showBefore ? 'Viewing Original' : 'Compare Before/After'}
          </button>
          
          <div className="w-px h-6 bg-black/10 mx-2" />
          
          <button 
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#00113a] text-white text-sm font-bold shadow-md hover:brightness-110 active:scale-95 transition-all"
            onClick={() => setToast({ message: "Project saved successfully!", type: 'success' })}
          >
            <span className="material-symbols-outlined text-sm">save</span>
            Save Project
          </button>
        </div>
      </header>

      {/* --- MAIN WORKSPACE --- */}
      <main className="relative pt-20 pl-28 pr-[396px] pb-28 flex overflow-hidden h-screen w-full pointer-events-none">
        
        {/* --- LEFT TOOLBAR (SELECTION TOOLS) --- */}
        <aside className="fixed left-4 top-24 bottom-28 w-20 z-40 bg-white/80 backdrop-blur-2xl rounded-2xl border border-white/50 shadow-xl flex flex-col items-center py-4 gap-4 pointer-events-auto">
          <div className="flex flex-col items-center gap-1 mb-2">
            <span className="text-[10px] font-bold text-[#00113a]/60 uppercase tracking-widest">Tools</span>
          </div>

          {[
            { id: 'brush', icon: 'brush', label: 'Precision Brush' },
            { id: 'magic', icon: 'auto_fix_high', label: 'AI Magic Wand' },
            { id: 'polygon', icon: 'pentagon', label: 'Custom Shape' },
          ].map((tool) => (
            <button
              key={tool.id}
              onClick={() => setSelectionMode(tool.id as any)}
              className={`p-3 rounded-xl transition-transform active:scale-90 relative group ${selectionMode === tool.id ? 'bg-[#00113a] text-white shadow-md' : 'text-[#444650] hover:bg-black/5'}`}
              title={tool.label}
            >
              <span className="material-symbols-outlined">{tool.icon}</span>
              <span className="absolute left-16 bg-[#00113a] text-white text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all whitespace-nowrap z-50 shadow-lg">
                {tool.label}
              </span>
            </button>
          ))}
          
          <div className="w-8 h-px bg-black/10 my-1" />
          
          <button
            onClick={() => setIsEraser(!isEraser)}
            className={`p-3 rounded-xl transition-transform active:scale-90 relative group ${isEraser ? 'bg-[#d92128] text-white shadow-md' : 'text-[#444650] hover:bg-black/5'}`}
            title="Eraser"
          >
            <span className="material-symbols-outlined">{isEraser ? 'ink_eraser' : 'ink_eraser_off'}</span>
          </button>

          <div className="mt-auto flex flex-col items-center gap-4">
            <button
              onClick={() => handleCompleteDetectedSurface()}
              className="p-3 rounded-xl text-[#00113a]/60 hover:bg-[#00113a]/5 hover:text-[#00113a] transition-all relative group"
              title="Smart Analyze Wall"
            >
              <span className="material-symbols-outlined">auto_awesome</span>
            </button>
            <button
              onClick={() => handleCompleteDetectedSurface('ceiling')}
              className="p-3 rounded-xl text-[#00113a]/60 hover:bg-[#00113a]/5 hover:text-[#00113a] transition-all relative group"
              title="Smart Analyze Ceiling"
            >
              <span className="material-symbols-outlined">vertical_align_top</span>
            </button>
          </div>
        </aside>

        {/* --- CENTER CANVAS AREA --- */}
        <div className="flex-grow relative bg-[#e5eeff] overflow-hidden rounded-3xl shadow-inner pointer-events-auto border border-black/5">
          <VisualizerCanvas
            image={image}
            loadedImage={loadedImage}
            selectedShade={selectedShade}
            showBefore={showBefore}
            texturePreservation={texturePreservation}
            intensity={intensity}
            paintedAreas={paintedAreas}
            isDragging={isDragging}
            dragStart={dragStart}
            dragCurrent={dragCurrent}
            selectionMode={selectionMode}
            brushSize={brushSize}
            currentBrushMask={currentBrushMask}
            polygonPoints={polygonPoints}
            zoom={zoom}
            onZoomIn={() => setZoom(z => Math.min(3, z + 0.2))}
            onZoomOut={() => setZoom(z => Math.max(0.5, z - 0.2))}
            onZoomReset={() => setZoom(1)}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onFillPolygon={handleFillPolygon}
            aiStatus={aiStatus}
          />
        </div>

        {/* --- RIGHT SIDEBAR (SHADES & CONTROLS) --- */}
        <aside className="fixed right-0 top-16 bottom-0 w-[380px] z-40 bg-white/80 backdrop-blur-3xl border-l border-white/30 flex flex-col pointer-events-auto">
          {/* Panel Tabs */}
          <div className="flex border-b border-black/5 bg-[#f8f9ff]/50">
              {[
                { id: 'shades', icon: 'palette', label: 'Shades' },
                { id: 'projects', icon: 'folder_special', label: 'History' },
                { id: 'calculator', icon: 'calculate', label: 'Calculator' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActivePanel(tab.id as any)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] uppercase tracking-widest font-bold transition-all ${activePanel === tab.id ? 'bg-white text-primary shadow-md' : 'text-primary/40 hover:text-primary/70'}`}
                >
                  <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
            {activePanel === 'shades' && (
              <div className="h-full flex flex-col">
                <div className="p-4 bg-white/50 border-b border-black/5 flex items-center gap-4 shrink-0">
                  <div 
                    className="w-12 h-12 rounded-full shadow-sm border border-black/10"
                    style={{ backgroundColor: selectedShade.code }}
                  />
                  <div>
                    <h3 className="text-[#00113a] font-bold text-sm">{selectedShade.name}</h3>
                    <p className="text-[10px] text-[#444650] uppercase tracking-wider">JSW · {selectedShade.jswCode}</p>
                  </div>
                </div>

                  <div className="flex-1 h-full flex flex-col">
                    <ShadePickerPanel 
                      selectedShade={selectedShade} 
                      onShadeSelect={handleSelectShade}
                    />
                  </div>
                </div>
              )}

              {activePanel === 'projects' && (
                <ProjectManager 
                  selectedShade={selectedShade} 
                  onLoadConsultation={setSelectedShade}
                  calculatorSummary={lastCalculatorSummary}
                />
              )}

              {activePanel === 'calculator' && (
                <PaintCalculator 
                  onAddToQuote={(s) => {
                    setLastCalculatorSummary(s);
                    setToast({ message: "Estimate added to quote!", type: 'success' });
                    setTimeout(() => setToast(null), 2000);
                  }}
                />
              )}
            </div>

          {/* Bottom Sliders */}
          <div className="p-6 bg-[#f8f9ff] border-t border-black/5 space-y-5 shrink-0">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] uppercase tracking-widest font-bold text-[#444650]">Paint Intensity</label>
                <span className="text-xs font-bold text-[#00113a]">{intensity}%</span>
              </div>
              <input 
                type="range" 
                min="30" max="100" 
                value={intensity} 
                onChange={(e) => setIntensity(parseInt(e.target.value))}
                className="w-full h-1 bg-black/10 rounded-full appearance-none cursor-pointer"
              />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] uppercase tracking-widest font-bold text-[#444650]">Texture Preservation</label>
                <span className="text-xs font-bold text-[#00113a]">{texturePreservation}%</span>
              </div>
              <input 
                type="range" 
                min="0" max="100" 
                value={texturePreservation} 
                onChange={(e) => setTexturePreservation(parseInt(e.target.value))}
                className="w-full h-1 bg-black/10 rounded-full appearance-none cursor-pointer"
              />
            </div>
          </div>
        </aside>

        {/* --- BOTTOM PROJECT BAR --- */}
        <nav className="fixed bottom-4 left-28 right-[400px] z-50 h-20 bg-white/70 backdrop-blur-3xl rounded-full border border-white/30 shadow-lg flex justify-between items-center px-6 pointer-events-auto">
          <div className="flex items-center gap-3 overflow-x-auto custom-scrollbar-h py-2 flex-1">
            {rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => handleSwitchRoom(room.id)}
                className={`flex items-center gap-3 px-4 py-2 rounded-full transition-all border ${activeRoomId === room.id ? 'bg-[#00113a] text-white border-[#00113a]' : 'bg-transparent text-[#444650] border-transparent hover:bg-black/5'}`}
              >
                <img src={room.image} className="w-8 h-8 rounded-full object-cover shadow-sm" />
                <span className="text-xs font-bold whitespace-nowrap">{room.name}</span>
              </button>
            ))}
            
            <label className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-full border border-dashed border-black/20 text-[#444650] hover:bg-black/5 cursor-pointer transition-all">
              <input type="file" className="hidden" multiple onChange={handleAddRoom} />
              <span className="material-symbols-outlined text-sm">add</span>
              <span className="text-xs font-bold">Add View</span>
            </label>
          </div>

          <div className="w-px h-8 bg-black/10 mx-4" />
          
          <button 
            onClick={() => handlePaintAllWalls()}
            disabled={isProcessingAll}
            className="shrink-0 flex items-center gap-2 px-6 py-3 rounded-full bg-[#00113a] text-white text-sm font-bold shadow-md hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all"
          >
            <span className="material-symbols-outlined text-sm">format_paint</span>
            Paint All Walls
          </button>
        </nav>
      </main>

      {/* --- NOTIFICATIONS / TOASTS --- */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[100]"
          >
            <div className={`px-6 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 backdrop-blur-xl ${toast.type === 'error' ? 'bg-red-500 text-white border-red-400' : 'bg-primary text-white border-primary/20'}`}>
              <span className="material-symbols-outlined">{toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : 'info'}</span>
              <p className="text-sm font-bold tracking-tight">{toast.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Styles for this page */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 17, 58, 0.1); border-radius: 10px; }
        .custom-scrollbar-h::-webkit-scrollbar { height: 4px; }
        .custom-scrollbar-h::-webkit-scrollbar-thumb { background: rgba(0, 17, 58, 0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}
