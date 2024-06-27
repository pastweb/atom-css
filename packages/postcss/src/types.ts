import { FilterPattern } from '@rollup/pluginutils';

export interface UtilityOptions {
  mode?: 'readable' | 'semireadable' | 'coded';
  media?: boolean;
  container?: boolean;
  output?: boolean;
  property?: {
    include?: FilterPattern,
    exclude?: FilterPattern,
  };
  value?: {
    include?: FilterPattern,
    exclude?: FilterPattern,
  }
  getUtilityModules?: (filePath: string, modules: Record<string, string>) => void;
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
  cssVariables?: boolean | string | VariablesOptions;
};

export interface ResolvedScopeOptions {
  length: number;
  cssVariables: ResolvedVariablesOptions;
};

export interface ResolvedUtilityOptions {
  mode: 'readable' | 'semireadable' | 'coded';
  media: boolean;
  container: boolean
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
  scope?: number | ScopeOptions;
  modules?: boolean;
  utility?: boolean | UtilityOptions;
  getModules?: (filePath: string, modules: Record<string, string>) => void | Promise<void>;
};

export interface ResolvedOptions {
  test: {
    include?: FilterPattern,
    exclude?: FilterPattern,
  };
  scope: ResolvedScopeOptions;
  modules: boolean;
  utility: boolean | ResolvedUtilityOptions;
  getModules: (filePath: string, modules: Record<string, string>) => void | Promise<void>;
};
