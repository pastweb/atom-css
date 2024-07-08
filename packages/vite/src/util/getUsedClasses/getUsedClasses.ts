import { dirname, resolve } from 'node:path';
import * as walk from 'acorn-walk';
import { getIdentifiers } from './getIdentifiers';
import { getClassPropertyNode } from './getClassPropertyNode';
import { setClassNames } from './setClasses';
import { plugins } from './plugins';
import { NodeType } from './constants';
import { CSS_LANGS_RE } from '../../constants';
import { UsedClasses } from './types';
import { ModulesMap } from '../../types';

export function getUsedClasses(id: string, ast: any, modulesMap: ModulesMap): void {
  const classes: UsedClasses = {};
  let frameworkName = '';
  const importNames: { [frameworkName: string]: { frameworkName: string, names: Set<string> } } = {};

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

      plugins.forEach(plugin => {
        if (!plugin.source.test(value)) return;
        
        const { name, getImportNames } = plugin;
        frameworkName = name;
        
        if (!getImportNames) return;

        importNames[name] = importNames[name] || { frameworkName, names: new Set<string>() };
        const specifierNames = getImportNames(node);
        specifierNames.forEach(specifier => importNames[name].names.add(specifier));
      });
    },
    [NodeType.TaggedTemplateExpression](node: any) {
      if (!Object.keys(classes).length) return;

      const importName = importNames[frameworkName].names.has(node.tag.name) ? node.tag.name : '';

      if (!importName) return;

      const identifiers = getIdentifiers(classes);
      setClassNames(node, identifiers);
    },
    [NodeType.AssignmentExpression](node: any) {
      if (!Object.keys(classes).length) return;

      let value: any;

      switch(frameworkName) {
        case 'svelte':
          if(node.left.type === NodeType.Identifier && /_class_value$/.test(node.left.name)) {
            value = node.right;
          }
        break;
      }
      
      if(!value) return;

      const identifiers = getIdentifiers(classes);
      setClassNames(value, identifiers);
    },
    [NodeType.CallExpression](node: any) {
      if (!Object.keys(classes).length) return;
      if (!importNames[frameworkName]) return;

      const importName = importNames[frameworkName].names.has(node.callee.name) ? node.callee.name : '';

      if (!importName) return;

      let value: any;

      switch(frameworkName) {
        case 'react':
          value = getClassPropertyNode(node.arguments[1], 'className');
          break;
        case 'preact':
        case 'vue':
          value = getClassPropertyNode(node.arguments[1], 'class');
        break;
        case 'svelte':
          value = node.arguments[1];
        break;
      }

      if (!value) return;
      
      const identifiers = getIdentifiers(classes);
      setClassNames(value, identifiers);
    },
  });

  if (!Object.keys(classes).length) return;

  Object.entries(classes).forEach(([id, { classes }]) => {
    modulesMap[id] = modulesMap[id] || {};
    modulesMap[id].usedClasses = classes;
  });
}
