import { loadCatalog, searchCatalog } from './catalog.mjs';
import { createCollection } from './collection.mjs';
import { renderSearchResults, renderCollection } from './view.mjs';
import { initializeNavigation } from './navigation.mjs';
import { initializeAnalysisFlow } from './analysis-flow.mjs';
import { initializeMyNine } from './my-nine.mjs';
import { initializePreferences } from './preferences.mjs';
import { connectSearchKeyboard, searchAnnouncement } from './search-keyboard.mjs';
import {initializeCompare} from './compare.mjs';
import {createUndoToast} from './undo-toast.mjs';
import {initializeFragranceDetails} from './fragrance-details.mjs';
import {initializeBrandFilter} from './brand-filter.mjs';
import {initializeCatalogPage} from './catalog-page.mjs';

initializePreferences(document);

const byId = (id) => document.getElementById(id);
const search = byId('fragrance-search');
const results = byId('search-results');
const summary = byId('search-summary');
const announceSearch=searchAnnouncement(byId('search-live'));
const clearSearch = byId('clear-search');
const catalogStatus = byId('catalog-status');
const retry = byId('retry-catalog');
const grid = byId('collection-grid');
const empty = byId('collection-empty');
const count = byId('collection-count');
const clearCollection = byId('clear-collection');
const analyze = byId('analyze-collection');
const analysisStatus = byId('analysis-status');
const announcement = byId('app-announcement');
const collection = createCollection();
let catalog = [];
let announcementTimer;
let catalogStarted = false;
let searchClosed=false;
let searchLimit=20;
const more=byId('search-more');
const brands=initializeBrandFilter(document,()=>{searchClosed=false;searchLimit=20;updateSearch();});
const flow = initializeAnalysisFlow(document, {getCollection: () => collection.items(), getCatalog: () => catalog, announce});
const toast=createUndoToast(document);
const myNine = initializeMyNine(document,toast);
const details=initializeFragranceDetails(document,{getCatalog:()=>catalog,onBrowse:(field,value)=>explorer.filter(field,value)});
function addFromCatalog(perfume) {
  if(collection.has(perfume.id))return false;
  rememberCollection();collection.add(perfume);updateCollection();updateSearch();
  announce(`${perfume.name} added. ${collection.size} ${collection.size===1?'fragrance':'fragrances'} in your collection.`);
  return true;
}
const compare=initializeCompare(document,{getCollection:()=>collection.items(),addToCollection:addFromCatalog});
const explorer=initializeCatalogPage(document,{
  load:async()=>{if(!catalog.length)catalog=await loadCatalog('./scents.json');return catalog;},
  getCollection:()=>collection.items(),addToCollection:addFromCatalog,
  compare:perfume=>{compare.choose(perfume);document.querySelector('.header-nav [href="#compare-scents"]').click();},
});

function announce(message) {
  clearTimeout(announcementTimer);
  announcement.textContent = '';
  announcementTimer = setTimeout(() => { announcement.textContent = message; }, 30);
}

function updateSearch() {
  const query = search.value;
  clearSearch.hidden = !query;
  const filtered=brands.apply(catalog);
  const matches = query.trim()?searchCatalog(filtered, query):brands.active?filtered:[];
  const hasQuery = Boolean(query.trim())||brands.active;
  results.hidden = searchClosed || !hasQuery || !matches.length;
  summary.hidden = searchClosed || !hasQuery;
  more.hidden=searchClosed||matches.length<=searchLimit;
  summary.textContent = !hasQuery ? '' : matches.length
    ? `${matches.length} ${matches.length === 1 ? 'fragrance' : 'fragrances'} found`
    : 'No fragrances found. Try another name or brand.';
  announceSearch(summary.textContent);
  renderSearchResults(results, matches.slice(0,searchLimit), new Set(collection.items().map(({ id }) => id)));
}

function updateCollection() {
  renderCollection(grid, collection.items());
  count.textContent = String(collection.size);
  clearCollection.disabled = collection.size === 0;
  empty.hidden = collection.size > 0;
  grid.hidden = collection.size === 0;
  analyze.disabled = collection.size < 2;
  analysisStatus.textContent = collection.size >= 2
    ? 'Ready when you are. You can keep adding fragrances.'
    : collection.size === 1 ? 'We need at least two fragrances to compare them. Add one more to analyze your collection.' : 'We need at least two fragrances to compare them. Add your fragrances to get started.';
  flow.collectionChanged();
}

