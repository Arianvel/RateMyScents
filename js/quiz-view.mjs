import { OCCASIONS } from './method.mjs';
import { SCENT_GROUPS } from './scent-groups.mjs';

const questions = [
  'What occasions would you like to cover?', 'What kind of scents would you like?',
  'What type of fragrances are you interested in?', 'What is your budget per fragrance?', 'Which fragrances would you like to discover?', 'What should we prioritize?',
];
const types = [['designer','Designer'],['arabic','Middle Eastern / Arabic'],['niche','Niche'],['any','Any type']];
const priorities = [['familiar','Similar to my collection'],['different','Different from my collection'],['versatile','More occasions covered'],['none','No preference']];

export function renderQuiz(container, {answers,step}, error = '', {firstFragrance=false}={}) {
  const document = container.ownerDocument;
  const node = (tag,text,className) => {
    const el = document.createElement(tag);
    if (text) el.textContent=text;
    if (className) el.className=className;
    return el;
  };
  container.replaceChildren();
  const totalSteps=firstFragrance?5:6;
  const progressText = node('p',`Question ${step+1} of ${totalSteps}`,'eyebrow');
  const progress = node('progress'); progress.max=totalSteps; progress.value=step+1; progress.setAttribute('aria-label',`Question ${step+1} of ${totalSteps}`);
  const fieldset = node('fieldset');
  const legend = node('legend',questions[step],'section-heading'); legend.id='quiz-question'; legend.tabIndex=-1;
  fieldset.append(legend);
  const help = node('p',step===0 ? 'Choose any occasions you would like to cover, or No preference.'
    : step===1 ? 'Choose up to 3, or select No preference.' : step===2 ? 'Choose the types you want to explore, or Any type.' : step===3 ? 'How much would you spend on one fragrance? Prices are in USD.' : 'Choose one option.','caption');
  help.id='quiz-help'; fieldset.append(help);
  const options = node('div',null,`quiz-options${step===1 ? ' profile-options' : ''}`);
  let optionIndex=0;
  function option(group,value,label,checked,multiple=false,description='') {
    const wrapper = node('label',null,'quiz-option');
    const input = node('input'); input.type=multiple ? 'checkbox' : 'radio'; input.name=group; input.value=value; input.checked=checked;
    input.setAttribute('aria-describedby','quiz-help quiz-error');
    const copy=node('span',null,'quiz-option-copy');
    const title=node('span',label);title.id=`quiz-option-${group}-${optionIndex++}`;
    input.setAttribute('aria-labelledby',title.id);
    copy.append(title);
    if(description) {
      const hint=node('span',description,'quiz-option-description');hint.id=`${title.id}-description`;
      input.setAttribute('aria-describedby',`quiz-help quiz-error ${hint.id}`);copy.append(hint);
    }
    wrapper.append(input,copy); options.append(wrapper);
  }
  if (step<2) {
    const group = step===0 ? 'occasions' : 'profiles';
    if(step===0) for(const value of OCCASIONS) option(group,value,value,answers[group]?.includes(value)??false,true);
    else for(const item of SCENT_GROUPS) option(group,item.id,item.label,answers.profiles?.includes(item.id)??false,true,item.description);
    option(group,'none','No preference',Array.isArray(answers[group]) && !answers[group].length,true);
  } else if (step===2 || step===5) {
    const group = step===2 ? 'type' : 'priority';
    for (const [value,label] of step===2 ? types : priorities.filter(([value])=>!firstFragrance||!['familiar','different'].includes(value))) {
      const checked=step===2 ? value==='any' ? Array.isArray(answers.type)&&!answers.type.length : answers.type?.includes(value)??false : answers[group]===value;
      option(group,value,label,checked,step===2);
    }
  } else if(step===4) {
    for(const [value,label] of [['men','Masculine & unisex'],['women','Feminine & unisex'],['unisex','Unisex only'],['any','No preference']]) option('gender',value,label,answers.gender===value);
  } else {
    for(const amount of ['50','100','150']) option('budget-mode',amount,`Up to $${amount}`,answers.budget.mode==='maximum' && answers.budget.amount===amount);
    option('budget-mode','maximum','Custom amount',answers.budget.mode==='maximum' && !['50','100','150'].includes(answers.budget.amount));
    option('budget-mode','unlimited','No budget limit',answers.budget.mode==='unlimited');
  }
  fieldset.append(options);
  if (step===1) fieldset.append(node('p',`${answers.profiles?.length ?? 0} of 3 selected`,'caption selection-count'));
  if (step===3) {
    const label = node('label','Maximum per fragrance (USD)','budget-label'); label.htmlFor='budget-amount';
    const input = node('input'); input.id='budget-amount'; input.name='budget-amount'; input.type='text'; input.inputMode='decimal';
    input.autocomplete='off'; input.value=answers.budget.amount; input.placeholder='e.g. 100'; input.disabled=answers.budget.mode==='unlimited';
    input.setAttribute('aria-describedby','quiz-help budget-warning quiz-error');
    const numberField=node('div',null,'budget-number-field');
    const digits=node('span',null,'budget-digits');digits.id='budget-digits';digits.setAttribute('aria-hidden','true');
    numberField.append(input,digits);
    digits.addEventListener('animationend',()=>numberField.classList.remove('budget-joke'));
    const warning=node('p',null,'budget-warning');warning.id='budget-warning';warning.hidden=true;
    warning.setAttribute('role','status');warning.setAttribute('aria-atomic','true');
    fieldset.append(label,numberField,warning);
  }
  const message = node('p',error,'form-error'); message.id='quiz-error'; message.setAttribute('role','status');
  message.setAttribute('aria-atomic','true');
  const actions = node('div',null,'quiz-actions');
  const back = node('button','Back','secondary-button'); back.type='button'; back.dataset.action='back';
  const next = node('button',step===totalSteps-1 ? 'See my results' : 'Continue','primary-button'); next.type='submit';
  actions.append(back,next);
  container.append(progressText,progress,fieldset,message,actions);
}
