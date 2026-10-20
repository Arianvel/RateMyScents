import { PROFILES, OCCASIONS, SEASONS, WEIGHTS, readLabels, profileSimilarity } from './method.mjs';

const metric = (value, reason = null, status = 'unavailable') => ({ status: value === null ? status : 'available', value, reason });

function counts(perfumes, field, vocabulary, allowEmpty) {
  const map = new Map();
  const missingIds = [];
  for (const perfume of perfumes) {
    const labels = readLabels(perfume[field], vocabulary, { allowEmpty });
    if (!labels) { missingIds.push(perfume.id); continue; }
    for (const label of labels) map.set(label, (map.get(label) ?? 0) + 1);
  }
  return { complete: missingIds.length === 0, missingIds,
    entries: [...map].map(([label, count]) => ({ label, count }))
      .sort((a,b) => b.count-a.count || a.label.localeCompare(b.label, 'en')) };
}

/** Only collection data enters this function; preferences cannot affect its output. */
export function analyzeCollection(perfumes) {
  const sorted = [...perfumes].sort((a,b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const size = sorted.length;
  const profiles = counts(sorted, 'profile', PROFILES, false);
  const occasions = counts(sorted, 'occasions', OCCASIONS, true);
  const seasons = counts(sorted, 'seasons', SEASONS, true);
  const varietySizeFactor = Math.min(1,size/4);
  const notes = counts(sorted, 'notes', null, true);
  const pairs = [];
  if (profiles.complete) {
    for (let i = 0; i < size; i++) for (let j = i+1; j < size; j++) {
      const a = sorted[i], b = sorted[j];
      const left = readLabels(a.profile,PROFILES), right = readLabels(b.profile,PROFILES);
      pairs.push({ ids: [a.id,b.id], shared: [...left].filter(label => right.has(label)).length,
        union: new Set([...left,...right]).size, similarity: profileSimilarity(a,b) });
    }
  }
  const noCollection = 'Add fragrances to analyze your collection.';
  const variety = !size ? metric(null,noCollection,'not-applicable') : profiles.complete
    ? metric((100*profiles.entries.length/PROFILES.length)*varietySizeFactor) : metric(null,'Profile data is missing or invalid for part of your collection.');
  const versatility = !size ? metric(null,noCollection,'not-applicable') : occasions.complete && seasons.complete
    ? metric(100*(0.5*occasions.entries.length/OCCASIONS.length+0.5*seasons.entries.length/SEASONS.length)) : metric(null,`${!occasions.complete && !seasons.complete ? 'Occasion and season' : !seasons.complete ? 'Season' : 'Occasion'} data is missing or invalid for part of your collection.`);
  const complementarity = size < 2 ? metric(null,'At least two fragrances are needed to compare profiles.','not-applicable')
    : !profiles.complete ? metric(null,'Complete profile data is needed to compare all fragrance pairs.')
    : metric(100*(1-pairs.reduce((sum,pair) => sum+pair.similarity,0)/pairs.length));
  const metrics = {variety,versatility,complementarity};
  const total = Object.values(metrics).every(item => item.value !== null)
    ? metric(Object.entries(metrics).reduce((sum,[key,item]) => sum+item.value*WEIGHTS[key],0))
    : metric(null,size < 2 ? 'At least two fragrances are needed for a total score.' : 'A total score needs complete profiles, occasions and seasons for every fragrance.',size < 2 ? 'not-applicable' : 'unavailable');
  const maximum = pairs.reduce((max,pair) => Math.max(max,pair.similarity),-1);
  return { size, varietySizeFactor, ...metrics, total, profiles, occasions, seasons, notes, pairs,
    closestPairs: pairs.filter(pair => pair.similarity === maximum) };
}
