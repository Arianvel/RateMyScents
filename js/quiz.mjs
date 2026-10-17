import { OCCASIONS } from './method.mjs';
import { SCENT_GROUPS } from './scent-groups.mjs';

export function createQuiz() {
  let step = 0;
  const answers = { occasions: null, profiles: null, type: null, budget: {mode:null,amount:''}, priority:null };
  return {
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
      } else if (group === 'type' && ['designer','arabic','niche','any'].includes(value)) answers.type=value;
      else if (group === 'priority' && ['familiar','different','versatile','none'].includes(value)) answers.priority=value;
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
      else valid = index === 4 && answers.priority !== null;
      return {valid, message: valid ? '' : index === 3 ? 'Enter a maximum in USD (0 or more, up to two decimal places), or choose No budget limit.' : 'Choose an option or select No preference where available.'};
    },
    goTo(index) { if (Number.isInteger(index) && index >= 0 && index < 5) step=index; },
  };
}
