import { Root, Rule } from 'postcss';

export function countAncestors(rule: Rule, ancestors = 0): number {
  const hasRootParent = rule.parent instanceof Root;

  if (hasRootParent) return ancestors;
  
  return countAncestors(rule.parent as Rule, ancestors + 1);
}
