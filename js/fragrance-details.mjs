import {concentrationLabel} from './view.mjs';
import {filterLabel} from './filter-controls.mjs';

export function detailNode(document,tag,text,className) {
  const node=document.createElement(tag);
  if(text!==null&&text!==undefined)node.textContent=text;
  if(className)node.className=className;
  return node;
}
export function catalogText(node) {node.setAttribute('translate','no');return node;}
export function bottleImage(document) {
  const svg=document.getElementById('collection-card-template').content.querySelector('svg').cloneNode(true);
  svg.classList.add('compare-bottle');svg.setAttribute('aria-hidden','true');return svg;
}
export function descriptionNode(document,perfume) {
  const value=typeof perfume.description==='string'?perfume.description.trim():'';
  const node=detailNode(document,'p',value||'No description has been added yet.','reading-copy perfume-description');
  if(value){catalogText(node);node.lang='en';}return node;
}
export function labelList(document,values,{literal=false}={}) {
  if(!Array.isArray(values)||!values.every(v=>typeof v==='string'&&v.trim()))return detailNode(document,'p','Not recorded','caption');
  if(!values.length)return detailNode(document,'p','No assignments','caption');
  const list=detailNode(document,'ul',null,'compare-labels');
  for(const value of new Set(values)){const item=detailNode(document,'li',value);if(literal)catalogText(item);list.append(item);}return list;
}
export function initializeFragranceDetails(document,{getCatalog,onBrowse=()=>{}}) {
  const make=(...args)=>detailNode(document,...args);
  const dialog=make('dialog',null,'fragrance-dialog');dialog.id='fragrance-details';dialog.setAttribute('aria-labelledby','fragrance-detail-title');
  const closeButton=make('button',null,'dialog-close');closeButton.type='button';closeButton.setAttribute('aria-label','Close fragrance details');
  const cross=make('span','×');cross.setAttribute('aria-hidden','true');closeButton.append(cross);
  const layout=make('div',null,'fragrance-detail-layout');dialog.append(closeButton,layout);document.body.append(dialog);
  let opener=null,restore=true;
  function close(restoreFocus=true){restore=restoreFocus;if(dialog.open)dialog.close();}
  function browse(node,field,value) {
    const link=make('a',node.textContent,'catalog-fact-link');link.href='#catalog';
    link.dataset.catalogField=field;link.dataset.catalogValue=String(value);
    if(node.getAttribute('translate')==='no')link.setAttribute('translate','no');
    link.addEventListener('click',event=>{
      if(event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
      onBrowse(field,value);close(false);
    });
    node.replaceChildren(link);return node;
  }
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});closeButton.addEventListener('click',()=>close());
  dialog.addEventListener('close',()=>{if(restore&&opener?.isConnected&&!opener.closest('[hidden], [inert]'))opener.focus({preventScroll:true});});
  function open(perfume,button) {
    opener=button;restore=true;layout.replaceChildren();
    const visual=make('div',null,'fragrance-detail-visual');visual.append(bottleImage(document));
    const content=make('div',null,'fragrance-detail-copy');
    const title=catalogText(make('h2',perfume.name,'section-heading'));title.id='fragrance-detail-title';
    content.append(browse(catalogText(make('p',perfume.brand,'eyebrow')),'brand',perfume.brand),title,browse(catalogText(make('p',concentrationLabel(perfume.concentration),'caption')),'concentration',perfume.concentration),make('h3','Catalog description'),descriptionNode(document,perfume));
    const facts=make('dl',null,'fragrance-facts');
    const types={designer:'Designer',arabic:'Middle Eastern / Arabic',niche:'Niche'};
    const genders={men:'Masculine',women:'Feminine',unisex:'Unisex'};
    const prices=[['USD',perfume.priceUsd]].filter(([,n])=>typeof n==='number'&&Number.isFinite(n)&&n>=0).map(([currency,n])=>`${currency} ${n.toFixed(2)}`);
    for(const [label,value,key]of [['Fragrance type',types[perfume.type],'type'],['Fragrance gender',genders[perfume.gender],'gender'],['Catalog price',prices.join(' · '),'priceUsd']]) {
      const row=make('div'),dd=make('dd',value||'Not recorded');if(value)browse(dd,key,perfume[key]);row.append(make('dt',label),dd);facts.append(row);
    }content.append(facts);
    for(const [label,key]of [['Notes','notes'],['Scent profiles','profile'],['Occasions','occasions'],['Suggested seasons','seasons']]){
      const section=make('section'),list=labelList(document,perfume[key],{literal:key==='notes'});
      for(const item of list.querySelectorAll('li')) {
        const value=item.textContent;if(key==='seasons')item.textContent=filterLabel(value);
        browse(item,key,value);
      }
      section.append(make('h3',label),list);content.append(section);
    }
    content.append(make('p','Occasions and seasons are suggestions, not rules.','caption'));
    layout.append(visual,content);dialog.showModal();dialog.scrollTop=0;closeButton.focus();
  }
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-fragrance-info]');
    if(!button||button.closest('[hidden], [inert]'))return;
    const perfume=getCatalog().find(p=>p.id===button.dataset.fragranceInfo);if(perfume)open(perfume,button);
  });
  return {close};
}
