/** Manual, documented guidance only. Never infer weather from fragrance labels. */
export function readWeather(value) {
  if (!value || !Array.isArray(value.values) || !value.values.length
    || !value.values.every(item => ['warm','cool'].includes(item))
    || !['brand','editorial'].includes(value.basis)
    || !Array.isArray(value.sources) || !value.sources.length) return null;
  for (const source of value.sources) {
    if (!source || typeof source.title !== 'string' || !source.title.trim() || typeof source.url !== 'string') return null;
    try { if (!['https:','http:'].includes(new URL(source.url).protocol)) return null; }
    catch { return null; }
  }
  return {values:[...new Set(value.values)],basis:value.basis,sources:value.sources.map(({title,url})=>({title,url}))};
}
