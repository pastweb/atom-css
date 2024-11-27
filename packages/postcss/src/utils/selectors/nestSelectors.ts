import postcss from 'postcss';
import { AT_RULES, SPLIT_SELECTOR_RE } from './constants';
import { ChildNode, Rule, Root, AtRule } from 'postcss';

// Split selector by combinators and special characters, capturing pseudo-classes and pseudo-elements
const splitSelector = (selector: string) => {
  const selectors: string[] = /:global\s*\(/g.test(selector) || selector.includes(',') ? [ selector ] : [];
  
  if (selectors.length) return selectors;

  const parts = selector.replace(/ +/, ' ').trim().split(SPLIT_SELECTOR_RE);

  for (let i = 0; i < parts.length; i++) {
    if (!parts[i]) continue;
    if (parts[i] === ' ') {
      selectors.push(` ${parts[i + 1]}`);
      i++;
    } else {
      selectors.push(parts[i]);
    }
  }

  return selectors;
};
// Normalize selectors, handling parent reference and removing leading spaces
const normalizeSelectors = (selectors: string[]) => selectors.map(s => /^ /.test(s) ? s.replace(/^ /, '') : /^&/.test(s) ? s : `&${s}`);

// Helper function to traverse and nest rules
function traverseNodes(parentRule: AtRule | Rule | Root, nodes: (Rule | AtRule)[]): void {
  const topLevelRules: { [key: string]: Rule } = {};
  const removeRules: Rule[] = [];

  // collect top-level rules
  nodes.forEach(node => {
    if (node.type === 'rule' && splitSelector(node.selector).length === 1) {
      topLevelRules[node.selector] = node;
      traverseNodes(node, node.nodes as Rule[] | AtRule[]);
    }
  });


  // nest the rules
  nodes.forEach(node => {
    if (node.type === 'rule') {
      const parts = splitSelector(node.selector);

      if (parts.length === 1) return;

      const [ parentSelector, ...rest ] = parts;
      const normalized = normalizeSelectors(rest);
      const topRule = topLevelRules[parentSelector] || postcss.rule({ selector: parentSelector });
      
      if (!topLevelRules[parentSelector]) parentRule.append(topRule);

      let current = topRule;

      for (let i = 0; i < normalized.length; i++) {
        const selector = normalized[i];

        const rule = current.nodes.find(node => node.type === 'rule' && node.selector === selector);

        if (rule) {
          current = rule as Rule;
          continue;
        }

        if (i === normalized.length - 1) {
          current.append(node.clone({ selector }));
        } else {
          const next = postcss.rule({ selector });
          current.append(next);
          current = next;
        }
      }

      removeRules.push(node);
    }

    if (node.type === 'atrule' && AT_RULES.has(node.name)) {
      node.each((child: ChildNode) => {
        if (child.type === 'rule' && child.selector === '&') {
          child.nodes.forEach(decl => node.append(decl.clone()));
          child.remove();
        }
      });

      traverseNodes(node, node.nodes as (Rule | AtRule)[]);
    }

    if (node.nodes && node.nodes.length > 0) {
      traverseNodes(node, node.nodes as (Rule | AtRule)[]);
    }
  });

  removeRules.forEach(rule => rule.remove());
}

export function nestSelectors(root: Root): void {
  // nest root flat rule selectors
  traverseNodes(root, root.nodes as (Rule | AtRule)[]);
}
