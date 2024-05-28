export interface Options {
  baseUrl?: string;
  scopeLength?: number;
  modules?: boolean;
  utility?: boolean | {
    className?: 'readable' | 'semireadable' | 'coded';
    getUtilityModules?: (filePath: string, modules: Record<string, string>) => void;
    output?: boolean;
  };
  scopedCSSVariables?: boolean;
  getModules?: (filePath: string, modules: Record<string, string>) => void | Promise<void>;
};

export interface ResolvedUtilityOptions {
  className: 'readable' | 'semireadable' | 'coded';
  getUtilityModules?: (filePath: string, modules: Record<string, string>) => void | Promise<void>;
  output: boolean;
}

export interface ResolvedOptions {
  baseUrl: string;
  scopeLength: number;
  modules: boolean;
  utility: boolean | ResolvedUtilityOptions;
  scopedCSSVariables: boolean;
  getModules: (filePath: string, modules: Record<string, string>) => void | Promise<void>;
};
