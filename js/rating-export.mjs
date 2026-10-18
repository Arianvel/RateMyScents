import {translate} from './i18n.mjs';
import {concentrationLabel} from './view.mjs';
import {renderCollectionStyle} from './results-details.mjs';

// Uses final calculation values, never the animated counter or hidden page text.
export async function exportRating(document,analysis,collection) {
  const language=document.documentElement.lang;
  const dark=document.documentElement.dataset.theme==='dark';
  const t=text=>translate(text,language);
  const colors=dark?{background:'#18232f',ink:'#eeeae2',accent:'#e0b965',card:'#343027'}:{background:'#f7f5f0',ink:'#192630',accent:'#806022',card:'#f3e5c5'};
  const make=(tag,text,className)=>{const node=document.createElement(tag);if(text)node.textContent=text;if(className)node.className=className;return node;};
  const summary=renderCollectionStyle(make,analysis,collection);
  const score=metric=>metric.value===null?t('Not available'):`${Math.floor(metric.value)} / 100`;
  await document.fonts?.ready;
  const canvas=document.createElement('canvas');canvas.width=1100;
  const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas unavailable');
  const blocks=[];let y=70;
  function block(text,size=28,{accent=false,bold=false,gap=24}={}) {
    const font=`${bold?'600':'400'} ${size}px ${bold?'Jost, sans-serif':'"Source Serif 4", serif'}`;
    ctx.font=font;
    const lines=[];let line='';
    for(const word of String(text).split(/\s+/)) {
      if(line&&ctx.measureText(line+' '+word).width>960){lines.push(line);line='';}
      // Break unusually long names without clipping or dropping characters.
      for(const character of (line?' ':'')+word) {
        if(ctx.measureText(line+character).width>960){lines.push(line);line='';}
        line+=character;
      }
    }
    if(line)lines.push(line);
    blocks.push({lines,y,font,color:accent?colors.accent:colors.ink,lineHeight:size*1.45});
    y+=lines.length*size*1.45+gap;
  }
  block('RateMyScents',34,{bold:true,accent:true});
  block(t('Your collection rating'),28,{bold:true});
  block(score(analysis.total),64,{bold:true,accent:true});
  if(analysis.total.reason)block(t(analysis.total.reason),24);
  for(const [key,title] of [['variety','Variety'],['versatility','Versatility'],['complementarity','Complementarity']]) {
    block(`${t(title)}: ${score(analysis[key])}`,28,{bold:true,gap:12});
    if(analysis[key].reason)block(t(analysis[key].reason),23);
  }
  y+=20;const summaryTop=y-16;
  block(t('Your profile, according to your collection'),32,{bold:true,accent:true});
  for(const p of summary.querySelectorAll('p'))block(t(p.textContent),27);
  const summaryBottom=y;y+=24;
  block(t('Your collection'),32,{bold:true,accent:true});
  collection.forEach((p,index)=>block(`${index+1}. ${p.brand} ${p.name} (${concentrationLabel(p.concentration)})`,25,{gap:12}));
  y+=18;
  block(t('Think of this score as another way to look at your collection. It reflects the categories and rules we chose, not how good your perfumes are or how much you should enjoy them. Your taste is yours.'),23);
  block(t('Made with RateMyScents'),23,{accent:true});
  if(y>30000)throw new Error('Image too tall');
  canvas.height=Math.ceil(y+40);
  ctx.fillStyle=colors.background;ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle=colors.card;ctx.fillRect(45,summaryTop,1010,summaryBottom-summaryTop);
  ctx.textAlign='left';ctx.textBaseline='top';
  for(const block of blocks){ctx.font=block.font;ctx.fillStyle=block.color;block.lines.forEach((line,i)=>ctx.fillText(line,70,block.y+i*block.lineHeight));}
  const blob=await new Promise((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error('PNG unavailable')),'image/png'));
  const window=document.defaultView,url=window.URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download='ratemyscents-rating.png';document.body.append(link);link.click();link.remove();
  window.setTimeout(()=>window.URL.revokeObjectURL(url),60000);
}
