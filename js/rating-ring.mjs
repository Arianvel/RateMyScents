/** Reveal an already calculated rating; no artificial loading or scoring changes. */
export function ratingRing(document, score, value) {
  const target=Math.floor(value);
  const ring=document.createElement('div');ring.className='rating-ring';
  ring.setAttribute('role','img');
  ring.setAttribute('aria-label',`Collection rating: ${target} out of 100`);
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox','0 0 120 120');svg.setAttribute('aria-hidden','true');
  for(const className of ['rating-ring-track','rating-ring-progress']) {
    const circle=document.createElementNS(svg.namespaceURI,'circle');
    for(const [key,val] of Object.entries({cx:60,cy:60,r:53,pathLength:100,class:className})) circle.setAttribute(key,String(val));
    svg.append(circle);
  }
  const arc=svg.lastElementChild;
  score.setAttribute('aria-hidden','true');
  ring.append(svg,score);
  const draw=number=>{score.textContent=`${number} / 100`;arc.setAttribute('stroke-dashoffset',String(100-number));};
  const window=document.defaultView;
  if(!window?.requestAnimationFrame || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    draw(target);return ring;
  }
  draw(0);
  let start;
  function tick(time) {
    if(!ring.isConnected || ring.closest('[hidden]')) return;
    start??=time;
    const progress=Math.min((time-start)/1200,1);
    const ease=1-(1-progress)**3;
    draw(progress===1 ? target : Math.floor(target*ease));
    if(progress<1) window.requestAnimationFrame(tick);
  }
  window.requestAnimationFrame(tick);
  return ring;
}
