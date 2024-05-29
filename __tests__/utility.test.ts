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

describe('postcss-utility-modules - utility', () => {
  it('should generate readable className utilies by default correctly', async () => {
    const input = `.class1 { color: red; background-color: white; .class2 { color: blue; } }`;

    const expectedOutput = `.color[_red] { color: red\n}\n.background-color[_white] { background-color: white\n}\n.color[_blue] { color: blue\n}`;
    
    let fileName: string = '';
    let cssModules: Record<string, string> = {};

    const getModules = jest.fn((filePath, modules) => {
      fileName = filePath;
      cssModules = modules;
    });

    const output = await processCSS(input, {
      getModules,
      utility: true,
    });
    
    expect(output).toBe(expectedOutput);
    expect(getModules).toHaveBeenCalledTimes(1);
    expect(fileName).toBe('unknown');
    expect(Object.keys(cssModules).length).toBe(2);
    expect(cssModules.class1).toBe('color[_red] background-color[_white]');
    expect(cssModules.class2).toBe('color[_blue]');
  });

  it('should generate readable className utilies by default correctly even in utilityModules', async () => {
    const input = `.class1 { color: red; background-color: white; .class2 { color: blue; } }`;

    const expectedOutput = `.color[_red] { color: red\n}\n.background-color[_white] { background-color: white\n}\n.color[_blue] { color: blue\n}`;
    
    let cssFileName: string = '';
    let cssModules: Record<string, string> = {};
    let utilityFileName: string = '';
    let utilityModules: Record<string, string> = {};

    const getModules = jest.fn((filePath, modules) => {
      cssFileName = filePath;
      cssModules = modules;
    });

    const getUtilityModules = jest.fn((filePath, modules) => {
      utilityFileName = filePath;
      utilityModules = modules;
    });

    const output = await processCSS(input, {
      getModules,
      utility: { getUtilityModules },
    });
    
    expect(output).toBe(expectedOutput);
    expect(getModules).toHaveBeenCalledTimes(1);
    expect(cssFileName).toBe('unknown');
    expect(Object.keys(cssModules).length).toBe(2);
    expect(cssModules.class1).toBe('color[_red] background-color[_white]');
    expect(cssModules.class2).toBe('color[_blue]');
    expect(getUtilityModules).toHaveBeenCalledTimes(1);
    expect(utilityFileName).toBe('unknown');
    expect(Object.keys(utilityModules).length).toBe(3);
    expect(utilityModules['color[_red]']).toBe('.color[_red] { color: red\n}');
    expect(utilityModules['background-color[_white]']).toBe('.background-color[_white] { background-color: white\n}');
    expect(utilityModules['color[_blue]']).toBe('.color[_blue] { color: blue\n}');
  });

  it('should generate semireadable className utilies correctly even in utilityModules', async () => {
    const input = `.class1 { color: red; background-color: white; .class2 { color: blue; } }`;

    const redId = getScope('red');
    const whiteId = getScope('white');
    const blueId = getScope('blue');

    const expectedOutput = `.color[${redId}] { color: red\n}\n.background-color[${whiteId}] { background-color: white\n}\n.color[${blueId}] { color: blue\n}`;
    
    let cssFileName: string = '';
    let cssModules: Record<string, string> = {};
    let utilityFileName: string = '';
    let utilityModules: Record<string, string> = {};

    const getModules = jest.fn((filePath, modules) => {
      cssFileName = filePath;
      cssModules = modules;
    });

    const getUtilityModules = jest.fn((filePath, modules) => {
      utilityFileName = filePath;
      utilityModules = modules;
    });

    const output = await processCSS(input, {
      getModules,
      utility: {
        mode: 'semireadable',
        getUtilityModules,
      },
    });
    
    expect(output).toBe(expectedOutput);
    expect(getModules).toHaveBeenCalledTimes(1);
    expect(cssFileName).toBe('unknown');
    expect(Object.keys(cssModules).length).toBe(2);
    expect(cssModules.class1).toBe(`color[${redId}] background-color[${whiteId}]`);
    expect(cssModules.class2).toBe(`color[${blueId}]`);
    expect(getUtilityModules).toHaveBeenCalledTimes(1);
    expect(utilityFileName).toBe('unknown');
    expect(Object.keys(utilityModules).length).toBe(3);
    expect(utilityModules[`color[${redId}]`]).toBe(`.color[${redId}] { color: red\n}`);
    expect(utilityModules[`background-color[${whiteId}]`]).toBe(`.background-color[${whiteId}] { background-color: white\n}`);
    expect(utilityModules[`color[${blueId}]`]).toBe(`.color[${blueId}] { color: blue\n}`);
  });

  it('should generate coded className utilies correctly even in utilityModules', async () => {
    const input = `.class1 { color: red; background-color: white; .class2 { color: blue; } }`;

    const redId = getScope('color', 'red');
    const whiteId = getScope('background-color', 'white');
    const blueId = getScope('color', 'blue');

    const expectedOutput = `.${redId} { color: red\n}\n.${whiteId} { background-color: white\n}\n.${blueId} { color: blue\n}`;
    
    let cssFileName: string = '';
    let cssModules: Record<string, string> = {};
    let utilityFileName: string = '';
    let utilityModules: Record<string, string> = {};

    const getModules = jest.fn((filePath, modules) => {
      cssFileName = filePath;
      cssModules = modules;
    });

    const getUtilityModules = jest.fn((filePath, modules) => {
      utilityFileName = filePath;
      utilityModules = modules;
    });

    const output = await processCSS(input, {
      getModules,
      utility: {
        mode: 'coded',
        getUtilityModules,
      },
    });
    
    expect(output).toBe(expectedOutput);
    expect(getModules).toHaveBeenCalledTimes(1);
    expect(cssFileName).toBe('unknown');
    expect(Object.keys(cssModules).length).toBe(2);
    expect(cssModules.class1).toBe(`${redId} ${whiteId}`);
    expect(cssModules.class2).toBe(`${blueId}`);
    expect(getUtilityModules).toHaveBeenCalledTimes(1);
    expect(utilityFileName).toBe('unknown');
    expect(Object.keys(utilityModules).length).toBe(3);
    expect(utilityModules[`${redId}`]).toBe(`.${redId} { color: red\n}`);
    expect(utilityModules[`${whiteId}`]).toBe(`.${whiteId} { background-color: white\n}`);
    expect(utilityModules[`${blueId}`]).toBe(`.${blueId} { color: blue\n}`);
  });

  it('should generate coded className utilies correctly in utilityModules without output', async () => {
    const input = `.class1 { color: red; background-color: white; .class2 { color: blue; } }`;

    const redId = getScope('color', 'red');
    const whiteId = getScope('background-color', 'white');
    const blueId = getScope('color', 'blue');

    const expectedOutput = ``;
    
    let cssFileName: string = '';
    let cssModules: Record<string, string> = {};
    let utilityFileName: string = '';
    let utilityModules: Record<string, string> = {};

    const getModules = jest.fn((filePath, modules) => {
      cssFileName = filePath;
      cssModules = modules;
    });

    const getUtilityModules = jest.fn((filePath, modules) => {
      utilityFileName = filePath;
      utilityModules = modules;
    });

    const output = await processCSS(input, {
      getModules,
      utility: {
        mode: 'coded',
        getUtilityModules,
        output: false,
      },
    });
    
    expect(output).toBe(expectedOutput);
    expect(getModules).toHaveBeenCalledTimes(1);
    expect(cssFileName).toBe('unknown');
    expect(Object.keys(cssModules).length).toBe(2);
    expect(cssModules.class1).toBe(`${redId} ${whiteId}`);
    expect(cssModules.class2).toBe(`${blueId}`);
    expect(getUtilityModules).toHaveBeenCalledTimes(1);
    expect(utilityFileName).toBe('unknown');
    expect(Object.keys(utilityModules).length).toBe(3);
    expect(utilityModules[`${redId}`]).toBe(`.${redId} { color: red\n}`);
    expect(utilityModules[`${whiteId}`]).toBe(`.${whiteId} { background-color: white\n}`);
    expect(utilityModules[`${blueId}`]).toBe(`.${blueId} { color: blue\n}`);
  });

  it('should generate scoped classNames and coded className for utilies correctly in utilityModules without output for utility classes.', async () => {
    const input = `.class1 { color: red; background-color: white; div { margin: 0; } .class2 { color: blue; } }`;
    
    const ID = getScope(input);
    const redId = getScope('color', 'red');
    const whiteId = getScope('background-color', 'white');
    const blueId = getScope('color', 'blue');

    const expectedOutput = `.class1${ID} { div { margin: 0; } }`;
    
    let cssFileName: string = '';
    let cssModules: Record<string, string> = {};
    let utilityFileName: string = '';
    let utilityModules: Record<string, string> = {};

    const getModules = jest.fn((filePath, modules) => {
      cssFileName = filePath;
      cssModules = modules;
    });

    const getUtilityModules = jest.fn((filePath, modules) => {
      utilityFileName = filePath;
      utilityModules = modules;
    });

    const output = await processCSS(input, {
      modules: true,
      getModules,
      utility: {
        mode: 'coded',
        getUtilityModules,
        output: false,
      },
    });
    
    expect(output).toBe(expectedOutput);
    expect(getModules).toHaveBeenCalledTimes(1);
    expect(cssFileName).toBe('unknown');
    expect(Object.keys(cssModules).length).toBe(2);
    expect(cssModules.class1).toBe(`class1${ID} ${redId} ${whiteId}`);
    expect(cssModules.class2).toBe(`${blueId}`);
    expect(getUtilityModules).toHaveBeenCalledTimes(1);
    expect(utilityFileName).toBe('unknown');
    expect(Object.keys(utilityModules).length).toBe(3);
    expect(utilityModules[`${redId}`]).toBe(`.${redId} { color: red\n}`);
    expect(utilityModules[`${whiteId}`]).toBe(`.${whiteId} { background-color: white\n}`);
    expect(utilityModules[`${blueId}`]).toBe(`.${blueId} { color: blue\n}`);
  });
});