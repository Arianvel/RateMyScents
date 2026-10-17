import {concentrationLabel} from './view.mjs';
import {translate} from './i18n.mjs';
import {NINE_PALETTES,nineCaption} from './nine-personalization.mjs';

export async function exportNine(document,slots,{name='',palette='gold'}={}) {
  const window=document.defaultView;
  const language=document.documentElement.lang;
  const colors=NINE_PALETTES[palette]??NINE_PALETTES.gold;
  const caption=nineCaption(name,language);
  const t=text=>translate(text,language);
  await document.fonts?.ready;
  const canvas=document.createElement('canvas');canvas.width=1500;canvas.height=1740;
  const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas unavailable');
  // Reuse the same locally authored bottle, with no remote images or CORS dependencies.
  const svg=document.getElementById('collection-card-template').content.querySelector('svg').cloneNode(true);
  svg.setAttribute('xmlns','http://www.w3.org/2000/svg');svg.setAttribute('width','100');svg.setAttribute('height','120');svg.setAttribute('color',colors.ink);
  const image=new window.Image();
  const source='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(new window.XMLSerializer().serializeToString(svg));
  await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src=source;});
  ctx.fillStyle=colors.background;ctx.fillRect(0,0,1500,1740);ctx.textAlign='center';
  function text(value,x,y,width,size,maxLines,font,color) {
    let lines;
    do {
      ctx.font=`${size}px ${font}`;lines=[''];
      for(const char of value) {
        const last=lines.length-1;
        if(ctx.measureText(lines[last]+char).width>width)lines.push(char);else lines[last]+=char;
      }
      if(lines.length<=maxLines||size<=12)break;size--;
    } while(true);
    ctx.fillStyle=color;lines.forEach((line,i)=>ctx.fillText(line.trim(),x,y+i*size*1.25));
  }
  text(caption.title,750,100,1320,48,1,'Jost, sans-serif',colors.ink);
  if(caption.owner) text(caption.owner,750,167,1320,42,1,'Jost, sans-serif',colors.accent);
  slots.forEach((p,i)=>{
    const x=75+(i%3)*460,y=225+Math.floor(i/3)*460;
    ctx.fillStyle=colors.card;ctx.strokeStyle=colors.border;ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(x,y,430,430,22);ctx.fill();ctx.stroke();
    ctx.textAlign='left';ctx.fillStyle=colors.accent;ctx.font='24px Jost, sans-serif';ctx.fillText(String(i+1).padStart(2,'0'),x+24,y+40);ctx.textAlign='center';
    ctx.globalAlpha=p ? 1 : .18;ctx.drawImage(image,x+155,y+60,120,144);ctx.globalAlpha=1;
    if(p) {
      text(p.brand,x+215,y+246,374,24,2,'Jost, sans-serif','#637080');
      text(p.name,x+215,y+307,374,32,2,'"Source Serif 4", serif',colors.ink);
      text(concentrationLabel(p.concentration),x+215,y+394,374,21,1,'Jost, sans-serif','#637080');
    }else{ctx.fillStyle='#637080';ctx.font='24px "Source Serif 4", serif';ctx.fillText(t('Still choosing'),x+215,y+292);}
  });
  ctx.fillStyle=colors.ink;ctx.font='26px Jost, sans-serif';ctx.fillText(t('Made with RateMyScents'),750,1685);
  const blob=await new Promise((resolve,reject)=>canvas.toBlob(result=>result ? resolve(result) : reject(new Error('PNG unavailable')),'image/png'));
  const url=window.URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='my-9-scents.png';document.body.append(link);link.click();link.remove();
  window.setTimeout(()=>window.URL.revokeObjectURL(url),60000);
}
