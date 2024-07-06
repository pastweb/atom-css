import { NodeType } from "./constants";

function getClasses(classes: string): string[] {
  return classes.trim().replace(/ +/g, ' ').split(' ').filter(c => c);
}

export function setClassNames(node: any, identifiers: Record<string, string[]>): void {
  const from: Record<string, (node: any, identifiers: Record<string, string[]>, getIdentifier?: boolean) => string> = {
    [NodeType.ArrayExpression]: (node, identifiers) => node.elements.map((e: any) => from[e.type] ? from[e.type](e, identifiers) : '').join(' '),
    [NodeType.BinaryExpression]: (node, identifiers) => {
      if (node.operator !== '+') return '';
      
      let value = from[node.left.type] ? from[node.left.type](node.left, identifiers) : '.*';
      value = `${value}${from[node.right.type] ? from[node.right.type](node.right, identifiers) : '.*'}`;
      value = value === '.*.*' ? '' : value;
  
      return value;
    },
    [NodeType.CallExpression]: (node, identifiers) => node.arguments.map((a: any) => from[a.type] ? from[a.type](a, identifiers) : '').join(' '),
    [NodeType.ConditionalExpression]: (node, identifiers) => {
      const { consequent, alternate } = node;
      let value = '';
      value = from[consequent.value.type] ? from[consequent.value.type](consequent.value, identifiers) : '';
      value = `${value}${from[alternate.value.type] ? `${value ? ' ': ''}${from[alternate.value.type](alternate.value, identifiers)}`: ''}`;
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
    [NodeType.ObjectExpression]: (node, identifiers) => {
      const { properties } = node;
      return properties.map((p: any) => from[p.type] ? from[p.type](p, identifiers) : '').join(' ');
    },
    [NodeType.Property]: (node: any, identifier) => from[node.key.type] ? from[node.key.type](node.key, identifier) : '',
    [NodeType.TemplateElement]: (node, _) => node.value.cooked,
    [NodeType.TemplateLiteral]: (node, identifiers) => {
      const { quasis, expressions } = node;
      let value = '';
  
      for (let i = 0; i < quasis.length; i++) {
        value = `${value}${quasis[i].value.cooked}`; // Add static part
        
        if (i < expressions.length) {
          value += `${value}${from[expressions[i].type] ? from[expressions[i].type](expressions[i], identifiers): ''}`;
        }
      }
  
      return value.replace(/ +/g, ' ');
    },
  
  };

  if (!from[node.type]) return;
  // if there is any className without any module identifier specified it will be added for each indentifier.
  let used = getClasses(from[node.type](node, identifiers));
  if (used.length) {
    Object.values(identifiers).forEach(classes => used.forEach(cl => classes.push(cl)));
  }
}
