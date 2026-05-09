import React, { useState, useMemo } from 'react';
import { PAINT_TYPES, calculatePaintEstimate } from '../features/visualizer/lib/paintCalculator';

interface PaintCalculatorProps {
  onAddToQuote: (summary: string) => void;
}

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
    return calculatePaintEstimate({
      length: parseFloat(length) || 0,
      width: parseFloat(width) || 0,
      height: parseFloat(height) || 0,
      doors: parseInt(doors) || 0,
      windows: parseInt(windows) || 0,
      includeCeiling,
      coats,
      paintTypeId: paintType
    });
  }, [length, width, height, doors, windows, includeCeiling, coats, paintType]);

  const handleAddQuote = () => {
    if (!result) return;
    const typeName = PAINT_TYPES.find(p => p.id === paintType)?.name;
    const summary = `${typeName} for ${result.area} sqm (${coats} coats)\nRecommended packs: ${result.packCombo}`;
    onAddToQuote(summary);
  };

  return <div className="flex flex-col h-full bg-white p-4">
      <div className="space-y-4 flex-1 overflow-y-auto pr-2 pb-4 custom-scrollbar">
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-text-secondary mb-1 uppercase tracking-wider">Length (m)</label>
            <input type="number" min="0" step="0.1" value={length} onChange={e => setLength(e.target.value)} className="w-full px-3 py-2 text-sm bg-slate-50 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-text-secondary mb-1 uppercase tracking-wider">Width (m)</label>
            <input type="number" min="0" step="0.1" value={width} onChange={e => setWidth(e.target.value)} className="w-full px-3 py-2 text-sm bg-slate-50 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-text-secondary mb-1 uppercase tracking-wider">Height (m)</label>
            <input type="number" min="0" step="0.1" value={height} onChange={e => setHeight(e.target.value)} className="w-full px-3 py-2 text-sm bg-slate-50 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-text-secondary mb-1 uppercase tracking-wider">Doors</label>
            <input type="number" min="0" value={doors} onChange={e => setDoors(e.target.value)} className="w-full px-3 py-2 text-sm bg-slate-50 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-text-secondary mb-1 uppercase tracking-wider">Windows</label>
            <input type="number" min="0" value={windows} onChange={e => setWindows(e.target.value)} className="w-full px-3 py-2 text-sm bg-slate-50 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-50 rounded-xl border border-border hover:bg-slate-100 transition-colors">
          <input type="checkbox" checked={includeCeiling} onChange={e => setIncludeCeiling(e.target.checked)} className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary" />
          <span className="text-xs font-bold text-text-primary">Include Ceiling Area</span>
        </label>

        <div>
          <label className="block text-[10px] font-bold text-text-secondary mb-2 uppercase tracking-wider">Coats</label>
          <div className="flex bg-slate-50 p-1 rounded-lg border border-border">
            {[1, 2, 3].map(c => (
              <label key={c} className={`flex-1 text-center py-2 rounded-md text-xs font-bold cursor-pointer transition-all ${coats === c ? 'bg-white shadow-sm text-primary' : 'text-text-secondary hover:text-text-primary'}`}>
                <input type="radio" name="coats" value={c} checked={coats === c} onChange={() => setCoats(c)} className="hidden" />
                {c} Coat{c > 1 ? 's' : ''}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-text-secondary mb-1 uppercase tracking-wider">Paint Variant</label>
          <select value={paintType} onChange={e => setPaintType(e.target.value)} className="w-full px-3 py-2 text-sm bg-slate-50 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
            {PAINT_TYPES.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Results Card */}
        {result ? (
          <div className="bg-soft-blue/50 border border-primary/20 rounded-2xl p-6 mt-4 text-center animate-slide-up">
            <div className="text-[10px] font-bold text-primary mb-1 uppercase tracking-widest">Recommended Quantity</div>
            <div className="text-5xl font-black text-text-primary my-3">{result.litres}<span className="text-xl font-bold text-text-secondary ml-1">L</span></div>
            <div className="text-[10px] text-text-secondary mb-6 font-bold uppercase tracking-wider">For {result.area} SQM Net Area</div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm border border-border text-xs font-bold text-text-primary leading-relaxed">
              {result.packCombo}
            </div>
            
            <button 
              onClick={handleAddQuote}
              className="mt-6 w-full py-4 bg-primary text-white text-xs font-bold rounded-xl hover:brightness-110 transition-all active:scale-95 shadow-md uppercase tracking-widest"
            >
              Add to Quote Notes
            </button>
          </div>
        ) : (
          <div className="bg-slate-50 border border-border border-dashed rounded-2xl p-10 text-center mt-4">
            <span className="material-symbols-outlined text-4xl text-text-secondary/20 mb-3">calculate</span>
            <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider leading-relaxed">Enter room dimensions <br/> to calculate paint</p>
          </div>
        )}

      </div>
    </div>;
};
