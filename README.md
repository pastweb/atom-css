# postcss-utility-modules
A [PostCSS] plugin inspired to [CSS Modules] and [Tailwind] CSS framework
for handle CSS modules, scoped CSS variables and utilities.

[postcss]: https://github.com/postcss/postcss
[css modules]: https://github.com/css-modules/css-modules
[tailwind]: https://github.com/tailwindlabs/tailwindcss

## Motivation
Both the tools names above are great, just the use of Tailwind can make the source code verbose and sometime hard to read.
This plugin try to bring the same idea reducing the CSS footprint using CSS utilities but calculted on the fly reading a standard
CSS source code, and orgenise the class utilities in the CSS Module Object even keeping most of the CSS Modules functionalities.

## install
```sh
$ npm i -D postcss-utility-modules
```

## Usage
```ts
import postcss from 'postcss';
import utilityModules, { Options } from 'postcss-utility-modules';

const fileName = 'my/file/name.css';
const cssInput = '...any css code here';
// Utility function to process CSS with the plugin
const processCSS = async (input: string, opts: Options = {}) => {
  const result = await postcss([ utilityModules(opts) ]).process(input, { from: fileName });
  return result.css;
};

const output = await processCSS(cssInput, { /** options */ });

console.log(output);
```

## Options
| PropName           |                                        type                                        | required | default       | Description                                                                                     |
|--------------------|:----------------------------------------------------------------------------------:|----------|---------------|-------------------------------------------------------------------------------------------------|
| baseUrl            |                                       string                                       |    no    |      "/"      | if `scopedCSSVariables` option is true, is used as a key to calculate the CSS variables suffix. |
| scopeLength        |                                       number                                       |    no    |       8       | the SHA-256 hash code length.                                                                   |
| modules            |                                       boolean                                      |    no    |     false     | enable the CSS modules giving a scope suffix for CSS classes and keyframes names.               |
| scopedCSSVariables |                                       boolean                                      |    no    |     false     | add a suffix to the CSS variables declared in the `:root` selector.                             |
| getModules         | function |    no    | noop function | function called giving the `filePath` and CSS `modules` Object as parameters and returns `void` or `Promise void`.                                     |

### Utility Options
| PropName          | type                                         | required | default       | Description                                                                             |
|-------------------|----------------------------------------------|----------|---------------|-----------------------------------------------------------------------------------------|
| className         | "readable" \| "semireadable" \| "coded"      |    no    |   "readable"  | the coding method for the utility classNames check the [Utility] section for more info. |
| getUtilityModules | function |    no    | noop function | function called giving the `filePath` and Utility `modules` Object as parameters, and returns `void` or `Promise void`.                         |
| output            | boolean                                      |    no    |      true     | prints the CSS utility classes in the final CSS string.                                 |

## Examples

### CSS Modules
For option `{ modules: true }`:

```css
.title { color: green; }
.title:hover { color: red; }

.fade-in { animation: 3s linear fadeIn, 3s ease-out 5s moveIn; }

@keyframes fadeIn { opacity: 1; }
@keyframes moveIn { margin-top: 100px; }
```

After the transformation it will become like this:

```css
.title_116zl1d3 { color: green; }
.title_116zl1d3:hover { color: red; }

.fade-in_116zl1d3 {
	animation: 3s linear fadeIn_116zl1d3, 3s ease-out 5s moveIn_116zl1d3;
}

@keyframes fadeIn_116zl1d3 { opacity: 1; }
@keyframes moveIn_116zl1d3 { margin-top: 100px; }
```

And the plugin will give you a Module object for transformed classes:

```js
{
	'title': 'title_116zl1d3',
	'fade-in': 'fade-in_116zl1d3'
}
```
### Global
Is possible using the CSS Module option to keep global (so without scope suffix) a class or an animation name.
You can use the syntax `:global .className` or `:global(.className)` for the classes and `global(animationName)`
for the keyframes.
```css
:global .title { color: green; }
.title:hover { color: red; }

.fade-in { animation: 3s linear global(fadeIn), 3s ease-out 5s moveIn; }

@keyframes fadeIn { opacity: 1; }
@keyframes moveIn { margin-top: 100px; }
```

After the transformation it will become like this:

```css
.title { color: green; }
.title:hover { color: red; }

.fade-in_116zl1d3 {
	animation: 3s linear fadeIn, 3s ease-out 5s moveIn_116zl1d3;
}

@keyframes fadeIn { opacity: 1; }
@keyframes moveIn_116zl1d3 { margin-top: 100px; }
```
And the plugin will give you a Module object for transformed classes:

```js
{
	'fade-in': 'fade-in_116zl1d3'
}
```

### Saving exported classes

By default, no any JSON file with exported classes will be placed next to corresponding CSS.
But you have a freedom to make everything you want with exported classes, just
use the `getModules` callback. For example, save data about classes into a corresponding JSON file:

```js
postcss([
	require("postcss-utility-modules")({
		getModules: function (filePath, modules) {
			var path = require("path");
			var cssName = path.basename(filePath, ".css");
			var jsonFileName = path.resolve("./build/" + cssName + ".json");
			fs.writeFileSync(jsonFileName, JSON.stringify(modules));
		},
	}),
]);
```

`getModules` may also return a `Promise`.

## Scope Suffix ID
The suffix ID is calculated with a SHA-256 hash 8 characters long, the key used is:

- the css code for the CSS Modules and `keyframes` names.
- the `baseUrl` option ("/" by default) for the CSS variables.
- the CSS property `value` for the utilities.

Using the first 8 characters of a SHA-256 hash provides 16^8 (approximately 4.3 billion) possible combinations. While this is a large number, it's not guaranteed to be unique in all cases, especially in scenarios with a massive number of files. For most practical purposes, this should be sufficient to avoid collisions, but it's important to consider the context in which the plugin is used.

If you want to increase the uniqueness without adding too much complexity, you could use a longer portion of the hash using the `scopeLength` option. However, for most applications, 8 characters are generally enough.

