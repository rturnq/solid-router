import { createEffect, createRoot, createSignal, unwrap } from 'solid-js';
import { createRouter, defaultUtils } from '../src/routing';
import type { RouteUpdate } from '../src/types';
import { createCounter } from './helpers';

describe('Router should', () => {
  describe('have member `base` which should', () => {
    test(`have a default path when basePath is not defined`, () => {
      const utils = { ...defaultUtils };
      const spy = jest.spyOn(utils, 'resolvePath');
      createRoot(() => {
        const signal = createSignal<RouteUpdate>({ value: '' });
        const { base } = createRouter(signal, undefined, utils);
        expect(spy).toBeCalledTimes(1);
        expect(base.path).toBe('/');
      });
    });

    test(`have a normalized version of the basePath when defined`, () => {
      const utils = { ...defaultUtils };
      const spy = jest.spyOn(utils, 'resolvePath');
      createRoot(() => {
        const signal = createSignal<RouteUpdate>({ value: '' });
        const { base } = createRouter(signal, 'base', utils);
        expect(spy).toBeCalledTimes(1);
        expect(base.path).toBe('/base');
      });
    });

    test(`throw when the basePath is invalid`, () => {
      createRoot(() => {
        const signal = createSignal<RouteUpdate>({ value: '' });
        expect(() => createRouter(signal, 'http://example.com')).toThrow();
      });
    });
  });

  describe('have member `location` which should', () => {
    test(`be initialized by the integration signal`, () => {
      createRoot(() => {
        const signal = createSignal<RouteUpdate>({
          value: '/foo/bar?hello=world'
        });
        const { location } = createRouter(signal);
        expect(location.path).toBe('/foo/bar');
        expect(location.queryString).toBe('hello=world');
      });
    });

    describe(`contain property 'path' which should`, () => {
      test(`be reactive to the path part of the integration signal`, () =>
          createRoot(() => {
            const expected = 'fizz/buzz';
            const signal = createSignal<RouteUpdate>({
              value: '/foo/bar?hello=world'
            });
            const { location } = createRouter(signal);
            expect(location.path).toBe('/foo/bar');
            signal[1]({ value: expected + '?hello=world' });
            expect(location.path).toBe(expected);
        }));

      test(`ignore the queryString part of the integration signal`, () =>
          createRoot(() => {
            const signal = createSignal<RouteUpdate>({
              value: '/foo/bar?hello=world'
            });
            const { location } = createRouter(signal);
            const count = createCounter(() => location.path);

            expect(location.path).toBe('/foo/bar');
            signal[1]({ value: '/foo/bar?fizz=buzz' });
            expect(location.path).toBe('/foo/bar');
            expect(count()).toBe(0);
        }));
    });
    describe(`contain propery 'queryString' which should`, () => {
      test(`be reactive to the queryString part of the integration signal`, () =>
          createRoot(() => {
            const expected = 'fizz=buzz';
            const signal = createSignal<RouteUpdate>({
              value: '/foo/bar?hello=world'
            });
            const { location } = createRouter(signal);

            expect(location.queryString).toBe('hello=world');
            signal[1]({ value: '/foo/baz?' + expected });
            expect(location.queryString).toBe(expected);
        }));

      test(`ignore the path part of the integration signal`, () =>
          createRoot(() => {
            const signal = createSignal<RouteUpdate>({
              value: '/foo/bar?hello=world'
            });
            const { location } = createRouter(signal);
            const count = createCounter(() => location.queryString);

            expect(location.queryString).toBe('hello=world');
            signal[1]({ value: '/fizz/buzz?hello=world' });
            expect(location.queryString).toBe('hello=world');
            expect(count()).toBe(0);
        }));
    });
  });

  describe('have member `query` which should', () => {
    test(`be parsed from location.queryString`, () => {
      createRoot(() => {
        const signal = createSignal<RouteUpdate>({
          value: '/foo/bar?hello=world&fizz=buzz'
        });
        const { query } = createRouter(signal);
        expect({ ...query }).toEqual({ hello: 'world', fizz: 'buzz' });
      });
    });

    test(`be parsed using the parseQuery utility`, () => {
      const utils = { ...defaultUtils };
      const spy = jest.spyOn(utils, 'parseQuery');
      createRoot(() => {
        const signal = createSignal<RouteUpdate>({
          value: '/foo/bar?hello=world&fizz=buzz'
        });
        createRouter(signal, undefined, utils);
        expect(spy).toHaveBeenCalledTimes(1);
      });
    });

    test(`be reactive to location.queryString`, () =>
        createRoot(() => {
          const signal = createSignal<RouteUpdate>({
            value: '/foo/bar?hello=world'
          });
          const { query } = createRouter(signal);

          expect({ ...query }).toEqual({ hello: 'world' });
          signal[1]({ value: '/foo/bar?hello=world&fizz=buzz' });
          expect(query.fizz).toEqual('buzz');
      }));

    test(`have fine-grain reactivity`, () =>
        createRoot(() => {
          const signal = createSignal<RouteUpdate>({
            value: '/foo/bar?hello=world'
          });
          const { query } = createRouter(signal);
          const count = createCounter(() => query.hello);

          expect(unwrap(query)).toEqual({ hello: 'world' });
          signal[1]({ value: '/foo/bar?hello=world&fizz=buzz' });
          expect(query.fizz).toEqual('buzz');
          expect(count()).toBe(0);
      }));
  });

  describe('have member `push` which should', () => {
    test(`update the location each time it is called`, () => {
      createRoot(() => {
        const signal = createSignal<RouteUpdate>({
          value: '/'
        });
        const { location, push } = createRouter(signal);

        expect(location.path).toBe('/');
        push('/foo/1');
        expect(location.path).toBe('/foo/1');
        push('/foo/2');
        expect(location.path).toBe('/foo/2');
        push('/foo/3');
        expect(location.path).toBe('/foo/3');
      });
    });

    test(`do nothing if the new path is the same`, () =>
        createRoot(() => {
          const signal = createSignal<RouteUpdate>({
            value: '/foo/bar'
          });
          const { location, push } = createRouter(signal);
          const count = createCounter(() => location.path);

          expect(location.path).toBe('/foo/bar');
          push('/foo/bar');
          expect(location.path).toBe('/foo/bar');
          expect(count()).toBe(0)
      }));

    test(`update the integrationSignal`, () =>
      new Promise<void>((resolve) => {
        createRoot(() => {
          const signal = createSignal<RouteUpdate>({
            value: '/'
          });
          const { push } = createRouter(signal);
          createEffect<number>((n = 0) => {
            const { value, mode } = signal[0]();
            if (value === '/foo/bar') {
              expect(n).toBe(1);
              expect(mode).toBe('push');
              resolve();
            }
            return n + 1;
          });

          expect(signal[0]().value).toBe('/');
          push('/foo/bar');
        });
      }));

    test(`be able to be called many times before it updates the integrationSignal`, () =>
      new Promise<void>((resolve) => {
        createRoot(() => {
          const signal = createSignal<RouteUpdate>({
            value: '/'
          });
          const { push } = createRouter(signal);
          createEffect<number>((n = 0) => {
            const { value, mode } = signal[0]();
            if (value === '/foo/5') {
              expect(n).toBe(1);
              expect(mode).toBe('push');
              resolve();
            }
            return n + 1;
          });

          expect(signal[0]()).toEqual({ value: '/' });
          push('/foo/1');
          push('/foo/2');
          push('/foo/3');
          push('/foo/4');
          push('/foo/5');
        });
      }));

    test(`throw if called more than 100 times during a reactive update`, () => {
      createRoot(() => {
        const signal = createSignal<RouteUpdate>({
          value: '/'
        });
        const { push } = createRouter(signal);
        function pushAlot() {
          for (let i = 0; i < 101; i++) {
            push(`/foo/${i}`);
          }
        }
        expect(pushAlot).toThrow('Too many redirects');
      });
    });
  });

  describe('have member `replace` which should', () => {
    test(`update the location each time it is called`, () => {
      createRoot(() => {
        const signal = createSignal<RouteUpdate>({
          value: '/'
        });
        const { location, replace } = createRouter(signal);

        expect(location.path).toBe('/');
        replace('/foo/1');
        expect(location.path).toBe('/foo/1');
        replace('/foo/2');
        expect(location.path).toBe('/foo/2');
        replace('/foo/3');
        expect(location.path).toBe('/foo/3');
      });
    });

    test(`do nothing if the new path is the same`, () =>
        createRoot(() => {
          const signal = createSignal<RouteUpdate>({
            value: '/foo/bar'
          });
          const { location, replace } = createRouter(signal);
          const count = createCounter(() => location.path);

          expect(location.path).toBe('/foo/bar');
          replace('/foo/bar');
          expect(location.path).toBe('/foo/bar');
          expect(count()).toBe(0);
      }));

    test(`update the integrationSignal`, () =>
      new Promise<void>((resolve) => {
        createRoot(() => {
          const signal = createSignal<RouteUpdate>({
            value: '/'
          });
          const { replace } = createRouter(signal);
          createEffect<number>((n = 0) => {
            const { value, mode } = signal[0]();
            if (value === '/foo/bar') {
              expect(n).toBe(1);
              expect(mode).toBe('replace');
              resolve();
            }
            return n + 1;
          });

          expect(signal[0]().value).toBe('/');
          replace('/foo/bar');
        });
      }));

    test(`be able to be called many times before it updates the integrationSignal`, () =>
      new Promise<void>((resolve) => {
        createRoot(() => {
          const signal = createSignal<RouteUpdate>({
            value: '/'
          });
          const { replace } = createRouter(signal);
          createEffect<number>((n = 0) => {
            const { value, mode } = signal[0]();
            if (value === '/foo/5') {
              expect(n).toBe(1);
              expect(mode).toBe('replace');
              resolve();
            }
            return n + 1;
          });

          expect(signal[0]()).toEqual({ value: '/' });
          replace('/foo/1');
          replace('/foo/2');
          replace('/foo/3');
          replace('/foo/4');
          replace('/foo/5');
        });
      }));

    test(`throw if called more than 100 times during a reactive update`, () => {
      createRoot(() => {
        const signal = createSignal<RouteUpdate>({
          value: '/'
        });
        const { replace } = createRouter(signal);
        function replaceAlot() {
          for (let i = 0; i < 101; i++) {
            replace(`/foo/${i}`);
          }
        }
        expect(replaceAlot).toThrow('Too many redirects');
      });
    });
  });

  describe('update the integration signal with the first update mode', () => {
    test(`when that is push`, () =>
      new Promise<void>((resolve) => {
        createRoot(() => {
          const signal = createSignal<RouteUpdate>({
            value: '/'
          });
          const { push, replace } = createRouter(signal);
          createEffect<number>((n = 0) => {
            const { value, mode } = signal[0]();
            if (value === '/foo/3') {
              expect(n).toBe(1);
              expect(mode).toBe('push');
              resolve();
            } else if (n > 0) {
              throw new Error('Route integratio signal updated too soon');
            }
            return n + 1;
          });

          expect(signal[0]().value).toBe('/');
          push('/foo/1');
          replace('/foo/1');
          replace('/foo/2');
          replace('/foo/3');
        });
      }));

    test(`when that is replace`, () =>
      new Promise<void>((resolve) => {
        createRoot(() => {
          const signal = createSignal<RouteUpdate>({
            value: '/'
          });
          const { push, replace } = createRouter(signal);
          createEffect<number>((n = 0) => {
            const { value, mode } = signal[0]();
            if (value === '/foo/3') {
              expect(n).toBe(1);
              expect(mode).toBe('replace');
              resolve();
            } else if (n > 0) {
              throw new Error('Route integratio signal updated too soon');
            }
            return n + 1;
          });

          expect(signal[0]().value).toBe('/');
          replace('/foo/1');
          push('/foo/1');
          push('/foo/2');
          push('/foo/3');
        });
      }));
  });

  describe('have member `isRouting` which should', () => {
    test.skip('be true when the push or replace causes transition', () => {
      throw new Error('Test not implemented');
    });
  });
});
