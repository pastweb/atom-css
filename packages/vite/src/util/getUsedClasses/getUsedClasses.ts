import { dirname, resolve } from 'node:path';
import * as walk from 'acorn-walk';
import { setClassNames } from './setClasses';
import { NodeType } from './constants';
import { CSS_LANGS_RE } from '../../constants';
import { UsedClasses } from './types';
import { ModulesMap } from '../../types';

function getCreateFuncNames(node: any, regexp: RegExp, defaultName?: string): string[] {
  const functions: string[] = [];

  for(const specifier of node.specifiers) {
    if (specifier.type === NodeType.ImportSpecifier && regexp.test(specifier.imported.name)) {
      functions.push(specifier.local.name);
    }
  }

  return functions.length ? functions : defaultName ? [ defaultName ] : [];
}

function getClassPropertyNode(node: any, propName: string) {
  if (node.type !== NodeType.ObjectExpression) return;
  
  const [ valueNode ] = node.properties.filter(({ key }: any) => key.name === propName);
  
  if (valueNode) return valueNode.value;
}

const frameworks = [
  {
    name: 'react',
    source: /^react\/?(jsx-runtime|jsx-dev-runtime)?/,
    getFunctionNames(node: any) : string[] {
      const regexp = /^createElement$|^jsx(s|DEV)?$/;
      return getCreateFuncNames(node, regexp, 'createElement');
    }
  },
  {
    name: 'vue',
    source: /^vue$/,
    getFunctionNames(node: any) : string[] {
      const regexp = /^h$|^create(Element)?VNode$/;
      return getCreateFuncNames(node, regexp);
    }
  },
  {
    name: 'svelte',
    source: /^svelte/,
    getFunctionNames(node: any) : string[] {
      const regexp = /toggle_class/;
      return getCreateFuncNames(node, regexp);
    },
  },
];

export function getUsedClasses(id: string, ast: any, modulesMap: ModulesMap): void {
  const classes: UsedClasses = {};
  let frameworkName = '';
  const functionNames: { [frameworkName: string]: { funcs: Set<string>, name: string; } } = {};
  const getIdentifiers = () => Object.values(classes).reduce((acc, { identifier, classes }) => ({ ...acc, [identifier]: classes }), {});

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

      frameworks.forEach(f => {
        if (!f.source.test(value)) return;
        
        const { name, getFunctionNames } = f;
        frameworkName = name;
        
        if (!getFunctionNames) return;
        functionNames[name] = functionNames[name] || { name, funcs: new Set<string>() };
        const funcNames = getFunctionNames(node);
        funcNames.forEach(f => functionNames[name].funcs.add(f));
      });
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

      const identifiers = getIdentifiers();
      setClassNames(value, identifiers);
    },
    [NodeType.CallExpression](node: any) {
      if (!Object.keys(classes).length) return;
      if (!functionNames[frameworkName]) return;

      const functionName = functionNames[frameworkName].funcs.has(node.callee.name) ? node.callee.name : '';

      if (!functionName) return;

      const identifiers = getIdentifiers();

      let value: any;

      switch(frameworkName) {
        case 'react':
        case 'preact':
          value = getClassPropertyNode(node.arguments[1], 'className');
        break;
        case 'vue':
          value = getClassPropertyNode(node.arguments[1], 'class');
        break;
        case 'svelte':
          value = node.arguments[1];
        break;
      }

      if (value) setClassNames(value, identifiers);
    },
  });

  if (!Object.keys(classes).length) return;

  Object.entries(classes).forEach(([id, { classes }]) => {
    modulesMap[id] = modulesMap[id] || {};
    modulesMap[id].usedClasses = classes;
  });
}