async function startCatalog() {
  search.disabled = true;
  byId('first-fragrance').disabled=true;
  retry.hidden = true;
  catalogStatus.textContent = 'Loading the fragrance catalog…';
  try {
    catalog = await loadCatalog('./scents.json');
    brands.populate(catalog);
    search.disabled = catalog.length === 0;
    byId('first-fragrance').disabled=catalog.length===0;
    catalogStatus.textContent = catalog.length ? '' : 'No fragrances are available yet.';
    updateSearch();
    if (document.activeElement === retry || document.activeElement === document.body) {
      // Only restore focus following a retry, never steal it on initial load.
      if (retry.dataset.used && catalog.length) search.focus();
    }
  } catch {
    catalogStatus.textContent = 'We couldn’t load the fragrance catalog. Please try again.';
    retry.hidden = false;
  }
}

function openSearch(){searchClosed=false;updateSearch();}
function closeSearch(){searchClosed=true;results.hidden=true;summary.hidden=true;more.hidden=true;search.focus();}
search.addEventListener('input',()=>{searchLimit=20;openSearch();});
search.addEventListener('click',()=>{if(searchClosed)openSearch();});
search.addEventListener('keydown',event=>{if(event.key==='ArrowDown'&&searchClosed)openSearch();if(event.key==='Escape')closeSearch();});
results.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();closeSearch();}});
connectSearchKeyboard(search,results);
more.addEventListener('click',()=>{
  const previous=searchLimit;searchLimit+=20;updateSearch();
  results.children[previous]?.querySelector('button')?.focus();
});
clearSearch.addEventListener('click', () => {
  search.value = '';
  searchClosed=false;searchLimit=20;
  updateSearch();
  search.focus();
});
retry.addEventListener('click', () => {
  retry.dataset.used = 'true';
  startCatalog();
});

results.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action="add"]');
  if (!button || !results.contains(button)) return;
  const perfume = catalog.find(({ id }) => id === button.dataset.perfumeId);
  if (!perfume || collection.has(perfume.id)) return;
  rememberCollection();collection.add(perfume);
  updateCollection();
  updateSearch();
  closeSearch();
  announce(`${perfume.name} added. ${collection.size} ${collection.size === 1 ? 'fragrance' : 'fragrances'} in your collection.`);
});

grid.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action="remove"]');
  if (!button || !grid.contains(button)) return;
  const previousItems = collection.items();
  const index = previousItems.findIndex(({ id }) => id === button.dataset.perfumeId);
  if(index<0)return;
  rememberCollection();collection.remove(button.dataset.perfumeId);
  updateCollection();
  updateSearch();
  const buttons = grid.querySelectorAll('button[data-action="remove"]');
  (buttons[Math.min(index, buttons.length - 1)] ?? search).focus();
  announce(`${previousItems[index].name} removed. ${collection.size} ${collection.size === 1 ? 'fragrance' : 'fragrances'} in your collection.`);
  toast.show('collection','Fragrance removed from your collection.',restoreCollection);
});

analyze.addEventListener('click', () => flow.openChoice());

let previousCollection=null;
const undoClear=document.createElement('button');
undoClear.id='undo-clear';undoClear.type='button';undoClear.className='secondary-button';undoClear.textContent='Undo last change';undoClear.hidden=true;
const collectionActions=document.createElement('div');collectionActions.className='collection-actions';
clearCollection.before(collectionActions);collectionActions.append(undoClear,clearCollection);
function rememberCollection(){previousCollection=collection.items();undoClear.hidden=false;toast.clear('collection');}
function restoreCollection(){
  if(previousCollection===null)return;
  collection.clear();for(const perfume of previousCollection)collection.add(perfume);
  previousCollection=null;undoClear.hidden=true;toast.clear('collection');updateCollection();updateSearch();search.focus();announce('Last change undone.');
}
undoClear.addEventListener('click',restoreCollection);
clearCollection.addEventListener('click', () => {
  if (!collection.size) return;
  rememberCollection();
  collection.clear();
  updateCollection();
  updateSearch();
  search.focus();
  announce('Collection cleared. You can start adding fragrances again.');
  toast.show('collection','Collection cleared.',restoreCollection);
});

updateCollection();
initializeNavigation(document, {beforeRoute: hash => {details.close(false);toast.hide();myNine.leaveRoute(); return flow.beforeRoute(hash);}, onRoute: hash=>{flow.enterRoute(hash);if(hash==='#compare-scents')compare.enter();if(hash==='#catalog')explorer.enter();}, onHome: () => {
  if (catalogStarted) return;
  catalogStarted = true;
  startCatalog();
}});
