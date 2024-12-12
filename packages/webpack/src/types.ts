import { Options, UtilityOptions } from '@pastweb/atomic-css-postcss';
import { AstPlugin } from './util';
export type AtomicCssOptions = Omit<Options, 'test' | 'getModules' | 'utility' | 'usedClasses'> & {
  astPlugins?: AstPlugin[];
  usedClasses?: boolean;
  utility?: Omit<UtilityOptions, 'getUtilityModules' | 'output'>;
};

export type ResolvedCssUtilityOptions = Omit<AtomicCssOptions, 'astPlugins'> & Omit<Options, 'usedClasses'> & {
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
