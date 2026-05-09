export interface PaintType {
  id: string;
  name: string;
  rate: number;
}

export const PAINT_TYPES: PaintType[] = [
  { id: 'interior', name: 'Interior Emulsion', rate: 12 },
  { id: 'exterior', name: 'Exterior Weather Coat', rate: 8 },
  { id: 'texture', name: 'Texture Paint', rate: 4 },
  { id: 'primer', name: 'Primer', rate: 10 },
];

export interface PaintEstimateInput {
  length: number;
  width: number;
  height: number;
  doors: number;
  windows: number;
  includeCeiling: boolean;
  coats: number;
  paintTypeId: string;
}

export interface PaintEstimateResult {
  area: string;
  litres: number;
  packCombo: string;
}

export function calculatePaintEstimate(input: PaintEstimateInput): PaintEstimateResult | null {
  const { length, width, height, doors, windows, includeCeiling, coats, paintTypeId } = input;

  if (length === 0 || width === 0 || height === 0) return null;

  let netArea = 2 * (length + width) * height;
  netArea -= (doors * 1.8);
  netArea -= (windows * 1.2);
  if (netArea < 0) netArea = 0;

  if (includeCeiling) {
    netArea += (length * width);
  }

  const selectedPaint = PAINT_TYPES.find(p => p.id === paintTypeId);
  const rate = selectedPaint?.rate || 12;

  const totalLitresExact = (netArea / rate) * coats;
  const totalLitres = Math.ceil(totalLitresExact * 2) / 2; // Round up to nearest 0.5L

  // Calculate packs (20L, 10L, 4L, 1L)
  let remaining = totalLitres;
  const packs: Record<number, number> = { 20: 0, 10: 0, 4: 0, 1: 0 };
  
  packs[20] = Math.floor(remaining / 20);
  remaining %= 20;
  
  packs[10] = Math.floor(remaining / 10);
  remaining %= 10;
  
  packs[4] = Math.floor(remaining / 4);
  remaining %= 4;
  
  if (remaining > 0) packs[1] = Math.ceil(remaining);

  const packStrings = [];
  if (packs[20] > 0) packStrings.push(`${packs[20]} x 20L`);
  if (packs[10] > 0) packStrings.push(`${packs[10]} x 10L`);
  if (packs[4] > 0) packStrings.push(`${packs[4]} x 4L`);
  if (packs[1] > 0) packStrings.push(`${packs[1]} x 1L`);

  return {
    area: netArea.toFixed(1),
    litres: totalLitres,
    packCombo: packStrings.join(' + ') + ` = ${totalLitres}L`
  };
}
