import { extractClassName } from './extractClassName';
import type { Rule } from 'postcss';

export function removeClassIfEmpty(rule: Rule, modules: Record<string, string>): void {
  const parent = rule.parent as Rule;
  const { scoped, unscoped } = extractClassName(rule.selector);

  if (rule.nodes.length) {
    if (!modules[unscoped].startsWith(scoped)) {
      modules[unscoped] = `${scoped} ${modules[unscoped]}`;
      return;
    }

    return;
  }

  modules[unscoped] = modules[unscoped].replace(`${scoped} `, '');
  rule.remove();

  if (parent && parent.selector && parent.selector.startsWith('.')) {
    removeClassIfEmpty(parent, modules);
  }
}
