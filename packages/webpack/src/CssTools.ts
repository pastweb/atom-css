import { Compilation, Compiler } from 'webpack';
import { AstPlugin, AstPlugins, resolveOptions } from './util';
import type { Options } from '@pastweb/postcss-tools';
import { CssToolsOptions, ModulesMap } from './types'; // Import your types

const PLUGIN_NAME = 'CssTools';

export class CssTools {
  private options: CssToolsOptions;
  private isDevelopment: boolean = false;
  public static opts: Options;
  public static usedClasses = true;
  public static astPlugins: AstPlugin[];
  public static resolvedAstPlugins: AstPlugins = {};
  public static modulesMap: ModulesMap = {};
  public static getUtilitiesCssCode = () => Object.values(Object.values(CssTools.modulesMap).reduce((acc, { utilities }) => ({ ...acc, ...utilities }), {})).join('\n');

  constructor(options: CssToolsOptions = {}) {
    this.options = options;
  }

  apply(compiler: Compiler) {
    const { mode } = compiler.options;
    this.isDevelopment = mode === 'development';

    compiler.hooks.beforeCompile.tapAsync(PLUGIN_NAME, (params, callback) => {
      // Initialize the shared modulesMap
      CssTools.modulesMap = {};
      
      const {
        astPlugins: _astPlugins,
        usedClasses: _usedClasses,
        ...rest
      } = resolveOptions(this.options, CssTools.modulesMap, mode === 'development' ? 'development' : 'production');
      
      CssTools.opts = rest;
      CssTools.astPlugins = _astPlugins;
      CssTools.usedClasses = typeof _usedClasses !== 'undefined' ? _usedClasses : CssTools.usedClasses;

      _astPlugins.forEach(({ name, ast }) => {
        Object.entries(ast).forEach(([type, fn]) => {
          CssTools.resolvedAstPlugins[type] = CssTools.resolvedAstPlugins[type] || {};
          CssTools.resolvedAstPlugins[type][name] = fn;
        });
      });

      callback();
    });

    compiler.hooks.compilation.tap(PLUGIN_NAME, compilation => {
      compilation.hooks.processAssets.tap({
        name: PLUGIN_NAME,
        stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
      },
      assets => {
        if (!this.isDevelopment) return;
        
        const entriesName = Object.keys(compiler.options.entry); // Assume the first entry is the main entry
        entriesName.forEach(entryName => {
          const fileName = `${entryName}.js`;
          
          if (!compilation.assets[fileName]) return;

          const assetSource = compilation.assets[fileName].source();

          const newSource = [
            assetSource,
            ``,
            `if (module.hot) {`,
            `  module.hot.accept();`,
            `  const style = document.createElement('style');`,
            `  style.id = 'css-tools-utilities';`,
            `  document.head.append(style);`,
            ``,
            `  module.hot.apply(update => {`,
            `    if (update.message === 'update-utility-css') {`,
            `      style.textContent = update.css;`,
            `    }`,
            `  });`,
            `}`
          ].join('\n');

          compilation.updateAsset(fileName, new compiler.webpack.sources.RawSource(newSource));
        });
      });
    });

    compiler.hooks.emit.tapAsync(PLUGIN_NAME, async (compilation, callback) => {
      const utilitiesCss = CssTools.getUtilitiesCssCode();

      if (utilitiesCss) {
        // Find the first CSS output file
        const cssFileName = Object.keys(compilation.assets).find((filename) => filename.endsWith('.css'));
        
        if (cssFileName) {
          const existingCss = compilation.assets[cssFileName].source().toString();
          const updatedCss = `${existingCss}\n${utilitiesCss}`;

          // Replace the asset with the new CSS content
          compilation.assets[cssFileName] = {
            source: () => updatedCss,
            size: () => Buffer.byteLength(updatedCss, 'utf8'),
          } as any;

          console.log(`[${PLUGIN_NAME}] Appended utilities CSS to: ${cssFileName}`);
        }
      }

      callback();
    });
  }
}
