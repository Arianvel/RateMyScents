import {loadCatalog,searchCatalog} from './catalog.mjs';
import {concentrationLabel} from './view.mjs';
import {connectSearchKeyboard,searchAnnouncement} from './search-keyboard.mjs';
import {bottleImage} from './fragrance-details.mjs';
import {renderComparison} from './compare-presentation.mjs';

export function initializeCompare(document,{getCollection=()=>[],addToCollection=()=>false}={}) {
  const el=id=>document.getElementById(id);
  const make=(tag,text,cls)=>{const node=document.createElement(tag);if(text!==undefined&&text!==null)node.textContent=text;if(cls)node.className=cls;return node;};
  let catalog=null,loading=false;
  const chosen=[null,null],pickers=[];
  const literal=node=>{node.setAttribute('translate','no');return node;};
  function updateAddButtons() {
    const owned=new Set(getCollection().map(p=>p.id));
    pickers.forEach((picker,index)=>{
      const perfume=chosen[index],included=perfume&&owned.has(perfume.id);
      picker.add.hidden=!perfume;
      picker.add.textContent=included?'In your collection':'Add to my collection';
      picker.add.setAttribute('aria-disabled',String(Boolean(included)));
    });
  }
  function render() {
    const content=el('compare-content');content.replaceChildren();
    for(let i=0;i<2;i++) {
      const p=chosen[i],picker=pickers[i];picker.selection.replaceChildren();
      if(p) {
        picker.selection.append(literal(make('h2',`${p.brand} ${p.name}`,'section-heading')),literal(make('p',concentrationLabel(p.concentration),'caption')),bottleImage(document));
      } else picker.selection.append(make('p','Choose a fragrance to compare.','caption'),bottleImage(document));
      picker.clear.disabled=!p;
    }
    renderComparison(content,chosen);
    updateAddButtons();
  }

  function select(index,perfume,origin) {
    chosen[index]=perfume;pickers[index].input.value='';
    for(const picker of pickers){picker.owned.hidden=true;picker.fromCollection.setAttribute('aria-expanded','false');}
    render();search(0);search(1);origin.focus();el('compare-status').textContent='';pickers[index].announce('Comparison updated.');
  }
  function showOwned(index) {
    const picker=pickers[index];picker.owned.replaceChildren();
    const collection=getCollection();
    if(!collection.length)picker.owned.append(make('p','Add fragrances to your collection to choose them here.','caption'));
    for(const perfume of collection){const button=make('button',null,'nine-match');button.type='button';button.dataset.perfumeId=perfume.id;
      button.append(literal(make('span',`${perfume.brand} · ${perfume.name} · ${concentrationLabel(perfume.concentration)}`)));
      button.disabled=chosen.some(p=>p?.id===perfume.id);if(button.disabled)button.append(make('span','Already selected','caption'));
      button.addEventListener('click',()=>select(index,perfume,picker.fromCollection));picker.owned.append(button);
    }
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
      button.addEventListener('click',()=>select(index,p,picker.input));
      picker.matches.append(button);
    }
  }
  for(let i=0;i<2;i++) {
    const card=make('div',null,'compare-picker'),label=make('label',i===0?'First fragrance':'Second fragrance');
    const input=make('input');input.id=`compare-search-${i}`;input.type='search';input.autocomplete='off';input.placeholder='Search by name or brand';input.disabled=true;label.htmlFor=input.id;
    const searchbar=make('div',null,'compare-searchbar'),fromCollection=make('button','My collection','secondary-button compare-collection-button');fromCollection.type='button';fromCollection.dataset.action='choose-from-collection';fromCollection.setAttribute('aria-expanded','false');
    const owned=make('div',null,'compare-owned');owned.id=`compare-owned-${i}`;owned.hidden=true;fromCollection.id=`compare-collection-${i}`;owned.setAttribute('role','region');owned.setAttribute('aria-labelledby',fromCollection.id);label.id=`compare-label-${i}`;fromCollection.setAttribute('aria-describedby',label.id);fromCollection.setAttribute('aria-controls',owned.id);searchbar.append(input,fromCollection);
    fromCollection.addEventListener('click',()=>{const open=owned.hidden;for(const picker of pickers){picker.owned.hidden=true;picker.fromCollection.setAttribute('aria-expanded','false');}owned.hidden=!open;fromCollection.setAttribute('aria-expanded',String(open));if(open)showOwned(i);});
    owned.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();owned.hidden=true;fromCollection.setAttribute('aria-expanded','false');fromCollection.focus();}});
    fromCollection.addEventListener('keydown',event=>{if(event.key==='Escape'&&!owned.hidden){event.preventDefault();owned.hidden=true;fromCollection.setAttribute('aria-expanded','false');}});
    fromCollection.addEventListener('keydown',event=>{if(event.key==='ArrowDown'&&owned.hidden){fromCollection.click();}});
    connectSearchKeyboard(fromCollection,owned);
    const matches=make('div',null,'compare-matches'),live=make('p',null,'caption'),announcement=make('p',null,'visually-hidden');announcement.setAttribute('role','status');
    const selection=make('div',null,'compare-selection'),clear=make('button','Clear selection','text-button');clear.type='button';
    selection.id=`compare-selection-${i}`;
    const add=make('button','Add to my collection','secondary-button compare-add');add.type='button';add.dataset.action='add-to-collection';add.hidden=true;add.setAttribute('aria-describedby',selection.id);
    add.addEventListener('click',()=>{
      const perfume=chosen[i];if(!perfume||getCollection().some(p=>p.id===perfume.id))return;
      if(addToCollection(perfume)) {updateAddButtons();for(let index=0;index<pickers.length;index++)if(!pickers[index].owned.hidden)showOwned(index);}
    });
    clear.addEventListener('click',()=>{chosen[i]=null;render();search(0);search(1);input.focus();el('compare-status').textContent='';pickers[i].announce('Selection cleared.');});
    input.addEventListener('input',()=>{owned.hidden=true;fromCollection.setAttribute('aria-expanded','false');search(i);});connectSearchKeyboard(input,matches);
    card.append(label,searchbar,live,announcement,matches,owned,selection,clear,add);el('compare-pickers').append(card);
    pickers.push({input,matches,live,selection,clear,add,owned,fromCollection,announce:searchAnnouncement(announcement)});
  }
  async function load() {
    if(loading)return;loading=true;el('compare-retry').hidden=true;el('compare-status').textContent='Loading fragrances...';
    try{catalog=await loadCatalog('./scents.json');pickers.forEach(p=>p.input.disabled=!catalog.length);el('compare-status').textContent=catalog.length?'':'No fragrances are available yet.';}
    catch{el('compare-status').textContent='We could not load the fragrances. Please try again.';el('compare-retry').hidden=false;}
    finally{loading=false;}
  }
  el('compare-retry').addEventListener('click',load);render();
  return {
    choose(perfume){if(chosen[1]?.id===perfume.id)chosen[1]=null;select(0,perfume,pickers[0].input);},
    enter(){updateAddButtons();for(const picker of pickers){picker.owned.hidden=true;picker.fromCollection.setAttribute('aria-expanded','false');}if(catalog===null)load();}
  };
}
