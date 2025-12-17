import type { ConditionRule } from '@/types/formBuilder';

/**
 * Formats a condition rule into a human-readable summary
 * @param condition - The condition rule to format
 * @returns Formatted condition string (e.g., "> 5", "= High", "Checked")
 */
export function formatConditionSummary(condition: ConditionRule | undefined): string {
  if (!condition) return 'No condition set';

  switch (condition.type) {
    case 'equals':
      if (condition.operator === 'greaterThan') return `> ${condition.value}`;
      if (condition.operator === 'lessThan') return `< ${condition.value}`;
      return `= ${condition.value}`;
    case 'range':
      return `${condition.rangeMin} - ${condition.rangeMax}`;
    case 'optionMatch':
      if (!condition.options?.length) return 'No options selected';
      if (condition.options.length === 1) return `"${condition.options[0]}"`;
      return `${condition.options.length} options`;
    case 'checkboxState':
      return condition.value ? 'Checked' : 'Unchecked';
    default:
      return 'Unknown condition';
  }
}
