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

describe('postcss-utility-modules - scopedCSSVariables', () => {
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
});
