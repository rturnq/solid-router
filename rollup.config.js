import nodeResolve from '@rollup/plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import filesize from 'rollup-plugin-filesize';
import pkg from './package.json';

export default {
  plugins: [
    nodeResolve({
      extensions: ['.ts', '.tsx']
    }),
    babel({
      extensions: ['.ts', '.tsx'],
      presets: ['@babel/preset-typescript', 'solid'],
      plugins: [
        '@babel/plugin-proposal-optional-chaining',
        '@babel/plugin-proposal-nullish-coalescing-operator'
      ]
		}),
		filesize()
  ],
  input: 'src/index.ts',
  external: ['solid-js', 'solid-js/dom', 'path-to-regexp'],
  output: [
    { file: pkg.main, format: 'cjs' },
    { file: pkg.module, format: 'es' }
  ]
};
