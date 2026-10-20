import {detailNode,descriptionNode,catalogText} from './fragrance-details.mjs';
import {concentrationLabel} from './view.mjs';
import {filterLabel} from './filter-controls.mjs';

export function renderComparison(container,chosen) {
  const document=container.ownerDocument,make=(...args)=>detailNode(document,...args);
  container.replaceChildren();
  if(!chosen.every(Boolean))return;
    const table=make('table',null,'compare-table');
    const caption=make('caption','Fragrance comparison');table.append(caption);
    const head=make('thead'),header=make('tr');
    const feature=make('th','Feature');feature.scope='col';header.append(feature);
    for(const p of chosen){const th=catalogText(make('th',`${p.brand} ${p.name} (${p.concentration})`));th.scope='col';header.append(th);}
    head.append(header);table.append(head);
    const body=make('tbody');
    const types={designer:'Designer',arabic:'Middle Eastern / Arabic',niche:'Niche'};
    const genders={men:'Masculine',women:'Feminine',unisex:'Unisex'};
    const fields=[['Catalog description','description'],['Brand','brand'],['Concentration','concentration'],['Catalog price (USD)','priceUsd'],['Fragrance type','type'],['Fragrance gender','gender'],['Scent profiles','profile'],['Notes','notes'],['Occasions','occasions'],['Suggested seasons','seasons']];
    for(const [label,key] of fields) {
      const row=make('tr'),heading=make('th',label);heading.scope='row';row.dataset.field=key;row.append(heading);
      chosen.forEach((p,index)=>{
        const cell=make('td'),value=p[key];
        if(key==='description')cell.append(descriptionNode(document,p));
        else if(['profile','notes','occasions','seasons'].includes(key)) {
          if(!Array.isArray(value)||!value.every(x=>typeof x==='string'&&x.trim()))cell.append(make('span','Not recorded','caption'));
          else if(!value.length)cell.append(make('span','No assignments','caption'));
          else {
            const list=make('ul',null,'compare-labels');
            for(const label of new Set(value)) {
              const other=chosen[1-index][key];
              const shared=Array.isArray(other)&&other.includes(label);
              const item=make('li',null,shared?'compare-shared':'');
              const text=make('span',key==='seasons'?filterLabel(label):label);if(key==='notes')catalogText(text);item.append(text);
              if(shared)item.append(make('span','Shared','compare-shared-label'));
              list.append(item);
            }cell.append(list);
          }
        } else if(key==='priceUsd')cell.append(make('span',Number.isFinite(value)&&value>=0?`USD ${value.toFixed(2)}`:'Not recorded'));
        else if(key==='type'||key==='gender')cell.append(make('span',(key==='type'?types:genders)[value]??'Not recorded'));
        else if(typeof value==='string'&&value.trim())cell.append(catalogText(make('span',key==='concentration'?concentrationLabel(value):value)));
        else cell.append(make('span','Not recorded'));
        row.append(cell);
      });body.append(row);
    }
    table.append(body);container.append(table,make('p','Shared labels do not mean two fragrances smell the same. Occasions and seasons are suggestions; the catalog does not measure longevity or projection.','caption compare-note'));
}
