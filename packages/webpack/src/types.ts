import { Options, UtilityOptions } from '../../postcss';
import { AstPlugin } from './util';

export type CssToolsOptions = Omit<Options, 'test' | 'getModules' | 'utility' | 'usedClasses'> & {
  astPlugins?: AstPlugin[];
  usedClasses?: boolean;
  utility?: Omit<UtilityOptions, 'getUtilityModules' | 'output'>;
};

export type ResolvedCssUtilityOptions = Omit<CssToolsOptions, 'astPlugins'> & Omit<Options, 'usedClasses'> & {
  astPlugins: AstPlugin[];
}

export interface ModuleData {
  isEntry: boolean;
  importedCss: Set<string>;
  css?: string;
  modules?: Record<string, string>;
  utilities?: Record<string, string>;
  usedClasses?: string[];
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
