import { OCCASIONS } from './method.mjs';
import { SCENT_GROUPS } from './scent-groups.mjs';

export function createQuiz() {
  let step = 0;
  const emptyAnswers=()=>({ occasions: null, profiles: null, type: null, gender:null, budget: {mode:null,amount:''}, priority:null });
  let answers = emptyAnswers();
  return {
    reset() { step=0; answers=emptyAnswers(); },
    snapshot: () => structuredClone({answers,step}),
    select(group,value) {
      if (['profiles','occasions'].includes(group)) {
        if (value === 'none') { answers[group] = []; return; }
        if (!(group === 'profiles' ? SCENT_GROUPS.map(item=>item.id) : OCCASIONS).includes(value)) return;
        const selected = answers[group] ?? [];
        if (selected.includes(value)) {
          const remaining = selected.filter(item => item !== value);
          answers[group] = remaining.length ? remaining : null;
        } else if (group !== 'profiles' || selected.length < 3) answers[group] = [...selected,value];
      } else if (group === 'type' && ['designer','arabic','niche','any'].includes(value)) {
        if(value==='any') answers.type=[];
        else {
          const selected=answers.type??[];
          const next=selected.includes(value)?selected.filter(item=>item!==value):[...selected,value];
          answers.type=next.length?next:null;
        }
      }
      else if (group === 'priority' && ['familiar','different','versatile','none'].includes(value)) answers.priority=value;
      else if (group === 'gender' && ['men','women','unisex','any'].includes(value)) answers.gender=value;
    },
    setBudget(mode,amount) {
      if (['maximum','unlimited'].includes(mode)) answers.budget={mode,amount:String(amount).trim().replace(/^(\d+),(\d{1,2})$/, '$1.$2')};
    },
    validate(index) {
      let valid;
      if (index === 0) valid = answers.occasions !== null;
      else if (index === 1) valid = answers.profiles !== null;
      else if (index === 2) valid = answers.type !== null;
      else if (index === 3) valid = answers.budget.mode === 'unlimited' || (answers.budget.mode === 'maximum'
        && /^\d+(\.\d{1,2})?$/.test(answers.budget.amount.trim()) && Number.isFinite(Number(answers.budget.amount)));
      else if(index===4) valid=answers.gender!==null;
      else valid = index === 5 && answers.priority !== null;
      return {valid, message: valid ? '' : index === 3 ? 'Enter a maximum in USD (0 or more, up to two decimal places), or choose No budget limit.' : 'Choose an option or select No preference where available.'};
    },
    goTo(index) { if (Number.isInteger(index) && index >= 0 && index < 6) step=index; },
  };
}
