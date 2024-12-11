import { NodeType } from "./constants";

export function getSpecifierNames(node: any, regexp: RegExp, defaultName?: string): string[] {
  const specifiers: string[] = [];

  for(const specifier of node.specifiers) {
    if (
      specifier.type === NodeType.ImportSpecifier && regexp.test(specifier.imported.name) ||
      specifier.type === NodeType.ImportDefaultSpecifier && regexp.test(specifier.local.name)
    ) {
      specifiers.push(specifier.local.name);
    }
  }

  return specifiers.length ? specifiers : defaultName ? [ defaultName ] : [];
}
