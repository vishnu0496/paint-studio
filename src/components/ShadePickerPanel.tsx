import React, { useState, useMemo, useEffect } from 'react';
import { Shade } from '../types';
import { JSW_PAINTS_COLLECTIONS } from '../constants';

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
    if (!debouncedQuery.trim()) return [];
    
    // Flatten all shades from all collections for searching
    const allShades = JSW_PAINTS_COLLECTIONS.flatMap(c => c.shades);
    
    return allShades.filter(shade => {
      return shade.name.toLowerCase().includes(debouncedQuery.toLowerCase()) || 
             shade.jswCode.toLowerCase().includes(debouncedQuery.toLowerCase());
    }).slice(0, 16); // Limit to top 16 results to keep it extremely clean
  }, [debouncedQuery]);

  return (
    <div className="flex flex-col h-full relative">
      <div className="p-4 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-[#00113a] font-outfit">Shade Search</h2>
          <button 
            onClick={() => setIsCompareMode(!isCompareMode)}
            className={`text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-lg transition-all active:scale-95 border ${isCompareMode ? 'bg-[#00113a] text-white border-[#00113a]' : 'bg-transparent text-[#444650] border-black/10 hover:bg-black/5'}`}
          >
            {isCompareMode ? 'Done' : 'Compare'}
          </button>
        </div>
          
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#444650] text-sm">search</span>
          <input 
            type="text" 
            placeholder="Search JSW paint code (e.g. 4809)..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            className="w-full pl-11 pr-4 py-3 bg-white border border-black/10 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#00113a]/20 focus:border-[#00113a] transition-all placeholder-[#444650]/50 shadow-sm"
          />
        </div>
      </div>
  
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {!debouncedQuery.trim() ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 opacity-70">
            <div className="w-16 h-16 rounded-full bg-[#00113a]/5 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-2xl text-[#00113a]/40">palette</span>
            </div>
            <p className="text-[#00113a] font-bold text-sm mb-1">Find Your Perfect Shade</p>
            <p className="text-[#444650] text-xs max-w-[200px] leading-relaxed">Type a JSW paint code or shade name into the search bar above to see it applied instantly.</p>
          </div>
        ) : filteredShades.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 opacity-70">
            <span className="material-symbols-outlined text-4xl text-black/20 mb-2">format_color_reset</span>
            <p className="text-[#00113a] font-bold text-sm mb-1">No Matches Found</p>
            <p className="text-[#444650] text-xs">We couldn't find any JSW shade matching "{debouncedQuery}".</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4 pb-8">
            {filteredShades.map((shade, idx) => {
              const isSelected = selectedShade?.code === shade.code && !isCompareMode;
              const isComparing = compareTray.some(s => s.code === shade.code);
              
              return (
                <div key={`${shade.code}-${idx}`} className="flex flex-col items-center group">
                  <div 
                    onClick={() => handleShadeClick(shade)}
                    className={`w-full aspect-square rounded-2xl shadow-sm mb-2 relative cursor-pointer transition-transform hover:scale-105 active:scale-95 overflow-hidden ${isSelected ? 'ring-2 ring-[#00113a] ring-offset-2 scale-105' : 'border border-black/5'} ${isComparing ? 'ring-2 ring-[#00113a]/50 ring-offset-2' : ''}`}
                    style={{ backgroundColor: shade.code }}
                  >
                    {isSelected && (
                      <div className="absolute inset-0 bg-black/10 flex items-center justify-center backdrop-blur-[2px]">
                        <span className="material-symbols-outlined text-white drop-shadow-md">check</span>
                      </div>
                    )}
                    {isComparing && (
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold drop-shadow-md uppercase tracking-wider">Compare</span>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-[#00113a] text-center leading-tight w-full px-1 truncate">{shade.name}</span>
                  <span className="text-[8px] text-[#444650] uppercase tracking-widest mt-0.5">{shade.jswCode}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
  
      {/* Compare Tray */}
      {isCompareMode && (
        <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-black/10 shadow-[0_-10px_30px_rgba(0,0,0,0.1)] flex flex-col z-50 rounded-t-3xl overflow-hidden">
          <div className="flex justify-between items-center px-4 py-3 border-b border-black/5 bg-[#f8f9ff]">
            <span className="text-[10px] font-bold text-[#00113a] uppercase tracking-widest">Compare (Max 4)</span>
            <button onClick={() => setCompareTray([])} className="text-[10px] font-bold text-[#d92128] hover:text-[#d92128]/70 uppercase tracking-widest transition-colors">Clear</button>
          </div>
          <div className="flex h-32">
            {compareTray.map((shade, i) => (
              <div key={i} className="flex-1 flex flex-col relative border-r border-white/20" style={{ backgroundColor: shade.code }}>
                <div className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur-md rounded-lg p-1.5 text-center shadow-lg">
                  <div className="text-[9px] font-bold text-[#00113a] truncate">{shade.name}</div>
                  <div className="text-[8px] text-[#444650] uppercase tracking-widest">{shade.jswCode}</div>
                </div>
              </div>
            ))}
            {Array.from({ length: Math.max(0, 4 - compareTray.length) }).map((_, i) => (
              <div key={`empty-${i}`} className="flex-1 bg-black/5 border-r border-black/5 flex items-center justify-center">
                <span className="text-[10px] font-bold text-black/20 uppercase tracking-widest">Empty</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
