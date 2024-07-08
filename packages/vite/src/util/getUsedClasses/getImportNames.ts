import { NodeType } from "./constants";

export function getImportNames(node: any, regexp: RegExp, defaultName?: string): string[] {
  const functions: string[] = [];

  for(const specifier of node.specifiers) {
    if (specifier.type === NodeType.ImportSpecifier && regexp.test(specifier.imported.name)) {
      functions.push(specifier.local.name);
    }
  }

  return functions.length ? functions : defaultName ? [ defaultName ] : [];
}
