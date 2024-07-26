import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import { OutputOptions, Plugin } from 'rollup';
import pkg from './package.json';

const input = 'src/index.ts';
const sourcemap = true;

const plugins: Plugin[] = [
  nodeResolve({ preferBuiltins: true }),
	commonjs(),
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
  external: Object.keys(pkg.peerDependencies),
	output: [cjs, es],
	plugins,
	strictDeprecations: true,
	treeshake
};
