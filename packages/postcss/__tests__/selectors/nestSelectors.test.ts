import postcss, { PluginCreator } from 'postcss';
import { nestSelectors } from '../../src/utils';

const plugin: PluginCreator<void> = () => {
  return {
    postcssPlugin: 'postcss-nest-selectors',
    async Once(root) {
      nestSelectors(root);
    },
  };
};

plugin.postcss = true;

const processCSS = async (input: string) => {
  const result = await postcss([ plugin ]).process(input, { from: undefined });
  return result.css;
};

describe('atomic-css - nestSelectors', () => {
  it('should nest root selectors correctly', async () => {
    const input = `.Panel { color: black; background-color: white; }.Panel .panel-box { padding: 1em; font-size: 1em;}.Panel .panel-header { background-color: grey; }.Panel .panel-header .panel-box { padding: 0.5em; }.Panel .panel-footer { background-color: lightgrey; }.Panel .panel-footer .panel-box { padding: 0.3em; }`;
    const expectedOutput = `.Panel { color: black; background-color: white;.panel-box { padding: 1em; font-size: 1em;}.panel-header { background-color: grey;.panel-box { padding: 0.5em; } }.panel-footer { background-color: lightgrey;.panel-box { padding: 0.3em; } } }`;

    const output = await processCSS(input);
    expect(output).toBe(expectedOutput);
  });

  it('should nest internal selectors correctly', async () => {
    const input = `.Panel { color: black; background-color: white;.panel-box { padding: 1em; font-size: 1em;}.panel-header .panel-box { padding: 0.5em; }.panel-header { background-color: grey; }.panel-footer { background-color: lightgrey; }.panel-footer .panel-box { padding: 0.3em; } }`;
    const expectedOutput = `.Panel { color: black; background-color: white;.panel-box { padding: 1em; font-size: 1em;}.panel-header { background-color: grey;.panel-box { padding: 0.5em; } }.panel-footer { background-color: lightgrey;.panel-box { padding: 0.3em; } } }`;

    const output = await processCSS(input);
    expect(output).toBe(expectedOutput);
  });

  it('should not nest selectors with comma', async () => {
    const input = `.Panel { color: black; background-color: white;.panel-box { padding: 1em; font-size: 1em;}.panel-header .panel-box { padding: 0.5em; }.panel-header { background-color: grey; }.panel-footer { background-color: lightgrey; }.panel-footer .panel-box { padding: 0.3em; } }.Panel, panel-box { border: 1px solid; }`;
    const expectedOutput = `.Panel { color: black; background-color: white;.panel-box { padding: 1em; font-size: 1em;}.panel-header { background-color: grey;.panel-box { padding: 0.5em; } }.panel-footer { background-color: lightgrey;.panel-box { padding: 0.3em; } } }.Panel, panel-box { border: 1px solid; }`;

    const output = await processCSS(input);
    expect(output).toBe(expectedOutput);
  });

  it('should nest root media query selectors correctly', async () => {
    const input = `.Panel { color: black; background-color: white; }.Panel .panel-box { padding: 1em; font-size: 1em;}.Panel .panel-header { background-color: grey; }.Panel .panel-header .panel-box { padding: 0.5em; }.Panel .panel-footer { background-color: lightgrey; }.Panel .panel-footer .panel-box { padding: 0.3em; }@media screen and (min-width: 30em) and (orientation: landscape) { .class1 { width: 50px; }.class1 .class2 { color: green; } }`;
    const expectedOutput = `.Panel { color: black; background-color: white;.panel-box { padding: 1em; font-size: 1em;}.panel-header { background-color: grey;.panel-box { padding: 0.5em; } }.panel-footer { background-color: lightgrey;.panel-box { padding: 0.3em; } } }@media screen and (min-width: 30em) and (orientation: landscape) { .class1 { width: 50px;.class2 { color: green; } } }`;

    const output = await processCSS(input);
    expect(output).toBe(expectedOutput);
  });

  it('should nest internal media query selectors correctly', async () => {
    const input = `.Panel { color: black; background-color: white; @media screen and (min-width: 30em) and (orientation: landscape) { .class1 { width: 50px; }.class1 .class2 { color: green; } } }.Panel .panel-box { padding: 1em; font-size: 1em;}.Panel .panel-header { background-color: grey; }.Panel .panel-header .panel-box { padding: 0.5em; }.Panel .panel-footer { background-color: lightgrey; }.Panel .panel-footer .panel-box { padding: 0.3em; }@media screen and (min-width: 30em) and (orientation: landscape) { .class1 { width: 50px; }.class1 .class2 { color: green; } }`;
    const expectedOutput = `.Panel { color: black; background-color: white; @media screen and (min-width: 30em) and (orientation: landscape) { .class1 { width: 50px;.class2 { color: green; } } }.panel-box { padding: 1em; font-size: 1em;}.panel-header { background-color: grey;.panel-box { padding: 0.5em; } }.panel-footer { background-color: lightgrey;.panel-box { padding: 0.3em; } } }@media screen and (min-width: 30em) and (orientation: landscape) { .class1 { width: 50px;.class2 { color: green; } } }`;

    const output = await processCSS(input);
    expect(output).toBe(expectedOutput);
  });
});
