import { createComputed, createRoot, createSignal, untrack } from 'solid-js';
import { defaultUtils, createRouteState } from '../src/routing';
import { RouteMatch } from '../src/types';

describe('RouteState should', () => {
  describe('have member `path` which should', () => {
    test('be the value passed in to createRouteState', () => {
      createRoot(() => {
        for (let expected of ['test', '/test', '//test', '/', '']) {
          const { path } = createRouteState(defaultUtils, '', expected, false, () => ['', {}]);
          expect(path).toBe(expected);
        }
      });
    });
  });

  describe('have member `match` which should', () => {
    test('be the first item route when matchSignal is a tuple', () => {
      createRoot(() => {
        const { match } = createRouteState(defaultUtils, '', '', false, () => ['foo', {}]);
        expect(match()).toBe('foo');
      });
    });

    test('be undefined when matchSignal is null', () => {
      createRoot(() => {
        const { match } = createRouteState(defaultUtils, '', '', false, () => null);
        expect(match()).toBe(undefined);
      });
    });

    test('react to matchSignal changing from null to a tuple', () =>
      new Promise<void>((resolve) => {
        createRoot(() => {
          const [
            matchSignal,
            setMatchSignal
          ] = createSignal<RouteMatch | null>(null);
          const { match } = createRouteState(defaultUtils, '', '', false, matchSignal);
          createComputed((n = 0) => {
            if (match() === 'foo') {
              expect(n).toBe(1);
              resolve();
            }
            return n + 1;
          }, 0);

          expect(match()).toBe(undefined);
          setMatchSignal(['foo', {}]);
        });
      }));

    test('react to matchSignal changing from an tuple to null', () =>
      new Promise<void>((resolve) => {
        createRoot(() => {
          const [
            matchSignal,
            setMatchSignal
          ] = createSignal<RouteMatch | null>(['foo', {}]);
          const { match } = createRouteState(defaultUtils, '', '', false, matchSignal);
          createComputed((n = 0) => {
            if (match() === undefined) {
              expect(n).toBe(1);
              resolve();
            }
            return n + 1;
          }, 0);

          expect(match()).toBe('foo');
          setMatchSignal(null);
        });
      }));

    test('react to matchSignal changing the first tuple element', () =>
      new Promise<void>((resolve) => {
        createRoot(() => {
          const [
            matchSignal,
            setMatchSignal
          ] = createSignal<RouteMatch | null>(['foo', {}]);
          const { match } = createRouteState(defaultUtils, '', '', false, matchSignal);
          createComputed((n = 0) => {
            if (match() === 'bar') {
              expect(n).toBe(1);
              resolve();
            }
            return n + 1;
          }, 0);

          expect(match()).toBe('foo');
          setMatchSignal(['bar', {}]);
          setMatchSignal(null);
        });
      }));

      test('not react to matchSignal changing the second tuple element', () =>
      new Promise<void>((resolve) => {
        createRoot(() => {
          const [
            matchSignal,
            setMatchSignal
          ] = createSignal<RouteMatch | null>(['foo', {}]);
          const { match } = createRouteState(defaultUtils, '', '', false, matchSignal);
          createComputed((n = 0) => {
            if (match() === undefined) {
              expect(n).toBe(1);
              resolve();
            } else if (n > 0) {
              throw new Error('match should not have reacted');
            }
            return n + 1;
          }, 0);

          expect(match()).toBe('foo');
          setMatchSignal(['foo', { bar: 'baz' }]);
          setMatchSignal(null);
        });
      }));
  });

  describe('have member `params` which should', () => {
    test('be an empty object when matchSignal second tuple element is an empty object', () => {
      createRoot(() => {
        const match: RouteMatch = ['', {}];
        const { params } = createRouteState(defaultUtils, '', '', false, () => match);
        expect(params).toEqual(match[1]);
      });
    });

    test('be an equivelant object when matchSignal second tuple element is a non-empty object', () => {
      createRoot(() => {
        const match: RouteMatch = ['', { foo: new Date().toISOString() }];
        const { params } = createRouteState(defaultUtils, '', '', false, () => match);
        expect(params).toEqual(match[1]);
      });
    });

    test('be an empty object when matchSignal is null', () => {
      createRoot(() => {
        const match = null;
        const { params } = createRouteState(defaultUtils, '', '', false, () => match);
        expect(params).toEqual({});
      });
    });

    test('react to matchSignal changing from null to a tuple', () =>
      new Promise<void>((resolve) => {
        createRoot(() => {
          const match: RouteMatch = ['', { foo: new Date().toISOString() }];
          const [
            matchSignal,
            setMatchSignal
          ] = createSignal<RouteMatch | null>(null);
          const { params } = createRouteState(defaultUtils, '', '', false, matchSignal);
          createComputed((n = 0) => {
            if (params.foo !== undefined) {
              expect(n).toBe(1);
              expect(params).toEqual(match[1]);
              resolve();
            }
            return n + 1;
          }, 0);

          expect(params).toEqual({});
          setMatchSignal(match);
        });
      }));

    test('react to matchSignal changing from a tuple to null', () =>
      new Promise<void>((resolve) => {
        createRoot(() => {
          const match: RouteMatch = ['', { foo: new Date().toISOString() }];
          const [
            matchSignal,
            setMatchSignal
          ] = createSignal<RouteMatch | null>(match);
          const { params } = createRouteState(defaultUtils, '', '', false, matchSignal);
          createComputed((n = 0) => {
            if (params.foo === undefined) {
              expect(n).toBe(1);
              expect(params).toEqual({});
              resolve();
            }
            return n + 1;
          }, 0);

          expect(params).toEqual(match[1]);
          setMatchSignal(null);
        });
      }));

      test('not react to matchSignal changing the first tuple element', () =>
        new Promise<void>((resolve) => {
          createRoot(() => {
            const match: RouteMatch = ['', { foo: new Date().toISOString() }];
            const [
              matchSignal,
              setMatchSignal
            ] = createSignal<RouteMatch | null>(match);
            const { params } = createRouteState(defaultUtils, '', '', false, matchSignal);
            createComputed((n = 0) => {
              if (params.foo === undefined) {
                expect(n).toBe(1);
                expect(params).toEqual({});
                resolve();
              } else if (n > 0) {
                throw new Error('params.foo should not have reacted');
              }
              return n + 1;
            }, 0);
  
            expect(params).toEqual(match[1]);
            setMatchSignal(['foo', match[1]])
            setMatchSignal(null);
          });
        }));

    test('react to fine-grained changes in matchSignal', () =>
      new Promise<void>((resolve) => {
        createRoot(() => {
          const matches: RouteMatch[] = [
            ['', { foo: 'hello' }],
            ['', { foo: 'hello', bar: 'world' }]
          ];
          const [
            matchSignal,
            setMatchSignal
          ] = createSignal<RouteMatch | null>(matches[0]);
          const { params } = createRouteState(defaultUtils, '', '', false, matchSignal);
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
              expect(untrack(() => params)).toEqual(matches[1][1]);
              resolve();
            }
            return n + 1;
          }, 0);

          expect(params).toEqual(matches[0][1]);
          setMatchSignal(matches[1]);
        });
      }));
  });

  describe('have member `resolvePath` which should', () => {
    test('return undefined for paths with a schema', () => {
      const utils = { ...defaultUtils };
      const spy = jest.spyOn(utils, 'resolvePath');
      createRoot(() => {
        const { resolvePath } = createRouteState(utils, '', '', false, () => ['', {}]);
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
        const { resolvePath } = createRouteState(utils, '', '', false, () => ['', {}]);
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
        const { resolvePath } = createRouteState(utils, '/base', '/base/route', false, () => ['/base/route', {}]);
        expect(resolvePath('/')).toBe('/base');
        expect(resolvePath('/foo')).toBe('/base/foo');
        expect(spy).toBeCalledTimes(2);
      });
    });

    test(`use the route path for paths that don't start with '/'`, () => {
      const utils = { ...defaultUtils };
      const spy = jest.spyOn(utils, 'resolvePath');
      createRoot(() => {
        const { resolvePath } = createRouteState(utils, '/base', '/base/route', false, () => ['/base/route', {}]);
        expect(resolvePath('')).toBe('/base/route');
        expect(resolvePath('foo')).toBe('/base/route/foo');
        expect(spy).toBeCalledTimes(2);
      });
    });
  });
});
