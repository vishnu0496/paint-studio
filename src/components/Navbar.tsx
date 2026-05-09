/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Link } from "react-router-dom";
import { CONTACT_INFO } from "../constants";

export default function Navbar() {
  const handleWhatsApp = () => {
    window.open(`https://wa.me/${CONTACT_INFO.whatsapp}?text=Hi Vishnu Paints, I have an in-shop colour preview to discuss.`, '_blank');
  };

  return (
    <header className="bg-white/95 backdrop-blur-md fixed top-0 w-full z-50 border-b border-outline-variant shadow-[0_2px_15px_-3px_rgba(27,79,74,0.08)]">
      <div className="max-w-[1200px] mx-auto flex items-center justify-between px-container-margin md:px-lg h-20">
        <Link to="/visualizer" className="text-lg font-black tracking-tighter text-primary uppercase font-h1 antialiased">
          Vishnu Paints & Interiors
        </Link>
        <nav className="hidden md:flex items-center gap-3">
          <span className="rounded-full bg-secondary-container px-4 py-2 text-xs font-black uppercase tracking-widest text-on-secondary-container">
            In-shop visualizer
          </span>
          <span className="text-sm font-semibold text-on-surface-variant">
            JSW shade preview for counter consultations
          </span>
        </nav>
        <div className="flex items-center space-x-4">
          <button 
            onClick={handleWhatsApp}
            aria-label="Open WhatsApp"
            className="active:scale-95 cursor-pointer p-2 rounded-full hover:bg-surface-container-high transition-all duration-200"
          >
            <span className="material-symbols-outlined text-primary">chat</span>
          </button>
        </div>
      </div>
    </header>
  );
}
