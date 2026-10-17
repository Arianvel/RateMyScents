import {spanish} from './locales/es.mjs';

const label = value => {value=value.trim();return spanish[value] ?? spanish[value[0]?.toUpperCase()+value.slice(1)] ?? value;};
const labels = value => value.split(', ').map(label).join(', ');
const rules = [
  [/^Matches: (.+) \(\+(\d+) more\)\.$/,(_,names,n)=>`Coincidencias: ${labels(names)} (+${n} más).`],
  [/^Listed for (\d+) of 5 occasions\.$/,(_,n)=>`Asignado a ${n} de 5 ocasiones.`],
  [/^None of your fragrances are listed for (.+)\.$/,(_,names)=>`Ninguno de tus perfumes tiene asignado ${labels(names).toLowerCase()}.`],
  [/^Your collection includes (\d+) of the method's 12 profile labels across (\d+) fragrances\.$/,(_,n,size)=>`Tu colección incluye ${n} de los 12 perfiles del método en ${size} perfumes.`],
  [/^(\d+) of 3 selected$/,(_,n)=>`${n} de 3 seleccionados`],
  [/^You have the most options for (.+): (\d+) of your (\d+) fragrances are listed for (?:each occasion|this occasion)\.$/,(_,names,n,total)=>`Tienes más opciones para ${labels(names).toLowerCase()}: ${n} de tus ${total} perfumes tienen asignada cada ocasión.`],
  [/^There are fewer options for (.+): (\d+) of your (\d+) fragrances are listed for (?:each occasion|this occasion)\.$/,(_,names,n,total)=>`Hay menos opciones para ${labels(names).toLowerCase()}: ${n} de tus ${total} perfumes tienen asignada cada ocasión.`],
  [/^None of your fragrances are listed for (.+)\. That does not mean you cannot wear them there\.$/,(_,names)=>`Ninguno de tus perfumes tiene asignado ${labels(names).toLowerCase()}. Eso no significa que no puedas usarlos en esas ocasiones.`],
  [/^The profiles you see most often are (.+): each appears in (\d+) of your (\d+) fragrances\.$/,(_,names,n,total)=>`Los perfiles que más se repiten son ${labels(names).toLowerCase()}: cada uno aparece en ${n} de tus ${total} perfumes.`],
  [/^(.+), side by side: each appears in (\d+) of your (\d+) fragrances for (.+)\.$/,(_,names,n,total,occasion)=>`Los perfiles ${new Intl.ListFormat('es').format(names.split(/, and | and |, /).map(name=>label(name).toLowerCase()))} van a la par: cada uno aparece en ${n} de tus ${total} perfumes para ${label(occasion).toLowerCase()}.`],
  [/^(.+) profiles appear in (\d+) of your (\d+) fragrances for (.+)\.$/,(_,name,n,total,occasion)=>`El perfil ${label(name).toLowerCase()} aparece en ${n} de tus ${total} perfumes para ${label(occasion).toLowerCase()}.`],
  [/^Most represented: (.+)\. Each (?:is assigned to|appears in) (\d+) of (\d+) fragrances\.$/,(_,names,n,total)=>`Lo más presente: ${labels(names)}. Cada categoría aparece en ${n} de ${total} perfumes.`],
  [/^Show all: (.+)$/,(_,name)=>`Ver todos: ${label(name)}`],
  [/^Catalog price: USD ([\d.]+)$/,(_,n)=>`Precio del catálogo: ${n.replace('.',',')} USD`],
  [/^Question (\d) of 5$/,(_,n)=>`Pregunta ${n} de 5`],
  [/^Up to \$(\d+)$/,(_,n)=>`Hasta $${n}`],
  [/^(\d+) of 3 profiles selected$/,(_,n)=>`${n} de 3 perfiles seleccionados`],
  [/^(\d+) fragrances? found$/,(_,n)=>`${n} ${n==='1'?'perfume encontrado':'perfumes encontrados'}`],
  [/^(.+) (added|removed)\. (\d+) fragrances? in your collection\.$/,(_,name,action,n)=>`${name} ${action==='added'?'añadido':'eliminado'}. ${n} ${n==='1'?'perfume':'perfumes'} en tu colección.`],
  [/^(Already added|Add|Remove) (.+)$/,(_,verb,name)=>`${verb==='Already added'?'Ya añadido':verb==='Add'?'Añadir':'Eliminar'} ${name}`],
  [/^Your collection includes (\d+) of the method's 12 profile labels across (\d+) fragrances\. (.+)$/,(_,n,size,rest)=>`Tu colección incluye ${n} de los 12 perfiles del método en ${size} perfumes. ${translate(rest,'es')}`],
  [/^Variety includes a collection-size factor of (\d+)%: fewer fragrances offer fewer individual choices\.$/,(_,n)=>`La Variedad incluye un factor de tamaño del ${n}%: menos perfumes ofrecen menos opciones individuales.`],
  [/^(\d+) of 5 occasions and (\d+) of 4 seasons covered, weighted equally\.$/,(_,a,b)=>`${a} de 5 ocasiones y ${b} de 4 estaciones cubiertas, con el mismo peso.`],
  [/^(\d+)% average profile overlap across (\d+) pairs?\.$/,(_,n,p)=>`${n}% de solapamiento medio de perfiles entre ${p} ${p==='1'?'pareja':'parejas'}.`],
  [/^With (\d+) selected fragrances, there (?:is just 1 pair|are just \d+ pairs) to compare\. This analysis describes those selected fragrances; the same formulas apply to collections of any size\.$/,(_,n)=>`Con ${n} perfumes seleccionados hay ${Number(n)*(Number(n)-1)/2} ${n==='2'?'pareja':'parejas'} que comparar. Este análisis describe esos perfumes; se aplican las mismas fórmulas a cualquier tamaño de colección.`],
  [/^(\d+) of (\d+) fragrances$/,(_,n,total)=>`${n} de ${total} perfumes`],
  [/^(\d+) recorded; (\d+) missing$/,(_,n,m)=>`${n} registrados; faltan datos de ${m}`],
  [/^(\d+) assigned$/,(_,n)=>`${n} asignados`],
  [/^Data pending for (\d+) fragrances\.$/,(_,n)=>`Datos pendientes de ${n} perfumes.`],
  [/^(.+): (\d+) of (\d+) fragrances$/,(_,name,n,total)=>`${label(name)}: ${n} de ${total} perfumes`],
  [/^(.+) is (joint )?most represented: (\d+) of (\d+) fragrances( assigned)?\.$/,(_,name,tied,n,total)=>`${label(name)} ${tied?'comparte la mayor presencia':'es lo más representado'}: ${n} de ${total} perfumes${tied?' (empate)':''}.`],
  [/^(.+) appears in (\d+) of (\d+) fragrances\.$/,(_,name,n,total)=>`${labels(name)} aparece en ${n} de ${total} perfumes.`],
  [/^(.+): no fragrances assigned\.$/,(_,name)=>`${labels(name)}: ningún perfume asignado.`],
  [/^(.+): (\d+) of (\d+) fragrances assigned\.$/,(_,name,n,total)=>`${labels(name)}: ${n} de ${total} perfumes asignados.`],
  [/^USD ([\d.]+) per fragrance$/,(_,n)=>`${n.replace('.',',')} USD por perfume`],
  [/^Matches: (.+)\.$/,(_,values)=>`Coincidencias: ${labels(values)}.`],
  [/^Covers (\d+) of 5 assigned occasions; ordered by occasion coverage\.$/,(_,n)=>`Cubre ${n} de 5 ocasiones; ordenado por cobertura de ocasiones.`],
  [/^Showing (\d+)–(\d+) of (\d+) matching fragrances\.$/,(_,a,b,total)=>`Mostrando ${a}–${b} de ${total} perfumes compatibles.`],
  [/^(\d+) candidate\(s\) could not be evaluated with the available data\. No missing values were treated as zero\.$/,(_,n)=>`No se pudieron evaluar ${n} candidatos con los datos disponibles. Los datos ausentes no se trataron como cero.`],
  [/^(\d+) excluded by type or budget; (\d+) with no requested profile or occasion matches\.$/,(_,a,b)=>`${a} excluidos por tipo o presupuesto; ${b} sin coincidencias con los perfiles u ocasiones solicitados.`],
  [/^Choose fragrance (\d+)$/,(_,n)=>`Elige el perfume ${n}`],
  [/^Position (\d+): (.+)$/,(_,n,rest)=>`Posición ${n}: ${rest==='Choose a fragrance'?'Elige un perfume':rest.replace(/Change fragrance$/,'Cambiar perfume')}`],
  [/^(.+) · Already in your nine$/,(_,name)=>`${name} · Ya está entre tus nueve`],
  [/^(.+) added to position (\d+)\.$/,(_,name,n)=>`${name} añadido a la posición ${n}.`],
  [/^Position (\d+) cleared\.$/,(_,n)=>`Posición ${n} vaciada.`],
  [/^Moved to position (\d+)\.$/,(_,n)=>`Movido a la posición ${n}.`],
  [/^Move (.+) (left|right) to position (\d+)$/,(_,name,dir,n)=>`Mover ${name} a la ${dir==='left'?'izquierda':'derecha'}, a la posición ${n}`],
  [/^Cannot move (.+) further (left|right)$/,(_,name,dir)=>`No se puede mover ${name} más a la ${dir==='left'?'izquierda':'derecha'}`],
  [/^(.+) · RateMyScents$/,(_,title)=>`${translate(title,'es')} · RateMyScents`],
  [/^(Variety|Versatility|Complementarity): (\d+) out of 100$/,(_,name,n)=>`${label(name)}: ${n} de 100`],
  [/^Collection rating: (\d+) out of 100$/,(_,n)=>`Puntuación de la colección: ${n} de 100`],
];

export function translate(text, language='en') {
  if(language!=='es') return text;
  if(text.includes(' selected fragrances tagged for ') && text.includes('. ')) return text.split(/(?<=\.)\s+/).map(sentence=>translate(sentence,language)).join(' ');
  const source=text.replace(/\s+/g,' ').trim();
  let translated=spanish[source];
  if(translated===undefined) {
    for(const [pattern,format] of rules) if(pattern.test(source)) {translated=source.replace(pattern,format);break;}
  }
  // Pattern sentences are generated independently, then sometimes grouped on ties.
  if(translated===undefined && source.includes(' selected fragrances tagged for ')) {
    translated=source.replace(/([^.]+?) are tied in your (.+?) picks: each appears in (\d+) of the (\d+) selected fragrances tagged for (.+?)\./g,
      (_,names,occasion,n,total)=>`Los perfiles ${new Intl.ListFormat('es').format(names.split(/, and | and |, /).map(name=>label(name).toLowerCase()))} empatan en ${label(occasion).toLowerCase()}: cada uno aparece en ${n} de los ${total} perfumes seleccionados con esa ocasión asignada.`)
      .replace(/([^.]+?) is the most frequent profile in your (.+?) picks: (\d+) of the (\d+) selected fragrances tagged for (.+?) have this label\./g,
      (_,name,occasion,n,total)=>`El perfil ${label(name.trim()).toLowerCase()} es el más frecuente en ${label(occasion).toLowerCase()}: aparece en ${n} de los ${total} perfumes seleccionados con esa ocasión asignada.`);
  }
  if(translated===undefined) return text;
  return text.replace(/\S[\s\S]*\S|\S/,()=>translated);
}
