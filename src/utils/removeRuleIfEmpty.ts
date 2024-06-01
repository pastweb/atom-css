import type { Rule } from 'postcss';

export function removeRuleIfEmpty(scoped: string, unscoped: string, rule: Rule, modules: Record<string, string>, fixModules: boolean): void {
  const parent = rule.parent as Rule;

  if (rule.nodes.length) return;
  
  modules[unscoped] = modules[unscoped].replace(`${scoped} `, '');
  rule.remove();

  if (parent && parent.selector && parent.selector.startsWith('.')) {
    removeRuleIfEmpty(scoped, unscoped, parent, modules, fixModules);
  }
}
