import { renderContexts, renderProfiles, renderCoverage, renderPatterns, renderSeasons } from './results-details.mjs';
import { concentrationLabel } from './view.mjs';
import { ratingRing } from './rating-ring.mjs';
import { scentGroupLabel } from './scent-groups.mjs';

const number = value => String(Math.floor(value));
function builder(container) {
  return (tag,text,className) => {
    const node = container.ownerDocument.createElement(tag);
    if (text !== undefined && text !== null) node.textContent=text;
    if (className) node.className=className;
    return node;
  };
}
export function renderAnalysis(container, analysis, collection) {
  const el = builder(container);
  container.replaceChildren();
  const total = el('div',null,'rating-summary');
  total.append(el('p','Your collection rating','eyebrow'));
  const score = el('p',analysis.total.value === null ? 'Not available' : `${number(analysis.total.value)} / 100`,'rating-score');
  score.dataset.metric='total';
  total.append(analysis.total.value === null ? score : ratingRing(container.ownerDocument,score,analysis.total.value),el('p',analysis.total.reason ?? 'An analysis of your collection’s characteristics using our method.','reading-copy'));
  // An interface note, not a confidence threshold or an input to the rating.
  if (analysis.size === 2 || analysis.size === 3) {
    const pairCount = analysis.size * (analysis.size - 1) / 2;
    const note = el('p',`With ${analysis.size} selected fragrances, there ${pairCount === 1 ? 'is just 1 pair' : `are just ${pairCount} pairs`} to compare. This analysis describes those selected fragrances; the same formulas apply to collections of any size.`, 'small-collection-note caption');
    note.setAttribute('role','note');
    total.append(note);
  }
  container.append(total);
  const patterns=renderPatterns(el,collection);
  const coverage=renderCoverage(el,analysis);
  if(patterns) patterns.insertBefore(coverage.querySelector('.coverage-observations'),patterns.querySelector('details'));
  container.append(patterns??coverage);

  const metricList = el('div',null,'result-metrics');
  for (const [key,title] of [['variety','Variety'],['versatility','Versatility'],['complementarity','Complementarity']]) {
    const metric = analysis[key];
    const card = el('article',null,'result-metric');
    const heading = el('div',null,'metric-heading');
    const value = el('span',metric.value === null ? 'Not available' : `${number(metric.value)} / 100`); value.dataset.metric=key;
    heading.append(el('h2',title,'section-heading'),value); card.append(heading);
    if (metric.value !== null) {
      const meter = el('meter'); meter.min=0; meter.max=100; meter.value=metric.value; meter.setAttribute('aria-label',`${title}: ${number(metric.value)} out of 100`);
      card.append(meter);
    }
    const explanation = metric.value === null ? metric.reason : key==='variety'
      ? `Your collection includes ${analysis.profiles.entries.length} of the method's 12 profile labels across ${analysis.size} fragrances.` : key==='versatility'
      ? `${analysis.occasions.entries.length} of 5 occasions and ${analysis.seasons.entries.length} of 4 seasons covered, weighted equally.`
      : `${number(100-analysis.complementarity.value)}% average profile overlap across ${analysis.pairs.length} ${analysis.pairs.length===1 ? 'pair' : 'pairs'}.`;
    card.append(el('p',explanation,'reading-copy')); metricList.append(card);
  }
  container.append(metricList);
  container.append(renderContexts(el,collection),renderSeasons(el,collection),renderProfiles(el,analysis));
}

