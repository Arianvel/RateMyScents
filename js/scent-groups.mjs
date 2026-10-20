// Quiz groups use the method's canonical profiles; source labels remain intact.
export const SCENT_GROUPS=[
  {id:'fresh',label:'Fresh & clean',description:'Airy, watery scents',profiles:['fresh','aquatic']},
  {id:'citrus',label:'Citrus',description:'Lemon, orange, bergamot',profiles:['citrus']},
  {id:'sweet',label:'Sweet',description:'Sweet, dessert-like scents',profiles:['sweet','gourmand','warm']},
  {id:'woody',label:'Woody & warm',description:'Woods, amber, spices',profiles:['woody','amber','spicy']},
  {id:'floral',label:'Floral',description:'Flower-like scents',profiles:['floral']},
  {id:'green',label:'Green & herbal',description:'Leaves and herbs',profiles:['green','aromatic']},
  {id:'fruity',label:'Fruity',description:'Peach, berries, tropical fruits',profiles:['fruity']},
  {id:'powdery',label:'Powdery',description:'Soft, powder-like scents',profiles:['powdery']},
  {id:'leather',label:'Leather',description:'Leather and suede-like scents',profiles:['leather']},
];

export const scentGroupLabel=id=>SCENT_GROUPS.find(group=>group.id===id)?.label??id;

export function matchingScentGroups(selected,profiles) {
  return [...new Set(selected)].filter(id=>SCENT_GROUPS.find(group=>group.id===id)?.profiles.some(label=>profiles?.has(label)));
}
