import postcss from 'postcss';
import { postCssTools, Options } from '@pastweb/postcss-tools';

// Utility function to process CSS with the plugin
export async function processCSS (code: string, opts: Options, filePath: string) {
  const result = await postcss([postCssTools(opts)]).process(code, { from: filePath });
  return result.css;
};