const carouselCleanup=new WeakMap();
export function renderRecommendations(container, result, answers) {
  carouselCleanup.get(container)?.();
  const el=builder(container); container.replaceChildren();
  container.append(el('p','Based on your quiz answers','eyebrow'),el('h2','Your recommendations','section-heading'));
  const edit=el('button','Edit your preferences','secondary-button'); edit.type='button'; edit.id='edit-preferences'; container.append(edit);
  if (!result.items.length) {
    const text=result.reason==='catalog-exhausted' ? 'There are no other fragrances to recommend. All available fragrances are already in your collection.'
      : result.reason==='insufficient-data' ? 'We need more catalog details to find matches for these answers. You can change your preferences and try again.'
      : 'No matches this time. Try changing your preferences or budget. We have kept your filters as you chose them.';
    container.append(el('p',text,'reading-copy empty-recommendations'));
  }
  if(result.collectionProfilesMissing) container.append(el('p','Similarity ranking is unavailable because profile data is missing or invalid in your selected collection. Both similarity priorities need profiles for every selected fragrance.','reading-copy empty-recommendations'));
  if(result.counts.incomplete) container.append(el('p',`${result.counts.incomplete} candidate(s) could not be evaluated with the available data. No missing values were treated as zero.`,'caption'));
  if(!result.items.length && (result.counts.filtered || result.counts.noMatches)) container.append(el('p',`${result.counts.filtered} excluded by type or budget; ${result.counts.noMatches} with no requested profile or occasion matches.`,'caption'));
  if(!result.items.length)return;
  const grid=el('div',null,'recommendation-grid');
  grid.id='recommendation-carousel';grid.setAttribute('role','group');grid.setAttribute('aria-label','Recommended fragrances');
  const media=container.ownerDocument.defaultView.matchMedia?.('(max-width: 720px)');
  const pageSize=()=>media?.matches?1:3;
  const matchCount=item=>item.matchedProfiles.length+item.matchedOccasions.length;
  const sameRank=(a,b)=>matchCount(a)===matchCount(b)&&
    (['familiar','different'].includes(answers.priority)?a.similarity===b.similarity:answers.priority==='versatile'?a.occasionCount===b.occasionCount:true);
  const meaningful=answers.priority!=='none'||answers.profiles.length>0||answers.occasions.length>0;
  const tied=result.items.length>1&&sameRank(result.items[0],result.items[1]);
  if(meaningful)container.append(el('p',tied?'The first options are equally matched; alphabetical order breaks the tie.':'The highlighted option ranks first for your chosen priority and preferences.','caption'));
  const progress=el('p',null,'caption recommendation-progress');progress.setAttribute('role','status');
  const controls=el('div',null,'recommendation-controls');
  function arrow(action,label,symbol) {
    const button=el('button',null,'secondary-button carousel-arrow');button.type='button';button.dataset.action=action;
    button.setAttribute('aria-label',label);button.setAttribute('aria-controls',grid.id);
    const icon=el('span',symbol);icon.setAttribute('aria-hidden','true');button.append(icon);return button;
  }
  const previous=arrow('previous-recommendations','Previous recommendations','\u2190');
  const next=arrow('next-recommendations','Next recommendations','\u2192');
  controls.append(previous,progress,next);
  const exhausted=el('div',null,'recommendations-exhausted');
  exhausted.append(el('p',"That’s all the matches for your current preferences. Want to take the quiz again?",'reading-copy'));
  const retake=el('a','Retake the quiz','secondary-button');retake.href='#quiz';retake.dataset.action='retake-quiz';exhausted.append(retake);
  exhausted.hidden=true;
  let start=0;
  function renderPage() {
    const batch=result.items.slice(start,start+pageSize());
    grid.replaceChildren();
    for(const item of batch) {
    const index=start+grid.childElementCount;
    const card=el('article',null,'recommendation-card'+(index===0?' recommendation-top':''));
    card.dataset.perfumeId=item.perfume.id;card.tabIndex=-1;
    card.append(el('p',item.perfume.brand,'eyebrow'),el('h3',item.perfume.name),el('p',concentrationLabel(item.perfume.concentration),'caption'));
    const cardTitle=card.querySelector('h3');cardTitle.id=`recommendation-title-${start+grid.childElementCount+1}`;
    card.setAttribute('aria-labelledby',cardTitle.id);
    for(const node of card.children) node.setAttribute('translate','no');
    if(index===0)card.prepend(el('p',!meaningful?'Start here':tied?'Top match (tied)':'Best match for your choices','recommendation-badge'));
    if(Number.isFinite(item.perfume.priceUsd) && item.perfume.priceUsd>=0) card.append(el('p',`Catalog price: USD ${item.perfume.priceUsd.toFixed(2)}`,'caption'));
    const matches=[...item.matchedProfiles.map(scentGroupLabel),...item.matchedOccasions];
    const reason=matches.length ? `Matches: ${matches.slice(0,2).join(', ')}${matches.length>2?` (+${matches.length-2} more)`:''}.`
      : answers.priority==='versatile'?`Listed for ${item.occasionCount} of 5 occasions.`
      : answers.priority==='familiar'?'Chosen for its profile similarity to your collection.'
      : answers.priority==='different'?'Selected for your preference for something different.'
      :'No profile or occasion preferences requested.';
    card.append(el('p',reason,'reading-copy'));
    grid.append(card);
    }
    const visible=start+batch.length;
    progress.textContent=`Showing ${start+1}\u2013${visible} of ${result.items.length} matching fragrances.`;
    previous.setAttribute('aria-disabled',String(start===0));
    next.setAttribute('aria-disabled',String(visible>=result.items.length));
    exhausted.hidden=visible<result.items.length;
  }
  container.append(grid);
  container.append(controls,exhausted);
  previous.addEventListener('click',()=>{if(start===0)return;start=Math.max(0,start-pageSize());renderPage();previous.focus();});
  next.addEventListener('click',()=>{if(start+pageSize()>=result.items.length)return;start+=pageSize();renderPage();next.focus();});
  const resize=()=>{start=Math.floor(start/pageSize())*pageSize();renderPage();};
  media?.addEventListener('change',resize);
  carouselCleanup.set(container,()=>media?.removeEventListener('change',resize));
  renderPage();
}
