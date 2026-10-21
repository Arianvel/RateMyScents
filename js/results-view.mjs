import { renderContexts, renderProfiles, renderCollectionStyle, renderSeasons } from './results-details.mjs';
import { concentrationLabel, infoButton } from './view.mjs';
import { ratingRing } from './rating-ring.mjs';
import { SCENT_GROUPS } from './scent-groups.mjs';
import { canonicalProfile } from './method.mjs';

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
  container.append(renderCollectionStyle(el,analysis,collection));

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
      ? `Your collection brings together ${analysis.profiles.entries.length} distinct scent profiles.` : key==='versatility'
      ? `${analysis.occasions.entries.length} of 5 occasions and ${analysis.seasons.entries.length} of 4 seasons covered, weighted equally.`
      : `Your fragrances share an average of ${number(100-analysis.complementarity.value)}% of their scent profiles.`;
    card.append(el('p',explanation,'reading-copy')); metricList.append(card);
  }
  container.append(metricList);
  container.append(renderContexts(el,collection),renderSeasons(el,collection),renderProfiles(el,analysis));
  const download=el('button','Download rating image','secondary-button');download.type='button';download.id='rating-export';
  const status=el('p',null,'caption');status.id='rating-export-status';status.setAttribute('role','status');
  const actions=el('div',null,'rating-export-actions');actions.append(download,status);container.append(actions);
}

