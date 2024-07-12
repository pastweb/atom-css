import { Options, UtilityOptions } from '../../postcss';
import { AstPlugin } from './util';

export type CssUtilityOptions = Omit<Options, 'test' | 'getModules' | 'utility' | 'usedClasses'> & {
  astPlugins?: AstPlugin[];
  utility?: Omit<UtilityOptions, 'getUtilityModules' | 'output'>;
};

export type ResolvedCssUtilityOptions = Omit<CssUtilityOptions, 'astPlugins'> & Omit<Options, 'usedClasses'> & {
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
