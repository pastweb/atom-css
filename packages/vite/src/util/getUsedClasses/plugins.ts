import { getImportNames } from "./getImportNames";
import { Plugin } from "./types";

export const plugins: Plugin[] = [
  {
    name: 'lit',
    source: /^lit$/,
    getImportNames: (node: any) => getImportNames(node, /^html$/),
  },
  {
    name: 'preact',
    source: /^preact\/?(jsx-runtime|jsx-dev-runtime)?/,
    getImportNames: (node: any) => getImportNames(node, /^createElement$|^jsx(s|DEV)?$/, 'createElement'),
  },
  {
    name: 'react',
    source: /^react\/?(jsx-runtime|jsx-dev-runtime)?/,
    getImportNames: (node: any) => getImportNames(node, /^createElement$|^jsx(s|DEV)?$/, 'createElement'),
  },
  {
    name: 'vue',
    source: /^vue$/,
    getImportNames: (node: any) => getImportNames(node, /^h$|^create(Element)?VNode$/),
  },
  {
    name: 'svelte',
    source: /^svelte/,
    getImportNames: (node: any) => getImportNames(node, /toggle_class/),
  },
];
