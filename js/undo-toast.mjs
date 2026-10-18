export function createUndoToast(document) {
  const box=document.createElement('div');box.className='undo-toast';box.hidden=true;
  const message=document.createElement('span');message.setAttribute('role','status');message.setAttribute('aria-live','polite');
  const undo=document.createElement('button');undo.type='button';undo.className='secondary-button';undo.textContent='Undo';undo.dataset.action='toast-undo';
  const dismiss=document.createElement('button');dismiss.type='button';dismiss.className='text-button';dismiss.textContent='×';dismiss.setAttribute('aria-label','Dismiss notification');
  box.append(message,undo,dismiss);document.body.append(box);
  let owner=null,action=null,returnFocus=null;
  function hide() {box.hidden=true;document.body.classList.remove('has-undo-toast');message.textContent='';action=null;owner=null;}
  undo.addEventListener('click',()=>{const run=action;hide();run?.();});
  dismiss.addEventListener('click',()=>{hide();if(returnFocus?.isConnected&&!returnFocus.closest('[hidden]'))returnFocus.focus();});
  return {
    show(key,text,callback){owner=key;action=callback;returnFocus=document.activeElement;message.textContent=text;box.hidden=false;document.body.classList.add('has-undo-toast');},
    clear(key){if(owner===key){const focused=box.contains(document.activeElement);hide();if(focused&&returnFocus?.isConnected&&!returnFocus.closest('[hidden]'))returnFocus.focus();}},
    hide,
  };
}
