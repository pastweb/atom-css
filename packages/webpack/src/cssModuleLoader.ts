import { basename, extname } from 'node:path';
import { AtomicCss } from './AtomicCss';
import { simple } from 'acorn-walk';
import { generate } from 'astring';
import { parseJs, NodeType, processCSS } from './util';

function getModulesCode(css: string, modules: Record<string, string>): string {
  return [
    '// Imports',
    'import ___CSS_LOADER_API_NO_SOURCEMAP_IMPORT___ from "css-loader/dist/runtime/noSourceMaps.js";',
    `import ___CSS_LOADER_API_IMPORT___ from "css-loader/dist/runtime/api.js";`,
    `var ___CSS_LOADER_EXPORT___ = ___CSS_LOADER_API_IMPORT___(___CSS_LOADER_API_NO_SOURCEMAP_IMPORT___);`,
    `// Module`,
    `___CSS_LOADER_EXPORT___.push([module.id, \`${css}\`, ""]);`,
    `// Exports`,
    `___CSS_LOADER_EXPORT___.locals = ${JSON.stringify(modules)};`,
    `export default ___CSS_LOADER_EXPORT___;`,
  ].join('\n');
}

function extractCss(content: string): string {
  const ast = parseJs(content);
  let css = '';
  
  simple(ast, {
    [NodeType.CallExpression](node: any) {
      if (node.callee.type !== NodeType.MemberExpression) return;
      if (!node.callee.object || node.callee.object.type !== NodeType.Identifier || node.callee.object.name !== '___CSS_LOADER_EXPORT___') return;
      if (!node.arguments || !node.arguments.length) return;

      const [ arg ] = node.arguments;

      if (arg.type !== NodeType.ArrayExpression) return;
      if (!arg.elements || !arg.elements.length) return;

      const template = arg.elements[1];

      if (!template || template.type !== NodeType.TemplateLiteral || !template.quasis || !template.quasis.length) return;
      const [ quasi ] = template.quasis;
      
      if (!quasi) return;

      css = quasi.value.cooked;
    },
  });

  return css;
}

function replaceCode(code: string, css: string, modules: Record<string, string>): string {
  const ast = parseJs(code);

  simple(ast, {
    [NodeType.CallExpression](node: any) {
      if (node.callee.type !== NodeType.MemberExpression) return;
      if (!node.callee.object || node.callee.object.type !== NodeType.Identifier || node.callee.object.name !== '___CSS_LOADER_EXPORT___') return;
      if (!node.arguments || !node.arguments.length) return;

      const [ arg ] = node.arguments;

      if (arg.type !== NodeType.ArrayExpression) return;
      if (!arg.elements || !arg.elements.length) return;

      const template = arg.elements[1];

      if (!template || template.type !== NodeType.TemplateLiteral || !template.quasis || !template.quasis.length) return;
      const [ quasi ] = template.quasis;
      
      if (!quasi) return;

      quasi.value.raw = css;
      quasi.value.cooked = css;
    },
  });

  const defaultExport = ast.body.pop();
  const [ moduleExport ] = parseJs(`___CSS_LOADER_EXPORT___.locals = ${JSON.stringify(modules)};`).body;
  ast.body = [ ...(ast.body as any), moduleExport, defaultExport ];

  return generate(ast, { comments: true });
}

const START_STR = `// Imports\nimport ___CSS_LOADER`;

export default async function cssModuleLoader(this: any, content: string) {
  const callback = this.async(); // Asynchronous handling
  const opts = AtomicCss.opts;
  const isCssLoader = content.startsWith(START_STR);
  const code = !isCssLoader ? content : extractCss(content);

  try {
    const filename = this.resourcePath;
    console.log('------------------ cssModuleLoader')
    console.log(filename)
    console.log(AtomicCss.modulesMap)
    console.log('----------------------------------')
    const { usedClasses } = AtomicCss.modulesMap[filename];
    const css = await processCSS(code, { ...opts, usedClasses }, filename);
    // Emit the transformed CSS as a separate file
    const cssOutputPath = basename(filename, extname(filename)) + '.css';
    this.emitFile(cssOutputPath, css);

    // Return the class map as a JavaScript module using dataToEsm
    const { modules = {} } = AtomicCss.modulesMap[filename];
    const modulesCode = isCssLoader ? replaceCode(content, css, modules) : getModulesCode(css, modules);

    callback(null, modulesCode);
  } catch (error) {
    callback(new Error(`Failed to process CSS in ${this.resourcePath}: ${error instanceof Error ? error.message : String(error)}`));
  }
}
