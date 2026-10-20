import {searchCatalog} from './catalog.mjs';
import {infoButton,concentrationLabel} from './view.mjs';
import {bottleImage,detailNode,catalogText} from './fragrance-details.mjs';
import {SCENT_GROUPS} from './scent-groups.mjs';
import {canonicalProfile} from './method.mjs';
import {filterDropdown,connectFilterBar,filterLabel} from './filter-controls.mjs';

const fields={brand:'Brand',gender:'Fragrance gender',seasons:'Suggested seasons',group:'Scent profiles',type:'Fragrance type',profile:'Scent profiles',notes:'Notes',occasions:'Occasions',concentration:'Concentration'};
const labels={men:'Masculine',women:'Feminine',unisex:'Unisex',designer:'Designer',niche:'Niche',arabic:'Middle Eastern / Arabic'};
export function initializeCatalogPage(document,{load,getCollection,addToCollection,compare}) {
  const el=id=>document.getElementById(id),make=(...args)=>detailNode(document,...args);
  const controls=el('catalog-controls'),grid=el('catalog-grid');
  let catalog=null,loading=false,limit=24;
  const filters=new Map();
  function button(text,action){const b=make('button',text,'secondary-button');b.type='button';b.addEventListener('click',action);return b;}
  function control(label,id,tag='input') {
    const wrapper=make('label',label),input=make(tag);input.id=id;wrapper.append(input);controls.append(wrapper);return input;
  }
  const query=control('Search for a fragrance or brand','catalog-search');query.type='search';
  const groups=make('div',null,'filter-bar');controls.append(groups);connectFilterBar(groups);
  const sort={value:'name'};
  const sorting=filterDropdown(document,'Sort by',{sort:true});sorting.root.id='catalog-sort';
  for(const [value,text] of [['name','Name A–Z'],['reverse','Name Z–A'],['low','Price: low to high'],['high','Price: high to low']]) {
    const label=make('label',null,'catalog-filter-option'),input=make('input');input.type='radio';input.name='catalog-sort';input.value=value;input.checked=value===sort.value;
    label.append(input,make('span',text));sorting.panel.append(label);
    input.addEventListener('change',()=>{sort.value=value;limit=24;render();sorting.root.open=false;sorting.summary.focus();});
  }
  groups.append(sorting.root);
  const pricing=filterDropdown(document,'Price');
  const priceLabel=make('label','Maximum price (USD)'),price=make('input');price.id='catalog-price';price.type='number';price.min='0';price.step='0.01';priceLabel.append(price);pricing.panel.append(priceLabel);groups.append(pricing.root);
  const active=make('div',null,'catalog-active');active.id='catalog-active';controls.append(active);
  const clear=button('Clear filters',()=>{filters.clear();price.value='';query.value='';limit=24;sync();render();});clear.id='catalog-clear';controls.append(clear);
  function sync() {
    for(const input of groups.querySelectorAll('input[type="checkbox"]'))input.checked=filters.get(input.dataset.field)?.has(input.value)??false;
    for(const dropdown of groups.querySelectorAll('[data-filter-group]')) {
      const size=filters.get(dropdown.dataset.filterGroup)?.size??0;
      dropdown.querySelector('.filter-count').textContent=size?`(${size})`:'';
    }
  }
  function populate() {
    for(const field of ['brand','type','gender','seasons','group']) {
      const dropdown=filterDropdown(document,field==='type'?'Type':field==='gender'?'Gender':field==='seasons'?'Seasons':field==='group'?'Scents':fields[field]);
      dropdown.root.dataset.filterGroup=field;
      const section=make('fieldset');const legend=make('legend',fields[field],'visually-hidden');section.append(legend);dropdown.panel.append(section);
      if(field==='brand') {
        const label=make('label','Find a brand'),search=make('input');search.type='search';label.append(search);section.append(label);
        search.addEventListener('input',()=>{for(const row of section.querySelectorAll('.catalog-filter-option'))row.hidden=!row.textContent.toLowerCase().includes(search.value.toLowerCase().trim());});
      }
      const list=make('div',null,'catalog-filter-list');section.append(list);
      const values=field==='group'?SCENT_GROUPS.map(g=>g.id):[...new Set(catalog.flatMap(p=>Array.isArray(p[field])?p[field]:typeof p[field]==='string'?[p[field]]:[]))].sort((a,b)=>a.localeCompare(b,'en'));
      for(const value of values) {
        const label=make('label',null,'catalog-filter-option'),input=make('input');input.type='checkbox';input.value=value;input.dataset.field=field;
        const text=make('span',field==='group'?SCENT_GROUPS.find(g=>g.id===value).label:filterLabel(value));if(field==='brand')catalogText(text);
        label.append(input,text);list.append(label);
      }
      groups.insertBefore(dropdown.root,pricing.root);
    }sync();
  }
  function render() {
    if(!catalog)return;
    let matches=query.value.trim()?searchCatalog(catalog,query.value):[...catalog];
    for(const [field,values] of filters) {
      if(!values.size)continue;
      matches=matches.filter(p=>[...values].some(value=>field==='group'
        ? SCENT_GROUPS.find(g=>g.id===value)?.profiles.some(profile=>p.profile?.map(canonicalProfile).includes(profile))
        : Array.isArray(p[field])?p[field].includes(value):p[field]===value));
    }
    const validPrice=price.value===''||(price.validity.valid&&Number.isFinite(Number(price.value)));
    if(!validPrice)matches=[];
    else if(price.value!=='')matches=matches.filter(p=>Number.isFinite(p.priceUsd)&&p.priceUsd>=0&&p.priceUsd<=Number(price.value));
    const alpha=(a,b)=>a.name.localeCompare(b.name,'en')||a.brand.localeCompare(b.brand,'en')||a.id.localeCompare(b.id,'en');
    matches.sort((a,b)=>{
      if(sort.value==='name'||sort.value==='reverse')return (sort.value==='reverse'?-1:1)*alpha(a,b);
      const known=p=>Number.isFinite(p.priceUsd)&&p.priceUsd>=0;
      if(known(a)!==known(b))return known(a)?-1:1;
      return (known(a)?(sort.value==='low'?a.priceUsd-b.priceUsd:b.priceUsd-a.priceUsd):0)||alpha(a,b);
    });
    active.replaceChildren();
    if(price.value!=='') {
      const chip=button('',()=>{price.value='';limit=24;render();clear.focus();});
      chip.className='secondary-button catalog-chip';
      chip.append(make('span','Maximum price (USD)'),document.createTextNode(`: ${price.value} ×`));active.append(chip);
    }
    for(const [field,values] of filters)for(const value of values) {
      const chip=button('',()=>{values.delete(value);limit=24;sync();render();clear.focus();});
      chip.className='secondary-button catalog-chip';
      chip.append(make('span',fields[field]),document.createTextNode(': '),make('span',field==='group'?SCENT_GROUPS.find(g=>g.id===value)?.label:filterLabel(value)),make('span',' ×'));
      if(['brand','notes'].includes(field))chip.children[1]?.setAttribute('translate','no');
      active.append(chip);
    }
    const owned=new Set(getCollection().map(p=>p.id));
    grid.replaceChildren();
    for(const p of matches.slice(0,limit)) {
      const card=make('article',null,'catalog-card');card.dataset.perfumeId=p.id;
      card.append(catalogText(make('p',p.brand,'eyebrow')),catalogText(make('h2',p.name)),catalogText(make('p',concentrationLabel(p.concentration),'caption')),bottleImage(document));
      card.append(make('p',Number.isFinite(p.priceUsd)?`Catalog price: USD ${p.priceUsd.toFixed(2)}`:'Price not recorded','caption'));
      const actions=make('div',null,'catalog-card-actions');
      const add=button(owned.has(p.id)?'In your collection':'Add to my collection',()=>{
        if(addToCollection(p)){add.textContent='In your collection';add.setAttribute('aria-disabled','true');}
      });add.dataset.catalogAdd=p.id;add.setAttribute('aria-disabled',String(owned.has(p.id)));
      const compareButton=button('Compare',()=>compare(p));compareButton.dataset.catalogCompare=p.id;
      actions.append(add,compareButton);card.append(actions,infoButton(document,p));grid.append(card);
    }
    el('catalog-feedback').textContent=!validPrice?'Enter a price of 0 or more.':matches.length?`${matches.length} fragrances found`:'No fragrances found. Try another name or brand.';
    el('catalog-more').hidden=matches.length<=limit;
  }
  query.addEventListener('input',()=>{limit=24;render();});price.addEventListener('input',()=>{limit=24;render();});
  groups.addEventListener('change',event=>{
    const input=event.target;if(input.type!=='checkbox')return;
    const values=filters.get(input.dataset.field)??new Set();
    if(input.checked)values.add(input.value);else values.delete(input.value);
    filters.set(input.dataset.field,values);limit=24;sync();render();
  });
  el('catalog-more').addEventListener('click',()=>{const previous=limit;limit+=24;render();grid.children[previous]?.querySelector('button')?.focus();});
  async function enter() {
    if(catalog){render();return;}if(loading)return;
    loading=true;el('catalog-feedback').textContent='Loading fragrances...';el('catalog-retry').hidden=true;
    try{catalog=await load();populate();render();}catch{el('catalog-feedback').textContent='We could not load the fragrances. Please try again.';el('catalog-retry').hidden=false;}finally{loading=false;}
  }
  el('catalog-retry').addEventListener('click',enter);
  return {enter,filter(field,value){filters.clear();query.value='';price.value='';limit=24;
    if(field==='priceUsd')price.value=value;else if(fields[field])filters.set(field,new Set([value]));
    sync();render();
  }};
}
