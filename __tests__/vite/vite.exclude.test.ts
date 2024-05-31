import { viteUtilityModules, ViteCssUtilityModulesOptions } from '../../src';
import * as vite from 'vite';

const cleanCode = (bufferString: string | Uint8Array, isString = true): string => {
  if (isString) {
    let code = new TextEncoder().encode(bufferString as string);
    return new TextDecoder("utf-8").decode(code);
  }
  
  // if (typeof code === 'string') return code;
  return JSON.stringify(bufferString as string).slice(1, -3).replace(/[\\]+/g, '');
};

async function viteBuild(fileName: string, options: ViteCssUtilityModulesOptions): Promise<(vite.Rollup.OutputChunk | vite.Rollup.OutputAsset)[]> {
  const { output } = await vite.build({
    plugins: [
      viteUtilityModules(options),
    ],
    build: {
      outDir: './__tests__/vite/dist',
      rollupOptions: {
        input: `./__tests__/vite/src/${fileName}`,
      },
    },
  }) as vite.Rollup.RollupOutput;

  return output;
}

describe('viteUtilityModules', () => {
  // it('should process CSS with viteUtilityModules', async () => {
  //   const expectedOutput = `.panel .panel-header .panel-box{padding:.5em}.panel .panel-footer .panel-box{padding:.3em}.background-color[_white]{background-color:#fff}.padding[_1em]{padding:1em}.font-size[_1em]{font-size:1em}.background-color[_grey]{background-color:gray}.background-color[_lightgrey]{background-color:#d3d3d3}`;

  //   const [ file ] = await viteBuild('index.css', { mode: 'readable' });
  //   const result = cleanCode((file as unknown as vite.Rollup.OutputAsset).source, false);
    
  //   expect(result).toBe(expectedOutput);
  // });

  // it('should process js and CSS with viteUtilityModules and have CSS Utility Modules into the js file', async () => {
  //   const expectedOutput = `.panel .panel-header .panel-box{padding:.5em}.panel .panel-footer .panel-box{padding:.3em}.background-color[_white]{background-color:#fff}.padding[_1em]{padding:1em}.font-size[_1em]{font-size:1em}.background-color[_grey]{background-color:gray}.background-color[_lightgrey]{background-color:#d3d3d3}`;

  //   const [ file ] = await viteBuild('index.js', { mode: 'readable' });
  //   const result = cleanCode((file as unknown as vite.Rollup.OutputAsset).source);
    
  //   expect(result).toBe(expectedOutput);
  // });

  it('should process js and CSS with viteUtilityModules and have CSS Utility Modules into the js file', async () => {
    const expectedOutput = `._panel_sxwt2_1 ._panel-header_sxwt2_9 ._panel-box_sxwt2_4{padding:.5em}._panel_sxwt2_1 ._panel-footer_sxwt2_15 ._panel-box_sxwt2_4{padding:.3em}`;

    const output = await viteBuild('index.module.js', { mode: 'readable' });
    const [ jsFile, cssFile ] = output;
    const js = cleanCode((jsFile as unknown as vite.Rollup.OutputChunk).code);
    console.log(js)
    const css = cleanCode((cssFile as unknown as vite.Rollup.OutputAsset).source, false);
    
    expect(css).toBe(expectedOutput);
  });
});
