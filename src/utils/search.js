import Fuse from 'fuse.js';

/**
 * Searches for vehicle data based on a natural language query.
 * @param {string} query - The user's input string ("toro flex 2023").
 * @param {Array} database - The full list of vehicle objects.
 * @returns {Array} - Ranked list of matching objects.
 */
export function searchVehicles(query, database) {
  if (!query || !database || database.length === 0) return [];

  const normalizedQuery = query.toLowerCase().trim();
  
  // 1. Extract potential Year (4 digits)
  const yearMatch = normalizedQuery.match(/\b(19|20)\d{2}\b/);
  const searchedYear = yearMatch ? yearMatch[0] : null;

  // 2. Prepare Fuse.js options
  // We want to weigh Brand and Model heavily.
  const options = {
    includeScore: true,
    keys: [
      { name: 'brand', weight: 0.4 },
      { name: 'model', weight: 0.4 },
      { name: 'engine', weight: 0.2 },
      { name: 'year', weight: 0.1 } // Year is handled separately for strict filtering usually, but good to have here too
    ],
    threshold: 0.4, // Lower = stricter. 0.4 is a good balance.
    ignoreLocation: true
  };

  const fuse = new Fuse(database, options);
  
  // 3. Perform search
  // If we found a year, we might want to filter the database FIRST or text-search WITH the year.
  // Strategy: Let Fuse do the heavy lifting on the full query string first.
  let results = fuse.search(normalizedQuery);

  // 4. Post-process / Strict Filter
  // If the user typed a year, prioritize or filter results that match that year exactly.
  if (searchedYear) {
    const yearFiltered = results.filter(res => res.item.year == searchedYear);
    // If we have matches with the exact year, use those. 
    // Otherwise, maybe the user typed "2023" but the db has "2022-2024", handle that later. 
    // For now, strict year match if found in text is a good heuristic to boost confidence.
    if (yearFiltered.length > 0) {
      results = yearFiltered;
    }
  }

  // 5. Return clean items
  return results.map(res => res.item).slice(0, 10); // Limit to top 10
}
