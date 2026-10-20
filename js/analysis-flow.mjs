import { createQuiz } from './quiz.mjs';
import { renderQuiz } from './quiz-view.mjs';
import { analyzeCollection } from './analysis.mjs';
import { recommendFragrances } from './recommendations.mjs';
import { renderAnalysis, renderRecommendations } from './results-view.mjs';
import { exportRating } from './rating-export.mjs';
import {alternativeOptions} from './recommendation-options.mjs';

export function initializeAnalysisFlow(document,{getCollection,getCatalog,announce}) {
  const window=document.defaultView;
  const el=id=>document.getElementById(id);
  const dialog=el('analysis-choice');
  const form=el('quiz-form');
  const collectionQuiz=createQuiz(),firstQuiz=createQuiz();
  let quiz=collectionQuiz;
  let editingOne=false;
  let exporting=false;
  let mode='rating';
  let collectionMode='rating';
  let restoreFocus=true;
  const complete=()=>[0,1,2,3,4,5].every(step=>quiz.validate(step).valid);
  const lastStep=()=>mode==='first'?4:5;
  function restartQuiz() {
    quiz.reset();
    if(mode==='first')quiz.select('priority','none');
    editingOne=false;form.dataset.step='';
  }
  function close(restore=true) {
    restoreFocus=restore;
    if(dialog.open) dialog.close();
  }
  function showQuiz(error='',focus=false) {
    const snapshot=quiz.snapshot();
    if(form.dataset.step!==String(snapshot.step)) {
      const previous=form.dataset.step;
      form.dataset.direction=previous!==''&&previous!==undefined&&snapshot.step<Number(previous)?'back':'forward';
      renderQuiz(form,snapshot,'',{firstFragrance:mode==='first'});
      form.dataset.step=String(snapshot.step);
    }
    const {answers,step}=snapshot;
    for(const input of form.querySelectorAll('input')) {
      const group=input.name;
      if(group==='profiles'||group==='occasions') input.checked=input.value==='none' ? Array.isArray(answers[group])&&!answers[group].length : answers[group]?.includes(input.value)??false;
      else if(group==='type') input.checked=input.value==='any' ? Array.isArray(answers.type)&&!answers.type.length : answers.type?.includes(input.value)??false;
      else if(group==='priority'||group==='gender') input.checked=answers[group]===input.value;
      else if(group==='budget-mode') input.checked=answers.budget.mode==='unlimited' ? input.value==='unlimited' : answers.budget.mode==='maximum' && input.value===(['50','100','150'].includes(answers.budget.amount)?answers.budget.amount:'maximum');
      input.removeAttribute('aria-invalid');
    }
    const amount=el('budget-amount');
    if(amount) {amount.value=answers.budget.amount;amount.disabled=answers.budget.mode==='unlimited';if(error)amount.setAttribute('aria-invalid','true');}
    updateBudgetFeedback();
    const count=form.querySelector('.selection-count');
    if(count) count.textContent=`${answers.profiles?.length??0} of 3 selected`;
    el('quiz-error').textContent=error;
    form.querySelector('button[type="submit"]').textContent=editingOne?'Update recommendations':step===lastStep()?'See my results':'Continue';
    const fieldset=form.querySelector('fieldset');
    fieldset.setAttribute('aria-describedby','quiz-help quiz-error');
    if(error)fieldset.setAttribute('aria-invalid','true');else fieldset.removeAttribute('aria-invalid');
    if(focus) {
      const target=error ? (el('budget-amount')&&!el('budget-amount').disabled ? el('budget-amount') : form.querySelector('input:not(:disabled)')) : el('quiz-question');
      target.focus({preventScroll:true});
    }
  }
  function updateBudgetFeedback(animate=false) {
    const input=el('budget-amount'),warning=el('budget-warning');if(!input||!warning)return;
    const {budget}=quiz.snapshot().answers;
    const valid=budget.mode==='maximum'&&quiz.validate(3).valid;
    const low=valid&&Number(budget.amount)<50;
    const message=low?'There may be fewer options at this budget. You can continue or raise your maximum.':'';
    warning.hidden=!low;if(warning.textContent!==message)warning.textContent=message;
    const wrapper=input.parentElement;
    const special=valid&&Number(budget.amount)===67;
    if(!special||wrapper.dataset.animatedValue!==input.value)wrapper.classList.remove('budget-joke');
    if(animate&&special&&!wrapper.classList.contains('budget-joke')&&!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      const digits=el('budget-digits');digits.replaceChildren();
      for(const character of input.value){const span=document.createElement('span');span.textContent=character;digits.append(span);}
      wrapper.dataset.animatedValue=input.value;
      wrapper.classList.add('budget-joke');
    }
  }
  function go(hash) {
    close(false);
    if(window.location.hash===hash) enterRoute(hash);
    else window.location.hash=hash;
  }
  function openChoice() {
    if(getCollection().length<2) return;
    restoreFocus=true;
    dialog.showModal(); el('choose-rating').focus();
  }
  function beforeRoute(hash) {
    close(false);
    if(hash==='#results'&&mode==='first') {
      mode=collectionMode;quiz=collectionQuiz;editingOne=false;form.dataset.step='';
    }
    if(hash==='#suggestions'&&mode!=='first') {
      if(![0,1,2,3,4,5].every(step=>firstQuiz.validate(step).valid))return '#collection';
      mode='first';quiz=firstQuiz;editingOne=false;form.dataset.step='';
    }
    if((hash==='#results'||hash==='#quiz'&&mode!=='first') && getCollection().length<2) {
      announce('Add at least two fragrances to analyze your collection.'); return '#collection';
    }
    if((hash==='#results' && mode==='recommendations'||hash==='#suggestions') && !complete()) {
      announce('Complete your preferences to see recommendations.'); return '#quiz';
    }
    return hash;
  }
  const resultsRoute=()=>mode==='first'?'#suggestions':'#results';
  function renderSuggestions() {
    const collection=getCollection(),answers=quiz.snapshot().answers;
    const result=recommendFragrances(getCatalog(),collection,answers,{limit:Infinity});
    const alternatives=result.items.length?[]:alternativeOptions(getCatalog(),collection,answers);
    renderRecommendations(el('recommendation-results'),result,answers,alternatives);
  }
  function enterRoute(hash) {
    if(hash==='#quiz') {
      el('quiz-title').textContent=mode==='first'?'Find your first fragrance':'Find your next scent';
      el('quiz-view').querySelector('.flow-intro').textContent=mode==='first'?'Tell us what you would like to try. You do not need a collection to get suggestions.':'Your preferences guide recommendations. Your collection score stays the same.';
      showQuiz();
    }
    if(hash==='#results'||hash==='#suggestions') {
      const collection=getCollection();
      const first=hash==='#suggestions';
      el('results-title').textContent=first?'Find your first fragrance':'Your collection analysis';
      document.title=(first?'Find your first fragrance':'Your collection analysis')+' · RateMyScents';
      el('analysis-results').hidden=first;
      el('results-view').querySelector('.results-method').hidden=first;
      if(!first)renderAnalysis(el('analysis-results'),analyzeCollection(collection),collection);
      else el('analysis-results').replaceChildren();
      const recommendations=el('recommendation-results');
      recommendations.hidden=mode==='rating';
      if(mode!=='rating' && complete())renderSuggestions();
      else recommendations.replaceChildren();
    }
  }
  dialog.addEventListener('cancel',event=>{event.preventDefault(); close();});
  dialog.addEventListener('close',()=>{
    if(restoreFocus && !el('home-view').hidden) el('analyze-collection').focus();
  });
  el('close-analysis-choice').addEventListener('click',()=>close());
  el('choose-rating').addEventListener('click',()=>{mode='rating';collectionMode='rating';quiz=collectionQuiz;editingOne=false;go('#results');});
  el('choose-recommendations').addEventListener('click',()=>{mode='recommendations';collectionMode='recommendations';quiz=collectionQuiz;restartQuiz();go('#quiz');});
  el('first-fragrance').addEventListener('click',()=>{
    mode='first';quiz=firstQuiz;restartQuiz();go('#quiz');
  });
  form.addEventListener('change',event=>{
    const input=event.target;
    if(!input.matches('input') || input.name==='budget-amount') return;
    let error='';
    if(input.name==='budget-mode') {
      const amount=quiz.snapshot().answers.budget.amount;
      if(['50','100','150'].includes(input.value)) quiz.setBudget('maximum',input.value);
      else quiz.setBudget(input.value,input.value==='maximum' && ['50','100','150'].includes(amount) ? '' : amount);
    }
    else {
      if(input.name==='profiles' && input.value!=='none' && input.checked && quiz.snapshot().answers.profiles?.length===3) error='Choose up to 3. Deselect one to choose another.';
      quiz.select(input.name,input.value);
    }
    showQuiz(error);
    [...form.querySelectorAll('input')].find(item=>item.name===input.name && item.value===input.value)?.focus();
  });
  form.addEventListener('input',event=>{
    if(event.target.name==='budget-amount') {
      quiz.setBudget('maximum',event.target.value);
      const value=['50','100','150'].includes(event.target.value) ? event.target.value : 'maximum';
      form.querySelector(`input[name="budget-mode"][value="${value}"]`).checked=true;
      el('quiz-error').textContent='';
      event.target.removeAttribute('aria-invalid');
      form.querySelector('fieldset').removeAttribute('aria-invalid');
      updateBudgetFeedback(true);
    }
  });
  form.addEventListener('click',event=>{
    if(!event.target.closest('[data-action="back"]')) return;
    if(editingOne){editingOne=false;go(resultsRoute());return;}
    const {step}=quiz.snapshot();
    if(step>0) {quiz.goTo(step-1); showQuiz('',true);}
    else {
      go('#collection');
      if(mode!=='first')window.setTimeout(()=>{if(window.location.hash==='#collection') openChoice();},0);
    }
  });
  form.addEventListener('submit',event=>{
    event.preventDefault(); const {step}=quiz.snapshot(); const validation=quiz.validate(step);
    if(!validation.valid) {showQuiz(validation.message,true); return;}
    if(editingOne){editingOne=false;go(resultsRoute());}
    else if(step<lastStep()) {quiz.goTo(step+1); showQuiz('',true);}
    else {if(mode!=='first')mode='recommendations';go(resultsRoute());}
  });
  el('recommendation-results').addEventListener('click',event=>{
    const tag=event.target.closest('[data-edit-step]');
    if(tag){editingOne=true;quiz.goTo(Number(tag.dataset.editStep));go('#quiz');return;}
    const alternative=event.target.closest('[data-alternative]');
    if(alternative) {
      const answers=quiz.snapshot().answers;
      const option=alternativeOptions(getCatalog(),getCollection(),answers).find(x=>x.kind===alternative.dataset.alternative && (x.kind!=='budget'||String(x.amount)===alternative.dataset.amount));
      if(!option)return;
      if(option.kind==='budget')quiz.setBudget('maximum',option.amount);
      else if(option.kind==='type')quiz.select('type','any');
      else quiz.select(option.kind,'none');
      renderSuggestions();el('recommendation-results').querySelector('#edit-preferences').focus();announce('Preferences updated. Your recommendations are ready.');return;
    }
    if(event.target.closest('#edit-preferences, [data-action="retake-quiz"]')) {
      event.preventDefault();
      if(event.target.closest('[data-action="retake-quiz"]'))restartQuiz();
      else {editingOne=false;quiz.goTo(0);form.dataset.step='';}
      go('#quiz');
    }
  });
  el('recommendation-results').addEventListener('submit',event=>{
    const editor=event.target;if(editor.dataset.action!=='recommendation-budget')return;
    event.preventDefault();
    const amount=editor.elements.namedItem('amount');
    const draft=createQuiz();draft.setBudget(editor.elements.namedItem('unlimited').checked?'unlimited':'maximum',amount.value);
    const validation=draft.validate(3);
    if(!validation.valid){el('recommendation-budget-error').textContent=validation.message;amount.setAttribute('aria-invalid','true');amount.focus();return;}
    const budget=draft.snapshot().answers.budget;quiz.setBudget(budget.mode,budget.amount);
    renderSuggestions();
    el('recommendation-results').querySelector('.recommendation-budget summary').focus();
    announce('Budget updated. Your recommendations are ready.');
  });
  el('analysis-results').addEventListener('click',async event=>{
    const button=event.target.closest('#rating-export');if(!button||exporting)return;
    exporting=true;button.setAttribute('aria-disabled','true');button.setAttribute('aria-busy','true');
    const status=el('rating-export-status');status.textContent='Preparing your image...';
    const collection=structuredClone(getCollection());
    try {await exportRating(document,analyzeCollection(collection),collection);status.textContent='Your image is ready. Check your downloads.';}
    catch {status.textContent='We could not create the image. Please try again.';}
    finally {exporting=false;button.removeAttribute('aria-disabled');button.removeAttribute('aria-busy');}
  });
  return {openChoice,beforeRoute,enterRoute,collectionChanged() {
    el('analysis-results').replaceChildren(); el('recommendation-results').replaceChildren();
  }};
}
