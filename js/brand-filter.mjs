import {filterDropdown,connectFilterBar,filterLabel,filterIcon} from './filter-controls.mjs';
export function initializeBrandFilter(document,onChange) {
  const options=document.getElementById('brand-options');
  const input=document.getElementById('brand-search');
  const clear=document.getElementById('clear-brands');
  const selected=new Set();
  const extras={type:new Set(),gender:new Set()};
  const bar=document.createElement('div');bar.id='home-filter-bar';bar.className='filter-bar';
  const brand=document.getElementById('brand-filter');brand.before(bar);bar.append(brand);
  brand.className='filter-dropdown';brand.querySelector('.brand-panel').classList.add('filter-popover');
  brand.querySelector('summary').append(filterIcon(document));
  const dropdowns={};
  for(const [field,title,values] of [['type','Type',['designer','arabic','niche']],['gender','Gender',['men','women','unisex']]]) {
    const dropdown=filterDropdown(document,title);dropdowns[field]=dropdown;
    for(const value of values) {
      const label=document.createElement('label');label.className='catalog-filter-option';
      const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.value=value;checkbox.dataset.homeField=field;checkbox.disabled=true;
      const text=document.createElement('span');text.textContent=filterLabel(value);label.append(checkbox,text);dropdown.panel.append(label);
      checkbox.addEventListener('change',()=>{if(checkbox.checked)extras[field].add(value);else extras[field].delete(value);changed();});
    }bar.append(dropdown.root);
  }
  const reset=document.createElement('button');reset.id='home-clear-filters';reset.type='button';reset.className='text-button';reset.textContent='Clear filters';reset.hidden=true;bar.append(reset);
  connectFilterBar(bar);
  reset.addEventListener('click',()=>{
    selected.clear();extras.type.clear();extras.gender.clear();
    for(const checkbox of bar.querySelectorAll('input[type="checkbox"]'))checkbox.checked=false;
    input.value='';filter();changed();brand.querySelector('summary').focus();
  });
  const normalize=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  function filter() {
    let visible=0;
    for(const label of options.querySelectorAll('label')) {
      label.hidden=!normalize(label.textContent).includes(normalize(input.value));
      if(!label.hidden)visible++;
    }
    document.getElementById('brand-empty').hidden=visible>0;
  }
  function changed() {
    document.getElementById('brand-count').textContent=selected.size?`(${selected.size})`:'';
    clear.disabled=!selected.size;
    for(const field of ['type','gender'])dropdowns[field].count.textContent=extras[field].size?`(${extras[field].size})`:'';
    reset.hidden=!(selected.size||extras.type.size||extras.gender.size);
    onChange();
  }
  input.addEventListener('input',filter);
  options.addEventListener('change',event=>{
    if(event.target.type!=='checkbox')return;
    if(event.target.checked)selected.add(event.target.value);else selected.delete(event.target.value);
    changed();
  });
  clear.addEventListener('click',()=>{
    selected.clear();for(const checkbox of options.querySelectorAll('input'))checkbox.checked=false;
    input.value='';filter();changed();input.focus();
  });
  document.getElementById('brand-filter').addEventListener('keydown',event=>{
    if(event.key==='Escape') {
      event.preventDefault();document.getElementById('brand-filter').open=false;
      document.querySelector('#brand-filter summary').focus();
    }
  });
  return {
    selected,
    get active(){return Boolean(selected.size||extras.type.size||extras.gender.size);},
    apply(catalog){return catalog.filter(p=>(!selected.size||selected.has(p.brand))&&(!extras.type.size||extras.type.has(p.type))&&(!extras.gender.size||extras.gender.has(p.gender)));},
    populate(catalog) {
      for(const label of options.querySelectorAll('label'))label.remove();
      for(const brand of [...new Set(catalog.map(p=>p.brand))].sort((a,b)=>a.localeCompare(b,'en'))) {
        const label=document.createElement('label');const checkbox=document.createElement('input');
        checkbox.type='checkbox';checkbox.value=brand;checkbox.checked=selected.has(brand);
        const text=document.createElement('span');text.textContent=brand;text.setAttribute('translate','no');
        label.append(checkbox,text);options.append(label);
      }
      input.disabled=!catalog.length;filter();
      for(const checkbox of bar.querySelectorAll('[data-home-field]'))checkbox.disabled=!catalog.length;
    },
  };
}
