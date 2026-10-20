export const PROFILES = Object.freeze(['fresh', 'sweet', 'woody', 'spicy', 'citrus', 'floral', 'amber', 'green', 'aquatic', 'gourmand', 'aromatic', 'warm', 'fruity', 'powdery', 'leather']);
export const canonicalProfile = label => label === 'white floral' ? 'floral' : label;
export const SEASONS = Object.freeze(['spring','summer','autumn','winter']);
export const OCCASIONS = Object.freeze(['Daily / casual', 'Work / school', 'Date nights', 'Parties', 'Formal events']);
export const WEIGHTS = Object.freeze({ variety: 0.4, versatility: 0.3, complementarity: 0.3 });

// Accept legacy scalar answers as well as the quiz's multiple selections.
export const selectedTypes = value => Array.isArray(value) ? value : value && value !== 'any' ? [value] : [];

export function readLabels(value, vocabulary, { allowEmpty = false } = {}) {
  // Only profile calculations normalize subprofiles. Source records remain intact.
  if(Array.isArray(value)&&vocabulary===PROFILES)value=value.map(canonicalProfile);
  if (!Array.isArray(value) || (!allowEmpty && !value.length)
      || !value.every(label => typeof label === 'string' && label.trim() && (!vocabulary || vocabulary.includes(label)))) return null;
  return new Set(value);
}

export function profileSimilarity(a, b) {
  const left = readLabels(a.profile, PROFILES);
  const right = readLabels(b.profile, PROFILES);
  if (!left || !right) return null;
  const shared = [...left].filter(label => right.has(label)).length;
  return shared / new Set([...left, ...right]).size;
}

const collator = new Intl.Collator('en');
export function alphabetical(a, b) {
  return collator.compare(a.brand, b.brand) || collator.compare(a.name, b.name)
    || collator.compare(a.id, b.id) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}
