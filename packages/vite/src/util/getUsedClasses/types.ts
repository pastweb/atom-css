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

export interface UsedClasses {
  [fileName: string]: {
    identifier: string;
    classes: string[];
  };
}
