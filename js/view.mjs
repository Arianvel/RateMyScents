export function concentrationLabel(value) {
  return value === 'EDP' ? 'Eau de Parfum' : value;
}

export function infoButton(document,perfume) {
  const button=document.createElement('button');button.className='fragrance-info';button.type='button';
  button.dataset.fragranceInfo=perfume.id;button.setAttribute('aria-label',`View details for ${perfume.brand} ${perfume.name}`);button.setAttribute('aria-haspopup','dialog');
  const icon=document.createElement('span');icon.textContent='i';icon.setAttribute('aria-hidden','true');button.append(icon);return button;
}

function fragranceNode(container, templateId, perfume) {
  const document = container.ownerDocument;
  const node = document.getElementById(templateId).content.firstElementChild.cloneNode(true);
  for (const field of ['brand', 'name', 'concentration']) {
    node.querySelector(`[data-field="${field}"]`).setAttribute('translate','no');
    node.querySelector(`[data-field="${field}"]`).textContent = field === 'concentration'
      ? concentrationLabel(perfume[field]) : perfume[field];
  }
  node.querySelector('button').dataset.perfumeId = perfume.id;
  return node;
}

export function renderSearchResults(container, perfumes, selectedIds) {
  const nodes = perfumes.map((perfume) => {
    const node = fragranceNode(container, 'search-result-template', perfume);
    const button = node.querySelector('button');
    const added = selectedIds.has(perfume.id);
    button.textContent = added ? 'Added' : 'Add +';
    button.setAttribute('aria-disabled', String(added));
    button.setAttribute('aria-label', `${added ? 'Already added' : 'Add'} ${perfume.brand} ${perfume.name}, ${concentrationLabel(perfume.concentration)}`);
    return node;
  });
  container.replaceChildren(...nodes);
}

export function renderCollection(container, perfumes) {
  // Bounded density steps keep large collections manageable without endlessly shrinking text.
  container.dataset.density=perfumes.length>=13?'dense':perfumes.length>=7?'compact':'regular';
  container.replaceChildren(...perfumes.map((perfume) => {
    const node = fragranceNode(container, 'collection-card-template', perfume);
    node.querySelector('button').setAttribute('aria-label', `Remove ${perfume.brand} ${perfume.name}, ${concentrationLabel(perfume.concentration)}`);
    node.append(infoButton(container.ownerDocument,perfume));
    return node;
  }));
}
