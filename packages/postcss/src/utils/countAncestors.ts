import type { Rule, AtRule } from 'postcss';

export function countAncestors(rule: Rule | AtRule, ancestors: number | null = 0): number | null {
  if (ancestors === null || !rule.parent) return null;
  
  const hasRootParent = rule.parent && rule.parent.type === 'root';

  if (hasRootParent) return ancestors;
  
  return countAncestors(rule.parent as Rule, ancestors + 1);
}
