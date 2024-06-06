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
}

export interface Options {
  scopeLength?: number;
  modules?: boolean;
  utility?: boolean | UtilityOptions;
  scopedCSSVariables?: boolean | string | VariablesOptions;
  getModules?: (filePath: string, modules: Record<string, string>) => void | Promise<void>;
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
}

export interface ResolvedVariablesOptions {
  key: string;
  include?: FilterPattern,
  exclude?: FilterPattern,
}

export interface ResolvedOptions {
  scopeLength: number;
  modules: boolean;
  utility: boolean | ResolvedUtilityOptions;
  scopedCSSVariables: ResolvedVariablesOptions;
  getModules: (filePath: string, modules: Record<string, string>) => void | Promise<void>;
};
