import {translate} from './i18n.mjs';

/** Localizes presentation only: never changes input values, IDs or catalog records. */
export function initializePreferences(document) {
  const window=document.defaultView;
  const language=document.getElementById('language-select');
  const theme=document.getElementById('theme-toggle');
  const originals=new WeakMap();
  let locale='en';
  const attributes=['aria-label','aria-valuetext','placeholder','title'];
  const excluded=element=>element?.closest?.('script,style,[translate="no"]');
  function convert(node,key,current,set) {
    let entries=originals.get(node);
    if(!entries) {entries=new Map();originals.set(node,entries);}
    let entry=entries.get(key);
    if(!entry || current!==entry.rendered) entry={source:current};
    const value=translate(entry.source,locale);
    entry.rendered=value;entries.set(key,entry);
    if(current!==value) set(value);
  }
  function visit(root) {
    if(root.nodeType===3) {
      if(!excluded(root.parentElement)) convert(root,'text',root.data,value=>{root.data=value;});
      return;
    }
    if(root.nodeType!==1 && root.nodeType!==9) return;
    if(excluded(root)) return;
    if(root.nodeType===1) for(const name of attributes) if(root.hasAttribute(name)) convert(root,name,root.getAttribute(name),value=>root.setAttribute(name,value));
    for(const child of root.childNodes) visit(child);
  }
  const observe=()=>observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:attributes});
  const observer=new window.MutationObserver(records=>{
    observer.disconnect();
    for(const record of records) {
      if(record.type==='childList') for(const node of record.addedNodes) visit(node);
      else visit(record.target);
    }
    observe();
  });
  function apply() {
    observer.disconnect();visit(document);observe();
  }
  language.addEventListener('change',()=>{
    locale=language.value==='es'?'es':'en';
    document.documentElement.lang=locale;
    apply();
  });
  theme.addEventListener('click',()=>{
    const dark=document.documentElement.dataset.theme!=='dark';
    document.documentElement.dataset.theme=dark?'dark':'light';
    theme.setAttribute('aria-checked',String(dark));
    apply();
  });
  document.documentElement.lang='en';document.documentElement.dataset.theme='light';
  apply();
}
