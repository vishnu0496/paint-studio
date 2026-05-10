import React, { useState } from 'react';
import { Room, Shade } from '../../../types';
import { CONTACT_INFO, COLOR_DISCLAIMER, JSW_PAINTS_COLLECTIONS } from '../../../constants';

interface QuotePanelProps {
  rooms: Room[];
  activeRoomId: string;
  currentPaintedAreas: { color: string }[];
  lastCalculatorSummary?: string;
}

export function QuotePanel({ rooms, activeRoomId, currentPaintedAreas, lastCalculatorSummary }: QuotePanelProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');

  // Helper to find shade by hex code
  const allShades = JSW_PAINTS_COLLECTIONS[0].shades;
  const findShadeByCode = (hex: string) => {
    return allShades.find(s => s.code.toLowerCase() === hex.toLowerCase());
  };

  // Get summary of all rooms and shades
  const roomSummaries = rooms.map(room => {
    const areas = room.id === activeRoomId ? currentPaintedAreas : room.paintedAreas;
    if (areas.length === 0) return null;
    
    // Get unique colors and their shade info
    const hexColors = Array.from(new Set(areas.map(a => a.color)));
    const shades = hexColors.map(hex => findShadeByCode(hex)).filter((s): s is Shade => !!s);
    
    return {
      name: room.name,
      shades
    };
  }).filter((r): r is { name: string, shades: Shade[] } => r !== null);

  const handleSendWhatsApp = () => {
    if (!customerName || !customerMobile) {
      alert("Please enter customer name and mobile number.");
      return;
    }

    if (roomSummaries.length === 0) {
      alert("Please paint at least one room before generating a quote.");
      return;
    }

    const roomText = roomSummaries.map(r => {
      const shadeList = r.shades.map(s => `${s.name} (${s.jswCode})`).join(', ');
      return `- *${r.name}*: ${shadeList}`;
    }).join('\n');


    const message = `*Vishnu Paints Colour Preview*\n\n` +
      `*Customer:* ${customerName}\n` +
      `*Mobile:* ${customerMobile}\n\n` +
      `*Selected JSW Shades:*\n${roomText}\n\n` +
      (lastCalculatorSummary ? `*Estimate Summary:*\n${lastCalculatorSummary}\n\n` : '') +
      `*Request:* Please confirm shade availability and price.\n\n` +
      `_${COLOR_DISCLAIMER}_`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${CONTACT_INFO.whatsapp}?text=${encodedMessage}`, '_blank');
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 bg-slate-50 border-b border-border shrink-0">
        <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg">description</span>
          Project Quote Summary
        </h3>
        <p className="text-[10px] text-text-secondary mt-1 uppercase tracking-wider">Generate in-shop preview for customer</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {/* Customer Details */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Customer Details</h4>
          <div className="space-y-2">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-sm text-text-secondary">person</span>
              <input 
                type="text" 
                placeholder="Customer Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-border rounded-lg text-sm focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-sm text-text-secondary">call</span>
              <input 
                type="tel" 
                placeholder="Mobile Number"
                value={customerMobile}
                onChange={(e) => setCustomerMobile(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-border rounded-lg text-sm focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
          </div>
        </div>

        {/* Room Summary */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Selected Shades</h4>
          {roomSummaries.length > 0 ? (
            <div className="space-y-3">
              {roomSummaries.map((summary, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-border">
                  <div className="text-[10px] font-bold text-primary uppercase mb-2 tracking-wider">{summary.name}</div>
                  <div className="space-y-2">
                    {summary.shades.map((shade, sIdx) => (
                      <div key={sIdx} className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full shadow-sm border border-white" style={{ backgroundColor: shade.code }} />
                        <span className="text-xs text-text-primary font-medium">{shade.name}</span>
                        <span className="text-[10px] text-text-secondary font-bold ml-auto">JSW {shade.jswCode}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-border">
              <span className="material-symbols-outlined text-slate-300 text-4xl mb-2">palette</span>
              <p className="text-xs text-text-secondary italic">No rooms painted yet. Use manual or AI tools to select colours.</p>
            </div>
          )}
        </div>

        {/* Estimate Summary */}
        {lastCalculatorSummary && (
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Paint Estimate</h4>
            <div className="p-3 bg-soft-blue/10 rounded-xl border border-soft-blue/20">
              <pre className="text-[11px] text-primary font-mono whitespace-pre-wrap leading-relaxed">
                {lastCalculatorSummary}
              </pre>
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="p-3 bg-jsw-red/5 rounded-xl border border-jsw-red/10 flex gap-2">
          <span className="material-symbols-outlined text-jsw-red text-sm shrink-0">info</span>
          <p className="text-[10px] text-jsw-red/80 font-medium leading-relaxed italic">
            {COLOR_DISCLAIMER}
          </p>
        </div>
      </div>

      <div className="p-4 bg-slate-50 border-t border-border shrink-0">
        <button
          onClick={handleSendWhatsApp}
          className="w-full flex items-center justify-center gap-2 py-3 bg-[#25D366] text-white rounded-xl font-bold shadow-lg shadow-green-200 hover:brightness-105 active:scale-[0.98] transition-all"
        >
          <span className="material-symbols-outlined text-lg">send</span>
          Send To Vishnu Paints
        </button>
      </div>
    </div>
  );
}
