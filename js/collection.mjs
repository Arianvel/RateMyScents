/** Session-only membership, keyed by the catalog's fragrance IDs. */
export function createCollection() {
  const perfumes = new Map();
  return {
    add(perfume) {
      if (perfumes.has(perfume.id)) return false;
      perfumes.set(perfume.id, perfume);
      return true;
    },
    remove(id) { return perfumes.delete(id); },
    clear() { perfumes.clear(); },
    has(id) { return perfumes.has(id); },
    items() { return [...perfumes.values()]; },
    get size() { return perfumes.size; },
  };
}
