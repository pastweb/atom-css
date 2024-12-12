import { AtomicCss } from './AtomicCss';
import { getUsedClasses } from './util';
import { JS_TYPES_RE, FRAMEWORK_TYPE, DEFAULT_ENTRY_RE } from './constants';

export default async function cssClassLoader(this: any, code: string) {
  const callback = this.async(); // Asynchronous handling 

  try {
    const filename = this.resourcePath;

    if (!AtomicCss.usedClasses || /node_modules/.test(filename) || (!JS_TYPES_RE.test(filename) && !FRAMEWORK_TYPE.test(filename))) {
      callback(null, code);
      return;
    }

    if (AtomicCss.isHMR && ((AtomicCss.isDefaultEntry && DEFAULT_ENTRY_RE.test(filename)) || AtomicCss.entriesPaths.has(filename))) {
      // const newCode = [
      //   code,
      //   ``,
      //   `if (module.hot) {`,
      //   `  module.hot.accept();`,
      //   ``,
      //   `  module.hot.apply(update => {`,
      //   `    if (update.message === 'atomic-css:update-utility-css') {`,
      //   `      const style = document.getElementById('atomic-css-utilities');`,
      //   `      style.textContent = update.css;`,
      //   `    }`,
      //   `  });`,
      //   `}`
      // ].join('\n');
      const newCode = [
        code,
        ``,
        `if (module.hot) {`,
        `  module.hot.accept();`,
        ``,
        `const waitForReady = (callback) => {
    if (module.hot.status() === 'ready') {
      callback();
    } else {
      const handler = (status) => {
        if (status === 'ready') {
          module.hot.removeStatusHandler(handler);
          callback();
        }
      };
      module.hot.addStatusHandler(handler);
    }
  };

  waitForReady(() => {
    module.hot.apply((err, updates) => {
      if (err) {
        console.error('[HMR] Apply failed:', err);
      } else {
       const style = document.getElementById('atomic-css-utilities');
        console.log('[HMR] Applied updates:', updates);
      }
    });
  });`,
        `}`
      ].join('\n');
      // const newCode = [
      //   code,
      //   ``,
      //   `if (module.hot) {`,
      //   `  module.hot.accept()`,
      //   `  console.log('module.hot', module.hot)`,
      //   `  // Hook into Webpack's custom HMR events`,
      //   `  module.hot.addStatusHandler((status) => {`,
      //   `  console.log('status', status)`,
      //   `    if (status === 'apply') {`,
      //   `      // Assuming the plugin sends an HMR update for the CSS utilities`,
      //   `      const updates = module.hot.data && module.hot.data.customUpdates;`,
      //   `      if (updates && updates['atomic-css:update-utility-css']) {`,
      //   `        const updatedCss = updates['atomic-css:update-utility-css'];`,
      //   `        const style = document.getElementById('atomic-css-utilities');`,
      //   `        style.textContent = updatedCss;`,
      //   `        console.log('[HMR] Updated utility CSS');`,
      //   `      }`,
      //   `    }`,
      //   `  });`,
      //   `}`,
      // ].join('\n');

      code = newCode
    }
    
    const usedClasses = await getUsedClasses(filename, code, AtomicCss.astPlugins, AtomicCss.resolvedAstPlugins) || {};

    if (!usedClasses) return callback(null, code);

    Object.entries(usedClasses).forEach(([ filePath, classes ]) => {
      AtomicCss.modulesMap[filePath] = AtomicCss.modulesMap[filePath] || {};
      AtomicCss.modulesMap[filePath].usedClasses = classes;
    });

    callback(null, code);
  } catch (error) {
    callback(new Error(`Failed to process Javascript in ${this.resourcePath}: ${error instanceof Error ? error.message : String(error)}`));
  }
}
