# PostCSS plugin for CSS Utility Modules
A [PostCSS] plugin inspired to [CSS Modules] and [Tailwind] CSS framework
for handle CSS modules, scoped CSS variables and utilities.

[postcss]: https://github.com/postcss/postcss
[css modules]: https://github.com/css-modules/css-modules
[tailwind]: https://github.com/tailwindlabs/tailwindcss

Fore more info about the tool and the options check the [CSS Utility Modules](https://github.com/pastweb/css-utility-modules/blob/master/README.md) page.

## install
```bash
npm i -D postcss-utility-modules
```

## Usage
```ts
import postcss from 'postcss';
import { postcssUtlityModules }, { Options } from 'postcss-utility-modules';

const fileName = 'my/file/name.css';
const cssInput = '...any css code here';
// Utility function to process CSS with the plugin
const processCSS = async (input: string, opts: Options = {}) => {
  const result = await postcss([ postcssUtlityModules(opts) ]).process(input, { from: fileName });
  return result.css;
};

const output = await processCSS(cssInput, { /** options */ });

console.log(output);
```

### Saving exported classes

By default, no any JSON file with exported classes will be placed next to corresponding CSS.
But you have a freedom to make everything you want with exported classes, just
use the `getModules` callback. For example, save data about classes into a corresponding JSON file:

```js
import { postcssUtlityModules } from 'postcss-utility-modules';
...
postcss([
  postcssUtlityModules({
    getModules: function (filePath, modules) {
      var path = require("path");
      var cssName = path.basename(filePath, ".css");
      var jsonFileName = path.resolve("./build/" + cssName + ".json");
      fs.writeFileSync(jsonFileName, JSON.stringify(modules));
    },
  }),
]);
```
