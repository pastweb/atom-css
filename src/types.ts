export interface Options {
  scopeLength?: number;
  modules?: boolean;
  utility?: boolean | {
    mode?: 'readable' | 'semireadable' | 'coded';
    getUtilityModules?: (filePath: string, modules: Record<string, string>) => void;
    output?: boolean;
  };
  scopedCSSVariables?: boolean | string;
  getModules?: (filePath: string, modules: Record<string, string>) => void | Promise<void>;
};

export interface ResolvedUtilityOptions {
  mode: 'readable' | 'semireadable' | 'coded';
  getUtilityModules?: (filePath: string, modules: Record<string, string>) => void | Promise<void>;
  output: boolean;
}

export interface ResolvedOptions {
  scopeLength: number;
  modules: boolean;
  utility: boolean | ResolvedUtilityOptions;
  scopedCSSVariables: string;
  getModules: (filePath: string, modules: Record<string, string>) => void | Promise<void>;
};
