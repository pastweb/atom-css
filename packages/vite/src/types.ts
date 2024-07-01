import { Options, UtilityOptions } from '../../postcss';

export type ViteCssUtilityModulesOptions = Omit<Options, 'test' | 'getModules' | 'utility'> & {
  utility?: Omit<UtilityOptions, 'getUtilityModules' | 'output'>;
};

export interface ModuleData {
  isEntry: boolean;
  importedCss: Set<string>;
  css?: string;
  modules?: Record<string, string>;
  utilities?: Record<string, string>;
  jsVarName?: string;
  importer?: string;
}

export type ModulesMap = {
  [ filePath: string ]: ModuleData;
};

export interface ImporterData {
  id: string;
  isEntry?: boolean;
  importedCss: Set<string>;
};
