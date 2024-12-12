import { resolve } from 'node:path';
import { Compiler, EntryNormalized } from 'webpack';
import { AstPlugin, AstPlugins, resolveOptions } from './util';
import type { Options } from '@pastweb/atomic-css-postcss';
import { AtomicCssOptions, ModulesMap } from './types'; // Import your types
import { CSS_LANGS_RE } from './constants';

const PLUGIN_NAME = 'AtomicCss';

export class AtomicCss {
  private options: AtomicCssOptions;
  private isDevelopment: boolean = false;
  public static isHMR: boolean = false;
  public static isDefaultEntry: boolean = false;
  public static entriesPaths: Set<string> = new Set();
  public static opts: Options;
  public static usedClasses = true;
  public static astPlugins: AstPlugin[];
  public static resolvedAstPlugins: AstPlugins = {};
  public static modulesMap: ModulesMap = {};
  public static getUtilitiesCssCode = () => Object.values(Object.values(AtomicCss.modulesMap).reduce((acc, { utilities }) => ({ ...acc, ...utilities }), {})).join('\n');

  constructor(options: AtomicCssOptions = {}) {
    this.options = options;
  }

  apply(compiler: Compiler) {
    const { mode, devServer, entry } = compiler.options;
    this.isDevelopment = mode === 'development';
    AtomicCss.isHMR = this.isDevelopment && !!devServer;

    const {
      astPlugins: _astPlugins,
      usedClasses: _usedClasses,
      ...rest
    } = resolveOptions(this.options, AtomicCss.modulesMap, mode === 'development' ? 'development' : 'production');
    
    AtomicCss.opts = rest;
    AtomicCss.astPlugins = _astPlugins;
    AtomicCss.usedClasses = typeof _usedClasses !== 'undefined' ? _usedClasses : AtomicCss.usedClasses;

    _astPlugins.forEach(({ name, ast }) => {
      Object.entries(ast).forEach(([type, fn]) => {
        AtomicCss.resolvedAstPlugins[type] = AtomicCss.resolvedAstPlugins[type] || {};
        AtomicCss.resolvedAstPlugins[type][name] = fn;
      });
    });

    compiler.hooks.entryOption.tap(PLUGIN_NAME, (context: string, entries: EntryNormalized) => {
      const entriesPaths: string[] = Object.values(entries).reduce((acc, obj: any) => {
        const [ path ] = obj.import;
        
        if (path === './src') {
          AtomicCss.isDefaultEntry = true;
          return acc;
        }

        return [ ...acc as string[], resolve(context, path) ];
      }, [] as string[]) as string[];

      if (entriesPaths.length) {
        AtomicCss.entriesPaths = new Set(entriesPaths);
      }
    });

    if (this.isDevelopment  && AtomicCss.isHMR) {
      compiler.hooks.compilation.tap(PLUGIN_NAME, compilation => {
        compilation.hooks.processAssets.tap({
          name: PLUGIN_NAME,
          stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
        },
        assets => {
          const entriesName = Object.keys(compiler.options.entry); // Assume the first entry is the main entry
          entriesName.forEach(entryName => {
            const fileName = `${entryName}.js`;
            
            if (!compilation.assets[fileName]) return;
  
            const assetSource = compilation.assets[fileName].source();
  
            const newSource = [
              assetSource,
              ``,
              `const style = document.createElement('style');`,
              `style.id = 'atomic-css-utilities';`,
              `style.textContent = \`${AtomicCss.getUtilitiesCssCode().replace(/\\/g, '\\\\')}\`;`,
              `document.head.append(style);`
            ].join('\n');
  
            compilation.updateAsset(fileName, new compiler.webpack.sources.RawSource(newSource));
          });
        });
      });

      // Listen for file changes during the watch process
      compiler.hooks.watchRun.tapAsync(PLUGIN_NAME, (compilation, callback) => {
        const changedFiles: string[] = Array.from(compilation.modifiedFiles || []);

        for (const file of changedFiles) {
          if (CSS_LANGS_RE.test(file)) {
            // Find the Webpack Dev Server's HMR interface
            // const socket = (compilation.compiler as any).devServer?.socket;
            const socket = compiler.options.devServer && compiler.options.devServer.webSocketServer;
            
            if (!socket) {
              console.warn('[CssHotUpdatePlugin] HMR is not enabled.');
              break;
            }
            
            console.log('---------------------------------')
            console.log(socket)
            console.log('---------------------------------')
            // Use the HMR interface to send the update
            const clients = socket.clients || [];

            if (!clients.length) break;

            const css = AtomicCss.getUtilitiesCssCode();
            const update = JSON.stringify({ message: 'atomic-css:update-utility-css', css });

            clients.forEach((client: any) => {
              if (client.readyState === 1) {
                client.send(update);
              }
            });

            break;
          }
        }

        callback();
      });
    }

    compiler.hooks.emit.tapAsync(PLUGIN_NAME, async (compilation, callback) => {
      const utilitiesCss = AtomicCss.getUtilitiesCssCode();

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
