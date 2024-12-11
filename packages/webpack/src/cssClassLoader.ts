import { CssTools } from './CssTools';
import { getUsedClasses } from './util';
import { JS_TYPES_RE, FRAMEWORK_TYPE } from './constants';

export default async function cssClassLoader(this: any, code: string) {
  const callback = this.async(); // Asynchronous handling 

  try {
    const filename = this.resourcePath;

    if (!CssTools.usedClasses || /node_modules/.test(filename) || (!JS_TYPES_RE.test(filename) && !FRAMEWORK_TYPE.test(filename))) {
      callback(null, code);
      return;
    }
    
    const usedClasses = await getUsedClasses(filename, code, CssTools.astPlugins, CssTools.resolvedAstPlugins) || {};

    if (!usedClasses) return callback(null, code);

    Object.entries(usedClasses).forEach(([ filePath, classes ]) => {
      CssTools.modulesMap[filePath] = CssTools.modulesMap[filePath] || {};

      // if (isHMR && modulesMap[filePath].usedClasses && (JSON.stringify(classes) !== JSON.stringify(modulesMap[filePath].usedClasses))) {
      //   const cssModule = server.moduleGraph.getModuleById(filePath);
        
      //   if (!cssModule) return;
        
      //   server.moduleGraph.invalidateModule(cssModule);
      //   server.ws.send({
      //     type: 'full-reload',
      //     path: filePath,
      //   });
      // }

      CssTools.modulesMap[filePath].usedClasses = classes;
    });

    callback(null, code);
  } catch (error) {
    callback(new Error(`Failed to process Javascript in ${this.resourcePath}: ${error instanceof Error ? error.message : String(error)}`));
  }
}
