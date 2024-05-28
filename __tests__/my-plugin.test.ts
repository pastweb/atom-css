import postcss from 'postcss';
import plugin from '../src';
import { generateHash } from '../src/utils';
import { Options } from '../src/types';

const getScope = (...args: string[]) => `_${generateHash(8, ...args)}`;

// Utility function to process CSS with the plugin
const processCSS = async (input: string, opts: Options = {}) => {
  const result = await postcss([plugin(opts)]).process(input, { from: undefined });
  return result.css;
};

describe('postcss-utility-modules', () => {
  it('should add suffixes to class names', async () => {
    const input = '.example { color: red; }';
    const ID = getScope(input);
    const expectedOutput = `.example${ID} { color: red; }`;
    
    const output = await processCSS(input, { modules: true });

    expect(output).toBe(expectedOutput);
  });

  it('should handle :global(.example) correctly', async () => {
    const input = ':global(.example) { color: red; }';
    const expectedOutput = '.example { color: red; }';
    
    const output = await processCSS(input, { modules: true });

    expect(output).toBe(expectedOutput);
  });

  it('should handle :global correctly', async () => {
    const input = ':global .example { color: red; }';
    const expectedOutput = '.example { color: red; }';
    
    const output = await processCSS(input, { modules: true });

    expect(output).toBe(expectedOutput);
  });

  it('should add suffixes to animation names and keyframes', async () => {
    const input = '.example { animation: 3s linear animation1, 3s ease-out 5s animation2; }\n@keyframes animation1 { opacity: 1; }\n@keyframes animation2 { opacity: 0; }';
    const ID = getScope(input);
    const expectedOutput = `.example${ID} { animation: 3s linear animation1${ID}, 3s ease-out 5s animation2${ID}; }\n@keyframes animation1${ID} { opacity: 1; }\n@keyframes animation2${ID} { opacity: 0; }`;
    
    const output = await processCSS(input, { modules: true });

    expect(output).toBe(expectedOutput);
  });

  it('should note add suffixes to global(animationNames) and keyframes', async () => {
    const input = '.example { animation: 3s linear animation1, 3s ease-out 5s global(animation2); }\n@keyframes animation1 { opacity: 1; }\n@keyframes animation2 { opacity: 0; }';
    const ID = getScope(input);
    const expectedOutput = `.example${ID} { animation: 3s linear animation1${ID}, 3s ease-out 5s animation2; }\n@keyframes animation1${ID} { opacity: 1; }\n@keyframes animation2 { opacity: 0; }`;
    
    const output = await processCSS(input, { modules: true });

    expect(output).toBe(expectedOutput);
  });

  it('should add suffix to animation-name value and keyframes', async () => {
    const input = '.example { animation-name: animation1; }\n@keyframes animation1 { opacity: 1; }';
    const ID = getScope(input);
    const expectedOutput = `.example${ID} { animation-name: animation1${ID}; }\n@keyframes animation1${ID} { opacity: 1; }`;
    
    const output = await processCSS(input, { modules: true });

    expect(output).toBe(expectedOutput);
  });

  it('should note add suffix to global(animationName) and keyframes', async () => {
    const input = '.example { animation-name: global(animation1); }\n@keyframes animation1 { opacity: 1; }';
    const ID = getScope(input);
    const expectedOutput = `.example${ID} { animation-name: animation1; }\n@keyframes animation1 { opacity: 1; }`;
    
    const output = await processCSS(input, { modules: true });

    expect(output).toBe(expectedOutput);
  });

  it('should add suffixes to CSS variables in :root', async () => {
    const input = `
      :root {
        --color: red;
      }
      .example {
        color: var(--color);
      }
    `;
    
    const CLASS_ID = getScope(input);
    const VARS_ID = getScope('/');
    
    const expectedOutput = `
      :root {
        --color${VARS_ID}: red;
      }
      .example${CLASS_ID} {
        color: var(--color${VARS_ID});
      }
    `;

    const output = await processCSS(input, {
      modules: true,
      scopedCSSVariables: true,
      getModules: (filePath, modules) => {},
    });
    expect(output).toBe(expectedOutput);
  });

  it('should generate utilies correctly', async () => {
    const input = `.class1 {
  color: red;
  .class2 { color: blue; }
}`;

    const expectedOutput = `.color[red] {
  color: red
}
.color[blue] { color: blue
}`;
    
    const output = await processCSS(input, {
      utility: { className: 'readable' },
    });
    
    expect(output).toBe(expectedOutput);
  });
});
