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

describe('css-tools - usedClassNames', () => {
  it('should remove the class names not defined in "usedClasses" option.', async () => {
    const input = '.class1 { animation: 3s linear animation1, 3s ease-out 5s animation2;\n.class2 { color: red; }\n}\n@keyframes animation1 { opacity: 1; }\n@keyframes animation2 { opacity: 0; }';
    const ID = getScope(input);
    const expectedOutput = '.class1 { animation: 3s linear animation1, 3s ease-out 5s animation2\n}\n@keyframes animation1 { opacity: 1; }\n@keyframes animation2 { opacity: 0; }';
    
    const output = await processCSS(input, {
      scope: { classNames: false },
      usedClasses: ['class1'],
    });

    expect(output).toBe(expectedOutput);
  });

  it('should remove the class names not defined in "usedClasses" option.', async () => {
    const input = '.class1 { animation: 3s linear animation1, 3s ease-out 5s animation2;\n.class2 { color: red;\nclass3 { color: blue }\n}\n}\n@keyframes animation1 { opacity: 1; }\n@keyframes animation2 { opacity: 0; }';
    const ID = getScope(input);
    const expectedOutput = '.class1 { animation: 3s linear animation1, 3s ease-out 5s animation2\n}\n@keyframes animation1 { opacity: 1; }\n@keyframes animation2 { opacity: 0; }';
    
    const output = await processCSS(input, {
      scope: { classNames: false },
      usedClasses: ['class1'],
    });

    expect(output).toBe(expectedOutput);
  });

  it('should remove the class names defined in "usedClasses" option if empty.', async () => {
    const input = '.class1 { animation: 3s linear animation1, 3s ease-out 5s animation2;\n.class2 {\n.class3 { color: blue }\n}\n}\n@keyframes animation1 { opacity: 1; }\n@keyframes animation2 { opacity: 0; }';
    const ID = getScope(input);
    const expectedOutput = '.class1 { animation: 3s linear animation1, 3s ease-out 5s animation2\n}\n@keyframes animation1 { opacity: 1; }\n@keyframes animation2 { opacity: 0; }';
    
    const output = await processCSS(input, {
      scope: { classNames: false },
      usedClasses: ['class1', 'class2'],
    });

    expect(output).toBe(expectedOutput);
  });

  it('should not remove the class names defined in "usedClasses" option if not empty.', async () => {
    const input = '.class1 { animation: 3s linear animation1, 3s ease-out 5s animation2;\n.class2 { color: red;\n.class3 { color: blue }\n}\n}\n@keyframes animation1 { opacity: 1; }\n@keyframes animation2 { opacity: 0; }';
    const ID = getScope(input);
    const expectedOutput = `.class1${ID} { animation: 3s linear animation1${ID}, 3s ease-out 5s animation2${ID};\n.class2${ID} { color: red\n}\n}\n@keyframes animation1${ID} { opacity: 1; }\n@keyframes animation2${ID} { opacity: 0; }`;
    
    const output = await processCSS(input, {
      usedClasses: ['class1', 'class2'],
    });

    expect(output).toBe(expectedOutput);
  });

  it('should remove unused keyframes.', async () => {
    const input = '.class1 { animation: 3s linear animation1, 3s ease-out 5s animation2;\n.class2 { color: red;\n.class3 { color: blue; animation-name: animation3\n}\n}\n}\n@keyframes animation1 { opacity: 1; }\n@keyframes animation2 { opacity: 0; }\n@keyframes animation3 { opacity: 0; }';
    const expectedOutput = '.class1 { animation: 3s linear animation1, 3s ease-out 5s animation2;\n.class2 { color: red\n}\n}\n@keyframes animation1 { opacity: 1; }\n@keyframes animation2 { opacity: 0; }';
    
    const output = await processCSS(input, {
      scope: { classNames: false },
      usedClasses: ['class1', 'class2'],
    });

    expect(output).toBe(expectedOutput);
  });

  it('should rename global keyframes.', async () => {
    const input = '.class1 { animation: 3s linear global(animation1), 3s ease-out 5s animation2;\n.class2 { color: red;\n.class3 { color: blue; animation-name: animation3\n}\n}\n}\n@keyframes animation1 { opacity: 1; }\n@keyframes animation2 { opacity: 0; }\n@keyframes animation3 { opacity: 0; }';
    const expectedOutput = '.class1 { animation: 3s linear animation1, 3s ease-out 5s animation2;\n.class2 { color: red\n}\n}\n@keyframes animation1 { opacity: 1; }\n@keyframes animation2 { opacity: 0; }';
    
    const output = await processCSS(input, {
      scope: { classNames: false },
      usedClasses: ['class1', 'class2'],
    });

    expect(output).toBe(expectedOutput);
  });

  it('should remove unused classes in root media query.', async () => {
    const input = '.class1 { animation: 3s linear global(animation1), 3s ease-out 5s animation2;\n.class2 { color: red;\n.class3 { color: blue; animation-name: animation3\n}\n}\n}\n@media (min-width: 30em) and (max-width: 50em) { .class1 { color: green;\n.class2 { color: black;\n.class3 { color: white\n}\n}\n}\n}\n@keyframes animation1 { opacity: 1; }\n@keyframes animation2 { opacity: 0; }\n@keyframes animation3 { opacity: 0; }';
    const expectedOutput = '.class1 { animation: 3s linear animation1, 3s ease-out 5s animation2;\n.class2 { color: red\n}\n}\n@media (min-width: 30em) and (max-width: 50em) { .class1 { color: green;\n.class2 { color: black\n}\n}\n}\n@keyframes animation1 { opacity: 1; }\n@keyframes animation2 { opacity: 0; }';

    const output = await processCSS(input, {
      scope: { classNames: false },
      usedClasses: ['class1', 'class2'],
    });

    expect(output).toBe(expectedOutput);
  });
});