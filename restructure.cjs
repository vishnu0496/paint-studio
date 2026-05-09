const fs = require('fs');

const file = 'src/pages/VisualizerPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add imports
if (!content.includes('ShadePickerPanel')) {
  content = content.replace(
    'import VisualizerCanvas from "../components/VisualizerCanvas";',
    `import VisualizerCanvas from "../components/VisualizerCanvas";
import { ShadePickerPanel } from '../components/ShadePickerPanel';
import { ProjectManager } from '../components/ProjectManager';
import { PaintCalculator } from '../components/PaintCalculator';`
  );
}

// 2. Add state
if (!content.includes('const [rightTab, setRightTab]')) {
  content = content.replace(
    'const [showBefore, setShowBefore] = useState(false);',
    `const [showBefore, setShowBefore] = useState(false);
  const [rightTab, setRightTab] = useState<'consultation' | 'calculator'>('consultation');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);`
  );
}

// 3. Extract canvas block
const lines = content.split('\n');
let canvasBlock = [];
let insideCanvas = false;
let returnStart = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('return (')) returnStart = i;
  if (lines[i].includes('LEFT COLUMN: Main Workspace')) insideCanvas = true;
  if (lines[i].includes('RIGHT COLUMN: Sidebar Controls')) insideCanvas = false;
  
  if (insideCanvas) {
    canvasBlock.push(lines[i]);
  }
}

// Remove the first and last few lines of canvasBlock which are just layout wrappers we don't want
// We want everything inside: <div className="flex-1 min-w-0 space-y-6">
// So we'll keep the inner part.
let canvasStr = canvasBlock.join('\n');

// 4. Inject Wall/Ceiling buttons into the toolbar
const wallCeilingButtons = `
                  <button
                    onClick={() => { setSelectionMode("magic"); setSurfaceType("wall"); setIsEraser(false); setAiMessage("Click inside a wall. Use Eraser for any tiny cleanup."); setTimeout(() => setAiMessage(''), 4000); }}
                    className={\`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 \${surfaceType === "wall" && selectionMode === "magic" ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-primary"}\`}
                  >
                    <span className="material-symbols-outlined text-sm">foundation</span>
                    Wall
                  </button>
                  <button
                    onClick={() => { setSelectionMode("magic"); setSurfaceType("ceiling"); setIsEraser(false); setAiMessage("Click inside the ceiling."); setTimeout(() => setAiMessage(''), 4000); }}
                    className={\`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 \${surfaceType === "ceiling" && selectionMode === "magic" ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-primary"}\`}
                  >
                    <span className="material-symbols-outlined text-sm">roofing</span>
                    Ceiling
                  </button>
`;

canvasStr = canvasStr.replace(
  '{/* TOOL TOGGLE */}',
  `{/* TOOL TOGGLE */}\n${wallCeilingButtons}`
);

// 5. Build new return block
const newReturnBlock = `  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 flex-col md:flex-row print:bg-white print:h-auto">
      {/* MOBILE DRAWER TRIGGER */}
      <button 
        onClick={() => setMobileDrawerOpen(true)}
        className="md:hidden fixed bottom-6 right-6 z-50 bg-primary text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center active:scale-95 transition-all mobile-drawer-trigger"
      >
        <span className="material-symbols-outlined text-2xl">palette</span>
      </button>

      {/* LEFT COLUMN: ShadePickerPanel */}
      <div className={\`fixed inset-0 z-40 bg-black/50 transition-opacity md:hidden \${mobileDrawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}\`} onClick={() => setMobileDrawerOpen(false)}></div>
      <aside className={\`fixed inset-y-0 left-0 z-50 w-[85%] max-w-[320px] bg-white transform transition-transform md:relative md:translate-x-0 md:w-[280px] lg:w-[280px] shrink-0 border-r border-gray-200 \${mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'} shade-picker-panel\`}>
        <ShadePickerPanel selectedShade={selectedShade} onShadeSelect={(s) => { setSelectedShade(s); setMobileDrawerOpen(false); }} />
      </aside>

      {/* CENTRE COLUMN: Canvas */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 header-bar">
          <div>
            <h1 className="text-xl font-black text-primary tracking-tight">Vishnu Paints</h1>
            <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">JSW Paints Dealer · Darsi, Prakasam</p>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-24 md:pb-6 relative">
           <div className="max-w-[900px] mx-auto w-full">
              \${canvasStr}
           </div>
        </main>
      </div>

      {/* RIGHT COLUMN: Tabs */}
      <aside className="w-full md:w-[320px] shrink-0 bg-white border-l border-gray-200 flex flex-col h-[50vh] md:h-full right-tabs-panel md:relative z-10 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] md:shadow-none">
         <div className="flex border-b border-gray-200 shrink-0">
           <button onClick={() => setRightTab('consultation')} className={\`flex-1 py-4 text-sm font-bold transition-colors \${rightTab === 'consultation' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-gray-500 hover:text-gray-800'}\`}>Consultation</button>
           <button onClick={() => setRightTab('calculator')} className={\`flex-1 py-4 text-sm font-bold transition-colors \${rightTab === 'calculator' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-gray-500 hover:text-gray-800'}\`}>Calculator</button>
         </div>
         <div className="flex-1 overflow-hidden relative">
            {rightTab === 'consultation' ? <ProjectManager selectedShade={selectedShade} onLoadConsultation={setSelectedShade} /> : <PaintCalculator onAddToQuote={(s) => console.log(s)} />}
         </div>
      </aside>
    </div>
  );
}`;

// Re-assemble file
const fileBeforeReturn = lines.slice(0, returnStart).join('\n');
fs.writeFileSync(file, fileBeforeReturn + '\n' + newReturnBlock + '\n}\n');
console.log('Replaced layout in VisualizerPage.');
