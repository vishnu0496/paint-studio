import { Shade } from "../../../types";
import { JSW_SHADES_CATALOGUE } from "../../../data/jswShades";

export function searchShades(query: string, limit: number = 20): Shade[] {
  const trimmedQuery = query.trim().toLowerCase();
  if (!trimmedQuery) return [];

  // Remove spaces and non-alphanumeric for a normalized code search
  const normalizedQuery = trimmedQuery.replace(/[^a-z0-9]/g, '');

  return JSW_SHADES_CATALOGUE.filter(s => {
    const nameMatch = s.name.toLowerCase().includes(trimmedQuery);
    const codeMatch = s.jswCode.toLowerCase().includes(trimmedQuery);
    
    // Normalized code match (e.g. "010" matches "S010")
    const normalizedCode = s.jswCode.toLowerCase().replace(/[^a-z0-9]/g, '');
    const partialCodeMatch = normalizedCode.includes(normalizedQuery);

    return nameMatch || codeMatch || partialCodeMatch;
  }).slice(0, limit);
}
