import * as postcss from 'postcss';
import { getUtilityClassName } from './getUtilityClassName';
import { extractClassName } from './extractClassName';
import { removeRuleIfEmpty } from './removeRuleIfEmpty';
import type { Declaration, Rule } from 'postcss';

export function processRule(rule: Rule, mode: string, modules: Record<string, string>, utilityModules: Record<string, Rule>): void {
  const { unscoped } = extractClassName(rule.selector);

  rule.each(node => {
    if (node.type !== 'decl') return;

    const decl = node as Declaration;
    const { prop, value } = decl;
    const utilityClassName = getUtilityClassName(mode, prop, value);
    const utilityRule = postcss.rule({ selector: `.${utilityClassName}` });
    utilityRule.append(decl.clone());
    decl.remove(); // Remove the processed declaration from the original rule
    
    if (!utilityModules[utilityClassName]) utilityModules[utilityClassName] = utilityRule;
    
    modules[unscoped] = modules[unscoped] ? `${modules[unscoped]} ${utilityClassName}` : utilityClassName;
  });

  removeRuleIfEmpty(rule, modules);
}
