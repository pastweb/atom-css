import * as postcss from 'postcss';
import { getUtilityClassName } from './getUtilityClassName';
import { extractClassName } from './extractClassName';
import { removeRuleIfEmpty } from './removeRuleIfEmpty';
import type { Declaration, Rule, AtRule } from 'postcss';

export function processRules(
  selector: string,
  isAtRule: boolean,
  rules: (Rule | AtRule)[],
  mode: string,
  modules: Record<string, string>,
  utilityModules: Record<string, Rule | AtRule>
): void {
  const propertyDeclarations: Record<string, string> = {};

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
  
  const [ first ] = rules as AtRule[];
  const { scoped, unscoped } = extractClassName(selector);

  Object.entries(propertyDeclarations).forEach(([ prop, value ]) => {
    const utilityClassName = getUtilityClassName(mode, prop, value, isAtRule ? first : undefined);
    const utilityRule = postcss.rule({ selector: `.${utilityClassName}` });
    const decl = postcss.decl({ prop, value, raws: { before: ' ', between: ': ' } });

    if (isAtRule) {
      const { name, params } = first;
      const atRule = postcss.atRule({ name, params });
      atRule.append(decl);
      utilityRule.append(atRule);
    } else {
      utilityRule.append(decl);
    }

    if (!utilityModules[utilityClassName]) utilityModules[utilityClassName] = utilityRule;
      
    modules[unscoped] = !modules[unscoped] ? `${scoped} ${utilityClassName}` : `${modules[unscoped]} ${utilityClassName}`;
  });

  rules.forEach(rule=> removeRuleIfEmpty(scoped, unscoped, rule, modules, isAtRule));
}
