import { NodeType } from './constants';
import { getStrClasses } from './getStrClasses';
import { UsedClasses } from './types';

export function setClassNames(node: any, classes: UsedClasses): void {
  const from: Record<string, (node: any, alt?: boolean) => string> = {
    [NodeType.ArrayExpression]: (node, alt) => node.elements.map((e: any) => from[e.type] ? from[e.type](e, alt) : '').join(' '),
    [NodeType.BinaryExpression]: (node, alt) => {
      if (node.operator !== '+') return '';
      
      let value = from[node.left.type] ? from[node.left.type](node.left, alt) : '.*';
      value = `${value}${from[node.right.type] ? from[node.right.type](node.right, alt) : '.*'}`;
      value = value === '.*.*' ? '' : value;
  
      return value;
    },
    [NodeType.CallExpression]: (node, alt) => node.arguments.map((a: any) => from[a.type] ? from[a.type](a, alt) : '').join(' '),
    [NodeType.ConditionalExpression]: (node, alt) => {
      const { consequent, alternate } = node;
      let value = '';
      value = from[consequent.value.type] ? from[consequent.value.type](consequent.value, alt) : '';
      value = `${value}${from[alternate.value.type] ? `${value ? ' ': ''}${from[alternate.value.type](alternate.value, alt)}`: ''}`;
      return value;
    },
    [NodeType.Identifier]: (node, _) => node.name,
    [NodeType.Literal]: (node, _) => node.value,
    [NodeType.MemberExpression]: (node, getIdentifier) => {
      const { object, property } = node;
      
      const identifierNode = object.type === NodeType.MemberExpression ? object.property : object;
      const identifier = from[identifierNode.type](identifierNode, true);

      if (getIdentifier) return identifier;
  
      let added = false;
      for (const [filePath, { identifiers }] of Object.entries(classes)) {
        if (!identifiers.has(identifier)) continue;
        classes[filePath].classes.push(from[property.type](property));
        added = true;
      }
  
      return added ? '' : from[property.type](property);
    },
    [NodeType.ObjectExpression]: (node, alt) => {
      const { properties } = node;
      return properties.map((p: any) => from[p.type] ? from[p.type](p, alt) : '').join(' ');
    },
    [NodeType.Property]: (node, alt) => from[node.key.type] ? from[node.key.type](node.key, alt) : '',
    [NodeType.TemplateElement]: (node, _) => node.value.cooked,
    [NodeType.TemplateLiteral]: (node, tag) => {
      let value = '';

      const { quasis, expressions } = node;
  
      for (let i = 0; i < quasis.length; i++) {
        if (!tag) {
          value = `${value}${quasis[i].value.cooked}`; // Add static part
        }
        
        if ((i < expressions.length && !tag) || ((i < expressions.length && tag && /class=("|')$/.test(quasis[i].value.cooked)))) {
          value = `${value}${from[expressions[i].type] ? `${from[expressions[i].type](expressions[i])} ` : ''}`;
        }
      }

      return value.replace(/ +/g, ' ');
    },
    [NodeType.TaggedTemplateExpression](node) {
      return from[NodeType.TemplateLiteral](node.quasi, true);
    },
  };

  if (!from[node.type]) return;
  // if there is any className without any module identifier specified it will be added for each indentifier.
  let used = getStrClasses(from[node.type](node));

  if (used.length) {
    Object.values(classes).forEach(({ classes }) => used.forEach(cl => classes.push(cl)));
  }
}
