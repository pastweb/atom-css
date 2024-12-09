import { NodeType } from "./constants";

export function getClassPropertyNode(node: any, propName: string) {
  if (node.type !== NodeType.ObjectExpression) return;
  
  const [ valueNode ] = node.properties.filter(({ type, key }: any) => type === NodeType.Property && key.name === propName);
  
  if (valueNode) return valueNode.value;
}
