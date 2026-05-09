import React, { useState, useMemo } from 'react';

interface PaintCalculatorProps {
  onAddToQuote: (summary: string) => void;
}

const PAINT_TYPES = [
  { id: 'interior', name: 'Interior Emulsion', rate: 12 },
  { id: 'exterior', name: 'Exterior Weather Coat', rate: 8 },
  { id: 'texture', name: 'Texture Paint', rate: 4 },
  { id: 'primer', name: 'Primer', rate: 10 },
];

export const PaintCalculator: React.FC<PaintCalculatorProps> = ({ onAddToQuote }) => {
  const [length, setLength] = useState<string>('');
  const [width, setWidth] = useState<string>('');
  const [height, setHeight] = useState<string>('2.8');
  const [doors, setDoors] = useState<string>('1');
  const [windows, setWindows] = useState<string>('2');
  const [includeCeiling, setIncludeCeiling] = useState<boolean>(false);
  const [coats, setCoats] = useState<number>(2);
  const [paintType, setPaintType] = useState<string>('interior');

  const result = useMemo(() => {
    const l = parseFloat(length) || 0;
    const w = parseFloat(width) || 0;
    const h = parseFloat(height) || 0;
    const d = parseInt(doors) || 0;
    const win = parseInt(windows) || 0;

    if (l === 0 || w === 0 || h === 0) return null;

    let netArea = 2 * (l + w) * h;
    netArea -= (d * 1.8);
    netArea -= (win * 1.2);
    if (netArea < 0) netArea = 0;

    if (includeCeiling) {
      netArea += (l * w);
    }

    const selectedPaint = PAINT_TYPES.find(p => p.id === paintType);
    const rate = selectedPaint?.rate || 12;

    const totalLitresExact = (netArea / rate) * coats;
    const totalLitres = Math.ceil(totalLitresExact * 2) / 2; // Round up to nearest 0.5L

    // Calculate packs (20L, 10L, 4L, 1L)
    let remaining = totalLitres;
    const packs = { 20: 0, 10: 0, 4: 0, 1: 0 };
    
    packs[20] = Math.floor(remaining / 20);
    remaining %= 20;
    
    packs[10] = Math.floor(remaining / 10);
    remaining %= 10;
    
    packs[4] = Math.floor(remaining / 4);
    remaining %= 4;
    
    if (remaining > 0) packs[1] = Math.ceil(remaining); // Any remaining fraction requires a 1L bucket

    const packStrings = [];
    if (packs[20] > 0) packStrings.push(`${packs[20]} × 20L`);
    if (packs[10] > 0) packStrings.push(`${packs[10]} × 10L`);
    if (packs[4] > 0) packStrings.push(`${packs[4]} × 4L`);
    if (packs[1] > 0) packStrings.push(`${packs[1]} × 1L`);

    return {
      area: netArea.toFixed(1),
      litres: totalLitres,
      packCombo: packStrings.join(' + ') + ` = ${totalLitres}L`
    };
  }, [length, width, height, doors, windows, includeCeiling, coats, paintType]);

  const handleAddQuote = () => {
    if (!result) return;
    const typeName = PAINT_TYPES.find(p => p.id === paintType)?.name;
    const summary = `${typeName} for ${result.area} sqm (${coats} coats)\nRecommended packs: ${result.packCombo}`;
    onAddToQuote(summary);
  };

  return (
    <div className="flex flex-col h-full bg-white p-4">
      <div className="space-y-4 flex-1 overflow-y-auto pr-2 pb-4">
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Length (m) *</label>
            <input type="number" min="0" step="0.1" value={length} onChange={e => setLength(e.target.value)} className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Width (m) *</label>
            <input type="number" min="0" step="0.1" value={width} onChange={e => setWidth(e.target.value)} className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Height (m)</label>
            <input type="number" min="0" step="0.1" value={height} onChange={e => setHeight(e.target.value)} className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Doors (1.8 sqm)</label>
            <input type="number" min="0" value={doors} onChange={e => setDoors(e.target.value)} className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Windows (1.2 sqm)</label>
            <input type="number" min="0" value={windows} onChange={e => setWindows(e.target.value)} className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer p-2 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors">
          <input type="checkbox" checked={includeCeiling} onChange={e => setIncludeCeiling(e.target.checked)} className="rounded text-primary focus:ring-primary" />
          <span className="text-sm font-medium text-gray-700">Include Ceiling Area</span>
        </label>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-2">Number of Coats</label>
          <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-200">
            {[1, 2, 3].map(c => (
              <label key={c} className={`flex-1 text-center py-1.5 rounded-md text-sm font-medium cursor-pointer transition-all ${coats === c ? 'bg-white shadow-sm text-primary font-bold' : 'text-gray-500 hover:text-gray-800'}`}>
                <input type="radio" name="coats" value={c} checked={coats === c} onChange={() => setCoats(c)} className="hidden" />
                {c} Coat{c > 1 ? 's' : ''}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Paint Type</label>
          <select value={paintType} onChange={e => setPaintType(e.target.value)} className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
            {PAINT_TYPES.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.rate} sqm/L)</option>
            ))}
          </select>
        </div>

        {/* Results Card */}
        {result ? (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mt-4 text-center">
            <div className="text-xs font-bold text-primary mb-1 uppercase tracking-wider">Estimated Paint Required</div>
            <div className="text-4xl font-black text-gray-900 my-2">{result.litres} <span className="text-lg font-bold text-gray-500">L</span></div>
            <div className="text-xs text-gray-600 mb-4">For {result.area} sqm net area</div>
            
            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 text-sm font-bold text-gray-800">
              {result.packCombo}
            </div>
            
            <button 
              onClick={handleAddQuote}
              className="mt-4 w-full py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 transition-all active:scale-96 shadow-sm"
            >
              Add to Quote Notes
            </button>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-100 border-dashed rounded-xl p-6 text-center mt-4">
            <span className="material-symbols-outlined text-3xl text-gray-300 mb-2">calculate</span>
            <p className="text-xs text-gray-500">Enter room dimensions above to calculate paint requirements automatically.</p>
          </div>
        )}

      </div>
    </div>
  );
};
