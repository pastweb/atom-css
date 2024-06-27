import type { Rule, AtRule } from 'postcss';

export function countAncestors(rule: Rule | AtRule, ancestors = 0): number {
  const hasRootParent = rule.parent && rule.parent.type === 'root';

  if (hasRootParent) return ancestors;
  
  return countAncestors(rule.parent as Rule, ancestors + 1);
}
