import { NodeType } from "./constants";

export interface ImportDefaultSpecifier {
  type: NodeType.ImportDefaultSpecifier;
  start: number;
  end: number;
  local: {
    type: NodeType.Identifier;
    start: number;
    end: number;
    name: string;
  };
};

export interface ImportSpecifier {
  type: NodeType.ImportSpecifier;
  start: number;
  end: number;
  imported: {
    type: NodeType.Identifier;
    start: number;
    end: number;
    name: string;
  };
  local: {
    type: NodeType.Identifier;
    start: number;
    end: number;
    name: string;
  };
};

export interface ImportDeclaration {
  type: NodeType.ImportDeclaration;
  start: number;
  end: number;
  specifiers: (ImportSpecifier | ImportDefaultSpecifier)[];
  source: {
    type: NodeType.Literal;
    start: number;
    end: number;
    value: string;
    raw: string;
  };
};

export interface UsedClasses {
  [fileName: string]: {
    identifier: string;
    classes: string[];
  };
}
