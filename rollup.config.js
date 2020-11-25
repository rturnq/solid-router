import resolve from '@rollup/plugin-node-resolve';
import babel from "@rollup/plugin-babel";
import filesize from 'rollup-plugin-filesize';
import pkg from './package.json';

export default {
  plugins: [
    resolve({
      extensions: ['.ts', '.tsx']
    }),
    babel({
      extensions: ['.ts', '.tsx'],
      babelHelpers: 'bundled',
      presets: ['@babel/preset-typescript', 'babel-preset-solid'],
      exclude: 'node_modules/**'
    }),
    filesize()
  ],
  input: 'src/index.ts',
  external: ['solid-js', 'solid-js/web', 'history', 'regexparam'],
  output: [
    { file: pkg.main, format: 'cjs' },
    { file: pkg.module, format: 'es' }
  ]
};
