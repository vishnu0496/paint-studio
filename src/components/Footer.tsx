/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { JSW_PAINTS_COLLECTIONS, CONTACT_INFO } from "../constants";

export default function Footer() {
  return (
    <footer className="bg-surface-container-low w-full mt-auto border-t border-outline-variant">
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 py-16 px-container-margin md:px-lg">
        <div className="md:col-span-1">
          <span className="text-xl font-bold text-primary mb-4 block font-h2">Vishnu Paints</span>
          <p className="font-body-md text-on-surface-variant">Transforming spaces with premium craftsmanship and the finest JSW Paints collection.</p>
        </div>
        <div className="space-y-4">
          <h4 className="font-label-md text-primary">Services</h4>
          <ul className="space-y-2">
            <li><a className="text-on-surface-variant hover:text-primary transition-colors font-medium" href="/services">Interior Painting</a></li>
            <li><a className="text-on-surface-variant hover:text-primary transition-colors font-medium" href="/services">Exterior Protection</a></li>
            <li><a className="text-on-surface-variant hover:text-primary transition-colors font-medium" href="/services">Waterproofing</a></li>
          </ul>
        </div>
        <div className="space-y-4">
          <h4 className="font-label-md text-primary">Quick Links</h4>
          <ul className="space-y-2">
            <li><a className="text-on-surface-variant hover:text-primary transition-colors font-medium" href="/portfolio">Portfolio</a></li>
            <li><a className="text-on-surface-variant hover:text-primary transition-colors font-medium" href="/contact">Contact Us</a></li>
            <li><a className="text-on-surface-variant hover:text-primary transition-colors font-medium" href="/visualizer">Paint Visualizer</a></li>
          </ul>
        </div>
        <div className="space-y-4">
          <h4 className="font-label-md text-primary">Location</h4>
          <p className="font-body-md text-on-surface-variant">{CONTACT_INFO.address}</p>
          <div className="h-24 w-full bg-surface-container-high rounded-lg overflow-hidden grayscale opacity-70">
            <img 
              alt="Location Map" 
              className="w-full h-full object-cover" 
              src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=300"
            />
          </div>
        </div>
      </div>
      <div className="max-w-[1200px] mx-auto border-t border-outline-variant py-8 px-container-margin md:px-lg text-center md:text-left">
        <span className="text-sm font-medium leading-relaxed text-on-surface-variant">© 2024 Vishnu Paints & Interiors. Precision in every stroke. Authorized JSW Paints Dealer.</span>
      </div>
    </footer>
  );
}
