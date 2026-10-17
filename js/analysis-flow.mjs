import { createQuiz } from './quiz.mjs';
import { renderQuiz } from './quiz-view.mjs';
import { analyzeCollection } from './analysis.mjs';
import { recommendFragrances } from './recommendations.mjs';
import { renderAnalysis, renderRecommendations } from './results-view.mjs';

export function initializeAnalysisFlow(document,{getCollection,getCatalog,announce}) {
  const window=document.defaultView;
  const el=id=>document.getElementById(id);
  const dialog=el('analysis-choice');
  const form=el('quiz-form');
  const quiz=createQuiz();
  let mode='rating';
  let restoreFocus=true;
  const complete=()=>[0,1,2,3,4].every(step=>quiz.validate(step).valid);
  function close(restore=true) {
    restoreFocus=restore;
    if(dialog.open) dialog.close();
  }
  function showQuiz(error='',focus=false) {
    const snapshot=quiz.snapshot();
    if(form.dataset.step!==String(snapshot.step)) {
      renderQuiz(form,snapshot);
      form.dataset.step=String(snapshot.step);
    }
    const {answers,step}=snapshot;
    for(const input of form.querySelectorAll('input')) {
      const group=input.name;
      if(group==='profiles'||group==='occasions') input.checked=input.value==='none' ? Array.isArray(answers[group])&&!answers[group].length : answers[group]?.includes(input.value)??false;
      else if(group==='type'||group==='priority') input.checked=answers[group]===input.value;
      else if(group==='budget-mode') input.checked=answers.budget.mode==='unlimited' ? input.value==='unlimited' : answers.budget.mode==='maximum' && input.value===(['50','100','150'].includes(answers.budget.amount)?answers.budget.amount:'maximum');
      input.removeAttribute('aria-invalid');
    }
    const amount=el('budget-amount');
    if(amount) {amount.value=answers.budget.amount;amount.disabled=answers.budget.mode==='unlimited';if(error)amount.setAttribute('aria-invalid','true');}
    const count=form.querySelector('.selection-count');
    if(count) count.textContent=`${answers.profiles?.length??0} of 3 selected`;
    el('quiz-error').textContent=error;
    const fieldset=form.querySelector('fieldset');
    fieldset.setAttribute('aria-describedby','quiz-help quiz-error');
    if(error)fieldset.setAttribute('aria-invalid','true');else fieldset.removeAttribute('aria-invalid');
    if(focus) {
      const target=error ? (el('budget-amount')&&!el('budget-amount').disabled ? el('budget-amount') : form.querySelector('input:not(:disabled)')) : el('quiz-question');
      target.focus({preventScroll:true});
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
    if(['#quiz','#results'].includes(hash) && getCollection().length<2) {
      announce('Add at least two fragrances to analyze your collection.'); return '#collection';
    }
    if(hash==='#results' && mode==='recommendations' && !complete()) {
      announce('Complete your preferences to see recommendations.'); return '#quiz';
    }
    return hash;
  }
  function enterRoute(hash) {
    if(hash==='#quiz') showQuiz();
    if(hash==='#results') {
      const collection=getCollection();
      renderAnalysis(el('analysis-results'),analyzeCollection(collection),collection);
      const recommendations=el('recommendation-results');
      recommendations.hidden=mode!=='recommendations';
      if(mode==='recommendations' && complete()) renderRecommendations(recommendations,recommendFragrances(getCatalog(),collection,quiz.snapshot().answers,{limit:Infinity}),quiz.snapshot().answers);
      else recommendations.replaceChildren();
    }
  }
  dialog.addEventListener('cancel',event=>{event.preventDefault(); close();});
  dialog.addEventListener('close',()=>{
    if(restoreFocus && !el('home-view').hidden) el('analyze-collection').focus();
  });
  el('close-analysis-choice').addEventListener('click',()=>close());
  el('choose-rating').addEventListener('click',()=>{mode='rating'; go('#results');});
  el('choose-recommendations').addEventListener('click',()=>{mode='recommendations'; quiz.goTo(0); go('#quiz');});
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
    }
  });
  form.addEventListener('click',event=>{
    if(!event.target.closest('[data-action="back"]')) return;
    const {step}=quiz.snapshot();
    if(step>0) {quiz.goTo(step-1); showQuiz('',true);}
    else {
      go('#collection');
      window.setTimeout(()=>{if(window.location.hash==='#collection') openChoice();},0);
    }
  });
  form.addEventListener('submit',event=>{
    event.preventDefault(); const {step}=quiz.snapshot(); const validation=quiz.validate(step);
    if(!validation.valid) {showQuiz(validation.message,true); return;}
    if(step<4) {quiz.goTo(step+1); showQuiz('',true);}
    else {mode='recommendations'; go('#results');}
  });
  el('recommendation-results').addEventListener('click',event=>{
    if(event.target.closest('#edit-preferences, [data-action="retake-quiz"]')) {
      event.preventDefault(); quiz.goTo(0); go('#quiz');
    }
  });
  return {openChoice,beforeRoute,enterRoute,collectionChanged() {
    el('analysis-results').replaceChildren(); el('recommendation-results').replaceChildren();
  }};
}
