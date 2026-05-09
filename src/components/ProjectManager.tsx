import React, { useState } from 'react';
import { Shade } from '../types';
import { jsPDF } from 'jspdf';

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
    const text = `Hello! Here is your JSW Paints colour suggestion from Vishnu Paints, Darsi:
Shade: ${c.shade.name} (JSW Code: ${c.shade.jswCode}) | Colour: ${c.shade.code}
Room: ${c.roomType}
Notes: ${c.notes || 'None'}
${c.calculatorSummary ? `\nEstimate:\n${c.calculatorSummary}` : ''}

Visit us: Main Road, Darsi | Call: +91-9440052968`;
    
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
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6 shrink-0">
        <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-sm">person_add</span>
          New Consultation
        </h3>
        
        <div className="space-y-3">
          <input 
            type="text" 
            placeholder="Customer Name *" 
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          />
          <input 
            type="tel" 
            placeholder="Phone Number (Optional)" 
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          />
          <select 
            value={roomType}
            onChange={e => setRoomType(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          >
            <option value="Hall">Hall</option>
            <option value="Bedroom">Bedroom</option>
            <option value="Kitchen">Kitchen</option>
            <option value="Exterior">Exterior</option>
            <option value="Other">Other</option>
          </select>
          <textarea 
            placeholder="Notes (Optional)" 
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none h-20"
          />
          
          <button 
            onClick={handleSave}
            disabled={!name || !selectedShade}
            className={`w-full py-2.5 rounded-lg text-sm font-bold transition-all active:scale-96 ${!name || !selectedShade ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20'}`}
          >
            Save Consultation
          </button>
          {!selectedShade && <p className="text-xs text-orange-500 text-center">Select a shade first to save.</p>}
        </div>
      </div>

      {/* List */}
      <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2 shrink-0">
        <span className="material-symbols-outlined text-primary text-sm">folder_open</span>
        Saved Consultations
      </h3>
      
      <div className="flex-1 overflow-y-auto pr-2 space-y-3 pb-4">
        {consultations.length === 0 ? (
          <div className="text-center py-10 px-4 bg-gray-50 rounded-xl border border-gray-100 border-dashed">
            <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">assignment</span>
            <p className="text-xs text-gray-500">No consultations saved yet. Select a shade and fill in customer details above to save your first consultation.</p>
          </div>
        ) : (
          consultations.map(c => (
            <div key={c.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm consultation-print-card relative">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="text-sm font-bold text-gray-800">{c.customerName}</h4>
                  <p className="text-[10px] text-gray-500">{new Date(c.timestamp).toLocaleString()} • {c.roomType}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full shadow-inner border border-gray-200" style={{ backgroundColor: c.shade.code }}></div>
                  <div className="text-right">
                    <div className="text-[11px] font-bold text-gray-800">{c.shade.name}</div>
                    <div className="text-[10px] text-gray-500">{c.shade.jswCode}</div>
                  </div>
                </div>
              </div>
              
              {c.notes && (
                <p className="text-xs text-gray-600 mb-3 bg-gray-50 p-2 rounded truncate">{c.notes}</p>
              )}
              
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 print:hidden">
                <button onClick={() => onLoadConsultation(c.shade)} className="flex-1 text-xs font-bold text-primary bg-primary/5 hover:bg-primary/10 py-1.5 rounded transition-colors">
                  Load
                </button>
                <button onClick={() => handleWhatsApp(c)} className="flex items-center justify-center w-8 h-8 rounded bg-green-50 text-green-600 hover:bg-green-100 transition-colors" title="Share on WhatsApp">
                  <span className="material-symbols-outlined text-[18px]">chat</span>
                </button>
                <button onClick={() => handleDownloadPDF(c)} className="flex items-center justify-center w-8 h-8 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors" title="Download PDF">
                  <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                </button>
                <button onClick={() => window.print()} className="flex items-center justify-center w-8 h-8 rounded bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors" title="Print">
                  <span className="material-symbols-outlined text-[18px]">print</span>
                </button>
                <button onClick={() => handleDelete(c.id)} className="flex items-center justify-center w-8 h-8 rounded bg-red-50 text-red-500 hover:bg-red-100 transition-colors" title="Delete">
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
