# CSS Tools
A set of tools inspired to [CSS Modules] and [Tailwind] CSS framework.
* Reduce the css size nesting the selectors where convenient.
* Handle CSS modules.
* Scopes CSS variables.
* Calculate utilities on the fly and assign them in the CSS module object.

[postcss]: https://github.com/postcss/postcss
[css modules]: https://github.com/css-modules/css-modules
[tailwind]: https://github.com/tailwindlabs/tailwindcss

## Motivation
Both the tools names above are great, just the use of Tailwind can make the source code verbose and sometime hard to read and maintain.
This plugin try to bring the same idea reducing the CSS footprint using CSS utilities calculted at build time reading a standard CSS source code, and orgenise the class utilities in the CSS Module Object even keeping most of the CSS Modules functionalities.
This approach keep the functionalities agnostic in terms of the CSS framework used putting in the center just the CSS standard.
Also There are great CSS Frameworks out there quite largely used, such as [Bootstrap], [Bulma], [SemanticUI] and so on.
Use this plugin in addition to those CSS Frameworks will improve the CSS footprint without change your code base.
With css-tools you are the framework rock star 🤘😎🤘.

[bootstrap]: https://getbootstrap.com/docs/3.4/css/
[bulma]: https://bulma.io/
[semanticui]: https://semantic-ui.com/

