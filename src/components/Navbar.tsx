/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Link, useLocation } from "react-router-dom";
import { CONTACT_INFO } from "../constants";

export default function Navbar() {
  const location = useLocation();

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Services", path: "/services" },
    { name: "Paint Visualizer", path: "/visualizer" },
    { name: "Portfolio", path: "/portfolio" },
    { name: "Contact", path: "/contact" }
  ];

  const handleWhatsApp = () => {
    window.open(`https://wa.me/${CONTACT_INFO.whatsapp}?text=Hi Vishnu Paints, I'd like to book a consultation.`, '_blank');
  };

  return (
    <header className="bg-white/95 backdrop-blur-md fixed top-0 w-full z-50 border-b border-outline-variant shadow-[0_2px_15px_-3px_rgba(27,79,74,0.08)]">
      <div className="max-w-[1200px] mx-auto flex items-center justify-between px-container-margin md:px-lg h-20">
        <Link to="/" className="text-lg font-black tracking-tighter text-primary uppercase font-h1 antialiased">
          Vishnu Paints & Interiors
        </Link>
        <nav className="hidden md:flex items-center space-x-base">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`transition-colors px-4 py-2 font-sans tracking-tight antialiased ${
                  isActive
                    ? "text-primary font-bold border-b-2 border-primary"
                    : "text-on-surface-variant hover:text-primary"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center space-x-4">
          <button 
            onClick={handleWhatsApp}
            className="active:scale-95 cursor-pointer p-2 rounded-full hover:bg-surface-container-high transition-all duration-200"
          >
            <span className="material-symbols-outlined text-primary">chat</span>
          </button>
        </div>
      </div>
    </header>
  );
}
