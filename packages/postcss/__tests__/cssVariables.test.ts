import postcss from 'postcss';
import { postCssUtlityModules } from '../src';
import { generateHash } from '../src/utils';
import { Options } from '../src/types';

const getScope = (...args: string[]) => `_${generateHash(8, ...args)}`;

// Utility function to process CSS with the plugin
const processCSS = async (input: string, opts: Options = {}) => {
  const result = await postcss([postCssUtlityModules(opts)]).process(input, { from: undefined });
  return result.css;
};

describe('css-utility-modules - scopedCSSVariables', () => {
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
      scope:{ cssVariables: true },
      modules: true,
    });

    expect(output).toBe(expectedOutput);
  });

  it('should not add suffixes to CSS variables excluded.', async () => {
    const input = `
      :root {
        --color: red;
        --width: 100%;
      }
      .example {
        color: var(--color);
        width: var(--width);
      }
    `;
    
    const VARS_ID = getScope('/');
    
    const expectedOutput = `
      :root {
        --color${VARS_ID}: red;
        --width: 100%;
      }
      .example {
        color: var(--color${VARS_ID});
        width: var(--width);
      }
    `;

    const output = await processCSS(input, {
      scope: {
        cssVariables: {
          exclude: /--width/,
        },
      },
    });
    
    expect(output).toBe(expectedOutput);
  });
});