const carouselCleanup=new WeakMap();
export function renderRecommendations(container, result, answers, alternatives=[]) {
  carouselCleanup.get(container)?.();
  const el=builder(container); container.replaceChildren();
  container.append(el('p','Based on your quiz answers','eyebrow'),el('h2','Your recommendations','section-heading'));
  const edit=el('button','Edit your preferences','secondary-button'); edit.type='button'; edit.id='edit-preferences'; container.append(edit);
  if(answers.budget) {
    const budget=el('details',null,'recommendation-budget');
    const summary=el('summary');
    summary.append(el('span',answers.budget.mode==='unlimited'?'No budget limit':`Up to USD ${answers.budget.amount} per fragrance`),el('span','Change','budget-change'));
    const form=el('form');form.dataset.action='recommendation-budget';form.noValidate=true;
    const label=el('label','Maximum per fragrance (USD)');label.htmlFor='recommendation-budget-amount';
    const amount=el('input');amount.id=label.htmlFor;amount.name='amount';amount.type='text';amount.inputMode='decimal';amount.value=answers.budget.amount;amount.disabled=answers.budget.mode==='unlimited';
    const unlimitedLabel=el('label',null,'budget-unlimited');const unlimited=el('input');unlimited.type='checkbox';unlimited.name='unlimited';unlimited.checked=answers.budget.mode==='unlimited';
    unlimitedLabel.append(unlimited,el('span','No budget limit'));
    unlimited.addEventListener('change',()=>{amount.disabled=unlimited.checked;});
    const error=el('p',null,'form-error');error.id='recommendation-budget-error';error.setAttribute('role','status');amount.setAttribute('aria-describedby',error.id);
    const apply=el('button','Apply budget','primary-button');apply.type='submit';
    form.append(label,amount,unlimitedLabel,error,apply);budget.append(summary,form);container.append(budget);
  }
  if (!result.items.length) {
    const text=result.reason==='catalog-exhausted' ? 'There are no other fragrances to recommend. All available fragrances are already in your collection.'
      : result.reason==='insufficient-data' ? 'We need more catalog details to find matches for these answers. You can change your preferences and try again.'
      : 'No matches this time. Try changing your preferences or budget. We have kept your filters as you chose them.';
    container.append(el('p',text,'reading-copy empty-recommendations'));
  }
  if(result.collectionProfilesMissing) container.append(el('p','Similarity ranking is unavailable because profile data is missing or invalid in your selected collection. Both similarity priorities need profiles for every selected fragrance.','reading-copy empty-recommendations'));
  if(!result.items.length && (result.counts.filtered || result.counts.noMatches)) container.append(el('p',`${result.counts.filtered} excluded by type, gender or budget; ${result.counts.noMatches} with no requested profile or occasion matches.`,'caption'));
  if(!result.items.length) {
    if(alternatives.length) {
      const choices=el('div',null,'recommendation-alternatives');
      choices.append(el('h3','Want to explore another option?'),el('p','Choose what you would like to change. Your other preferences will stay the same.','reading-copy'));
      for(const option of alternatives) {
        const text=option.kind==='budget'?`Try up to USD ${option.amount} per fragrance (${option.count} matches)`
          :option.kind==='type'?`Include any fragrance type (${option.count} matches)`
          :option.kind==='profiles'?`Remove scent preferences (${option.count} matches)`:`Remove occasion preferences (${option.count} matches)`;
        const button=el('button',text,'secondary-button');button.type='button';button.dataset.alternative=option.kind;
        if(option.kind==='budget')button.dataset.amount=option.amount;
        choices.append(button);
      }
      container.append(choices);
    }
    return;
  }
  const grid=el('div',null,'recommendation-grid');
  grid.id='recommendation-carousel';grid.setAttribute('role','group');grid.setAttribute('aria-label','Recommended fragrances');
  const media=container.ownerDocument.defaultView.matchMedia?.('(max-width: 720px)');
  const pageSize=()=>media?.matches?1:3;
  const matchCount=item=>item.matchedProfiles.length+item.matchedOccasions.length;
  const sameRank=(a,b)=>a.tier===b.tier&&matchCount(a)===matchCount(b)&&(a.matchedSeasons?.length??-1)===(b.matchedSeasons?.length??-1)&&
    (['familiar','different'].includes(answers.priority)?a.similarity===b.similarity:answers.priority==='versatile'?a.occasionCount===b.occasionCount:true);
  const meaningful=answers.priority!=='none'||answers.profiles.length>0||answers.occasions.length>0||answers.seasons?.length>0;
  const tied=result.items.length>1&&sameRank(result.items[0],result.items[1]);
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
  const tierNotice=el('p',null,'caption recommendation-tier');tierNotice.setAttribute('role','status');
  function pageEnd(index) {
    let end=Math.min(index+pageSize(),result.items.length);
    for(let i=index+1;i<end;i++)if(result.items[i].tier!==result.items[index].tier){end=i;break;}
    return end;
  }
  function pageStarts(){const pages=[];for(let i=0;i<result.items.length;i=pageEnd(i))pages.push(i);return pages;}
  function makeCard(item,index) {
    const card=el('article',null,'recommendation-card'+(index===0?' recommendation-top':''));
    card.dataset.perfumeId=item.perfume.id;card.tabIndex=-1;
    card.append(el('p',item.perfume.brand,'eyebrow'),el('h3',item.perfume.name),el('p',concentrationLabel(item.perfume.concentration),'caption'));
    const cardTitle=card.querySelector('h3');cardTitle.id=`recommendation-title-${index+1}`;
    card.setAttribute('aria-labelledby',cardTitle.id);
    for(const node of card.children) node.setAttribute('translate','no');
    if(index===0)card.prepend(el('p',item.tier==='close'?'Worth exploring':!meaningful?'Start here':tied?'Top match (tied)':'Best match for your choices','recommendation-badge'));
    if(Number.isFinite(item.perfume.priceUsd) && item.perfume.priceUsd>=0) card.append(el('p',`Catalog price: USD ${item.perfume.priceUsd.toFixed(2)}`,'caption'));
    const recorded=Array.isArray(item.perfume.profile)?item.perfume.profile.filter(x=>typeof x==='string'&&x.trim()):[];
    const requestedLabels=new Set(item.matchedProfiles.flatMap(id=>SCENT_GROUPS.find(group=>group.id===id)?.profiles??[id]));
    const hasPreferences=answers.profiles.length>0||answers.occasions.length>0;
    const profiles=[...new Set(hasPreferences?recorded.filter(label=>requestedLabels.has(canonicalProfile(label))):recorded)];
    const occasions=[...new Set(item.matchedOccasions)];
    const labels=[];
    for(let i=0;i<Math.max(profiles.length,occasions.length);i++) {
      if(profiles[i])labels.push(profiles[i]);
      if(occasions[i])labels.push(occasions[i]);
    }
    if(item.matchedSeasons?.length)labels.push(...item.matchedSeasons.map(s=>s[0].toUpperCase()+s.slice(1)));
    if(labels.length) {
      const tags=el('ul',null,'recommendation-fragrance-tags');
      for(const label of labels.slice(0,3))tags.append(el('li',label.charAt(0).toUpperCase()+label.slice(1)));
      cardTitle.after(tags);
    }
    const reason=hasPreferences&&labels.length?null
      : answers.priority==='versatile'?`Listed for ${item.occasionCount} of 5 occasions.`
      : answers.priority==='familiar'?'Chosen for its profile similarity to your collection.'
      : answers.priority==='different'?'Selected for your preference for something different.'
      :null;
    if(reason)card.append(el('p',reason,'reading-copy'));
    if(item.tier==='close')card.append(el('p','Shares your scent preferences, with different suggested occasions.','caption'));
    if(answers.seasons?.length&&item.matchedSeasons===null)card.append(el('p','Season details are not recorded yet.','caption'));
    card.append(infoButton(container.ownerDocument,item.perfume));
    return card;
  }
  function renderPage() {
    const batch=result.items.slice(start,pageEnd(start));
    grid.replaceChildren(...batch.map((item,index)=>makeCard(item,start+index)));
    const visible=start+batch.length;
    progress.textContent=`Showing ${start+1}\u2013${visible} of ${result.items.length} matching fragrances.`;
    previous.setAttribute('aria-disabled',String(start===0));
    next.setAttribute('aria-disabled',String(visible>=result.items.length));
    exhausted.hidden=visible<result.items.length;
    tierNotice.hidden=result.items[start].tier!=='close';
    tierNotice.textContent=tierNotice.hidden?'':'More to explore: these match your scents, though their suggested occasions are different. Your type, gender and budget filters still apply.';
  }
  container.append(grid);
  container.append(controls,tierNotice,exhausted);
  previous.addEventListener('click',()=>{if(start===0)return;const pages=pageStarts();start=pages[Math.max(0,pages.indexOf(start)-1)];renderPage();previous.focus();});
  next.addEventListener('click',()=>{const end=pageEnd(start);if(end>=result.items.length)return;start=end;renderPage();next.focus();});
  const resize=()=>{start=pageStarts().filter(i=>i<=start).at(-1)??0;renderPage();};
  media?.addEventListener('change',resize);
  const sizing=el('div',null,'recommendation-grid recommendation-sizing');
  sizing.setAttribute('aria-hidden','true');sizing.setAttribute('inert','');
  result.items.forEach((item,index)=>{
    const card=makeCard(item,index);card.classList.replace('recommendation-card','recommendation-measure');
    card.classList.replace('recommendation-top','recommendation-measure-top');
    card.style.gridRow='1';card.style.gridColumn=String(index%3+1);
    card.removeAttribute('tabindex');card.removeAttribute('aria-labelledby');
    for(const child of card.querySelectorAll('[id]'))child.removeAttribute('id');
    sizing.append(card);
  });
  container.append(sizing);
  const reserveHeight=()=>{
    const height=sizing.firstElementChild?.getBoundingClientRect().height;
    if(height>0)grid.style.minHeight=Math.ceil(height)+'px';
  };
  const Resize=container.ownerDocument.defaultView.ResizeObserver;
  const observer=Resize?new Resize(reserveHeight):null;
  if(sizing.firstElementChild)observer?.observe(sizing.firstElementChild);
  container.ownerDocument.defaultView.addEventListener('resize',reserveHeight);
  container.ownerDocument.fonts?.ready.then(reserveHeight);
  reserveHeight();
  carouselCleanup.set(container,()=>{media?.removeEventListener('change',resize);observer?.disconnect();container.ownerDocument.defaultView.removeEventListener('resize',reserveHeight);sizing.remove();});
  renderPage();
}
