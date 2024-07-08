import { NodeType } from "./constants";

function getClasses(classes: string): string[] {
  return classes.trim().replace(/ +/g, ' ').split(' ').filter(c => c);
}

export function setClassNames(node: any, identifiers: Record<string, string[]>): void {
  const from: Record<string, (node: any, identifiers: Record<string, string[]>, alt?: boolean) => string> = {
    [NodeType.ArrayExpression]: (node, identifiers, alt) => node.elements.map((e: any) => from[e.type] ? from[e.type](e, identifiers, alt) : '').join(' '),
    [NodeType.BinaryExpression]: (node, identifiers, alt) => {
      if (node.operator !== '+') return '';
      
      let value = from[node.left.type] ? from[node.left.type](node.left, identifiers, alt) : '.*';
      value = `${value}${from[node.right.type] ? from[node.right.type](node.right, identifiers, alt) : '.*'}`;
      value = value === '.*.*' ? '' : value;
  
      return value;
    },
    [NodeType.CallExpression]: (node, identifiers, alt) => node.arguments.map((a: any) => from[a.type] ? from[a.type](a, identifiers, alt) : '').join(' '),
    [NodeType.ConditionalExpression]: (node, identifiers, alt) => {
      const { consequent, alternate } = node;
      let value = '';
      value = from[consequent.value.type] ? from[consequent.value.type](consequent.value, identifiers, alt) : '';
      value = `${value}${from[alternate.value.type] ? `${value ? ' ': ''}${from[alternate.value.type](alternate.value, identifiers, alt)}`: ''}`;
      return value;
    },
    [NodeType.Identifier]: (node, _) => node.name,
    [NodeType.Literal]: (node, _) => node.value,
    [NodeType.MemberExpression]: (node, identifiers, getIdentifier) => {
      const { object, property } = node;
      
      const identifierNode = object.type === NodeType.MemberExpression ? object.property : object;
      const identifier = from[identifierNode.type](identifierNode, identifiers, true);

      if (getIdentifier) return identifier;
  
      if (identifiers[identifier] && from[property.type]) {
        const classes = getClasses(from[property.type](property, identifiers));
        classes.forEach(cl => identifiers[identifier].push(cl));
      }
  
      return '';
    },
    [NodeType.ObjectExpression]: (node, identifiers, alt) => {
      const { properties } = node;
      return properties.map((p: any) => from[p.type] ? from[p.type](p, identifiers, alt) : '').join(' ');
    },
    [NodeType.Property]: (node, identifier, alt) => from[node.key.type] ? from[node.key.type](node.key, identifier, alt) : '',
    [NodeType.TemplateElement]: (node, _) => node.value.cooked,
    [NodeType.TemplateLiteral]: (node, identifiers, tag) => {
      let value = '';

      const { quasis, expressions } = node;
  
      for (let i = 0; i < quasis.length; i++) {
        if (!tag) {
          value = `${value}${quasis[i].value.cooked}`; // Add static part
        }
        
        if ((i < expressions.length && !tag) || ((i < expressions.length && tag && /class=("|')$/.test(quasis[i].value.cooked)))) {
          value = `${value}${from[expressions[i].type] ? `${from[expressions[i].type](expressions[i], identifiers)} ` : ''}`;
        }
      }

      return value.replace(/ +/g, ' ');
    },
    [NodeType.TaggedTemplateExpression](node, identifiers) {
      return from[NodeType.TemplateLiteral](node.quasi, identifiers, true);
    },
  };

  if (!from[node.type]) return;
  // if there is any className without any module identifier specified it will be added for each indentifier.
  let used = getClasses(from[node.type](node, identifiers));
  if (used.length) {
    Object.values(identifiers).forEach(classes => used.forEach(cl => classes.push(cl)));
  }
}
