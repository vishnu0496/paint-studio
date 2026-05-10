import { Shade } from "../../../types";
import { JSW_SHADES_CATALOGUE } from "../../../data/jswShades";

export function searchShades(query: string, limit: number = 20): Shade[] {
  const trimmedQuery = query.trim().toLowerCase();
  if (!trimmedQuery) return [];

  // Support for grey/gray synonym
  const searchTerms = [trimmedQuery];
  if (trimmedQuery.includes('gray')) searchTerms.push(trimmedQuery.replace('gray', 'grey'));
  else if (trimmedQuery.includes('grey')) searchTerms.push(trimmedQuery.replace('grey', 'gray'));

  // Remove spaces and non-alphanumeric for a normalized code search
  const normalizedQuery = trimmedQuery.replace(/[^a-z0-9]/g, '');

  const results = JSW_SHADES_CATALOGUE.filter(s => {
    const nameLower = s.name.toLowerCase();
    const codeLower = s.jswCode.toLowerCase();
    
    // Check all search terms for synonyms
    const nameMatch = searchTerms.some(term => nameLower.includes(term));
    const codeMatch = searchTerms.some(term => codeLower.includes(term));
    
    // Normalized code match (e.g. "010" matches "S010")
    const normalizedCode = codeLower.replace(/[^a-z0-9]/g, '');
    const partialCodeMatch = normalizedCode.includes(normalizedQuery);

    return nameMatch || codeMatch || partialCodeMatch;
  });

  // Prioritize exact code match first, then exact name, then partial matches
  return results.sort((a, b) => {
    const aCode = a.jswCode.toLowerCase();
    const bCode = b.jswCode.toLowerCase();
    const aName = a.name.toLowerCase();
    const bName = b.name.toLowerCase();

    // 1. Exact code match
    if (aCode === trimmedQuery && bCode !== trimmedQuery) return -1;
    if (bCode === trimmedQuery && aCode !== trimmedQuery) return 1;

    // 2. Exact name match
    if (aName === trimmedQuery && bName !== trimmedQuery) return -1;
    if (bName === trimmedQuery && aName !== trimmedQuery) return 1;

    // 3. Partial code match (starts with)
    if (aCode.startsWith(trimmedQuery) && !bCode.startsWith(trimmedQuery)) return -1;
    if (bCode.startsWith(trimmedQuery) && !aCode.startsWith(trimmedQuery)) return 1;

    return 0;
  }).slice(0, limit);
}
