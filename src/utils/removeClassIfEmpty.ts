import { extractClassName } from './extractClassName';
import type { Rule } from 'postcss';

export function removeClassIfEmpty(rule: Rule, modules: Record<string, string>): void {
  if (rule.nodes.length) return;
  
  const { scoped, unscoped } = extractClassName(rule.selector);
  modules[unscoped] = modules[unscoped].replace(`${scoped} `, '');
  const parent = rule.parent as Rule;
  rule.remove();

  if (parent && parent.selector && parent.selector.startsWith('.')) {
    removeClassIfEmpty(parent, modules);
  }
}
