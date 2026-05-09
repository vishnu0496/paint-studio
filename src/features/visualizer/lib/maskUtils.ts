/**
 * Mask utility functions for the Vishnu Paints Colour Visualizer.
 * 
 * - Most utilities (morphology, flood fill, etc.) are pure typed-array helpers.
 * - createPolygonMask uses an offscreen DOM canvas and must run in a browser-like environment.
 * - None of these functions depend on React state.
 */

export interface PaintedArea {
  mask: Uint8Array;
  color: string;
}

/**
 * Creates a deep copy of the painted areas array and its Uint8Array masks.
 */
export const clonePaintedAreas = (areas: PaintedArea[]): PaintedArea[] => {
  return areas.map(area => ({ 
    color: area.color, 
    mask: new Uint8Array(area.mask) 
  }));
};

/**
 * Checks if a mask contains any painted pixels.
 */
export const maskHasPaint = (mask: Uint8Array): boolean => {
  for (let i = 0; i < mask.length; i++) {
    if (mask[i] === 1) return true;
  }
  return false;
};

/**
 * Calculates the percentage of the image covered by the mask.
 */
export const getMaskCoverage = (mask: Uint8Array): number => {
  if (mask.length === 0) return 0;
  let painted = 0;
  for (let i = 0; i < mask.length; i++) {
    if (mask[i] === 1) painted++;
  }
  return painted / mask.length;
};

/**
 * Merges two masks using either additive (OR) or subtractive (AND NOT) logic.
 */
export const mergeMask = (base: Uint8Array, addition: Uint8Array, subtract: boolean): Uint8Array => {
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

/**
 * Draws a circle on a mask Uint8Array.
 */
export const drawCircleOnMask = (
  mask: Uint8Array, 
  centerX: number, 
  centerY: number, 
  radius: number, 
  width: number, 
  height: number
): void => {
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

/**
 * Draws a line on a mask Uint8Array by interpolating between two points.
 */
export const drawLineOnMask = (
  mask: Uint8Array, 
  x0: number, 
  y0: number, 
  x1: number, 
  y1: number, 
  radius: number, 
  width: number, 
  height: number
): void => {
  const distance = Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2));
  const stepSize = Math.max(1, radius / 8);
  const steps = Math.max(1, Math.ceil(distance / stepSize));

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const curX = x0 + (x1 - x0) * t;
    const curY = y0 + (y1 - y0) * t;
    drawCircleOnMask(mask, curX, curY, radius, width, height);
  }
};

/**
 * Creates a mask from a set of polygon points using a temporary canvas.
 */
export const createPolygonMask = (
  points: { x: number; y: number }[], 
  width: number, 
  height: number
): Uint8Array => {
  const mask = new Uint8Array(width * height);
  if (points.length < 3) return mask;

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const ctx = tempCanvas.getContext('2d');
  
  if (ctx) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
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
  
  return mask;
};

/**
 * Basic morphology to fill small pinholes in a mask.
 */
export const fillPinholes = (mask: Uint8Array, width: number, height: number, passes = 2): Uint8Array => {
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

/**
 * Removes small islands of painted pixels from a mask.
 */
export const removeSmallMaskIslands = (
  mask: Uint8Array, 
  width: number, 
  height: number, 
  minPixels: number
): Uint8Array => {
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

/**
 * Keeps only the mask components connected to the top edge (useful for ceiling masks).
 */
export const keepTopConnectedMask = (mask: Uint8Array, width: number, height: number): Uint8Array => {
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

/**
 * Removes vertical 'drips' from a ceiling mask based on a boundary map.
 */
export const removeCeilingDrips = (
  mask: Uint8Array, 
  width: number, 
  height: number, 
  boundaryMap?: Int32Array
): Uint8Array => {
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

/**
 * Protects detailed objects (like furniture) from being painted by checking edge and chroma density.
 */
export const protectDetailedObjects = (
  mask: Uint8Array, 
  width: number, 
  height: number, 
  pixels: Uint8ClampedArray | Uint8Array,
  label: "wall" | "ceiling"
): Uint8Array => {
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

/**
 * Ensures that the new mask does not overlap with existing painted areas (except the same color).
 */
export const protectExistingPaint = (
  mask: Uint8Array, 
  paintedAreas: PaintedArea[], 
  currentColorCode: string
): Uint8Array => {
  const result = new Uint8Array(mask);
  paintedAreas.forEach(area => {
    if (area.color === currentColorCode || area.mask.length !== result.length) return;
    for (let i = 0; i < result.length; i++) {
      if (area.mask[i] === 1) result[i] = 0;
    }
  });
  return result;
};

/**
 * Expands a binary mask into corners using color similarity and gradient awareness.
 */
export const expandMaskByColorSimilarity = (
  binaryMask: Uint8Array,
  pixels: Uint8ClampedArray | Uint8Array,
  width: number,
  height: number,
  startX: number,
  startY: number
): Uint8Array => {
  const expanded = new Uint8Array(binaryMask.length);
  const startIdx = Math.floor(startY) * width + Math.floor(startX);
  const sr = pixels[startIdx * 4], sg = pixels[startIdx * 4 + 1], sb = pixels[startIdx * 4 + 2];
  
  const q = [startIdx];
  const v = new Uint8Array(width * height);
  v[startIdx] = 1;
  expanded[startIdx] = 1;
  
  let head = 0;
  while(head < q.length && q.length < width * height * 0.95) {
    const idx = q[head++];
    const x = idx % width, y = idx / width | 0;
    
    for (const [dx, dy] of [[0,1],[0,-1],[1,0],[-1,0]]) {
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const ni = ny * width + nx;
        if (!v[ni]) {
          v[ni] = 1;
          const p = ni * 4;
          
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
          
          const isSharpEdge = edgeStrength > 45;
          
          if (binaryMask[ni] === 1 || (!isSharpEdge && colorDiff < 55)) {
            expanded[ni] = 1;
            q.push(ni);
          }
        }
      }
    }
  }
  return expanded;
};
