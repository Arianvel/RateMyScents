import { OCCASIONS, SEASONS, PROFILES, readLabels } from './method.mjs';
import { concentrationLabel } from './view.mjs';
import { collectionPatterns, patternText } from './collection-patterns.mjs';

const occasionLabels = OCCASIONS;

const fragranceName = p => `${p.brand} ${p.name} (${concentrationLabel(p.concentration)})`;

export function renderCollectionStyle(el, analysis, collection) {
  const section=el('section',null,'result-section collection-summary');
  section.append(el('h2','Your profile, according to your collection','section-heading'));
  const copy=el('div',null,'coverage-observations');
  const profiles=analysis.profiles;
  const list=values=>new Intl.ListFormat('en',{style:'long',type:'conjunction'}).format(values);
  if(profiles.complete && profiles.entries.length) {
    const sorted=[...profiles.entries].sort((a,b)=>b.count-a.count||a.label.localeCompare(b.label,'en'));
    const top=sorted.filter(x=>x.count===sorted[0].count);
    if(top.length===sorted.length && top.length>1) copy.append(el('p','There is no single leading profile here. Your collection gives its different sides equal room, so describing it with just one word would leave part of the picture out.','reading-copy'));
    else {
      const names=list(top.map(x=>x.label));
      copy.append(el('p',`Looking at the perfumes you have chosen, you seem to lean toward ${names} scents. They keep coming up in your collection, so they feel like a good place to start when describing your style.`,'reading-copy'));
      const next=sorted.find(x=>x.count<sorted[0].count);
      if(next) copy.append(el('p',`You have not stuck to just that, though. Your ${list(sorted.filter(x=>x.count===next.count).map(x=>x.label))} choices show another side of your collection. They are less frequent, but still part of what makes this selection yours.`,'reading-copy'));
    }
    if(analysis.occasions.complete) {
      const contexts=OCCASIONS.map(occasion=>({occasion,count:collection.filter(p=>p.occasions.includes(occasion)&&top.every(x=>readLabels(p.profile,PROFILES)?.has(x.label))).length}));
      const max=Math.max(...contexts.map(x=>x.count));
      if(max>=2) copy.append(el('p',`And there is a little connection with occasions: that ${list(top.map(x=>x.label))} mix also appears among your options for ${list(contexts.filter(x=>x.count===max).map(x=>x.occasion.toLowerCase()))}. So it is not just a recurring scent style; you also have it represented among the perfumes suggested for those moments.`,'reading-copy'));
    }
  } else copy.append(el('p','There are still a few blanks in the catalog for this collection. Rather than guess what ties your perfumes together, we will leave its scent portrait open until those profiles are complete. You can still explore the recorded occasions and seasons below.','reading-copy'));
  section.append(copy);return section;
}

function coverageRows(el, collection, field, vocabulary, season=false) {
  const grid=el('div',null,season?'season-grid':'occasion-rows');
  const records=collection.map(perfume=>({perfume,labels:readLabels(perfume[field],vocabulary,{allowEmpty:true})}));
  const missing=records.filter(record=>record.labels===null);
  for(const value of vocabulary) {
    const assigned=records.filter(record=>record.labels?.has(value));
    const title=season?value[0].toUpperCase()+value.slice(1):value;
    const row=el('article',null,'context-row'+(season?' season-row':''));
    const details=el('details');
    const summary=el('summary');
    const heading=el('div',null,'context-heading');
    const status=missing.length===collection.length?'Not recorded':missing.length
      ?assigned.length+' recorded; '+missing.length+' missing'
      :assigned.length?assigned.length+' of '+collection.length+' fragrances':'No assignments';
    heading.append(el('h3',title),el('span',status,'context-count'));summary.append(heading);details.append(summary);row.append(details);
    if(!missing.length) {
      const bar=el('meter');bar.min=0;bar.max=Math.max(collection.length,1);bar.value=assigned.length;
      bar.setAttribute('aria-label',title+': '+assigned.length+' of '+collection.length+' fragrances');details.append(bar);
    } else details.append(el('p','Data pending for '+missing.length+' fragrances.','caption'));
    function names(items) {
      const list=el('ul',null,'context-fragrances');list.setAttribute('translate','no');
      for(const {perfume} of items) list.append(el('li',fragranceName(perfume)));
      return list;
    }
    if(assigned.length) details.append(names(assigned));
    else if(!missing.length) details.append(el('p','No fragrances in this collection are tagged for this yet.','caption'));
    grid.append(row);
  }
  return grid;
}

