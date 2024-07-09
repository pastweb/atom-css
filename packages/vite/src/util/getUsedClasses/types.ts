export interface Node {
  type: string;
  start: number;
  end: number;
  [x: string]: any;
};

export interface UsedClasses {
  [fileName: string]: {
    identifier?: string;
    classes: string[];
  };
};

export type AstFunction = (node: Node, specifiers: Set<string>, fileName: string) => void | Node | [string, string] | Promise<void | Node | [string, string]>;

export interface Plugin {
  name: string;
  import: {
    source: RegExp;
    specifier: RegExp;
    defaultSpecifier?: string;
  };
  ast: {
    [NodeType: string]: AstFunction;
  };
};

export type AstPlugins = Record<string, { [name: string]: AstFunction }>;
