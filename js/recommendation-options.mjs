import {recommendFragrances} from './recommendations.mjs';
import {scentGroupLabel} from './scent-groups.mjs';

export function preferenceTags(answers) {
  const tags=[];
  for(const value of answers.occasions??[])tags.push({step:0,label:value});
  for(const value of answers.profiles??[])tags.push({step:1,label:scentGroupLabel(value)});
  const types={designer:'Designer',arabic:'Middle Eastern / Arabic',niche:'Niche'};
  const genders={men:'Masculine & unisex',women:'Feminine & unisex',unisex:'Unisex only'};
  const priorities={familiar:'Similar to my collection',different:'Different from my collection',versatile:'More occasions covered'};
  for(const [step,label] of [[2,types[answers.type]],[4,genders[answers.gender]],[5,priorities[answers.priority]]])if(label)tags.push({step,label});
  return tags;
}

// Proposals only. Gender, owned IDs and all unmentioned choices stay unchanged.
export function alternativeOptions(catalog,collection,answers) {
  const options=[];
  const candidates=changes=>recommendFragrances(catalog,collection,{...answers,...changes},{limit:Infinity}).items;
  if(answers.budget.mode==='maximum') {
    const prices=candidates({budget:{mode:'unlimited',amount:''}}).map(x=>x.perfume.priceUsd)
      .filter(x=>Number.isFinite(x)&&x>Number(answers.budget.amount));
    if(prices.length) {
      const amount=Math.min(...prices);
      const count=candidates({budget:{mode:'maximum',amount:String(amount)}}).length;
      options.push({kind:'budget',amount,count});
    }
  }
  for(const [kind,changes,active] of [['type',{type:'any'},answers.type!=='any'],['profiles',{profiles:[]},answers.profiles.length],['occasions',{occasions:[]},answers.occasions.length]]) {
    if(!active)continue;
    const count=candidates(changes).length;if(count)options.push({kind,count});
  }
  return options;
}
