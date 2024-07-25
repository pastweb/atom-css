# Vite plugin for CSS Tools
A [Vite] plugin inspired to [CSS Modules] and [Tailwind] CSS framework.

[vite]: https://github.com/vitejs/vite
[css modules]: https://github.com/css-modules/css-modules
[tailwind]: https://github.com/tailwindlabs/tailwindcss

* Redulce the css size nesting the selectors where convenient.
* Handle CSS modules.
* Scopes CSS variables.
* Calculate utilities on the fly and assign them in the CSS module object.
* Remove the unused classes.

Fore more info about tools and the options check the [CSS Tools](https://github.com/pastweb/css-tools) page.

## install
```bash
npm i -D @pastweb/vite-plugin-css-tools
```

## Usage
```js
import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import { cssTools } from '@pastweb/vite-plugin-css-tools';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    preact(), // or any other framework plugin
    cssTools({ ...options }),
  ],
})
```
## Summary
* [Options](#options)  
* [Limitations](#limitations)
* [astPlugins](#astPlugins)
* [usedClasses](#usedClasses)
* [utility](#utility)
  * [mode](#mode)

## Options
All options are available as described in the [documentation](https://github.com/pastweb/css-tools), less the `getModules`, `getUtilityModules` and `test` which are used internally in the vite plugin.
Also, `usedClasses` is a boolean in case you don't want to use the `astPlugins` in order to remove the unused classa from the css.

## AstPlugins
The `AstPlugin` is a plugin which read the javascript source file in order to exctract the classNames used in your source code.
This list o classes are later passes to `css-tools` in order to remove the unused classes from the resultant css code.
There are alredy internal plugins in order to provide this functionality for the most used Front End frameworks such as [react](https://github.com/facebook/react), [preact](https://github.com/preactjs/preact), [vue](https://github.com/vuejs) and [svelte](https://github.com/sveltejs/svelte).

You can check the [example](https://github.com/pastweb/css-tools/tree/master/packages/vite/examples/rimmel) for [rimmel](https://github.com/ReactiveHTML/rimmel).

astPlugin example:
```js
export default defineConfig({
  plugins: [
    cssTools({
      astPlugins: [
        {
          name: 'react',
          import: {
            source: /^react\/?(jsx-runtime|jsx-dev-runtime)?/,
            specifier: /^createElement$|^jsx(s|DEV)?$/,
            defaultSpecifier: 'createElement',
          },
          ast: {
            ['CallExpression'](node, specifiers) {
              if (!specifiers.has(node.callee.name)) return;

              const propsNode = node.arguments[1];
              
              if (propsNode.type !== 'ObjectExpression') return;
  
              const [ valueNode ] = node.properties.filter(({ key }) => key.name === 'className');
                
              if (valueNode) return valueNode.value;
            }
          },
        },
      ],
    }),
  ],
});
```
In the example above is described an astPlugin for react.
* `name`: the plugin name (it gets the framework name by convention);
* `import`: the import information needed to identify the the ast node (in the above example the react jsx or createEleemnt function) which will be passed the the ast function later.
  * `source`: is a regular expression for detect the framework import line.
  * `specifier`: is a regular expression for detect the function specifier/s which will be passed as second parameterr `Set<string>` to the ast function.
  * `defaultSpecifier`: is optional and is the default value to be used.
* `ast`: is an Object `Record<string, (node: Node, specifiers: Set<string>) => void | Node | [ string, string ] | Promise<void | Node | [ string, string ]>`.
How you can see the ast function can be an `async` function and it can returns `void` for no operation, an array `[ filePath, classNames ]` or the ast `Node` which represent the classes string.
Even the string composition are supported as like any class composition function like [clsx](https://github.com/lukeed/clsx) for react which follows this parameters syntax.
To analyze your code you can use [astexplorer](https://astexplorer.net/) selecting `acorn` as ast standard;

## Limitations
To be able to process the css you need to import the css file in the js file even if you are using a SFC framework.
The css declared inside the tag `<style>` of a single file component will be not processed.
example:

```vue
<script setup lang="ts">
  import classes from './Panel.module.css';
</script>

<template>
  <div :class="classes.Panel">
    <div :class="classes['panel-header']">
      <div :class="classes['panel-box']">
        this is the Panel Header
      </div>
    </div>
    this is the content
    <div :class="classes['panel-footer']">
      <div :class="classes['panel-box']">
        this is the panel footer
      </div>
    </div>
  </div>
</template>
```