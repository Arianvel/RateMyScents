import {loadCatalog,searchCatalog} from './catalog.mjs';
import {concentrationLabel} from './view.mjs';
import {exportNine} from './nine-export.mjs';
import {NINE_PALETTES,nineCaption,nineList} from './nine-personalization.mjs';
import {connectSearchKeyboard,searchAnnouncement} from './search-keyboard.mjs';

export function initializeMyNine(document,toast=null) {
  const el=id=>document.getElementById(id), grid=el('nine-grid'), dialog=el('nine-picker');
  const slots=Array(9).fill(null);
  let catalog=null, active=0, restore=true;
  let previous=null, exporting=false, copying=false;
  const remember=()=>{previous=[...slots];el('nine-copy-fallback').hidden=true;toast?.clear('nine');};
  const options=()=>({name:el('nine-owner').value,palette:document.querySelector('input[name="nine-palette"]:checked').value});
  const node=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};
  const focusSlot=i=>grid.children[i].querySelector('.nine-select').focus();
  const status=text=>{el('nine-status').textContent=text;};
  const announceSearch=searchAnnouncement(el('nine-search-live'));
  function render() {
    grid.replaceChildren();
    slots.forEach((perfume,i)=>{
      const card=node('article',null,'nine-card');
      const choose=node('button',null,'nine-select');choose.type='button';choose.dataset.slot=i;
      choose.setAttribute('aria-label',`Position ${i+1}: ${perfume ? `${perfume.brand} ${perfume.name}, ${perfume.concentration}. Change fragrance` : 'Choose a fragrance'}`);
      choose.append(node('span',String(i+1).padStart(2,'0'),'nine-rank'));
      const svg=document.getElementById('collection-card-template').content.querySelector('svg').cloneNode(true);
      svg.classList.add('nine-bottle');choose.append(svg);
      if(perfume) choose.append(node('span',perfume.brand,'nine-brand'));
      choose.append(node('span',perfume?.name ?? 'Choose a fragrance','nine-name'));
      if(!perfume) {const plus=node('span','+','nine-plus');plus.setAttribute('aria-hidden','true');choose.append(plus);}
      if(perfume) choose.append(node('span',concentrationLabel(perfume.concentration),'nine-concentration'));
      if(perfume) for(const item of choose.querySelectorAll('.nine-brand,.nine-name,.nine-concentration')) item.setAttribute('translate','no');
      card.append(choose);
      if(perfume) {
        const actions=node('div',null,'nine-actions');
        for(const [action,text] of [['left','\u2190'],['right','\u2192'],['remove','\u00d7']]) {
          const button=node('button',text);button.type='button';button.dataset.action=action;button.dataset.slot=i;
          button.setAttribute('aria-label',action==='remove' ? `Remove ${perfume.name}` : `Move ${perfume.name} ${action} to position ${i+(action==='left' ? 0 : 2)}`);
          button.disabled=(action==='left'&&i===0)||(action==='right'&&i===8);
          if(button.disabled) button.setAttribute('aria-label',`Cannot move ${perfume.name} further ${action}`);
          if(action==='remove') {button.className='nine-remove';card.append(button);} else actions.append(button);
        }
        card.append(actions);
      }
      grid.append(card);
    });
    const empty=!slots.some(Boolean);
    el('nine-export').disabled=empty;
    el('nine-copy').disabled=empty;
    el('nine-clear').disabled=empty;
    el('nine-undo').disabled=!previous;
  }
  function search() {
    const matches=searchCatalog(catalog??[],el('nine-search').value), target=el('nine-matches');target.replaceChildren();
    el('nine-search-status').textContent=!catalog ? 'Loading fragrances...' : !catalog.length ? 'No fragrances are available yet.' : !el('nine-search').value.trim() ? 'Type a name or brand to find your favourite.' : matches.length ? `${matches.length} fragrances found` : 'No matches. Try another name or brand.';
    announceSearch(el('nine-search-status').textContent);
    for(const perfume of matches) {
      const used=slots.some((p,i)=>i!==active&&p?.id===perfume.id);
      const button=node('button',`${perfume.brand} · ${perfume.name} · ${concentrationLabel(perfume.concentration)}${used ? ' · Already in your nine' : ''}`,'nine-match');button.type='button';button.disabled=used;
      button.addEventListener('click',()=>{remember();slots[active]=perfume;render();dialog.close();status(`${perfume.name} added to position ${active+1}.`);});target.append(button);
    }
  }
  async function load() {
    el('nine-search').disabled=true;el('nine-retry').hidden=true;el('nine-search-status').textContent='Loading fragrances...';
    try {catalog=await loadCatalog('./scents.json');el('nine-search').disabled=!catalog.length;search();if(dialog.open)el('nine-search').focus();}
    catch {el('nine-search-status').textContent='We could not load the fragrances. Please try again.';announceSearch(el('nine-search-status').textContent);el('nine-retry').hidden=false;}
  }
  grid.addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button)return;
    const i=Number(button.dataset.slot);
    if(button.dataset.action==='remove') {remember();slots[i]=null;render();focusSlot(i);status(`Position ${i+1} cleared.`);toast?.show('nine','Fragrance removed from My 9 Scents.',undo);}
    else if(['left','right'].includes(button.dataset.action)) {
      const destination=i+(button.dataset.action==='left' ? -1 : 1);
      if(destination<0||destination>8)return;
      remember();
      [slots[i],slots[destination]]=[slots[destination],slots[i]];
      render();focusSlot(destination);status(`Moved to position ${destination+1}.`);
    }
    else {active=i;restore=true;el('nine-picker-title').textContent=`Choose fragrance ${i+1}`;el('nine-search').value='';dialog.showModal();el('nine-close').focus();if(catalog){search();el('nine-search').focus();}else load();}
  });
  el('nine-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('cancel',event=>{event.preventDefault();dialog.close();});
  dialog.addEventListener('close',()=>{if(restore&&!el('my-nine-view').hidden)focusSlot(active);});
  el('nine-search').addEventListener('input',search);el('nine-retry').addEventListener('click',load);
  connectSearchKeyboard(el('nine-search'),el('nine-matches'));
  el('nine-clear').addEventListener('click',()=>{
    if(!slots.some(Boolean))return;
    remember();slots.fill(null);render();el('nine-undo').focus();status('Your nine is empty. Undo brings your picks back.');
    toast?.show('nine','Your nine is empty. Undo brings your picks back.',undo);
  });
  function undo(){
    if(!previous)return;
    slots.splice(0,9,...previous);previous=null;render();focusSlot(active);status('Last change undone.');
    toast?.clear('nine');
    el('nine-copy-fallback').hidden=true;
  }
  el('nine-undo').addEventListener('click',undo);
  function personalize() {
    const {name,palette}=options(),caption=nineCaption(name),preview=el('nine-preview');
    preview.dataset.palette=palette;
    for(const [key,value] of Object.entries(NINE_PALETTES[palette])) preview.style.setProperty(`--nine-${key}`,value);
    el('nine-preview-title').textContent=caption.title;
    el('nine-preview-name').textContent=caption.owner;el('nine-preview-name').hidden=!caption.owner;
    el('nine-copy-fallback').hidden=true;
  }
  el('nine-owner').addEventListener('input',personalize);
  for(const radio of document.querySelectorAll('input[name="nine-palette"]')) radio.addEventListener('change',personalize);
  el('nine-copy').addEventListener('click',async()=>{
    if(copying||!slots.some(Boolean))return;
    copying=true;el('nine-copy').setAttribute('aria-disabled','true');el('nine-copy').setAttribute('aria-busy','true');
    const text=nineList(slots,options().name,document.documentElement.lang);
    try {
      if(!document.defaultView.navigator.clipboard?.writeText)throw new Error('Clipboard unavailable');
      await document.defaultView.navigator.clipboard.writeText(text);status('List copied. Ready to share.');
    } catch {
      el('nine-copy-fallback').hidden=false;el('nine-copy-text').value=text;
      // Do not move focus into a hidden page if the user navigated while copying.
      if(!el('my-nine-view').hidden) {el('nine-copy-text').focus();el('nine-copy-text').select();}
      status('Copy was blocked. Your list is selected below so you can copy it yourself.');
    } finally {copying=false;el('nine-copy').removeAttribute('aria-disabled');el('nine-copy').removeAttribute('aria-busy');el('nine-copy').disabled=!slots.some(Boolean);}
  });
  el('nine-export').addEventListener('click',async()=>{
    const button=el('nine-export');if(exporting||!slots.some(Boolean))return;exporting=true;button.setAttribute('aria-disabled','true');button.setAttribute('aria-busy','true');status('Preparing your image...');
    try {await exportNine(document,[...slots],options());status('Your image is ready. Check your downloads.');}
    catch {status('The image could not be created. Please try again.');}
    finally {exporting=false;button.removeAttribute('aria-disabled');button.removeAttribute('aria-busy');button.disabled=!slots.some(Boolean);}
  });
  personalize();render();
  return {leaveRoute(){restore=false;if(dialog.open)dialog.close();render();}};
}
