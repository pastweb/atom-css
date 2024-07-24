import type { AtRule, ChildNode, Root, Rule } from 'postcss';
import { MediaRule, ContainerRule } from './types';

const flatSelector = (rule: Rule | MediaRule | ContainerRule): string => {
  if (rule.type === 'rule') {
    const { selector } = rule;
    return /^&/.test(selector) ? selector.replace(/^&/, '') : ` ${selector}`;
  } else {
    const atRule = rule as AtRule;
    return `@${atRule.name}${atRule.params ? ` ${atRule.params}` : ''}`;
  }
};

function isRuleNode(node: ChildNode): boolean {
  if (node.type === 'rule') return true;
  if (node.type === 'atrule' && (node.name === 'media' || (node.name === 'container'))) return true;

  return false;
}

function flatRule(rule: Rule | MediaRule | ContainerRule, soft = false): (Rule | MediaRule | ContainerRule)[] {
  let append: (Rule | MediaRule | ContainerRule)[] = [];

  if (soft) {
    if (rule.nodes.length === 1) {
      const [ chilsNode ] = rule.nodes as Rule[];
      if (chilsNode.type === 'rule') {
        if (rule.type === 'rule') {
          chilsNode.nodes.forEach(node => rule.append(node.clone()));
          rule.selector = `${rule.selector}${flatSelector(chilsNode as Rule | MediaRule | ContainerRule)}`;
          chilsNode.remove();
          flatRule(rule, soft);
        }
      };
    } else {
      rule.nodes.forEach((node: ChildNode) => {
        if (!isRuleNode(node)) return;
        flatRule(node as Rule | MediaRule | ContainerRule, soft);
      });
    }
  } else {
    rule.nodes.forEach((node: ChildNode) => {
      if (!isRuleNode(node)) return;
  
      const selector = `${flatSelector(rule)}${flatSelector(node as Rule | MediaRule | ContainerRule)}`;
      
      const clone = node.clone({ selector }) as Rule | MediaRule | ContainerRule;
      node.remove();
      
      append.push(clone);
      append = [ ...append, ...flatRule(clone) ];
    });
  }

  return append;
}

export function flatSelectors(root: Root, soft = false): void {
  const removeNodes: ChildNode[] = [];
  let ruleAppend: Rule[] = [];
  const mediaAppend: AtRule[] = [];
  const keyframesAppend: AtRule[] = [];

  root.nodes.forEach((node: ChildNode) => {
    const isMedia = node.type === 'atrule' && node.name === 'media';
    const isKeyframes = node.type === 'atrule' && node.name === 'keyframes';

    if (node.type !== 'rule' && !isMedia && !isKeyframes) return;

    if (isKeyframes) {
      keyframesAppend.push(node.clone());
      removeNodes.push(node);
      return;
    }

    if (!isMedia) {
      const clone = (node as Rule).clone() as Rule;
      removeNodes.push(node);
      
      const rules = flatRule(clone, soft) as Rule[];
      rules.forEach(rule => { rule.selector = rule.selector.trim() });
      
      ruleAppend = [
        ...ruleAppend,
        ...clone.nodes.length ? [ clone ] : [],
        ...rules,
      ];
    } else {
      const clone = (node as AtRule).clone() as AtRule;
      removeNodes.push(node);

      clone.nodes?.forEach((childNode: ChildNode) => {
        for (const rule of flatRule(childNode as Rule, soft)) {
          (rule as Rule).selector = (rule as Rule).selector.trim();
          clone.append(rule);
        };

        if (!(childNode as Rule).nodes.length) childNode.remove();
      });

      mediaAppend.push(clone);
    }
  });

  removeNodes.forEach(node => node.remove());
  ruleAppend.forEach(rule => root.append(rule));
  mediaAppend.forEach(rule => root.append(rule));
  keyframesAppend.forEach(rule => root.append(rule));
}
