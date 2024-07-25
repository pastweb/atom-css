import postcss from 'postcss';
import { postCssTools } from '../src';
import { generateHash } from '../src/utils';
import { Options } from '../src/types';

const getScope = (...args: string[]) => `_${generateHash(8, ...args)}`;

// Utility function to process CSS with the plugin
const processCSS = async (input: string, opts: Options = {}, filePath?: string) => {
  const result = await postcss([postCssTools(opts)]).process(input, { from: filePath });
  return result.css;
};

describe('css-tools - ClassNames', () => {
  it('should not add suffixes to class names', async () => {
    const input = '.example { color: red; }\n.example:hover { color: blue; }';
    const expectedOutput = input;
    
    const output = await processCSS(input, {
      test: { include: /\.modules\.css$/ },
    }, 'any.css');

    expect(output).toBe(expectedOutput);
  });

  it('should add suffixes to class names for any.modules.css', async () => {
    const input = '.example { color: red; }\n.example:hover { color: blue; }';
    const ID = getScope(input);
    const expectedOutput = `.example${ID} { color: red;\n&:hover { color: blue; } }`;
    
    const output = await processCSS(input, {
      test: { include: /\.modules\.css$/ },
    }, 'any.modules.css');

    expect(output).toBe(expectedOutput);
  });

  it('should add suffixes to class names', async () => {
    const input = '.example { color: red; }\n.example:hover { color: blue; }';
    const ID = getScope(input);
    const expectedOutput = `.example${ID} { color: red; }\n.example${ID}:hover { color: blue; }`;
    
    const output = await processCSS(input, { selectors: 'flat' });

    expect(output).toBe(expectedOutput);
  });

  it('should handle :global(.example) correctly', async () => {
    const input = ':global(.example) { color: red; }';
    const expectedOutput = '.example { color: red; }';
    
    const output = await processCSS(input);

    expect(output).toBe(expectedOutput);
  });

  it('should add suffixes to animation names and keyframes', async () => {
    const input = '.example { animation: 3s linear animation1, 3s ease-out 5s animation2; }\n@keyframes animation1 { opacity: 1; }\n@keyframes animation2 { opacity: 0; }';
    const ID = getScope(input);
    const expectedOutput = `.example${ID} { animation: 3s linear animation1${ID}, 3s ease-out 5s animation2${ID}; }\n@keyframes animation1${ID} { opacity: 1; }\n@keyframes animation2${ID} { opacity: 0; }`;
    
    const output = await processCSS(input);

    expect(output).toBe(expectedOutput);
  });

  it('should note add suffixes to global(animationNames) and keyframes', async () => {
    const input = '.example { animation: 3s linear animation1, 3s ease-out 5s global(animation2); }\n@keyframes animation1 { opacity: 1; }\n@keyframes animation2 { opacity: 0; }';
    const ID = getScope(input);
    const expectedOutput = `.example${ID} { animation: 3s linear animation1${ID}, 3s ease-out 5s animation2; }\n@keyframes animation1${ID} { opacity: 1; }\n@keyframes animation2 { opacity: 0; }`;
    
    const output = await processCSS(input);

    expect(output).toBe(expectedOutput);
  });

  it('should add suffix to animation-name value and keyframes', async () => {
    const input = '.example { animation-name: animation1; }\n@keyframes animation1 { opacity: 1; }';
    const ID = getScope(input);
    const expectedOutput = `.example${ID} { animation-name: animation1${ID}; }\n@keyframes animation1${ID} { opacity: 1; }`;
    
    const output = await processCSS(input);

    expect(output).toBe(expectedOutput);
  });

  it('should note add suffix to global(animationName) and keyframes', async () => {
    const input = '.example { animation-name: global(animation1); }\n@keyframes animation1 { opacity: 1; }';
    const ID = getScope(input);
    const expectedOutput = `.example${ID} { animation-name: animation1; }\n@keyframes animation1 { opacity: 1; }`;
    
    const output = await processCSS(input);

    expect(output).toBe(expectedOutput);
  });
});
