export type ViteCssUtilityModulesOptions = {
  scopeLength?: number;
  mode?: 'readable' | 'semireadable' | 'coded';
  scopedCSSVariables?: boolean | string;
};

export type ModulesMap = {
  [ filePath: string ]: {
    modules?: Record<string, string>;
    utilities?: Record<string, string>;
    jsVarName?: string;
    importer?: string;
  };
};
