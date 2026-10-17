import { OCCASIONS, PROFILES, readLabels } from './method.mjs';

// Descriptive presentation only: never feeds scoring or recommendations.
export function collectionPatterns(collection) {
  const records=collection.map(perfume=>({
    occasions:readLabels(perfume.occasions,OCCASIONS,{allowEmpty:true}),
    profiles:readLabels(perfume.profile,PROFILES,{allowEmpty:false}),
  }));
  // Unknown membership prevents a complete denominator for any occasion.
  if(records.some(record=>record.occasions===null)) return [];
  const observations=[];
  for(const occasion of OCCASIONS) {
    const members=records.filter(record=>record.occasions.has(occasion));
    if(members.length<2 || members.some(record=>record.profiles===null)) continue;
    const counts=PROFILES.map(profile=>({profile,count:members.filter(record=>record.profiles.has(profile)).length}));
    const count=Math.max(...counts.map(entry=>entry.count));
    if(count<2) continue; // Presentation threshold for a repeated pattern, not reliability.
    observations.push({occasion,total:members.length,count,profiles:counts.filter(entry=>entry.count===count).map(entry=>entry.profile)});
  }
  // Equal support stays together, including at the two-observation cutoff.
  const support=[...new Set(observations.map(item=>item.count))].sort((a,b)=>b-a).slice(0,2);
  return support.map(count=>observations.filter(item=>item.count===count));
}

export function patternText(observation) {
  const {occasion,total,count,profiles}=observation;
  const names=new Intl.ListFormat('en',{style:'long',type:'conjunction'}).format(profiles);
  const heading=names[0].toUpperCase()+names.slice(1);
  const context=occasion.toLowerCase();
  return profiles.length>1
    ? `${heading}, side by side: each appears in ${count} of your ${total} fragrances for ${context}.`
    : `${heading} profiles appear in ${count} of your ${total} fragrances for ${context}.`;
}
