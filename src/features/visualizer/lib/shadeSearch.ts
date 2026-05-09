import { Shade, Collection } from "../../../types";

export function searchShades(collections: Collection[], query: string, limit: number = 5): Shade[] {
  const trimmedQuery = query.trim().toLowerCase();
  if (!trimmedQuery) return [];

  const allShades = collections.flatMap(c => c.shades);
  
  return allShades.filter(s =>
    s.name.toLowerCase().includes(trimmedQuery) ||
    s.jswCode.toLowerCase().includes(trimmedQuery)
  ).slice(0, limit);
}
