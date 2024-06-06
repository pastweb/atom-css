import { Root, type Rule, type AtRule } from 'postcss';

export function countAncestors(rule: Rule | AtRule, ancestors = 0): number {
  const hasRootParent = rule.parent instanceof Root;

  if (hasRootParent) return ancestors;
  
  return countAncestors(rule.parent as Rule, ancestors + 1);
}