export function renderSeasons(el,collection) {
  const section=el('section',null,'result-section collection-seasons');
  section.append(el('h2','Suggested seasons','section-heading'),coverageRows(el,collection,'seasons',SEASONS,true),el('p','These seasons are our suggestions, not rules about when to wear a fragrance.','caption'));
  return section;
}

export function renderPatterns(el, collection) {
  const groups=collectionPatterns(collection);
  if(!groups.length) return null;
  const card=el('section',null,'result-section collection-patterns collection-summary');
  card.append(el('h2','A closer look at your collection','section-heading'));
  const more=el('details',null,'summary-patterns');
  more.append(el('summary','A little more about the profiles'));
  for(const group of groups) {
    const paragraph=el('p',null,'reading-copy');
    for(const observation of group) paragraph.append(el('span',patternText(observation),'pattern-observation'));
    more.append(paragraph);
  }
  card.append(more);
  return card;
}

export function renderContexts(el, collection) {
  const section=el('section',null,'result-section collection-contexts');
  section.append(el('h2','Occasions','section-heading'),coverageRows(el,collection,'occasions',OCCASIONS),el('p','These are suggestions. You can wear your fragrances on other occasions too.','caption'));
  return section;
}

export function renderProfiles(el, analysis) {
  const section=el('section',null,'result-section scent-profiles');
  const details=el('details',null,'result-disclosure');
  details.append(el('summary','View your collection profiles'));
  details.append(el('p','These are the labels behind Variety. Each count shows how many of your fragrances have that profile; a fragrance can appear in several.','caption'));
  if(!analysis.profiles.complete) details.append(el('p','Counts below use recorded profiles; some fragrances have missing profile data.','caption'));
  function list(entries) {
    const rows=el('ul',null,'profile-distribution');
    for(const {label,count} of entries) {
      const row=el('li'),bar=el('meter'); bar.min=0;bar.max=Math.max(analysis.size,1);bar.value=count;
      bar.setAttribute('aria-label',`${label}: ${count} of ${analysis.size} fragrances`);
      row.append(el('span',label),bar,el('span',`${count} / ${analysis.size}`)); rows.append(row);
    }
    return rows;
  }
  details.append(list(analysis.profiles.entries));
  if(!analysis.profiles.entries.length) details.append(el('p','No profile data recorded.','caption'));
  section.append(details);
  return section;
}

export function renderCoverage(el, analysis) {
  const section=el('section',null,'result-section collection-summary'); section.append(el('h2','A closer look at your collection','section-heading'));
  const list=el('ul',null,'coverage-observations');
  // Select at most two facts; never turn unknown data into an absence.
  const uses=analysis.occasions;
  const profiles=analysis.profiles;
  if(uses.complete && uses.entries.length) {
    const top=uses.entries[0];
    const label=uses.entries.filter(x=>x.count===top.count).map(x=>x.label).join(', ');
    list.append(el('li',`You have the most options for ${label.toLowerCase()}: ${top.count} of your ${analysis.size} fragrances are listed for ${label.includes(', ')?'each occasion':'this occasion'}.`));
    const counts=new Map(uses.entries.map(x=>[x.label,x.count]));
    const allUses=OCCASIONS.map((value,index)=>({label:occasionLabels[index],count:counts.get(value)??0})).sort((a,b)=>a.count-b.count);
    const least={count:allUses[0].count,label:allUses.filter(x=>x.count===allUses[0].count).map(x=>x.label).join(', ')};
    if(least.count<top.count) list.append(el('li',least.count===0
      ? `None of your fragrances are listed for ${least.label.toLowerCase()}.`
      : `There are fewer options for ${least.label.toLowerCase()}: ${least.count} of your ${analysis.size} fragrances are listed for ${least.label.includes(', ')?'each occasion':'this occasion'}.`));
  } else if(profiles.complete && profiles.entries.length) {
    const top=profiles.entries[0];
    list.append(el('li',`The profiles you see most often are ${profiles.entries.filter(x=>x.count===top.count).map(x=>x.label).join(', ')}: each appears in ${top.count} of your ${analysis.size} fragrances.`));
  } else list.append(el('li','We need more catalog details to give you a clear picture of this collection.'));
  section.append(list); return section;
}

