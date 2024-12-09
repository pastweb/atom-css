# Atom CSS Plugin for PostCSS
A [PostCSS] plugin inspired to [CSS Modules] and [Tailwind] CSS framework.

[postcss]: https://github.com/postcss/postcss
[css modules]: https://github.com/css-modules/css-modules
[tailwind]: https://github.com/tailwindlabs/tailwindcss

Fore more info about tools and the options check the [Atom CSS](https://github.com/pastweb/atom-css/blob/master/README.md) page.

## install
```bash
npm i -D @pastweb/atom-css-postcss
```

## Usage
```ts
import postcss from 'postcss';
import { atomCss }, { type  Options } from '@pastweb/atom-css-postcss';

const fileName = 'my/file/name.css';
const cssInput = '...any css code here';
// Utility function to process CSS with the plugin
const processCSS = async (input: string, opts: Options = {}) => {
  const result = await postcss([ atomCss(opts) ]).process(input, { from: fileName });
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
import { atomCss } from '@pastweb/atom-css-postcss';
...
postcss([
  atomCss({
    getModules: function (filePath, modules) {
      var path = require("path");
      var cssName = path.basename(filePath, ".css");
      var jsonFileName = path.resolve("./build/" + cssName + ".json");
      fs.writeFileSync(jsonFileName, JSON.stringify(modules));
    },
  }),
]);
```
