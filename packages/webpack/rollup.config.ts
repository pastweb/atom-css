import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import { OutputOptions, Plugin } from 'rollup';

const input = {
  index: 'src/index.ts',
  cssClassLoader: 'src/cssClassLoader.ts',
  cssModuleLoader: 'src/cssModuleLoader.ts',
};

const sourcemap = true;

const plugins: Plugin[] = [
  nodeResolve({ preferBuiltins: true }),
	commonjs(),
  json(),
	typescript({ tsconfig: './tsconfig.build.json' }),
  terser(),
];

const treeshake = {
	moduleSideEffects: false,
	propertyReadSideEffects: false,
	tryCatchDeoptimization: false
};

const cjs: OutputOptions = {
  dir: 'dist',
  entryFileNames: '[name].cjs',
  exports: 'named',
  externalLiveBindings: false,
  format: 'cjs',
  freeze: false,
  sourcemap,
}

const es: OutputOptions = {
  ...cjs,
  entryFileNames: '[name].mjs',
  format: 'es',
};

export default {
	input,
  external: 'webpack',
	output: [cjs, es],
	plugins,
	strictDeprecations: true,
	treeshake
};
