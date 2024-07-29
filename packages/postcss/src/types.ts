import { FilterPattern } from '@rollup/pluginutils';

export interface UtilityOptions {
  mode?: 'readable' | 'semireadable' | 'encoded';
  atRules?: {
    container?: boolean;
    layer?: boolean;
    media?: boolean;
    scope?: boolean;
    supports?: boolean;
  };
  output?: boolean;
  property?: {
    include?: FilterPattern,
    exclude?: FilterPattern,
  };
  value?: {
    include?: FilterPattern,
    exclude?: FilterPattern,
  }
  getUtilityModules?: (filePath: string, modules: Record<string, string>) => void | Promise<void>;
};

export interface VariablesOptions {
  key?: string;
  include?: FilterPattern,
  exclude?: FilterPattern,
};

export interface ResolvedVariablesOptions {
  key: string;
  include?: FilterPattern,
  exclude?: FilterPattern,
};

export interface ScopeOptions {
  length?: number;
  classNames?: boolean | ((ClassName: string, filePath: string, css: string) => string);
  cssVariables?: boolean | string | VariablesOptions;
};

export interface ResolvedScopeOptions {
  length: number;
  classNames: boolean | ((className: string, filePath: string, css: string) => string);
  cssVariables: ResolvedVariablesOptions;
};

export interface ResolvedUtilityOptions {
  mode: 'readable' | 'semireadable' | 'encoded';
  atRules: {
    container: boolean;
    layer: boolean;
    media: boolean;
    scope: boolean;
    supports: boolean;
  };
  output: boolean;
  property?: {
    include?: FilterPattern,
    exclude?: FilterPattern,
  };
  value?: {
    include?: FilterPattern,
    exclude?: FilterPattern,
  }
  getUtilityModules?: (filePath: string, modules: Record<string, string>) => void | Promise<void>;
};

export interface Options {
  test?: {
    include?: FilterPattern,
    exclude?: FilterPattern,
  };
  selectors?: 'flat' | 'nested';
  scope?: number | ScopeOptions;
  usedClasses?: string[];
  utility?: boolean | UtilityOptions;
  getModules?: (filePath: string, modules: Record<string, string>) => void | Promise<void>;
};

export interface ResolvedOptions {
  test: {
    include?: FilterPattern,
    exclude?: FilterPattern,
  };
  selectors: 'flat' | 'nested';
  scope: ResolvedScopeOptions;
  usedClasses?: RegExp[];
  utility: boolean | ResolvedUtilityOptions;
  getModules: (filePath: string, modules: Record<string, string>) => void | Promise<void>;
};
