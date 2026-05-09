const fs = require('fs');
const file = 'src/index.css';
let content = fs.readFileSync(file, 'utf8');
const printCss = `
@media print {
  .shade-picker-panel,
  .right-tabs-panel,
  .header-bar,
  .mobile-drawer-trigger,
  .canvas-toolbar,
  nav,
  footer { display: none !important; }
  
  body { background: white !important; }
  
  .flex-1.flex.flex-col { overflow: visible !important; height: auto !important; }
  main { overflow: visible !important; height: auto !important; padding: 0 !important; }
  .max-w-[900px] { max-width: 100% !important; }

  .consultation-print-card { 
    display: block !important; 
    width: 100%;
    font-size: 14px;
    border: 1px solid #eee !important;
    box-shadow: none !important;
    break-inside: avoid;
    margin-top: 20px;
  }
  
  body::before {
    content: "Vishnu Paints & Interiors — Colour Consultation Summary";
    display: block;
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 24px;
    color: #01696f;
    text-align: center;
  }
}`;
fs.writeFileSync(file, content + printCss);
console.log('Added Print CSS.');
