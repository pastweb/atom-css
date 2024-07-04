import { dirname, resolve } from 'node:path';
import * as walk from 'acorn-walk';
import { setClassNames } from './setClasses';
import { NodeType } from './constants';
import { CSS_LANGS_RE } from '../../constants';
import type { Node } from 'acorn';
import { ImportDeclaration, ImportSpecifier, UsedClasses } from './types';
import { ModulesMap } from '../../types';

const frameworks: Record<string, (node: ImportDeclaration, functionNames: Set<string>) => void> = {
  react(node, functionNames) {
    const { value } = node.source;

    switch(value) {
      case 'react/jsx-runtime':
      case 'react/jsx-dev-runtime':
        node.specifiers.forEach(i => {
          const { name } = (i as ImportSpecifier).imported;
          if (!/jsx(s|DEV)?/.test(name)) return;
          functionNames.add((i as ImportSpecifier).local.name);
        });
      break;
      default :
      functionNames.add('createElement');
    }
  },
};

export function getUsedClasses(id: string, ast: Node, modulesMap: ModulesMap): void {
  const classes: UsedClasses = {};
  const functionNames: { [frameworkName: string]: { funcs: Set<string>, name: string; } } = {};

  walk.simple(ast, {
    [NodeType.ImportDeclaration](node: any) {
      const { value } = node.source;

      if (CSS_LANGS_RE.test(value)) {
        const [ specifier ] = node.specifiers;

        if (!specifier || specifier.type !== NodeType.ImportDefaultSpecifier) return;

        const { name: identifier } = specifier.local;
        const dir = dirname(id);
        const fileName = resolve(dir, value);
        classes[fileName] = { identifier, classes: [] };

        return;
      }

      const frameworkName = value.split('/')[0];

      if (!frameworks[frameworkName]) return;

      functionNames[frameworkName] = functionNames[frameworkName] || { name: frameworkName, funcs: new Set() };
      frameworks[frameworkName](node, functionNames[frameworkName].funcs);
    },
    [NodeType.CallExpression](node: any) {
      if (!Object.keys(classes).length) return;

      const { name: functionName } = node.callee;
      let frameworkName = '';

      for(const { name, funcs } of Object.values(functionNames)) {
        if (funcs.has(functionName)) {
          frameworkName = name;
          break;
        }
      }

      if (!frameworkName) return;

      const identifiers = Object.values(classes).reduce((acc, { identifier, classes}) => ({ ...acc, [identifier]: classes }), {});

      switch(frameworkName) {
        case 'react':
          const propsObj = node.arguments[1];

          setClassNames(propsObj, 'className', identifiers);
        break;
      }
    },
  });

  if (!Object.keys(classes).length) return;

  Object.entries(classes).forEach(([id, { classes }]) => {
    modulesMap[id] = modulesMap[id] || {};
    modulesMap[id].usedClasses = classes;
  });
}
