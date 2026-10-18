import {loadCatalog,searchCatalog} from './catalog.mjs';
import {concentrationLabel} from './view.mjs';
import {connectSearchKeyboard,searchAnnouncement} from './search-keyboard.mjs';

export function initializeCompare(document) {
  const el=id=>document.getElementById(id);
  const make=(tag,text,cls)=>{const node=document.createElement(tag);if(text!==undefined&&text!==null)node.textContent=text;if(cls)node.className=cls;return node;};
  let catalog=null,loading=false;
  const chosen=[null,null],pickers=[];
  const literal=node=>{node.setAttribute('translate','no');return node;};
  function render() {
    const content=el('compare-content');content.replaceChildren();
    for(let i=0;i<2;i++) {
      const p=chosen[i],picker=pickers[i];picker.selection.replaceChildren();
      if(p) {
        const bottle=document.getElementById('collection-card-template').content.querySelector('svg').cloneNode(true);bottle.classList.add('compare-bottle');
        picker.selection.append(literal(make('h2',`${p.brand} ${p.name}`,'section-heading')),literal(make('p',concentrationLabel(p.concentration),'caption')),bottle);
      } else picker.selection.append(make('p','Choose a fragrance to compare.','caption'));
      picker.clear.disabled=!p;
    }
    if(!chosen.every(Boolean)) return;
    const table=make('table',null,'compare-table');
    const caption=make('caption','Fragrance comparison');table.append(caption);
    const head=make('thead'),header=make('tr');
    const feature=make('th','Feature');feature.scope='col';header.append(feature);
    for(const p of chosen){const th=literal(make('th',`${p.brand} ${p.name} (${p.concentration})`));th.scope='col';header.append(th);}
    head.append(header);table.append(head);
    const body=make('tbody');
    const types={designer:'Designer',arabic:'Middle Eastern / Arabic',niche:'Niche'};
    const genders={men:'Masculine',women:'Feminine',unisex:'Unisex'};
    const fields=[['Brand','brand'],['Concentration','concentration'],['Catalog price (USD)','priceUsd'],['Fragrance type','type'],['Fragrance gender','gender'],['Scent profiles','profile'],['Notes','notes'],['Occasions','occasions'],['Suggested seasons','seasons']];
    for(const [label,key] of fields) {
      const row=make('tr'),heading=make('th',label);heading.scope='row';row.append(heading);
      chosen.forEach((p,index)=>{
        const cell=make('td'),value=p[key];
        if(['profile','notes','occasions','seasons'].includes(key)) {
          if(!Array.isArray(value)||!value.every(x=>typeof x==='string'&&x.trim()))cell.append(make('span','Not recorded','caption'));
          else if(!value.length)cell.append(make('span','No assignments','caption'));
          else {
            const list=make('ul',null,'compare-labels');
            for(const label of new Set(value)) {
              const other=chosen[1-index][key];
              const shared=Array.isArray(other)&&other.includes(label);
              const item=make('li',null,shared?'compare-shared':'');
              const text=make('span',label);if(key==='notes')literal(text);item.append(text);
              if(shared)item.append(make('span','Shared','compare-shared-label'));
              list.append(item);
            }cell.append(list);
          }
        } else if(key==='priceUsd')cell.append(make('span',Number.isFinite(value)&&value>=0?`USD ${value.toFixed(2)}`:'Not recorded'));
        else if(key==='type'||key==='gender')cell.append(make('span',(key==='type'?types:genders)[value]??'Not recorded'));
        else if(typeof value==='string'&&value.trim())cell.append(literal(make('span',key==='concentration'?concentrationLabel(value):value)));
        else cell.append(make('span','Not recorded'));
        row.append(cell);
      });body.append(row);
    }
    table.append(body);content.append(table,make('p','Shared labels do not mean two fragrances smell the same. Occasions and seasons are suggestions; the catalog does not measure longevity or projection.','caption compare-note'));
  }
  function search(index) {
    const picker=pickers[index],query=picker.input.value.trim();picker.matches.replaceChildren();
    const matches=query?searchCatalog(catalog??[],query):[];
    picker.live.textContent=query?(matches.length?`${matches.length} fragrances found`:'No matches. Try another name or brand.'):'';
    picker.announce(picker.live.textContent);
    for(const p of matches) {
      const button=make('button',null,'nine-match');button.type='button';button.dataset.perfumeId=p.id;
      button.append(literal(make('span',`${p.brand} · ${p.name} · ${concentrationLabel(p.concentration)}`)));
      button.disabled=chosen.some(x=>x?.id===p.id);
      if(button.disabled)button.append(make('span','Already selected','caption'));
      button.addEventListener('click',()=>{chosen[index]=p;picker.input.value='';render();search(0);search(1);picker.input.focus();el('compare-status').textContent='Comparison updated.';});
      picker.matches.append(button);
    }
  }
  for(let i=0;i<2;i++) {
    const card=make('div',null,'compare-picker'),label=make('label',i===0?'First fragrance':'Second fragrance');
    const input=make('input');input.id=`compare-search-${i}`;input.type='search';input.autocomplete='off';input.placeholder='Search by name or brand';input.disabled=true;label.htmlFor=input.id;
    const matches=make('div',null,'compare-matches'),live=make('p',null,'caption'),announcement=make('p',null,'visually-hidden');announcement.setAttribute('role','status');
    const selection=make('div',null,'compare-selection'),clear=make('button','Clear selection','text-button');clear.type='button';
    clear.addEventListener('click',()=>{chosen[i]=null;render();search(0);search(1);input.focus();el('compare-status').textContent='';pickers[i].announce('Selection cleared.');});
    input.addEventListener('input',()=>search(i));connectSearchKeyboard(input,matches);
    card.append(label,input,live,announcement,matches,selection,clear);el('compare-pickers').append(card);
    pickers.push({input,matches,live,selection,clear,announce:searchAnnouncement(announcement)});
  }
  async function load() {
    if(loading)return;loading=true;el('compare-retry').hidden=true;el('compare-status').textContent='Loading fragrances...';
    try{catalog=await loadCatalog('./scents.json');pickers.forEach(p=>p.input.disabled=!catalog.length);el('compare-status').textContent=catalog.length?'':'No fragrances are available yet.';}
    catch{el('compare-status').textContent='We could not load the fragrances. Please try again.';el('compare-retry').hidden=false;}
    finally{loading=false;}
  }
  el('compare-retry').addEventListener('click',load);render();
  return {enter(){if(catalog===null)load();}};
}
