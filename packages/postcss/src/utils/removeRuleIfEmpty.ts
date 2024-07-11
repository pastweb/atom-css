import type { Rule, AtRule } from 'postcss';

export function removeRuleIfEmpty(
  scoped: string,
  unscoped: string,
  rule: Rule | AtRule,
  modules: Record<string, string>,
): void {
  const parent = rule.parent as Rule;

  if (!rule.nodes || rule.nodes.length) return;

  rule.remove();

  if (parent && parent.selector && parent.selector.startsWith('.')) {
    removeRuleIfEmpty(scoped, unscoped, parent, modules);
  }
}
