/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CONTACT_INFO } from "../constants";

export default function Footer() {
  return (
    <footer className="bg-white w-full mt-auto border-t border-outline-variant">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-3 py-6 px-container-margin text-center md:flex-row md:items-center md:justify-between md:px-lg md:text-left">
        <span className="text-sm font-bold text-primary">Vishnu Paints in-shop colour visualizer</span>
        <span className="text-xs font-medium leading-relaxed text-on-surface-variant">
          For counter consultations at {CONTACT_INFO.address}
        </span>
      </div>
    </footer>
  );
}
