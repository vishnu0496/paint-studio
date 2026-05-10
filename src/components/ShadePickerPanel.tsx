import React, { useState, useMemo, useEffect } from 'react';
import { Shade } from '../types';
import { JSW_SHADES_CATALOGUE } from '../data/jswShades';
import { searchShades } from '../features/visualizer/lib/shadeSearch';
import { COLOR_DISCLAIMER } from '../constants';

interface ShadePickerPanelProps {
  selectedShade: Shade | null;
  onShadeSelect: (shade: Shade) => void;
}

export const ShadePickerPanel: React.FC<ShadePickerPanelProps> = ({ selectedShade, onShadeSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // We only support simple search now to keep the UI clean
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [compareTray, setCompareTray] = useState<Shade[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleShadeClick = (shade: Shade) => {
    if (isCompareMode) {
      setCompareTray(prev => {
        if (prev.find(s => s.code === shade.code)) return prev.filter(s => s.code !== shade.code);
        if (prev.length >= 4) return prev;
        return [...prev, shade];
      });
    } else {
      onShadeSelect(shade);
      if (navigator.vibrate) navigator.vibrate(10);
    }
  };

  const filteredShades = useMemo(() => {
    return searchShades(debouncedQuery, 24);
  }, [debouncedQuery]);

  return (
    <div className="flex flex-col h-full relative bg-white">
      <div className="p-4 shrink-0 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider">Shade Search</h2>
          <button 
            onClick={() => setIsCompareMode(!isCompareMode)}
            className={`text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-lg transition-all active:scale-95 border ${isCompareMode ? 'bg-primary text-white border-primary' : 'bg-white text-text-secondary border-border hover:bg-slate-50'}`}
          >
            {isCompareMode ? 'Done' : 'Compare'}
          </button>
        </div>
          
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary text-sm">search</span>
          <input 
            type="text" 
            placeholder="Search JSW code (e.g. 4809)..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder-text-secondary/50 shadow-sm"
          />
        </div>
      </div>
  
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {!debouncedQuery.trim() ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 opacity-70">
            <div className="w-16 h-16 rounded-full bg-soft-blue flex items-center justify-center mb-4 text-primary">
              <span className="material-symbols-outlined text-2xl">palette</span>
            </div>
            <p className="text-text-primary font-bold text-sm mb-1">Find Your Perfect Shade</p>
            <p className="text-text-secondary text-xs max-w-[200px] leading-relaxed">Type a JSW paint code or shade name above to see it applied instantly.</p>
          </div>
        ) : filteredShades.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 opacity-70">
            <span className="material-symbols-outlined text-4xl text-text-secondary mb-2">format_color_reset</span>
            <p className="text-text-primary font-bold text-sm mb-1">No Matches Found</p>
            <p className="text-text-secondary text-xs">Shade not found. Please confirm the code with the JSW shade card.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-4 gap-4 pb-8">
            {filteredShades.map((shade, idx) => {
              const isSelected = selectedShade?.code === shade.code && !isCompareMode;
              const isComparing = compareTray.some(s => s.code === shade.code);
              
              return (
                <div key={`${shade.code}-${idx}`} className="flex flex-col items-center group">
                  <div 
                    onClick={() => handleShadeClick(shade)}
                    className={`w-full aspect-square rounded-xl shadow-sm mb-2 relative cursor-pointer transition-transform hover:scale-105 active:scale-95 overflow-hidden ${isSelected ? 'ring-2 ring-primary ring-offset-2 scale-105' : 'border border-border'} ${isComparing ? 'ring-2 ring-primary/50 ring-offset-2' : ''}`}
                    style={{ backgroundColor: shade.code }}
                  >
                    {isSelected && (
                      <div className="absolute inset-0 bg-black/10 flex items-center justify-center backdrop-blur-[1px]">
                        <span className="material-symbols-outlined text-white drop-shadow-md text-sm">check</span>
                      </div>
                    )}
                    {isComparing && (
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <span className="text-white text-[8px] font-bold drop-shadow-md uppercase tracking-wider">Comp.</span>
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] font-bold text-text-primary text-center leading-tight w-full px-1 truncate">{shade.name}</span>
                  <span className="text-[8px] text-text-secondary uppercase tracking-widest mt-0.5">{shade.jswCode}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="px-4 py-3 bg-slate-50 border-t border-border">
        <p className="text-[9px] text-text-secondary leading-tight italic">
          {COLOR_DISCLAIMER}
        </p>
      </div>
  
      {/* Compare Tray */}
      {isCompareMode && (
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-border shadow-2xl flex flex-col z-50 rounded-t-2xl overflow-hidden animate-slide-up">
          <div className="flex justify-between items-center px-4 py-2 bg-slate-50 border-b border-border">
            <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest">Compare Shades</span>
            <button onClick={() => setCompareTray([])} className="text-[9px] font-bold text-jsw-red hover:opacity-70 uppercase tracking-widest transition-colors">Clear</button>
          </div>
          <div className="flex h-24">
            {compareTray.map((shade, i) => (
              <div key={i} className="flex-1 flex flex-col relative" style={{ backgroundColor: shade.code }}>
                <div className="absolute bottom-1.5 left-1.5 right-1.5 bg-white/90 backdrop-blur-sm rounded-lg p-1 text-center shadow-md">
                  <div className="text-[8px] font-bold text-text-primary truncate">{shade.name}</div>
                  <div className="text-[7px] text-text-secondary uppercase tracking-widest">{shade.jswCode}</div>
                </div>
              </div>
            ))}
            {Array.from({ length: Math.max(0, 4 - compareTray.length) }).map((_, i) => (
              <div key={`empty-${i}`} className="flex-1 bg-slate-100/50 border-r border-border flex items-center justify-center last:border-r-0">
                <span className="text-[8px] font-bold text-text-secondary/30 uppercase tracking-widest">Empty</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
