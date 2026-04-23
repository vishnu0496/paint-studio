/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Shade {
  name: string;
  code: string;
  jswCode: string;
}

export interface Collection {
  name: string;
  shades: Shade[];
}

export interface Service {
  title: string;
  description: string;
  icon: string;
}

export interface Room {
  id: string;
  name: string;
  image: string;
  paintedAreas: { mask: Uint8Array, color: string }[];
  intensity: number;
  texturePreservation: number;
  ceilingBoundaryLine?: number | null;
}
