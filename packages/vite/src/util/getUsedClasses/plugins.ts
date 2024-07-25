import { NodeType } from "./constants";
import { getClassPropertyNode } from "./getClassPropertyNode";
import { AstPlugin } from "./types";

export const plugins: AstPlugin[] = [
  {
    name: 'preact',
    import: {
      source: /^preact\/?(jsx-runtime|jsx-dev-runtime)?/,
      specifier: /^createElement$|^jsx(s|DEV)?$/,
      defaultSpecifier: 'createElement',
    },
    ast: {
      [NodeType.CallExpression](node, specifiers) {
        if (!specifiers.has(node.callee.name)) return;

        return getClassPropertyNode(node.arguments[1], 'class');
      }
    },
  },
  {
    name: 'react',
    import: {
      source: /^react\/?(jsx-runtime|jsx-dev-runtime)?/,
      specifier: /^createElement$|^jsx(s|DEV)?$/,
      defaultSpecifier: 'createElement',
    },
    ast: {
      [NodeType.CallExpression](node, specifiers) {
        if (!specifiers.has(node.callee.name)) return;

        return getClassPropertyNode(node.arguments[1], 'className');
      }
    },
  },
  {
    name: 'vue',
    import: {
      source: /^vue$/,
      specifier: /^h$|^create(Element)?VNode$/,
    },
    ast: {
      [NodeType.CallExpression](node, specifiers) {
        if (!specifiers.has(node.callee.name)) return;

        return getClassPropertyNode(node.arguments[1], 'class');
      }
    },
  },
  {
    name: 'svelte',
    import: {
      source: /^svelte/,
      specifier: /toggle_class/,
    },
    ast: {
      [NodeType.AssignmentExpression](node) {
        if(node.left.type === NodeType.Identifier && /_class_value$/.test(node.left.name)) {
          return node.right;
        }
      },
      [NodeType.CallExpression](node, specifiers) {
        if (!specifiers.has(node.callee.name)) return;

        return node.arguments[1];
      }
    },
  },
];
