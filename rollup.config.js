import resolve from '@rollup/plugin-node-resolve';
import babel from "@rollup/plugin-babel";
import filesize from 'rollup-plugin-filesize';

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
  input: 'src/index.tsx',
  external: ['solid-js', 'solid-js/web', 'history', 'regexparam'],
  output: [
    { file: 'dist/build/index.cjs.js', format: 'cjs' },
    { file: 'dist/build/index.js', format: 'es' }
  ]
};
