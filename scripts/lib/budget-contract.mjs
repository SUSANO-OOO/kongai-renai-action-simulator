// Repository-level safeguards; this cannot inspect or modify an external billing account.
export function validateBudget(settings, state, ciText) {
  const errors = [];
  const p = settings?.paidExternalResources;
  if (!p || p.authorized !== false || p.budget !== 0 || p.currency !== 'JPY' || p.policy !== 'hard_zero_incremental_spend') errors.push('Additional spending must be explicitly forbidden with a JPY 0 budget');
  for (const key of ['paidApiCalls', 'overageBilling', 'automaticTopUps', 'newSubscriptions', 'paidAssets', 'autoRenewingTrials', 'reopenBudgetQuestion']) {
    if (p?.[key] !== false) errors.push(key + ' must be false');
  }
  if (p?.existingEntitlementsOnly !== true || p?.whenCostUnknown !== 'do_not_execute' || p?.whenQuotaExhausted !== 'use_verified_free_alternative_or_stop_affected_task') errors.push('Unknown cost and exhausted quota must fail closed');
  if (state?.costPolicy !== 'hard_zero_incremental_spend') errors.push('Project cost policy differs');
  if ((state?.openProductDecisions ?? []).includes('Q10') || (state?.conditionalDecisions ?? []).some(d => d.id === 'Q10')) errors.push('Q10 is settled, not a pending budget negotiation');
  const ci = ciText ?? '';
  if (!ci.includes('if: github.event.repository.private == false')) errors.push('CI needs a public-repository guard');
  const runners = [...ci.matchAll(/^\s*runs-on:\s*(.+)$/gm)].map(m => m[1].trim());
  if (!runners.length || runners.some(s => s !== 'ubuntu-latest')) errors.push('Routine CI must use only the standard ubuntu-latest runner');
  if (!ci.includes('timeout-minutes: 10') || !ci.includes('contents: read')) errors.push('Routine CI needs a time limit and read-only contents permission');
  if (/upload-artifact|actions\/cache|schedule:|contents:\s*write/.test(ci)) errors.push('Routine CI must not add automatic artifact storage, caches, scheduled jobs or write permissions');
  return errors;
}