## Summary
* Options
  * [test](#test)
  * [selectors](#selectors)
  * [scope](#scope)
    * [classNames](#classNames)
    * [Globals](#Globals)
    * [cssVariables](#cssVariables)
  * [getModules](#getModules)
  * [usedClasses](#usedClasses)
  * [utility](#utility)
    * [mode](#mode)
    * [getUtlityModules](#getUtlityModules)
* Plugins
  * [PostCSS](https://github.com/pastweb/css-tools/tree/master/packages/postcss)
  * [Vite](https://github.com/pastweb/css-tools/tree/master/packages/vite)

## Options
---
### test
The `test` option allow to select the files must be processed if specified, all the files will be processed othewise.
example:
```js
// options
{
  test: {
    include: /\.util\.css$/,
    exclude: /\.not\.util\.css$/,
  },
}
```
Both the `test` options (`include` and `exclude`) can accept as parameter a `RegExp`, a `string`, a `null` value or an array of them. In the example above all the files which ands with `.util.css` will be processed, except for the files ending with `.not.util.css`.

### selectors
The modern browsers supports the [nested selectors](https://developer.mozilla.org/en-US/docs/Web/CSS/Nesting_selector).
This option accept two values `nested` or `flat`, `nested` is the default value.
The `nested` option nests the selectors and flat them just where convenient in order to reduce the resultant css code output size.
Specially useful if you are using any css preprocessor, which flat all selectors.
The `flat` option is flats all selectors, in case your target is any browser which is not supporting the selector nesting.
example:
```js
// options
{
  selectors: 'flat', // or 'nested'
}
```

### scope
The suffix scope ID is calculated with a SHA-256 hash `8` characters long by default preceded form `_`, the key used is:
- the css code for the CSS Modules and `keyframes` names.
- "/" by default if `cssVariables` option is `true` or the string assigned to the option intead for the CSS variables.
- the CSS property `value` for the utilities in `semireadable` mode or `property` ad `value` form `coded` mode.

Using the first `8` characters of a SHA-256 hash provides 16^8 (approximately 4.3 billion) possible combinations. While this is a large number, it's not guaranteed to be unique in all cases, especially in scenarios with a massive number of files. For most practical purposes, this should be sufficient to avoid collisions, but it's important to consider the context in which the plugin is used.

If you want to increase the uniqueness without adding too much complexity, you could use a longer portion of the hash. However, for most applications, `8` characters are generally enough.

shorthand to increse the scope suffix ID:
```js
// Options
{
  scope: 10 // length or you can assign a scope configuration object
}
```
```js
// Options
{
  scope: {
    length: 10,
  },
}
```

### classNames
The scope ID suffix will be applied to all the classNames and keyframes names into the file.
It is possible assign a function `(className: string, filePath: string, css: string) => string` for customize the className, this will be used just for the classNames, in this case the suffix scope will be attached at the end of the returned string.
By default is `true`;
as example:
```js
// Options
{
  scope: {
    classNames: true,
  },
}
```
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

### Globals
Is possible using the CSS Module option to keep global (so without scope suffix) a class or an animation name.
You can use the syntax `:global(.className)` for the classes and `global(animationName)`
for the keyframes.
```css
:global(.title) { color: green; }
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
And the [getModules](#getModules) function give you a Module object for transformed classes:

```js
{
  'fade-in': 'fade-in_116zl1d3'
}
```

### cssVariables
The scope configuration object can contains a `cssVariables` option, which accept as value a `boolean`, a `string` or a configuration object.
These options handle the behaviour related to che CSS Variable scoping.
If `cssVariables` are set to `true`, a scope suffix will be added for the CSS variables declared in the `:root` selector using `/` by default as key for generate the the suffix ID with the current length.
If a `string` is assigned, this will be used as key for the suffix ID.

Configuration object example:

```js
// Options
{
  scope: {
    cssVariables: {
      key: '/' // by default - optional
      include: /^-[A-Z]+/, // optional
      exclude: /[a-z]$/ // optional
    },
  }
}
```
In the example above has been used the optional options `include` and `exclude` to filter the CSS variable names where apply the scope.

### getModules
The `getModules` option accept a `function` or an `async function` which get as parameters `modules` (an object with the className as key and the scoped className as value), and `filePath` (which is the full file path);
The function will be not called if `scope.classNames` and `utility` are set to `false`.
example:
```js
// options
{
  getModules: (modules, filepath) => {
    // do something
  },
}
```
Where the modules object will be something like:
```js
{
  'title': 'title_116zl1d3',
  'fade-in': 'fade-in_116zl1d3'
}
```
This function will be called if the `modules` and/or the `utility` options are set.
You can check [here](###utility) more  info about the `utility` option.

### usedClasses
Useful to redulce the CSS resultant code size.
This option accept a string array as value, where each string represent a regular expression of the classed used.
The unused classes (and keyframes) will be removed from the resultant CSS code.

### utility
The `utility` option accept as value a `true` or a configuration object where the `true` is a shorthend for dafault configuration.
```js
// options
{
  utility: {
    mode: 'readable', // by default, could be 'readable' | 'semireadable' | 'coded'
    atRules: { // all are true by default for process the @ rules
      container: true, 
      layer: true,
      media: true,
      scope: true,
      supports: true,
    },
    output: true, // by default, append the css utilites rules at the end of the file if true
  },
}
```
The utility functionality read the CSS properies and values decalsered in each class and for each declaration generate a
new CSS rule `.property-name[_value] { property-name: value; }`.
The property will be removed from the original CSS class rule and the utiliy className will be added to the Css module for that className.
Will be generated even a Css utility module you can obtain assigning by assigning a function for `getUtilityModules` option.

```js
// CSS module
{
  'class1': 'class1 property-name[_value]',
}
```
```js
// CSS utility module
{
  'property-name[_value]': '.property-name[_value] { property-name: value; }'
}
```

If the original don't contains any other property and any other selector, the class will be removed from the resultant CSS and from the CSS module value.
```css
/* CSS source */
.class1 {
  animation: 3s linear animationName;
}
```
```js
// CSS module
{
  'class1': 'animation[_3s_linear_animationName]',
}
```
```css
/* CSS result */
.animation[_3s_linear_animationName] { animation: 3s linear animationName; }
```
With nested selectors:
```css
/* CSS source */
.class1 {
  animation: 3s linear animationName;
  div { margin: 0; }
}
```
```js
// CSS module
{
  'class1': 'class1 animation[_3s_linear_animationName]',
}
```
```css
/* CSS result */
.class1 {
  div { margin: 0; }
}
.animation[_3s_linear_animationName] { animation: 3s linear animationName; }
```
### mode
In order to support a better DX and optimise teh CSS footprint, there are 3 differnt `mode` for the utility classNames generation:
- `readable`: the utility className will folow the syntax `property-name[_value]`, where the value is the CSS property value string with the replacement for any space, comma or dot using a single `-` as in the example above.
- `semireadable`: the className syntax will be `property-name[_116zl1d3]`, where the hash code will be calculated using the property value as key.
- `coded`: the className syntax will be `_a26fl1d4`, where the hash code will be calculated using the property name and value as key.

### getUtlityModules
For a more elastic usage as example, if the plugin want to be implemented in a bundle loader tool pligin such as [vite], [webpack] or [rspack],
is possible use in combination the `getUtilityModules` and `output` options for generate an utilities map and not having the utiliy classes in the resultant CSS code, giving the opportunity to implemet a more optimised logic for separate utiliies CSS code bundle generation using the Utility Modules.

[vite]: https://github.com/vitejs/vite
[webpack]: https://github.com/webpack/webpack
[rspack]: https://github.com/web-infra-dev/rspack

```js
// Options
{
  utility: {
    getUtilityModules(filePath, modules) { /** your logic */},
    output: false,
  }
}
```
```css
/* CSS source */
.class1 {
  animation: 3s linear animationName;
  div { margin: 0; }
}
```
```js
// CSS module
{
  'class1': 'class1 animation[_3s_linear_animationName]',
}
```
```js
// CSS utility module
{
  'animation[_3s_linear_animationName]': '.animation[_3s_linear_animationName] { animation: 3s linear animationName; }'
}
```
```css
/* CSS result */
.class1 {
  div { margin: 0; }
}
```

### Processed classNames
Of course we can expect a CSS class to be reused and modified for a specific selector. In this case only the calss with the less specific selector will be processed as example:
```css
/* CSS source */
.panel {
	background-color: white;

	.panel-box {
		padding: 1em;
		font-size: 1em;
	}

	.panel-header {
		background-color: grey;

		.panel-box { padding: 0.5em; }
	}
  
  .panel-footer {
		background-color: lightgrey;

		.panel-box { padding: 0.3em; }
	}
}
```
```js
// CSS module
{
  'panel': 'panel background-color[_white]',
	'panel-box': 'padding[_1em] font-size[_1em]',
	'panel-header': 'panel-header background-color[_grey]',
	'panel-footer': 'panel-footer background-color[_lightgrey]'
}
```
```js
// CSS utility module
{
  'background-color[_white]': '.background-color[_white] { background-color: white; }',
	'padding[_1em]': '.padding[_1em] { padding: 1em; }',
	'font-size[_1em]': '.font-size[_1em] { font-size: 1em; }',
	'background-color[_grey]': '.background-color[_grey] { background-color: grey; }',
	'background-color[_lightgrey]': '.background-color[_lightgrey] { background-color: lightgrey; }'
}
```
```css
/* CSS result */
.panel {
	.panel-header {
		.panel-box { padding: 0.5em; }
	}
  
  .panel-footer {
		.panel-box { padding: 0.3em; }
	}
}

.background-color[_white] { background-color: white; }
.padding[_1em] { padding: 1em; }
.font-size[_1em] { font-size: 1em; }
.background-color[_grey] { background-color: grey; }
.background-color[_lightgrey] { background-color: lightgrey; }
```
Utility classes will be generated even for vendor perfixes `--webkit-`, `--moz-`, `--ms-` and `--o-`.
Duplicated Properties for the same className at the same levell will be overwritten.
