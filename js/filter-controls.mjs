export const filterLabel=value=>({
  spring:'Spring',summer:'Summer',autumn:'Autumn',winter:'Winter',
  men:'Masculine',women:'Feminine',unisex:'Unisex',
  designer:'Designer',arabic:'Middle Eastern / Arabic',niche:'Niche',
})[value]??value;

export function filterIcon(document,sort=false) {
  const ns='http://www.w3.org/2000/svg';
  const icon=document.createElementNS(ns,'svg');icon.setAttribute('viewBox','0 0 24 24');
  icon.setAttribute('class',sort?'filter-arrow filter-sort-icon':'filter-arrow');
  icon.setAttribute('aria-hidden','true');icon.setAttribute('focusable','false');
  const path=document.createElementNS(ns,'path');
  path.setAttribute('d',sort?'M7 19V5m-4 4 4-4 4 4m6-4v14m-4-4 4 4 4-4':'m6 9 6 6 6-6');
  icon.append(path);return icon;
}

export function filterDropdown(document,label,{sort=false}={}) {
  const root=document.createElement('details');root.className='filter-dropdown';
  const summary=document.createElement('summary');
  const text=document.createElement('span');text.textContent=label;
  const icon=filterIcon(document,sort);
  const count=document.createElement('span');count.className='filter-count';
  summary.append(text,count,icon);
  const panel=document.createElement('div');panel.className='filter-popover';
  root.append(summary,panel);
  return {root,panel,summary,count};
}

export function connectFilterBar(bar) {
  const document=bar.ownerDocument;
  bar.addEventListener('click',event=>{
    const summary=event.target.closest('summary');
    if(!summary||!bar.contains(summary))return;
    for(const dropdown of bar.querySelectorAll('details[open]'))if(dropdown!==summary.parentElement)dropdown.open=false;
  });
  bar.addEventListener('keydown',event=>{
    if(event.key!=='Escape')return;
    const dropdown=event.target.closest('details[open]');
    if(dropdown){event.preventDefault();dropdown.open=false;dropdown.querySelector('summary').focus();}
  });
  document.addEventListener('click',event=>{
    if(!bar.contains(event.target))for(const dropdown of bar.querySelectorAll('details[open]'))dropdown.open=false;
  });
}
