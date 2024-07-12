import * as postcss from 'postcss';
import { getUtilityClassName } from './getUtilityClassName';
import { extractClassName } from './extractClassName';
import { removeRuleIfEmpty } from './removeRuleIfEmpty';
import { VENDORS_RE } from '../constants';
import type { Declaration, Rule, AtRule } from 'postcss';

export function processRules(
  selector: string,
  isAtRule: boolean,
  rules: (Rule | AtRule)[],
  mode: string,
  scopeLength: number,
  modules: Record<string, string>,
  utilityModules: Record<string, Rule | AtRule>,
  propFilter?: (id: unknown) => boolean,
  valFilter?: (id: unknown) => boolean,
): void {
  const propertyDeclarations: Record<string, Record<string, string>> = {};

  rules.forEach(rule => {
    rule.each(node => {
      if (node.type !== 'decl') return;
  
      const decl = node as Declaration;
      const { prop, value } = decl;
      
      if (propFilter && !propFilter(prop)) return;
      if (valFilter && !valFilter(value)) return;
      if (prop.startsWith('--') && !VENDORS_RE.test(prop)) return;

      const propName = prop.replace(VENDORS_RE, '');
      propertyDeclarations[propName] = propertyDeclarations[propName] || {};
      propertyDeclarations[propName][prop] = value;
      decl.remove(); // Remove the processed declaration from the original rule
    });
  });
  
  const [ first ] = rules as AtRule[];
  const atRule = isAtRule ? postcss.atRule({ name: first.name, params: first.params }) : false;
  const { scoped, unscoped } = extractClassName(selector);

  Object.entries(propertyDeclarations).forEach(([ propName, properties ]) => {
    const values = Object.entries(properties);
    const utilityClassName = getUtilityClassName(mode, propName, values[0][1], scopeLength, isAtRule ? first : undefined);

    if (!utilityModules[utilityClassName]) {
      const utilityRule = postcss.rule({ selector: `.${utilityClassName.replace(/\[/g, '\\[').replace(/\]/g, '\\]')}` });
      if (isAtRule) utilityRule.append(atRule as AtRule);

      for(const [prop, value] of values) {
        const decl = postcss.decl({ prop, value, raws: { before: ' ', between: ': ' } });
        
        if (isAtRule) (atRule as AtRule).append(decl);
        else utilityRule.append(decl);
      }
      
      utilityModules[utilityClassName] = utilityRule;
    }

    modules[unscoped] = !modules[unscoped] ? `${scoped} ${utilityClassName}` : `${modules[unscoped]} ${utilityClassName}`;
  });

  rules.forEach(rule=> removeRuleIfEmpty(scoped, unscoped, rule, modules));
}
