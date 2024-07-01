import fs from 'node:fs';
import { resolve } from 'node:path';
import { utilityModules, ViteCssUtilityModulesOptions } from '../src';
import * as vite from 'vite';

const { readFile } = fs.promises;

const cleanCode = (bufferString: string | Uint8Array, isString = true): string => {
  if (isString) {
    let code = new TextEncoder().encode(bufferString as string);
    return new TextDecoder("utf-8").decode(code);
  }
  
  // if (typeof code === 'string') return code;
  // return JSON.stringify(bufferString as string).slice(1, -3).replace(/\\n/g, '\n').replace(/\\$/, '');
  const code = new TextEncoder().encode(bufferString as string);
  return new TextDecoder("utf-8").decode(code);
};

async function viteBuild(fileName: string, options: ViteCssUtilityModulesOptions): Promise<(vite.Rollup.OutputChunk | vite.Rollup.OutputAsset)[]> {
  const { output } = await vite.build({
    plugins: [ utilityModules(options) ],
    build: {
      minify: false,
      outDir: './__tests__/dist',
      rollupOptions: {
        input: `./__tests__/src/${fileName}`,
      },
    },
  }) as vite.Rollup.RollupOutput;

  return output;
}

describe('viteUtilityModules', () => {
  it('should not process CSS with viteUtilityModules', async () => {
    const expectedOutput = await readFile(resolve(__dirname, './src/index.css'), 'utf-8');

    const files = await viteBuild('index.css', { utility: { mode: 'readable' } });
    const [ file ] = files;
    const result = cleanCode((file as unknown as vite.Rollup.OutputAsset).source, false);
    
    expect(files.length).toBe(1);
    expect(result).toBe(expectedOutput);
  });

  it('should process CSS with viteUtilityModules', async () => {
    const expectedOutput = `.panel {

  .panel-header {

    .panel-box { padding: 0.5em; }
  }

  .panel-footer {

    .panel-box { padding: 0.3em; }
  }
}
.background-color\\[_lightgrey\\] { background-color: lightgrey
}
.background-color\\[_grey\\] { background-color: grey
}
.padding\\[_1em\\] { padding: 1em
}
.font-size\\[_1em\\] { font-size: 1em
}
.background-color\\[_white\\] { background-color: white
}`;

    const files = await viteBuild('index.module.css', { utility: { mode: 'readable' } });
    const [ css ] = files;
    const result = cleanCode((css as unknown as vite.Rollup.OutputAsset).source, false);

    expect(files.length).toBe(1);
    expect(result).toBe(expectedOutput);
  });

  it('should process js and CSS with viteUtilityModules and have CSS Utility Modules into the js file', async () => {
    const expectedCssOutput = `.panel {

  .panel-header {

    .panel-box { padding: 0.5em; }
  }

  .panel-footer {

    .panel-box { padding: 0.3em; }
  }
}
.background-color\\[_lightgrey\\] { background-color: lightgrey
}
.background-color\\[_grey\\] { background-color: grey
}
.padding\\[_1em\\] { padding: 1em
}
.font-size\\[_1em\\] { font-size: 1em
}
.background-color\\[_white\\] { background-color: white
}`;

    const expectedJsOutput = `const panel = "panel background-color[_white]";
const classes = {
  "panel-footer": "panel-footer background-color[_lightgrey]",
  "panel-header": "panel-header background-color[_grey]",
  "panel-box": "padding[_1em] font-size[_1em]",
  panel
};
console.log(classes);
`;

    const files = await viteBuild('index.module.js', { utility: { mode: 'readable' } });
    const [ jsFile, cssFile ] = files;
    const js = cleanCode((jsFile as unknown as vite.Rollup.OutputChunk).code);
    const css = cleanCode((cssFile as unknown as vite.Rollup.OutputAsset).source, false);
    
    
    expect(files.length).toBe(2);
    expect(js).toBe(expectedJsOutput);
    expect(css).toBe(expectedCssOutput);
  });
});
