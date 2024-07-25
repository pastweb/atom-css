import postcss from 'postcss';
import { postCssTools } from '../../src';
import { Options } from '../../src/types';

const DEFAULT_OPTIONS = {
  scope: { classNames: false },
  utility: false,
};
// Utility function to process CSS with the plugin
const processCSS = async (input: string, opts: Options = {}) => {
  const result = await postcss([ postCssTools({ ...DEFAULT_OPTIONS, ...opts}) ]).process(input, { from: undefined });
  return result.css;
};

describe('css-tools - selectors', () => {
  it('should nest flat selectors correctly', async () => {
    const input = `.class1 { color: red; background-color: white; }.class1 .class2 { color: blue; }`;
    const expectedOutput = `.class1 { color: red; background-color: white;.class2 { color: blue; } }`;

    const output = await processCSS(input);

    expect(output).toBe(expectedOutput);
  });

  it('should nest flat selectors correctly if needed', async () => {
    const input = `.class1 { color: red; background-color: white; }.class1 .class2 { &.class3 { color: blue; } }`;
    const expectedOutput = `.class1 { color: red; background-color: white;.class2.class3 { color: blue } }`;

    const output = await processCSS(input);

    expect(output).toBe(expectedOutput);
  });

  it('should nest even flat root media queries selectors correctly', async () => {
    const input = `.class1 { color: red; background-color: white; }.class1 .class2 { color: blue; }@media screen and (min-width: 30em) and (orientation: landscape) { .class1 { width: 50px; }.class1 .class2 { color: green; } }`;
    const expectedOutput = `.class1 { color: red; background-color: white;.class2 { color: blue; } }@media screen and (min-width: 30em) and (orientation: landscape) { .class1 { width: 50px;.class2 { color: green; } } }`;

    const output = await processCSS(input);

    expect(output).toBe(expectedOutput);
  });

  it('should flat root and media queries selectors correctly', async () => {
    const input = `.class1 { color: red; background-color: white;.class2 { color: blue; } }@media screen and (min-width: 30em) and (orientation: landscape) { .class1 { .class2 { color: green; } } }`;
    const expectedOutput = `.class1 { color: red; background-color: white }.class1 .class2 { color: blue; }@media screen and (min-width: 30em) and (orientation: landscape) { .class1 .class2 { color: green; } }`;

    const output = await processCSS(input, { selectors: 'flat' });

    expect(output).toBe(expectedOutput);
  });
  
  it('should flat root and media queries selectors correctly', async () => {
    const input = `.Panel { color: black; background-color: white; @media screen and (min-width: 30em) and (orientation: landscape) { .class1 { width: 50px;.class2 { color: green; } } }.panel-box { padding: 1em; font-size: 1em;}.panel-header { background-color: grey;.panel-box { padding: 0.5em; } }.panel-footer { background-color: lightgrey;.panel-box { padding: 0.3em; } } }@media screen and (min-width: 30em) and (orientation: landscape) { .class1 { width: 50px;.class2 { color: green; } } }`;
    const expectedOutput = `.Panel { color: black; background-color: white; @media screen and (min-width: 30em) and (orientation: landscape) { .class1 { width: 50px;.class2 { color: green; } } }.panel-box { padding: 1em; font-size: 1em;}.panel-header { background-color: grey;.panel-box { padding: 0.5em; } }.panel-footer { background-color: lightgrey;.panel-box { padding: 0.3em; } } }@media screen and (min-width: 30em) and (orientation: landscape) { .class1 { width: 50px;.class2 { color: green; } } }`;

    const output = await processCSS(input);
    expect(output).toBe(expectedOutput);
  });
});
