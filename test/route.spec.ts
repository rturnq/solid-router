import { createComputed, createRoot, createSignal, untrack } from 'solid-js';
import { defaultUtils, createRoute } from '../src/routing';
import type { ParamsCollection } from '../src/types';

describe('Route should', () => {
  describe('have member `path` which should', () => {
    test('be the value passed in to createRoute', () => {
      createRoot(() => {
        for (let expected of ['test', '/test', '//test', '/', '']) {
          const { path } = createRoute(defaultUtils, '', expected, () => ({}));
          expect(path).toBe(expected);
        }
      });
    });
  });

  describe('have member `isMatch` which should', () => {
    test('be true when matchSignal is an empty object', () => {
      createRoot(() => {
        const { isMatch } = createRoute(defaultUtils, '', '', () => ({}));
        expect(isMatch()).toBe(true);
      });
    });

    test('be true when matchSignal is a non-empty object', () => {
      createRoot(() => {
        const { isMatch } = createRoute(defaultUtils, '', '', () => ({
          foo: 'bar'
        }));
        expect(isMatch()).toBe(true);
      });
    });

    test('be false when matchSignal is null', () => {
      createRoot(() => {
        const { isMatch } = createRoute(defaultUtils, '', '', () => null);
        expect(isMatch()).toBe(false);
      });
    });

    test('react to matchSignal changing from null to an object', () =>
      new Promise((resolve) => {
        createRoot(() => {
          const [
            matchSignal,
            setMatchSignal
          ] = createSignal<ParamsCollection | null>(null);
          const { isMatch } = createRoute(defaultUtils, '', '', matchSignal);
          createComputed((n = 0) => {
            if (isMatch()) {
              expect(n).toBe(1);
              resolve();
            }
            return n + 1;
          }, 0);

          expect(isMatch()).toBe(false);
          setMatchSignal({ foo: 'bar' });
        });
      }));

    test('react to matchSignal changing from an object to null', () =>
      new Promise((resolve) => {
        createRoot(() => {
          const [
            matchSignal,
            setMatchSignal
          ] = createSignal<ParamsCollection | null>({ foo: 'bar' });
          const { isMatch } = createRoute(defaultUtils, '', '', matchSignal);
          createComputed((n = 0) => {
            if (!isMatch()) {
              expect(n).toBe(1);
              resolve();
            }
            return n + 1;
          }, 0);

          expect(isMatch()).toBe(true);
          setMatchSignal(null);
        });
      }));

    test('not react to matchSignal changing from an object to another object', () =>
      new Promise((resolve) => {
        createRoot(() => {
          const [
            matchSignal,
            setMatchSignal
          ] = createSignal<ParamsCollection | null>({ foo: 'bar' });
          const { isMatch } = createRoute(defaultUtils, '', '', matchSignal);
          createComputed((n = 0) => {
            if (!isMatch()) {
              expect(n).toBe(1);
              resolve();
            } else if (n > 0) {
              throw new Error('isMatch should not have reacted');
            }
            return n + 1;
          }, 0);

          expect(isMatch()).toBe(true);
          setMatchSignal({ bar: 'foo' });
          setMatchSignal(null);
        });
      }));
  });

  describe('have member `params` which should', () => {
    test('be an empty object when matchSignal is an empty object', () => {
      createRoot(() => {
        const match = {};
        const { params } = createRoute(defaultUtils, '', '', () => match);
        expect(params).toEqual(params);
      });
    });

    test('be an equivelant object when matchSignal is a non-empty object', () => {
      createRoot(() => {
        const match = { foo: new Date().toISOString() };
        const { params } = createRoute(defaultUtils, '', '', () => match);
        expect(params).toEqual(match);
      });
    });

    test('be an empty object when matchSignal is null', () => {
      createRoot(() => {
        const match = null;
        const { params } = createRoute(defaultUtils, '', '', () => match);
        expect(params).toEqual({});
      });
    });

    test('react to matchSignal changing from null to an object', () =>
      new Promise((resolve) => {
        createRoot(() => {
          const match = { foo: new Date().toISOString() };
          const [
            matchSignal,
            setMatchSignal
          ] = createSignal<ParamsCollection | null>(null);
          const { params } = createRoute(defaultUtils, '', '', matchSignal);
          createComputed((n = 0) => {
            if (params.foo !== undefined) {
              expect(n).toBe(1);
              expect(params).toEqual(match);
              resolve();
            }
            return n + 1;
          }, 0);

          expect(params).toEqual({});
          setMatchSignal(match);
        });
      }));

    test('react to matchSignal changing from an object to null', () =>
      new Promise((resolve) => {
        createRoot(() => {
          const match = { foo: new Date().toISOString() };
          const [
            matchSignal,
            setMatchSignal
          ] = createSignal<ParamsCollection | null>(match);
          const { params } = createRoute(defaultUtils, '', '', matchSignal);
          createComputed((n = 0) => {
            if (params.foo === undefined) {
              expect(n).toBe(1);
              expect(params).toEqual({});
              resolve();
            }
            return n + 1;
          }, 0);

          expect(params).toEqual(match);
          setMatchSignal(null);
        });
      }));

    test('react to fine-grained changes in matchSignal', () =>
      new Promise((resolve) => {
        createRoot(() => {
          const matches: ParamsCollection[] = [
            { foo: 'hello' },
            { foo: 'hello', bar: 'world' }
          ];
          const [
            matchSignal,
            setMatchSignal
          ] = createSignal<ParamsCollection | null>(matches[0]);
          const { params } = createRoute(defaultUtils, '', '', matchSignal);
          createComputed((n = 0) => {
            params.foo;
            if (n > 0) {
              throw new Error('params.foo should not have reacted');
            }
            return n + 1;
          }, 0);
          createComputed((n = 0) => {
            if (params.bar !== undefined) {
              expect(n).toBe(1);
              expect(untrack(() => params)).toEqual(matches[1]);
              resolve();
            }
            return n + 1;
          }, 0);

          expect(params).toEqual(matches[0]);
          setMatchSignal(matches[1]);
        });
      }));
  });

  describe('have member `resolvePath` which should', () => {
    test('return undefined for paths with a schema', () => {
      const utils = { ...defaultUtils };
      const spy = jest.spyOn(utils, 'resolvePath');
      createRoot(() => {
        const { resolvePath } = createRoute(utils, '', '', () => null);
        expect(resolvePath('http://foo')).toBe(undefined);
        expect(resolvePath('https://foo')).toBe(undefined);
        expect(resolvePath('abc://foo')).toBe(undefined);
        expect(resolvePath('//foo')).toBe(undefined);
        expect(spy).toBeCalledTimes(4);
      });
    });

    test('use the resolvePath utility provided for relative paths', () => {
      const utils = { ...defaultUtils };
      const spy = jest.spyOn(utils, 'resolvePath');
      createRoot(() => {
        const { resolvePath } = createRoute(utils, '', '', () => null);
        expect(resolvePath('')).toBe('/');
        expect(resolvePath('/')).toBe('/');
        expect(resolvePath('://')).toBe('/:');
        expect(resolvePath('foo')).toBe('/foo');
        expect(spy).toBeCalledTimes(4);
      });
    });

    test(`use the base path for paths that start with '/'`, () => {
      const utils = { ...defaultUtils };
      const spy = jest.spyOn(utils, 'resolvePath');
      createRoot(() => {
        const { resolvePath } = createRoute(utils, '/base', '/base/route', () => null);
        expect(resolvePath('/')).toBe('/base');
        expect(resolvePath('/foo')).toBe('/base/foo');
        expect(spy).toBeCalledTimes(2);
      });
    });

    test(`use the route path for paths that don't start with '/'`, () => {
      const utils = { ...defaultUtils };
      const spy = jest.spyOn(utils, 'resolvePath');
      createRoot(() => {
        const { resolvePath } = createRoute(utils, '/base', '/base/route', () => null);
        expect(resolvePath('')).toBe('/base/route');
        expect(resolvePath('foo')).toBe('/base/route/foo');
        expect(spy).toBeCalledTimes(2);
      });
    });
  });
});
