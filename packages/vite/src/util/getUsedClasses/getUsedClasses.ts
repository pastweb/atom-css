import { dirname, resolve } from 'node:path';
import * as acorn from 'acorn';
import { simple } from 'acorn-walk';
import { getSpecifierNames } from './getSpecifierNames';
import { getStrClasses } from './getStrClasses';
import { setClassNames } from './setClasses';
import { NodeType, ACORN_OPTIONS } from './constants';
import { CSS_LANGS_RE } from '../../constants';
import { UsedClasses, AstPlugin, AstPlugins, Node, AstFunction, UsedClassesResult } from './types';

export async function getUsedClasses(id: string, code: string, plugins: AstPlugin[], astPlugins: AstPlugins): Promise<void | UsedClassesResult> {
  const ast = acorn.parse(code, ACORN_OPTIONS);
  const classes: UsedClasses = {};
  const specifiers: { [frameworkName: string]: Set<string> } = {};
  const queue: Promise<any>[] = [];

  const runAstFunctions = (node: Node, astFn: { [name: string]: AstFunction }): void => {
    Object.entries(astFn).forEach(async ([ name, fn ]) => {
      if (!specifiers[name] || !specifiers[name].size) return;
      const response = fn(node, specifiers[name], id);

      if (response instanceof Promise) queue.push(response);
      
      const value = await response;

      if (!value) return;

      if (Array.isArray(value)) {
        const [ filePath, classesStr ] = value;
        
        if (!filePath || !classesStr) return;
        
        const cls = getStrClasses(classesStr);
        
        if (!cls.length) return;
        
        classes[filePath] = classes[filePath] || { classes: [] };
        cls.forEach(c => classes[filePath].classes.push(c));
      } else {
        setClassNames(value, classes);
      }
    });
  }

  const a = Object.entries(astPlugins).reduce((acc, [ type, astFn ]) => ({
    ...acc,
    ...type !== NodeType.ImportDeclaration ? { [type]: (node: Node) => runAstFunctions(node, astFn) } : {},
  }), {
    [NodeType.ImportDeclaration](node: Node) {
      const { value } = node.source;

      if (CSS_LANGS_RE.test(value)) {
        const dir = dirname(id);
        const fileName = resolve(dir, value);
        classes[fileName] = { identifiers: new Set(), classes: [] };
        
        if (node.specifiers) {
          node.specifiers.forEach((specifier: Node) => classes[fileName].identifiers.add(specifier.local));
        }

        return;
      }

      plugins.forEach(({ name, import: { source, specifier, defaultSpecifier } }) => {
        if (!source.test(value)) return;

        specifiers[name] = specifiers[name] || new Set<string>();
        const _specifiers = getSpecifierNames(node, specifier, defaultSpecifier);
        _specifiers.forEach(specifier => specifiers[name].add(specifier));
      });

      if (astPlugins[NodeType.ImportDeclaration]) runAstFunctions(node, astPlugins[NodeType.ImportDeclaration]);
    },
  } as any);

  simple(ast, a);

  if (!Object.keys(classes).length) return;

  if (queue.length) await Promise.all(queue);

  return Object.entries(classes).reduce((acc, [ id, { classes } ]) => ({ ...acc, [ id ]: classes }), {} as UsedClassesResult);
}
