import React, { useState } from 'react';
import { Shade } from '../types';
import { jsPDF } from 'jspdf';
import { buildConsultationMessage } from '../features/visualizer/lib/quoteBuilder';

interface ProjectManagerProps {
  selectedShade: Shade | null;
  onLoadConsultation: (shade: Shade) => void;
  calculatorSummary?: string;
}

interface Consultation {
  id: string;
  timestamp: number;
  customerName: string;
  phone: string;
  roomType: string;
  notes: string;
  shade: Shade;
  calculatorSummary?: string;
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({ selectedShade, onLoadConsultation, calculatorSummary }) => {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [roomType, setRoomType] = useState('Hall');
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    if (!name || !selectedShade) return;
    
    const newConsultation: Consultation = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      customerName: name,
      phone,
      roomType,
      notes,
      shade: selectedShade,
      calculatorSummary: calculatorSummary || ''
    };

    setConsultations(prev => [newConsultation, ...prev]);
    setName('');
    setPhone('');
    setRoomType('Hall');
    setNotes('');
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this consultation?")) {
      setConsultations(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleWhatsApp = (c: Consultation) => {
    const text = buildConsultationMessage({
      customerName: c.customerName,
      roomType: c.roomType,
      shade: c.shade,
      notes: c.notes,
      calculatorSummary: c.calculatorSummary
    });
    
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleDownloadPDF = (c: Consultation) => {
    const doc = new jsPDF();
    const date = new Date(c.timestamp).toLocaleDateString();

    // Header
    doc.setFontSize(22);
    doc.setTextColor(1, 105, 111); // #01696f teal
    doc.text("VISHNU PAINTS & INTERIORS", 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text("Colour Consultation Summary", 105, 28, { align: 'center' });
    doc.line(20, 35, 190, 35);

    // Customer Info
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text(`Customer: ${c.customerName}`, 20, 45);
    doc.text(`Phone: ${c.phone || 'N/A'}`, 20, 52);
    doc.text(`Room Type: ${c.roomType}`, 20, 59);
    doc.text(`Date: ${date}`, 190, 45, { align: 'right' });

    doc.line(20, 65, 190, 65);

    // Shade Info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text("Selected Shade:", 20, 75);
    
    // Color Box
    const hex = c.shade.code;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    doc.setFillColor(r, g, b);
    doc.rect(20, 80, 40, 40, 'F');
    doc.setDrawColor(200);
    doc.rect(20, 80, 40, 40, 'S');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Shade: ${c.shade.name}`, 65, 85);
    doc.text(`JSW Code: ${c.shade.jswCode}`, 65, 92);
    doc.text(`Hex: ${c.shade.code}`, 65, 99);

    doc.line(20, 130, 190, 130);

    // Notes
    doc.setFont('helvetica', 'bold');
    doc.text("Notes:", 20, 140);
    doc.setFont('helvetica', 'normal');
    const splitNotes = doc.splitTextToSize(c.notes || 'None', 170);
    doc.text(splitNotes, 20, 147);

    // Paint Estimate
    if (c.calculatorSummary) {
        doc.line(20, 170, 190, 170);
        doc.setFont('helvetica', 'bold');
        doc.text("Paint Estimate:", 20, 180);
        doc.setFont('helvetica', 'normal');
        const splitSummary = doc.splitTextToSize(c.calculatorSummary, 170);
        doc.text(splitSummary, 20, 187);
    }

    // Footer
    doc.line(20, 270, 190, 270);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Main Road, Darsi, Prakasam District, AP 523247", 105, 277, { align: 'center' });
    doc.text("+91-9440052968 | vishnupaints.com", 105, 283, { align: 'center' });

    doc.save(`Vishnu-Paints-${c.customerName.replace(/\s+/g, '-')}-${date.replace(/\//g, '-')}.pdf`);
  };

  return (
    <div className="flex flex-col h-full bg-white p-4">
      {/* Save Form */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-border mb-6 shrink-0 shadow-sm">
        <h3 className="text-xs font-bold text-text-primary mb-4 uppercase tracking-wider flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-sm">person_add</span>
          New Consultation
        </h3>
        
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input 
              type="text" 
              placeholder="Name *" 
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2.5 text-xs bg-white border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
            <input 
              type="tel" 
              placeholder="Phone" 
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full px-3 py-2.5 text-xs bg-white border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
          </div>
          <select 
            value={roomType}
            onChange={e => setRoomType(e.target.value)}
            className="w-full px-3 py-2.5 text-xs bg-white border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none"
          >
            <option value="Hall">Living Hall</option>
            <option value="Bedroom">Bedroom</option>
            <option value="Kitchen">Kitchen Area</option>
            <option value="Exterior">Exterior Wall</option>
            <option value="Other">Other Space</option>
          </select>
          <textarea 
            placeholder="Notes (Optional)" 
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full px-3 py-2.5 text-xs bg-white border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none h-16 transition-all"
          />
          
          <button 
            onClick={handleSave}
            disabled={!name || !selectedShade}
            className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all active:scale-95 ${!name || !selectedShade ? 'bg-slate-200 text-text-secondary/50 cursor-not-allowed' : 'bg-primary text-white hover:brightness-110 shadow-md shadow-primary/10'}`}
          >
            Save History
          </button>
          {!selectedShade && <p className="text-[10px] text-jsw-red text-center font-bold uppercase tracking-tighter">Select a shade to save</p>}
        </div>
      </div>

      {/* List */}
      <h3 className="text-xs font-bold text-text-primary mb-3 uppercase tracking-wider flex items-center gap-2 shrink-0">
        <span className="material-symbols-outlined text-primary text-sm">folder_open</span>
        Saved History
      </h3>
      
      <div className="flex-1 overflow-y-auto pr-2 space-y-3 pb-4 custom-scrollbar">
        {consultations.length === 0 ? (
          <div className="text-center py-10 px-4 bg-slate-50 rounded-2xl border border-border border-dashed">
            <span className="material-symbols-outlined text-4xl text-text-secondary/20 mb-2">assignment</span>
            <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider leading-relaxed">No history saved yet</p>
          </div>
        ) : (
          consultations.map(c => (
            <div key={c.id} className="bg-white border border-border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all relative group">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 min-w-0 pr-4">
                  <h4 className="text-xs font-bold text-text-primary truncate">{c.customerName}</h4>
                  <p className="text-[9px] text-text-secondary font-bold uppercase tracking-tighter mt-0.5">
                    {new Date(c.timestamp).toLocaleDateString()} • {c.roomType}
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-border">
                  <div className="w-8 h-8 rounded-full shadow-inner border border-white" style={{ backgroundColor: c.shade.code }}></div>
                  <div className="text-right hidden sm:block">
                    <div className="text-[9px] font-bold text-text-primary truncate max-w-[80px]">{c.shade.name}</div>
                    <div className="text-[8px] text-text-secondary uppercase tracking-widest">{c.shade.jswCode}</div>
                  </div>
                </div>
              </div>
              
              {c.notes && (
                <p className="text-[10px] text-text-secondary mb-4 bg-slate-50/50 p-2 rounded-lg italic line-clamp-2">"{c.notes}"</p>
              )}
              
              <div className="grid grid-cols-5 gap-2 pt-3 border-t border-slate-100">
                <button onClick={() => onLoadConsultation(c.shade)} className="col-span-1 flex items-center justify-center p-2 rounded-lg bg-soft-blue text-primary hover:bg-primary hover:text-white transition-all" title="Load">
                  <span className="material-symbols-outlined text-sm">refresh</span>
                </button>
                <button onClick={() => handleWhatsApp(c)} className="col-span-1 flex items-center justify-center p-2 rounded-lg bg-green-50 text-success hover:bg-success hover:text-white transition-all" title="WhatsApp">
                  <span className="material-symbols-outlined text-sm">chat</span>
                </button>
                <button onClick={() => handleDownloadPDF(c)} className="col-span-1 flex items-center justify-center p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all" title="PDF">
                  <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                </button>
                <button onClick={() => window.print()} className="col-span-1 flex items-center justify-center p-2 rounded-lg bg-slate-50 text-text-secondary hover:bg-text-primary hover:text-white transition-all" title="Print">
                  <span className="material-symbols-outlined text-sm">print</span>
                </button>
                <button onClick={() => handleDelete(c.id)} className="col-span-1 flex items-center justify-center p-2 rounded-lg bg-red-50 text-jsw-red hover:bg-jsw-red hover:text-white transition-all" title="Delete">
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
