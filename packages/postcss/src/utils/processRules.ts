import * as postcss from 'postcss';
import { getUtilityClassName } from './getUtilityClassName';
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
  const classNameMatch = selector.match(/\.([\w-]+)/); // Extract class name from the selector
  const className = classNameMatch![0].replace(/^\./, '');

  Object.entries(propertyDeclarations).forEach(([ propName, properties ]) => {
    const values = Object.entries(properties);
    const utilityClassName = getUtilityClassName(mode, propName, values[0][1], scopeLength, isAtRule ? first : undefined);
    modules[className] = !modules[className] ? `${className} ${utilityClassName}` : `${modules[className]} ${utilityClassName}`;

    if (utilityModules[utilityClassName]) return;

    const utilityRule = postcss.rule({ selector: `.${utilityClassName.replace(/\[/g, '\\[').replace(/\]/g, '\\]')}` });
    if (isAtRule) utilityRule.append(atRule as AtRule);

    for(const [prop, value] of values) {
      const decl = postcss.decl({ prop, value, raws: { before: ' ', between: ': ' } });
      
      if (isAtRule) (atRule as AtRule).append(decl);
      else utilityRule.append(decl);
    }
    
    utilityModules[utilityClassName] = utilityRule;
  });

  rules.forEach(rule=> removeRuleIfEmpty(rule, modules));
}
