/** Load the catalog without changing the source records or their schema. */
export async function loadCatalog(url, fetchImpl = globalThis.fetch) {
  const response = await fetchImpl(url);
  if (!response.ok) throw new Error(`Catalog request failed (${response.status}).`);
  const data = await response.json();
  if (!data || !Array.isArray(data.perfumes)) throw new Error('Invalid catalog format.');

  const ids = new Set();
  for (const perfume of data.perfumes) {
    if (!perfume || !['id', 'name', 'brand', 'concentration'].every(
      (key) => typeof perfume[key] === 'string' && perfume[key].trim().length > 0,
    )) throw new Error('A fragrance is missing identification details.');
    if (ids.has(perfume.id)) throw new Error('The catalog contains duplicate fragrance IDs.');
    ids.add(perfume.id);
  }
  return data.perfumes.filter(perfume => perfume.isJoke !== true && perfume.type !== 'joke');
}

const normalizeSearch = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
  .replace(/['’‘.]/g,'').replace(/[^a-z0-9]+/g,' ')
  .replace(/\bone\s+million\b/g,'1 million').replace(/\b1million\b/g,'1 million')
  .replace(/\b(\d+)\s*(am|pm)\b/g,'$1 $2').replace(/\s+/g,' ').trim();
const brandAliases = Object.freeze({jpg:'jean paul gaultier',ysl:'yves saint laurent',tf:'tom ford',ch:'carolina herrera',dg:'dolce & gabbana'});
export function searchCatalog(perfumes, query) {
  const term = normalizeSearch(query);
  if (!term) return [];
  const tokens=term.split(' ').flatMap(token=>normalizeSearch(brandAliases[token]??token).split(' '));
  return perfumes.filter(({name,brand})=>{
    const searchable=normalizeSearch(`${brand} ${name}`);
    return tokens.every(token=>searchable.includes(token));
  });
}
