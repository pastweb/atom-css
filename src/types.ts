export interface UtilityOptions {
  mode?: 'readable' | 'semireadable' | 'coded';
  media?: boolean;
  container?: boolean;
  output?: boolean;
  getUtilityModules?: (filePath: string, modules: Record<string, string>) => void;
};

export interface Options {
  scopeLength?: number;
  modules?: boolean;
  utility?: boolean | UtilityOptions;
  scopedCSSVariables?: boolean | string;
  getModules?: (filePath: string, modules: Record<string, string>) => void | Promise<void>;
};

export interface ResolvedUtilityOptions {
  mode: 'readable' | 'semireadable' | 'coded';
  media: boolean;
  container: boolean
  output: boolean;
  getUtilityModules?: (filePath: string, modules: Record<string, string>) => void | Promise<void>;
}

export interface ResolvedOptions {
  scopeLength: number;
  modules: boolean;
  utility: boolean | ResolvedUtilityOptions;
  scopedCSSVariables: string;
  getModules: (filePath: string, modules: Record<string, string>) => void | Promise<void>;
};
