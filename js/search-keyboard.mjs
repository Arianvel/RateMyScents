/** Wait for a typing pause; keep the live region mounted and announce one count. */
export function searchAnnouncement(liveRegion) {
  const window=liveRegion.ownerDocument.defaultView;
  let timer,latest='';
  return message=>{
    window.clearTimeout(timer);
    timer=window.setTimeout(()=>{
      if(message===latest)return;
      latest=message;liveRegion.textContent=message;
    },250);
  };
}

/** Keep native buttons and Tab order; arrows are an optional shortcut. */
export function connectSearchKeyboard(input, results) {
  const buttons=()=>[...results.querySelectorAll('button:not(:disabled):not([aria-disabled="true"])')];
  input.addEventListener('keydown',event=>{
    if(event.key!=='ArrowDown') return;
    const first=buttons()[0];
    if(first) {event.preventDefault();first.focus();}
  });
  results.addEventListener('keydown',event=>{
    const items=buttons(),index=items.indexOf(event.target);
    if(index<0 || !['ArrowDown','ArrowUp','Home','End'].includes(event.key)) return;
    event.preventDefault();
    const target=event.key==='Home'?items[0]:event.key==='End'?items.at(-1)
      :event.key==='ArrowUp'?(items[index-1]??input):(items[index+1]??items[index]);
    target.focus();
  });
}
