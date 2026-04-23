/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect, ChangeEvent, MouseEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { JSW_PAINTS_COLLECTIONS, CONTACT_INFO } from "../constants";
import { Shade, Collection, Room } from "../types";

export default function VisualizerPage() {
  const [selectedShade, setSelectedShade] = useState<Shade>(JSW_PAINTS_COLLECTIONS[0].shades[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showBefore, setShowBefore] = useState(false);
  const [projectPalette, setProjectPalette] = useState<Shade[]>([JSW_PAINTS_COLLECTIONS[0].shades[0]]);
  
  // Multi-room Project State
  const [rooms, setRooms] = useState<Room[]>([
    {
      id: "standard-room",
      name: "Hall (Standard)",
      image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&q=80&w=1200",
      paintedAreas: [],
      intensity: 65,
      texturePreservation: 50
    }
  ]);
  const [activeRoomId, setActiveRoomId] = useState<string>("standard-room");

  // Local state for the active room (for performance and easier editing)
  const [image, setImage] = useState<string | null>(null);
  const [paintedAreas, setPaintedAreas] = useState<{ mask: Uint8Array, color: string }[]>([]);
  const [intensity, setIntensity] = useState(65);
  const [texturePreservation, setTexturePreservation] = useState(50);

  // Initialize from rooms on mount
  useEffect(() => {
    const room = rooms.find(r => r.id === activeRoomId);
    if (room && !image) {
      setImage(room.image);
      setPaintedAreas(room.paintedAreas);
      setIntensity(room.intensity);
      setTexturePreservation(room.texturePreservation);
      setCeilingBoundaryLine(room.ceilingBoundaryLine || null);
    }
  }, []);
  
  // Selection mode and states
  const [selectionMode, setSelectionMode] = useState<"rectangle" | "brush" | "magic">("brush");
  const [isEraser, setIsEraser] = useState(false);
  const [brushSize, setBrushSize] = useState(24);
  const [magicSensitivity, setMagicSensitivity] = useState(40);
  const [magicFeathering, setMagicFeathering] = useState(2);
  const [surfaceType, setSurfaceType] = useState<"wall" | "ceiling" | "general">("general");
  const [boundaryLock, setBoundaryLock] = useState(true);
  const [edgeAwareness, setEdgeAwareness] = useState(true);
  const [edgeSensitivity, setEdgeSensitivity] = useState(30);
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  
  const [isDragging, setIsDragging] = useState(false);
  const [lastPoint, setLastPoint] = useState<{ x: number, y: number } | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number, y: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ x: number, y: number } | null>(null);
  
  // Brush path tracking
  const [currentBrushMask, setCurrentBrushMask] = useState<Uint8Array | null>(null);
  const [zoom, setZoom] = useState(1);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allShades = JSW_PAINTS_COLLECTIONS[0].shades;
  
  const filteredShades = searchQuery.trim() === "" 
    ? [] 
    : allShades.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        s.jswCode.includes(searchQuery)
      ).slice(0, 5);

  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);
  const [ceilingBoundaryLine, setCeilingBoundaryLine] = useState<number | null>(null);

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
    if (loadedImage && canvasRef.current) {
      renderCanvas();
    }
  }, [loadedImage, selectedShade, showBefore, texturePreservation, intensity, paintedAreas, isDragging, dragCurrent, selectionMode, brushSize, currentBrushMask]);

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

  const handleSwitchRoom = (roomId: string) => {
    // First, save current work to the array
    syncCurrentRoom();

    // Then load the new room
    const targetRoom = rooms.find(r => r.id === roomId);
    if (targetRoom) {
      setActiveRoomId(roomId);
      setImage(targetRoom.image);
      setPaintedAreas([...targetRoom.paintedAreas]);
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
        const nameMap: Record<number, string> = { 0: "Elevation", 1: "Hall", 2: "Kitchen", 3: "Bedroom 1", 4: "Bedroom 2" };
        
        newRooms.push({
          id,
          name: nameMap[rooms.length + processed] || `Room ${rooms.length + processed + 1}`,
          image: event.target?.result as string,
          paintedAreas: [],
          intensity: 65,
          texturePreservation: 50,
          ceilingBoundaryLine: null
        });

        processed++;
        if (processed === files.length) {
          setRooms(prev => [...prev, ...newRooms]);
          // Switch to the first newly added room
          if (newRooms.length > 0) {
            handleSwitchRoom(newRooms[0].id);
          }
        }
      };
      reader.readAsDataURL(file as unknown as Blob);
    });
  };

  const currentRoomPalette = Array.from(new Set(paintedAreas.map(a => a.color)));
  const shadePalette = currentRoomPalette.map(hex => allShades.find(s => s.code === hex) || { name: "Custom Color", code: hex, jswCode: "0000" });

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !loadedImage) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const maxWidth = 1200;
    const scale = Math.min(1, maxWidth / loadedImage.width);
    canvas.width = loadedImage.width * scale;
    canvas.height = loadedImage.height * scale;

    ctx.drawImage(loadedImage, 0, 0, canvas.width, canvas.height);

    // Helper to draw masks
    const drawMaskOnCtx = (mask: Uint8Array, colorHex: string) => {
      const paintCanvas = document.createElement("canvas");
      paintCanvas.width = canvas.width;
      paintCanvas.height = canvas.height;
      const pCtx = paintCanvas.getContext("2d")!;
      
      const paintImageData = pCtx.createImageData(canvas.width, canvas.height);
      const data = paintImageData.data;
      const color = hexToRgb(colorHex);

      for (let i = 0; i < mask.length; i++) {
        if (mask[i] === 1) {
          const idx = i * 4;
          data[idx] = color.r;
          data[idx + 1] = color.g;
          data[idx + 2] = color.b;
          data[idx + 3] = 255;
        }
      }
      pCtx.putImageData(paintImageData, 0, 0);

      // PROFESSIONAL SURFACE RENDERING: Strict 65% Multiply
      // This preserves all original wall texture, shadows, and natural depth
      ctx.save();
      ctx.globalAlpha = intensity / 100;
      ctx.globalCompositeOperation = "multiply";
      ctx.drawImage(paintCanvas, 0, 0);
      ctx.restore();
    };

    // Render each painted area
    if (!showBefore && paintedAreas.length > 0) {
      paintedAreas.forEach(area => {
        // Only draw if mask matches current canvas dimensions
        if (area.mask.length === canvas.width * canvas.height) {
          drawMaskOnCtx(area.mask, area.color);
        }
      });
    }

    // Live feedback
    if (isDragging) {
      if (selectionMode === "rectangle" && dragStart && dragCurrent) {
        ctx.save();
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = selectedShade.code;
        ctx.lineWidth = 2;
        const x = Math.min(dragStart.x, dragCurrent.x);
        const y = Math.min(dragStart.y, dragCurrent.y);
        const width = Math.abs(dragStart.x - dragCurrent.x);
        const height = Math.abs(dragStart.y - dragCurrent.y);
        ctx.strokeRect(x, y, width, height);
        ctx.fillStyle = areaToRgba(selectedShade.code, 0.2);
        ctx.fillRect(x, y, width, height);
        ctx.restore();
      } else if (selectionMode === "brush" && currentBrushMask) {
        // For live brush, we don't merge yet, just draw
        drawMaskOnCtx(currentBrushMask, selectedShade.code);
      }
    }
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
    setPaintedAreas(prev => {
      const existingAreaIdx = prev.findIndex(a => a.color === selectedShade.code);
      
      if (existingAreaIdx > -1) {
        const updated = [...prev];
        updated[existingAreaIdx].mask = mergeMask(updated[existingAreaIdx].mask, newMask, isEraser);
        return updated;
      } else if (!isEraser) {
        return [...prev, { mask: newMask, color: selectedShade.code }];
      }
      return prev;
    });
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
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

  const handleMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
    if (showBefore || !image) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * canvas.width);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * canvas.height);
    
    setIsDragging(true);
    setLastPoint({ x, y });

    if (selectionMode === "brush") {
      const mask = new Uint8Array(canvas.width * canvas.height);
      drawCircleOnMask(mask, x, y, brushSize / 2, canvas.width, canvas.height);
      setCurrentBrushMask(mask);
    } else if (selectionMode === "magic") {
      handleMagicWand(x, y);
      setIsDragging(false);
    } else {
      setDragStart({ x, y });
      setDragCurrent({ x, y });
    }
  };

  const handleFillGaps = () => {
    if (!canvasRef.current || !loadedImage) return;
    
    const width = canvasRef.current.width;
    const height = canvasRef.current.height;
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tCtx = tempCanvas.getContext("2d")!;
    tCtx.drawImage(loadedImage, 0, 0, width, height);
    const pixels = tCtx.getImageData(0, 0, width, height).data;

    let currentBoundary = ceilingBoundaryLine;
    if (currentBoundary === null) return; // Must have run a magic wand pass first

    const isCeiling = surfaceType === "ceiling";
    const targetColor = selectedShade.code;
    const newMask = new Uint8Array(width * height);

    // ZONE COMPLETION PASS
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const pIdx = idx * 4;
        const r = pixels[pIdx], g = pixels[pIdx+1], b = pixels[pIdx+2];

        if (isCeiling) {
          if (y <= currentBoundary) {
            newMask[idx] = 1;
          }
        } else {
          if (y > currentBoundary) {
            // Re-apply same exclusions as Magic Wand for consistency
            if (y > height * 0.65) continue;
            if (r > 235 && g > 235 && b > 235) continue;
            // For fill gaps, we can be a bit more inclusive with furniture check if needed,
            // but for now keeping it direct to zone logic.
            newMask[idx] = 1;
          }
        }
      }
    }
    
    updatePaintedAreas(newMask);
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
                  lineEdge += Math.abs((pixels[downIdx]*0.299 + pixels[downIdx+1]*0.587 + pixels[downIdx+2]*0.114) - (pixels[upIdx]*0.299 + pixels[upIdx+1]*0.587 + pixels[upIdx+2]*0.114));
                  lC += (pixels[upIdx]*0.299 + pixels[upIdx+1]*0.587 + pixels[upIdx+2]*0.114);
                  lW += (pixels[downIdx]*0.299 + pixels[downIdx+1]*0.587 + pixels[downIdx+2]*0.114);
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
            const cr = pixels[sIdx], cg = pixels[sIdx+1], cb = pixels[sIdx+2];

            for (let y = 0; y < height; y++) {
              for (let x = 0; x < width; x++) {
                const idx = y * width + x;
                if (y > boundary) {
                  const pIdx = idx * 4;
                  const r = pixels[pIdx], g = pixels[pIdx+1], b = pixels[pIdx+2];
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
        setPaintedAreas(current.paintedAreas);
        setCeilingBoundaryLine(current.ceilingBoundaryLine || null);
      }
    } catch (err) {
      console.error("Bulk paint failed:", err);
    } finally {
      setIsProcessingAll(false);
    }
  };

  const handleMagicWand = (startX: number, startY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !loadedImage) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tCtx = tempCanvas.getContext("2d")!;
    tCtx.drawImage(loadedImage, 0, 0, width, height);
    const imageData = tCtx.getImageData(0, 0, width, height);
    const pixels = imageData.data;

    let currentBoundary = ceilingBoundaryLine;

    // PASS 1: GEOMETRIC ZONE ANALYSIS (Run once per image)
    if (currentBoundary === null) {
      const scanLimit = Math.floor(height * 0.40); // Slightly deeper reach
      let bestLine = Math.floor(height * 0.15); 
      let maxScore = 0;

      // Scan for a line that represents a PERSPECTIVE shift (Lighting vs Edge)
      for (let y = 15; y < scanLimit; y++) {
        let lineEdge = 0;
        let lumaCeiling = 0;
        let lumaWall = 0;
        
        for (let x = width * 0.1; x < width * 0.9; x++) {
          const idx = (y * width + x) * 4;
          const upIdx = ((y - 5) * width + x) * 4;
          const downIdx = ((y + 5) * width + x) * 4;
          
          const luma = (pixels[idx]*0.299 + pixels[idx+1]*0.587 + pixels[idx+2]*0.114);
          const Lu = (pixels[upIdx]*0.299 + pixels[upIdx+1]*0.587 + pixels[upIdx+2]*0.114);
          const Ld = (pixels[downIdx]*0.299 + pixels[downIdx+1]*0.587 + pixels[downIdx+2]*0.114);
          
          lineEdge += Math.abs(Ld - Lu);
          lumaCeiling += Lu;
          lumaWall += Ld;
        }
        
        // SCORE: Strong Edge + Difference in lighting between the two zones
        // This helps distinguish the ceiling (usually brighter/flatter) from the wall junction
        const avgEdge = lineEdge / (width * 0.8);
        const lumaDiff = Math.abs(lumaCeiling - lumaWall) / (width * 0.8);
        const score = avgEdge + (lumaDiff * 1.5);
        
        if (score > maxScore) {
          maxScore = score;
          bestLine = y;
        }
      }
      currentBoundary = bestLine;
      setCeilingBoundaryLine(bestLine);
    }

    // PASS 2: ZONE PAINTING
    const newMask = new Uint8Array(width * height);
    const isCeiling = surfaceType === "ceiling";
    const targetColor = selectedShade.code;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const pIdx = idx * 4;
        const r = pixels[pIdx], g = pixels[pIdx+1], b = pixels[pIdx+2];

        if (isCeiling) {
          // CEILING ZONE: Above boundary line
          if (y <= currentBoundary) {
            newMask[idx] = 1;
          }
        } else {
          // WALL ZONE: Below boundary line
          if (y > currentBoundary) {
            // EXCLUSIONS
            // 1. Floor Skip (Bottom 35%)
            if (y > height * 0.65) continue;
            
            // 2. Very Bright Zone Skip (Windows / Lights)
            if (r > 235 && g > 235 && b > 235) continue;

            // 3. Furniture Skip (Large connected dark/saturated regions in center-bottom)
            // Simplified check: if it differs significantly from typical wall color base on click point
            if (y > height * 0.4) {
              const clickIdx = (startY * width + startX) * 4;
              const cr = pixels[clickIdx], cg = pixels[clickIdx+1], cb = pixels[clickIdx+2];
              const dist = Math.abs(r - cr) + Math.abs(g - cg) + Math.abs(b - cb);
              if (dist > 150) continue; // Likely furniture or shadow
            }
            
            newMask[idx] = 1;
          }
        }
      }
    }

    updatePaintedAreas(newMask);
  };

  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    
    if (selectionMode === "brush" && currentBrushMask && lastPoint) {
      // PERFORMANCE OPTIMIZATION: Mutate the mask instead of creating new ones
      drawLineOnMask(currentBrushMask, lastPoint.x, lastPoint.y, x, y, brushSize / 2, canvas.width, canvas.height);
      // Trigger a re-render by creating a shallow copy only after mutation if needed, 
      // but here we rely on the state update pattern below
      setCurrentBrushMask(new Uint8Array(currentBrushMask)); 
      setLastPoint({ x, y });
    } else {
      setDragCurrent({ x, y });
    }
  };

  const handleMouseUp = () => {
    if (!isDragging || !canvasRef.current) {
      setIsDragging(false);
      return;
    }

    const canvas = canvasRef.current;
    if (selectionMode === "rectangle" && dragStart && dragCurrent) {
      const width = canvas.width;
      const height = canvas.height;
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
    setPaintedAreas(paintedAreas.slice(0, -1));
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
    setPaintedAreas([]);
    setShowClearConfirm(false);
  };

  const handleSaveProject = () => {
    if (!image) return;
    try {
      const roomsToSave = rooms.map(r => {
        // If this is the active room, use current live state
        const roomToSave = r.id === activeRoomId ? {
          ...r,
          image,
          paintedAreas,
          intensity,
          texturePreservation
        } : r;

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
    if (projectPalette.length <= 1) return;
    setProjectPalette(prev => prev.filter(s => s.code !== code));
    if (selectedShade.code === code) {
      setSelectedShade(projectPalette.find(s => s.code !== code) || JSW_PAINTS_COLLECTIONS[0].shades[0]);
    }
  };

  const handleBook = () => {
    const message = `Hi Vishnu Paints, I'm interested in a free consultation for my home. I have selected the JSW shade: ${selectedShade.name} (JSW Code: ${selectedShade.jswCode}) on your visualizer and I love this color!`;
    window.open(`https://wa.me/${CONTACT_INFO.whatsapp}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <main className="pt-24 pb-12 px-4 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* LEFT COLUMN: Image Area */}
        <div className="flex-1 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-primary">Step 1: Upload your room photo</h2>
            <div className="flex items-center gap-4">
              {/* MODE TOGGLE */}
              <div className="flex bg-gray-100 p-1 rounded-xl shadow-inner gap-1">
                <button 
                  onClick={() => setSelectionMode("rectangle")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    selectionMode === "rectangle" ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-primary"
                  }`}
                  title="Rectangle Selection"
                >
                  <span className="material-symbols-outlined text-sm">square_foot</span>
                  Rect
                </button>
                <button 
                  onClick={() => setSelectionMode("brush")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    selectionMode === "brush" ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-primary"
                  }`}
                  title="Brush Tool"
                >
                  <span className="material-symbols-outlined text-sm">brush</span>
                  Brush
                </button>
                <button 
                  onClick={() => setSelectionMode("magic")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    selectionMode === "magic" ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-primary"
                  }`}
                  title="Magic Wand (Smart Fill)"
                >
                  <span className="material-symbols-outlined text-sm">magic_button</span>
                  Magic
                </button>

                <div className="w-px h-6 bg-gray-300 self-center mx-1"></div>

                <button 
                  onClick={() => setIsEraser(!isEraser)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isEraser ? "bg-red-100 text-red-600 shadow-sm" : "text-gray-500 hover:text-primary"
                  }`}
                  title="Toggle Eraser Mode"
                >
                  <span className="material-symbols-outlined text-sm">{isEraser ? 'ink_eraser' : 'edit_off'}</span>
                  {isEraser ? 'Eraser' : 'Paint'}
                </button>
              </div>

              <button 
                onClick={handleFillGaps}
                title="Automatically reaches into unpainted corners and fills small gaps"
                className="px-4 py-1.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl flex items-center gap-2 hover:bg-blue-100 transition-all shadow-sm active:scale-95"
              >
                <span className="material-symbols-outlined text-sm">texture</span>
                <span className="text-[10px] font-bold uppercase whitespace-nowrap">Fill Gaps</span>
              </button>

              <div className="flex items-center gap-2 border-l pl-4 border-gray-200">
                <span className="text-sm font-medium text-gray-600">Before/After</span>
                <button 
                  onClick={() => setShowBefore(!showBefore)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${showBefore ? 'bg-primary' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${showBefore ? 'right-0.5' : 'left-0.5'}`} />
                </button>
              </div>
            </div>
          </div>

          {/* CLEAN CANVAS */}
          <div className="relative rounded-2xl border border-gray-200 bg-gray-50 flex flex-col overflow-hidden shadow-2xl">
            {/* ZOOM BAR */}
            <div className="absolute top-4 right-4 z-20 flex bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-gray-100 p-1">
              <button 
                onClick={() => setZoom(Math.min(3, zoom + 0.25))}
                className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-lg text-primary transition-colors"
                title="Zoom In"
              >
                <span className="material-symbols-outlined">zoom_in</span>
              </button>
              <div className="w-px h-6 bg-gray-200 self-center mx-1"></div>
              <button 
                onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-lg text-primary transition-colors"
                title="Zoom Out"
              >
                <span className="material-symbols-outlined">zoom_out</span>
              </button>
              <div className="w-px h-6 bg-gray-200 self-center mx-1"></div>
              <button 
                onClick={() => setZoom(1)}
                className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-lg text-primary transition-colors"
                title="Reset Zoom"
              >
                <span className="material-symbols-outlined">restart_alt</span>
              </button>
              <div className="w-px h-6 bg-gray-200 self-center mx-1"></div>
              <span className="px-3 flex items-center justify-center text-[10px] font-black text-primary/60 uppercase">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            <div className="overflow-auto aspect-[4/3] w-full h-full cursor-crosshair">
              <div 
                className="min-w-full min-h-full transition-transform duration-200 ease-out origin-top-left"
                style={{ 
                  width: `${zoom * 100}%`,
                  height: `${zoom * 100}%` 
                }}
              >
                <canvas 
                  ref={canvasRef} 
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            
            {!image && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 pointer-events-none">
                <span className="material-symbols-outlined text-6xl mb-2">image_search</span>
                <p>Upload a photo to begin</p>
              </div>
            )}
            {image && paintedAreas.length === 0 && !isDragging && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-white/90 backdrop-blur px-6 py-3 rounded-full shadow-xl border border-primary/20 animate-pulse">
                  <p className="text-primary font-bold text-sm">
                    {selectionMode === "rectangle" ? "Click and drag to select area" : "Click and drag to paint area"}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* BOTTOM BUTTONS + BRUSH SELECTION */}
          <div className="space-y-6">
            {/* MAGIC SETTINGS PANEL */}
            {selectionMode === "magic" && (
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                <div className="flex items-center justify-between font-bold text-primary text-sm uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">auto_fix_high</span>
                    <span>Magic Accuracy</span>
                  </div>
                  <span className="bg-primary/10 px-3 py-1 rounded-full text-xs">
                    {magicSensitivity < 30 ? 'High' : magicSensitivity < 60 ? 'Standard' : 'Broad'}
                  </span>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-[10px] text-gray-400 font-bold mb-2 uppercase tracking-tighter">
                      <span>Exact</span>
                      <span>Sensitive</span>
                      <span>Wide</span>
                    </div>
                    <input 
                      type="range" min="10" max="80" step="1"
                      value={magicSensitivity} 
                      onChange={(e) => setMagicSensitivity(parseInt(e.target.value))} 
                      className="w-full accent-primary h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                      <span>Edge Smoothing</span>
                      <span className="text-primary">{magicFeathering}px</span>
                    </div>
                    <input 
                      type="range" min="0" max="8" step="1"
                      value={magicFeathering} 
                      onChange={(e) => setMagicFeathering(parseInt(e.target.value))} 
                      className="w-full accent-primary h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-primary">boundary_perspective</span>
                        <span className="text-[10px] font-bold text-gray-700 uppercase">Wall-Only Guard</span>
                      </div>
                      <button 
                        onClick={() => setEdgeAwareness(!edgeAwareness)}
                        className={`w-8 h-4 rounded-full transition-colors relative ${edgeAwareness ? 'bg-primary' : 'bg-gray-300'}`}
                      >
                        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${edgeAwareness ? 'right-0.5' : 'left-0.5'}`} />
                      </button>
                    </div>
                    
                    {edgeAwareness && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[9px] text-gray-400 font-bold uppercase">
                          <span>Furniture Avoidance</span>
                          <span>{edgeSensitivity}%</span>
                        </div>
                        <input 
                          type="range" min="10" max="100" step="1"
                          value={edgeSensitivity} 
                          onChange={(e) => setEdgeSensitivity(parseInt(e.target.value))} 
                          className="w-full accent-primary h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-[10px] text-gray-500 leading-tight">
                  <span className="font-bold text-primary">TIP:</span> "Wall-Only Guard" detects object edges to stop paint from leaking into furniture.
                </p>
              </div>
            )}

            {selectionMode === "brush" && (
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                <div className="flex items-center justify-between font-bold text-primary text-sm uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">line_weight</span>
                    <span>Brush Size</span>
                  </div>
                  <span className="bg-primary/10 px-3 py-1 rounded-full text-xs">
                    {brushSize <= 12 ? 'Small' : brushSize <= 30 ? 'Medium' : 'Large'}
                  </span>
                </div>
                
                <div className="px-2">
                  <div className="flex justify-between text-[10px] text-gray-400 font-bold mb-2 uppercase tracking-tighter">
                    <span>Small</span>
                    <span className="ml-4">Medium</span>
                    <span>Large</span>
                  </div>
                  <input 
                    type="range" 
                    min="5" 
                    max="60" 
                    step="1"
                    value={brushSize} 
                    onChange={(e) => setBrushSize(parseInt(e.target.value))} 
                    className="w-full accent-primary h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            )}

          {/* ROOM GALLERY */}
          <div className="bg-white rounded-2xl p-4 shadow-xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="text-sm font-bold text-primary uppercase tracking-widest">Project Photos</h3>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="text-[10px] bg-primary/10 text-primary px-3 py-1 rounded-full font-black hover:bg-primary/20 transition-all uppercase"
              >
                + Add Room
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-2">
              {rooms.map((room) => (
                <div 
                  key={room.id}
                  onClick={() => handleSwitchRoom(room.id)}
                  className={`relative min-w-[120px] h-20 rounded-xl cursor-pointer overflow-hidden transition-all border-2 ${
                    activeRoomId === room.id ? "border-primary shadow-lg scale-105" : "border-transparent grayscale hover:grayscale-0"
                  }`}
                >
                  <img src={room.image} className="w-full h-full object-cover" alt={room.name} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-bottom p-2">
                    <span className="text-[10px] font-bold text-white mt-auto truncate">{room.name}</span>
                  </div>
                  {activeRoomId === room.id && (
                    <div className="absolute top-1 right-1 bg-primary text-white p-0.5 rounded-full shadow-lg">
                      <span className="material-symbols-outlined text-[10px] font-bold">check</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
              <button 
                onClick={handleSaveProject}
                className="flex items-center justify-center gap-2 bg-primary/10 text-primary py-2.5 rounded-xl font-bold text-xs hover:bg-primary/20 transition-colors"
                title="Save current progress to browser"
              >
                <span className="material-symbols-outlined text-sm">save</span>
                Save Project
              </button>
              <button 
                onClick={handleLoadProject}
                className="flex items-center justify-center gap-2 bg-primary/10 text-primary py-2.5 rounded-xl font-bold text-xs hover:bg-primary/20 transition-colors"
                title="Load previously saved progress"
              >
                <span className="material-symbols-outlined text-sm">folder_open</span>
                Load Project
              </button>
              <div className="flex bg-gray-100 p-1 rounded-xl shadow-inner gap-1">
                <button 
                  onClick={handleUndo}
                  className="w-full flex items-center justify-center gap-1 bg-white text-primary py-1.5 rounded-lg font-bold text-[10px] uppercase shadow-sm hover:bg-gray-50 transition-all"
                  title="Undo last stroke"
                >
                  <span className="material-symbols-outlined text-xs">undo</span>
                  Undo Last Stroke
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 bg-white border-2 border-primary text-primary py-3 rounded-xl font-bold hover:bg-primary/5 transition-colors"
                title="Upload floor or room photo"
              >
                <span className="material-symbols-outlined">upload</span>
                Upload
              </button>
              <button 
                onClick={handleFillGaps}
                className="flex items-center justify-center gap-2 bg-white border-2 border-primary text-primary py-3 rounded-xl font-bold hover:bg-primary/5 transition-colors"
                title="Fix small gaps in painting"
              >
                <span className="material-symbols-outlined">auto_fix</span>
                Fill Gaps
              </button>
              <button 
                onClick={handleClearAll}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all shadow-sm ${
                  showClearConfirm 
                    ? "bg-red-600 text-white border-2 border-red-700" 
                    : "bg-red-50 border-2 border-red-200 text-red-600 hover:bg-red-100"
                }`}
                title="Reset all colors on the canvas"
              >
                <span className="material-symbols-outlined">
                  {showClearConfirm ? "warning" : "delete_forever"}
                </span>
                {showClearConfirm ? "Confirm Clear?" : "Clear All"}
              </button>
            </div>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            multiple 
            onChange={handleAddRoom} 
          />
        </div>

        {/* RIGHT COLUMN: Controls Panel */}
        <div className="w-full lg:w-[400px] space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-primary mb-4">Step 2: Find Your Shade</h2>
              <div className="relative">
                <input 
                  type="text"
                  placeholder="Search shade name or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full p-4 pl-12 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                />
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                
                <AnimatePresence>
                  {searchQuery.trim() !== "" && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                      className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden"
                    >
                      {filteredShades.length > 0 ? (
                        filteredShades.map((shade) => (
                          <div 
                            key={shade.jswCode} onClick={() => handleSelectShade(shade)}
                            className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                          >
                            <div className="w-10 h-10 rounded-lg shadow-inner" style={{ backgroundColor: shade.code }}></div>
                            <div>
                              <p className="font-bold text-primary">{shade.name}</p>
                              <p className="text-sm text-gray-500 uppercase">JSW {shade.jswCode}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-gray-500 italic">Shade not found — try another code</div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* PROJECT PALETTE (Multiple Color Options) */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-primary uppercase tracking-widest">My Selected Shades</h3>
                <span className="text-[10px] text-gray-400 font-bold">{projectPalette.length}/10</span>
              </div>
              
              <div className="flex flex-wrap gap-3">
                {projectPalette.map((shade) => (
                  <div key={shade.code} className="group relative">
                    <button 
                      onClick={() => setSelectedShade(shade)}
                      className={`w-12 h-12 rounded-xl transition-all shadow-md relative overflow-hidden border-2 ${
                        selectedShade.code === shade.code ? "border-primary ring-2 ring-primary/20 scale-110" : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: shade.code }}
                      title={shade.name}
                    >
                      {selectedShade.code === shade.code && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                          <span className="material-symbols-outlined text-white text-sm">check</span>
                        </div>
                      )}
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeFromPalette(shade.code); }}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <span className="material-symbols-outlined text-[10px]">close</span>
                    </button>
                    <div className="absolute top-14 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[9px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30">
                      {shade.name}
                    </div>
                  </div>
                ))}
                {projectPalette.length === 0 && (
                  <p className="text-[10px] text-gray-400 italic py-2">Add shades from search to start your palette</p>
                )}
              </div>
            </div>

            {/* ROOM PALETTE (Colors already used in canvas) */}
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 space-y-4">
              <h3 className="text-xs font-bold text-primary uppercase tracking-widest text-center">In Current Room</h3>
              <div className="flex flex-wrap justify-center gap-2">
                {shadePalette.length > 0 ? shadePalette.map((shade, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setSelectedShade(shade as Shade)}
                    className={`group relative w-10 h-10 rounded-full border-4 transition-all hover:scale-110 ${
                      selectedShade.code === shade.code ? "border-primary shadow-lg" : "border-white"
                    }`}
                    style={{ backgroundColor: shade.code }}
                    title={shade.name}
                  >
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                      {shade.name}
                    </div>
                  </button>
                )) : (
                  <div className="text-[10px] text-gray-400 italic">No colors applied yet</div>
                )}
              </div>
            </div>

            {/* COLOR PREVIEW BOX */}
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 space-y-4 text-center">
              <div className="w-20 h-20 rounded-2xl shadow-lg mx-auto border-4 border-white" style={{ backgroundColor: selectedShade.code }}></div>
              <div>
                <h3 className="text-xl font-bold text-primary">{selectedShade.name}</h3>
                <p className="text-sm font-medium text-gray-500 uppercase">JSW {selectedShade.jswCode}</p>
                <p className="text-xs font-mono text-gray-400 mt-1">{selectedShade.code.toUpperCase()}</p>
              </div>
            </div>

            {/* SLIDERS */}
            <div className="space-y-6">
              {selectionMode === "magic" && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="bg-primary/5 rounded-xl p-4 border border-primary/10 space-y-4"
                >
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-2">Magic Wand Settings</p>
                  
                  {/* PRESETS */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <button 
                      onClick={() => {
                        setMagicSensitivity(62); 
                        setEdgeSensitivity(85); 
                        setEdgeAwareness(true);
                        setMagicFeathering(2);
                        setSurfaceType("ceiling");
                        setBoundaryLock(false);
                      }}
                      className={`flex flex-col items-center gap-1 p-2 border rounded-lg transition-all group ${surfaceType === "ceiling" ? "bg-primary/10 border-primary shadow-sm" : "bg-white border-primary/20 hover:border-primary"}`}
                    >
                      <span className={`material-symbols-outlined text-lg group-hover:scale-110 transition-transform ${surfaceType === "ceiling" ? "text-primary" : "text-gray-400"}`}>roofing</span>
                      <span className="text-[9px] font-bold uppercase tracking-wider">Ceiling Preset</span>
                    </button>
                    <button 
                      onClick={() => {
                        setMagicSensitivity(28); 
                        setEdgeSensitivity(98);
                        setEdgeAwareness(true);
                        setBoundaryLock(true); // Wall mode enables lock
                        setMagicFeathering(1);
                        setSurfaceType("wall");
                      }}
                      className={`flex flex-col items-center gap-1 p-2 border rounded-lg transition-all group ${surfaceType === "wall" ? "bg-primary/10 border-primary shadow-sm" : "bg-white border-primary/20 hover:border-primary"}`}
                    >
                      <span className={`material-symbols-outlined text-lg group-hover:scale-110 transition-transform ${surfaceType === "wall" ? "text-primary" : "text-gray-400"}`}>foundation</span>
                      <span className="text-[9px] font-bold uppercase tracking-wider">Wall Preset</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between bg-white border border-primary/10 rounded-lg p-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-primary">lock</span>
                      <span className="text-[10px] font-bold text-gray-600 uppercase">Boundary Lock</span>
                    </div>
                    <button 
                      onClick={() => setBoundaryLock(!boundaryLock)}
                      className={`w-8 h-4 rounded-full transition-colors relative ${boundaryLock ? 'bg-primary' : 'bg-gray-300'}`}
                    >
                      <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${boundaryLock ? 'right-0.5' : 'left-0.5'}`} />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase">
                      <label>Fill Accuracy</label>
                      <span>{magicSensitivity}%</span>
                    </div>
                    <input 
                      type="range" min="1" max="100" value={magicSensitivity} 
                      onChange={(e) => setMagicSensitivity(parseInt(e.target.value))} 
                      className="w-full accent-primary h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 uppercase">
                      <label>Edge Guarding</label>
                      <button 
                        onClick={() => setEdgeAwareness(!edgeAwareness)}
                        className={`w-8 h-4 rounded-full transition-colors relative ${edgeAwareness ? 'bg-primary' : 'bg-gray-300'}`}
                      >
                        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${edgeAwareness ? 'right-0.5' : 'left-0.5'}`} />
                      </button>
                    </div>
                    {edgeAwareness && (
                      <div className="pt-1">
                        <div className="flex justify-between text-[8px] font-bold text-gray-400 uppercase mb-1">
                          <label>Boundary Strength</label>
                          <span>{edgeSensitivity}%</span>
                        </div>
                        <input 
                          type="range" min="1" max="100" value={edgeSensitivity} 
                          onChange={(e) => setEdgeSensitivity(parseInt(e.target.value))} 
                          className="w-full accent-primary h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase">
                      <label>Edge Smoothing</label>
                      <span>{magicFeathering}px</span>
                    </div>
                    <input 
                      type="range" min="0" max="10" value={magicFeathering} 
                      onChange={(e) => setMagicFeathering(parseInt(e.target.value))} 
                      className="w-full accent-primary h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {surfaceType === "wall" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="pt-2"
                    >
                      <button
                        disabled={isProcessingAll}
                        onClick={handlePaintAllWalls}
                        className={`w-full py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                          isProcessingAll 
                            ? 'bg-gray-100 text-gray-400 cursor-wait' 
                            : 'bg-primary text-white hover:bg-primary/90 shadow-md active:scale-95'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">
                          {isProcessingAll ? 'sync' : 'auto_mode'}
                        </span>
                        {isProcessingAll ? 'Analyzing Room Surfaces...' : 'Paint All Walls (Global)'}
                      </button>
                      <p className="text-[8px] text-gray-400 mt-2 text-center leading-relaxed">
                        Applies current shade to all wall surfaces in your project
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {selectionMode === "brush" && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase">
                      <label>Brush Size</label>
                      <span>{brushSize}px</span>
                    </div>
                    <input 
                      type="range" min="5" max="100" value={brushSize} 
                      onChange={(e) => setBrushSize(parseInt(e.target.value))} 
                      className="w-full accent-primary h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </motion.div>
              )}

              <div className="space-y-3 pt-2 border-t border-gray-100">
                <div className="flex justify-between items-center text-sm font-bold text-primary">
                  <label>PAINT OPACITY</label>
                  <span>{intensity}%</span>
                </div>
                <input 
                  type="range" min="10" max="100" value={intensity} 
                  onChange={(e) => setIntensity(parseInt(e.target.value))} 
                  className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm font-bold text-primary">
                  <label>TEXTURE DEPTH</label>
                  <span>{texturePreservation}%</span>
                </div>
                <input 
                  type="range" min="0" max="100" value={texturePreservation} 
                  onChange={(e) => setTexturePreservation(parseInt(e.target.value))} 
                  className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* WHATSAPP BUTTON */}
            <button 
              onClick={handleBook}
              className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white py-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-lg active:scale-95"
            >
              <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" className="w-6 h-6 brightness-0 invert" alt="WhatsApp" />
              Book Free Consultation
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
