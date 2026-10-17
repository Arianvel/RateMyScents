/** Shared document and shell: route changes never recreate session state. */
export function initializeNavigation(document, {onHome, beforeRoute = hash => hash, onRoute = () => {}}) {
  const window = document.defaultView;
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.header-nav');
  const mobile = window.matchMedia?.('(max-width: 720px)');
  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    toggle.firstElementChild.textContent = open ? '×' : '☰';
    nav.hidden = Boolean(mobile?.matches) && !open;
  }
  function adaptMenu() {
    const focused = document.activeElement;
    toggle.hidden = !mobile?.matches;
    setMenu(false);
    if (nav.hidden && nav.contains(focused)) toggle.focus();
    else if (toggle.hidden && focused === toggle) nav.querySelector('a').focus();
  }
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      event.preventDefault();
      setMenu(false);
      toggle.focus();
    }
  });
  mobile?.addEventListener('change', adaptMenu);
  adaptMenu();
  if ('scrollRestoration' in window.history) window.history.scrollRestoration='manual';
  const routes = {
    '#my-9-scents': ['my-nine-view','nine-title','My 9 Scents'],
    '#home': ['home-view','page-title','Build your collection'],
    '#collection': ['home-view','collection-heading','Build your collection'],
    '#how-it-works': ['how-it-works','how-title','How it works'],
    '#quiz': ['quiz-view','quiz-title','Find your next scent'],
    '#results': ['results-view','results-title','Your collection analysis'],
  };
  function render(moveFocus = false) {
    setMenu(false);
    const requested = routes[window.location.hash] ? window.location.hash : '#home';
    const hash = beforeRoute(requested);
    if(hash !== requested || window.location.hash==='#about') window.history.replaceState(null,'',hash);
    const [viewId,titleId,title] = routes[hash];
    for (const id of new Set(Object.values(routes).map(route => route[0]))) document.getElementById(id).hidden=id!==viewId;
    document.title=`${title} · RateMyScents`;
    for(const link of document.querySelectorAll('.site-header a, .site-footer a')) {
      const current = ['#how-it-works','#my-9-scents'].includes(hash) ? link.hash===hash : viewId==='home-view' && link.hash==='#collection';
      if(current) link.setAttribute('aria-current','page'); else link.removeAttribute('aria-current');
    }
    if(viewId==='home-view') onHome();
    onRoute(hash);
    if(moveFocus) {
      const target=document.getElementById(titleId);
      target.focus({preventScroll:true});
      window.scrollTo({top:0,left:0,behavior:'instant'});
    }
  }
  window.addEventListener('hashchange',()=>render(true));
  document.addEventListener('click',event=>{
    const link=event.target.closest('a');
    if(!link || event.button!==0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const destination=link.getAttribute('href');
    if(destination==='#main') {
      event.preventDefault(); const main=document.getElementById('main'); main.focus({preventScroll:true}); main.scrollIntoView?.({block:'start'});
    } else if(routes[destination]) {
      // Native fragment navigation can scroll past the shared header.
      event.preventDefault();
      if(destination!==window.location.hash) window.history.pushState(null,'',destination);
      render(true);
    }
  });
  render();
}
