import { PROFILES, OCCASIONS, readLabels, profileSimilarity, alphabetical } from './method.mjs';
import { matchingScentGroups } from './scent-groups.mjs';

/** Answers must have passed quiz validation. Never relax filters or impute data. */
export function recommendFragrances(catalog, collection, answers, {limit=3} = {}) {
  const counts = { alreadyOwned: 0, filtered: 0, noMatches: 0, incomplete: 0 };
  const owned = new Set(collection.map(perfume => perfume.id));
  const wantsProfiles = answers.profiles.length > 0;
  const wantsOccasions = answers.occasions.length > 0;
  const compareProfiles = ['familiar','different'].includes(answers.priority);
  const collectionProfilesValid = collection.length > 0 && collection.every(p => readLabels(p.profile,PROFILES));
  const sortedCollection = [...collection].sort((a,b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const items = [];
  for (const perfume of catalog) {
    if (owned.has(perfume.id)) { counts.alreadyOwned++; continue; }
    if (answers.gender && answers.gender !== 'any') {
      if (!['men','women','unisex'].includes(perfume.gender)) { counts.incomplete++; continue; }
      if (perfume.gender !== answers.gender && perfume.gender !== 'unisex') { counts.filtered++; continue; }
    }
    if (answers.type !== 'any') {
      if (!['designer','arabic','niche'].includes(perfume.type)) { counts.incomplete++; continue; }
      if (perfume.type !== answers.type) { counts.filtered++; continue; }
    }
    if (answers.budget.mode === 'maximum') {
      if (!Number.isFinite(perfume.priceUsd) || perfume.priceUsd < 0) { counts.incomplete++; continue; }
      if (perfume.priceUsd > Number(answers.budget.amount)) { counts.filtered++; continue; }
    }
    const profiles = readLabels(perfume.profile,PROFILES);
    const occasions = readLabels(perfume.occasions,OCCASIONS,{allowEmpty:true});
    if ((wantsProfiles && !profiles) || (wantsOccasions && !occasions)
        || (answers.priority === 'versatile' && !occasions)
        || (compareProfiles && (!profiles || !collectionProfilesValid))) {
      counts.incomplete++; continue;
    }
    // One match per chosen group, regardless of how many of its labels are present.
    const matchedProfiles = matchingScentGroups(answers.profiles,profiles);
    const matchedOccasions = [...new Set(answers.occasions)].filter(label => occasions?.has(label));
    if ((wantsProfiles || wantsOccasions) && !matchedProfiles.length && !matchedOccasions.length) { counts.noMatches++; continue; }
    items.push({ perfume, matchedProfiles, matchedOccasions,
      similarity: compareProfiles ? sortedCollection.reduce((sum,ownedPerfume) => sum+profileSimilarity(perfume,ownedPerfume),0)/sortedCollection.length : null,
      occasionCount: occasions ? occasions.size : null });
  }
  const matches = item => item.matchedProfiles.length+item.matchedOccasions.length;
  items.sort((a,b) => {
    const priority = answers.priority === 'familiar' ? b.similarity-a.similarity
      : answers.priority === 'different' ? a.similarity-b.similarity
      : answers.priority === 'versatile' ? b.occasionCount-a.occasionCount : 0;
    return priority || matches(b)-matches(a) || alphabetical(a.perfume,b.perfume);
  });
  const reason = items.length ? null : counts.alreadyOwned === catalog.length ? 'catalog-exhausted'
    : counts.incomplete ? 'insufficient-data' : 'no-matches';
  return {items: items.slice(0,limit), counts, reason,
    collectionProfilesMissing: compareProfiles && !collectionProfilesValid};
}
