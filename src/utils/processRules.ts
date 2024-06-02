import * as postcss from 'postcss';
import { getUtilityClassName } from './getUtilityClassName';
import { extractClassName } from './extractClassName';
import { removeRuleIfEmpty } from './removeRuleIfEmpty';
import type { Declaration, Rule } from 'postcss';

export function processRules(selector: string, rules: Rule[], mode: string, modules: Record<string, string>, utilityModules: Record<string, Rule>): void {
  const propertyDeclarations: Record<string, string> = {};
  const { scoped, unscoped } = extractClassName(selector);

  rules.forEach(rule => {
    rule.each(node => {
      if (node.type !== 'decl') return;
  
      const decl = node as Declaration;
      const { prop, value } = decl;
      
      if (prop.startsWith('--') && !/^--(webkit|moz|ms|o)-/.test(prop)) return;

      propertyDeclarations[prop] = value;
      decl.remove(); // Remove the processed declaration from the original rule
    });
  });
  
  Object.entries(propertyDeclarations).forEach(([ prop, value ]) => {
    const utilityClassName = getUtilityClassName(mode, prop, value);
    const utilityRule = postcss.rule({ selector: `.${utilityClassName}` });
    const decl = postcss.decl({ prop, value, raws: { before: ' ', between: ': ' } });
    utilityRule.append(decl);

    if (!utilityModules[utilityClassName]) utilityModules[utilityClassName] = utilityRule;
      
    modules[unscoped] = !modules[unscoped] ? `${scoped} ${utilityClassName}` : `${modules[unscoped]} ${utilityClassName}`;
  });

  rules.forEach((rule, i) => removeRuleIfEmpty(scoped, unscoped, rule, modules, !!!i));
}
