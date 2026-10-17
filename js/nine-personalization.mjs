import {concentrationLabel} from './view.mjs';
import {translate} from './i18n.mjs';

export const NINE_PALETTES={
  gold:{background:'#f4ecd9',card:'#fffdf8',accent:'#806022',border:'#b6944d',ink:'#25313b'},
  pink:{background:'#f6e5ec',card:'#fff9fb',accent:'#963e63',border:'#c1829c',ink:'#402c36'},
  purple:{background:'#eae5f4',card:'#fcfaff',accent:'#715298',border:'#a38bbf',ink:'#342d42'},
  blue:{background:'#e1edf5',card:'#f9fcff',accent:'#365f8c',border:'#7b9ebd',ink:'#263849'},
};

export function nineCaption(name='',language='en') {
  const owner=String(name).replace(/[\r\n\t]/g,' ').trim().slice(0,40);
  return {
    title:translate(owner?'THE 9 FAVOURITE FRAGRANCES OF:':'MY 9 FAVOURITE FRAGRANCES',language),
    owner,
  };
}

export function nineList(slots,name='',language='en') {
  const {title,owner}=nineCaption(name,language);
  return [title+(owner?` ${owner}`:''),'',...slots.flatMap((perfume,index)=>perfume
    ?[`${index+1}. ${perfume.brand} ${perfume.name} (${concentrationLabel(perfume.concentration)})`]:[])].join('\n');
}
