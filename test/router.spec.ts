import { createRoot, createSignal, unwrap } from 'solid-js';
import { createRouter, defaultUtils } from '../src/routing';
import type { RouteUpdate } from '../src/types';
import { createAsyncRoot, createCounter, waitFor } from './helpers';

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
        createAsyncRoot((resolve) => {
          const expected = 'fizz/buzz';
          const signal = createSignal<RouteUpdate>({
            value: '/foo/bar?hello=world'
          });
          const { location } = createRouter(signal);
          expect(location.path).toBe('/foo/bar');
          signal[1]({ value: expected + '?hello=world' });

          waitFor(() => signal[0]().value === expected + '?hello=world').then(
            () => {
              expect(location.path).toBe(expected);
              resolve();
            }
          );
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
        createAsyncRoot((resolve) => {
          const expected = 'fizz=buzz';
          const signal = createSignal<RouteUpdate>({
            value: '/foo/bar?hello=world'
          });
          const { location } = createRouter(signal);

          expect(location.queryString).toBe('hello=world');
          signal[1]({ value: '/foo/baz?' + expected });

          waitFor(() => signal[0]().value === '/foo/baz?' + expected).then(
            () => {
              expect(location.queryString).toBe(expected);
              resolve();
            }
          );
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
        expect(unwrap(query)).toEqual({ hello: 'world', fizz: 'buzz' });
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
      createAsyncRoot((resolve) => {
        const signal = createSignal<RouteUpdate>({
          value: '/foo/bar?hello=world'
        });
        const { query } = createRouter(signal);

        expect(unwrap(query)).toEqual({ hello: 'world' });
        signal[1]({ value: '/foo/bar?hello=world&fizz=buzz' });

        waitFor(
          () => signal[0]().value === '/foo/bar?hello=world&fizz=buzz'
        ).then(() => {
          expect(query.fizz).toEqual('buzz');
          resolve();
        });
      }));

    test(`have fine-grain reactivity`, () =>
      createAsyncRoot((resolve) => {
        const signal = createSignal<RouteUpdate>({
          value: '/foo/bar?hello=world'
        });
        const { query } = createRouter(signal);
        const count = createCounter(() => query.hello);

        expect(unwrap(query)).toEqual({ hello: 'world' });
        signal[1]({ value: '/foo/bar?hello=world&fizz=buzz' });

        waitFor(
          () => signal[0]().value === '/foo/bar?hello=world&fizz=buzz'
        ).then(() => {
          expect(query.fizz).toEqual('buzz');

          // Note: This really should be 0 but the underlying mapMemo is not perfect and causes existing properties to update when its keys change.
          expect(count()).toBe(1);

          resolve();
        });
      }));

    

    test(`have properties which are reactive`, () =>
      createAsyncRoot((resolve) => {
        const signal = createSignal<RouteUpdate>({
          value: '/foo/bar?hello=world'
        });
        const { query } = createRouter(signal);
        const count = createCounter(() => query.hello);

        expect(unwrap(query)).toEqual({ hello: 'world' });
        signal[1]({ value: '/foo/bar?hello=foo' });

        waitFor(
          () => signal[0]().value === '/foo/bar?hello=foo'
        ).then(() => {
          expect(query.hello).toEqual('foo');
          expect(count()).toBe(1);
          resolve();
        });
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
        expect(count()).toBe(0);
      }));

    test(`update the integrationSignal`, () =>
      createAsyncRoot((resolve) => {
        const signal = createSignal<RouteUpdate>({
          value: '/'
        });
        const { push } = createRouter(signal);
        expect(signal[0]().value).toBe('/');
        push('/foo/bar');

        waitFor(() => signal[0]().value === '/foo/bar').then((n) => {
          expect(n).toBe(1);
          expect(signal[0]().mode).toBe('push');
          resolve();
        });
      }));

    test(`be able to be called many times before it updates the integrationSignal`, () =>
      createAsyncRoot((resolve) => {
        const signal = createSignal<RouteUpdate>({
          value: '/'
        });
        const { push } = createRouter(signal);

        expect(signal[0]()).toEqual({ value: '/' });
        push('/foo/1');
        push('/foo/2');
        push('/foo/3');
        push('/foo/4');
        push('/foo/5');

        waitFor(() => signal[0]().value === '/foo/5').then((n) => {
          expect(n).toBe(1);
          expect(signal[0]().mode).toBe('push');
          resolve();
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

          expect(signal[0]().value).toBe('/');
          replace('/foo/bar');

          waitFor(() => signal[0]().value === '/foo/bar').then((n) => {
            expect(n).toBe(1);
            expect(signal[0]().mode).toBe('replace');
            resolve();
          });
        });
      }));

    test(`be able to be called many times before it updates the integrationSignal`, () =>
      new Promise<void>((resolve) => {
        createRoot(() => {
          const signal = createSignal<RouteUpdate>({
            value: '/'
          });
          const { replace } = createRouter(signal);

          expect(signal[0]()).toEqual({ value: '/' });
          replace('/foo/1');
          replace('/foo/2');
          replace('/foo/3');
          replace('/foo/4');
          replace('/foo/5');

          waitFor(() => signal[0]().value === '/foo/5').then((n) => {
            expect(n).toBe(1);
            expect(signal[0]().mode).toBe('replace');
            resolve();
          });
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

          expect(signal[0]().value).toBe('/');
          push('/foo/1');
          replace('/foo/1');
          replace('/foo/2');
          replace('/foo/3');

          waitFor(() => signal[0]().value === '/foo/3').then((n) => {
            expect(n).toBe(1);
            expect(signal[0]().mode).toBe('push');
            resolve();
          });
        });
      }));

    test(`when that is replace`, () =>
      new Promise<void>((resolve) => {
        createRoot(() => {
          const signal = createSignal<RouteUpdate>({
            value: '/'
          });
          const { push, replace } = createRouter(signal);

          expect(signal[0]().value).toBe('/');
          replace('/foo/1');
          push('/foo/1');
          push('/foo/2');
          push('/foo/3');

          waitFor(() => signal[0]().value === '/foo/3').then((n) => {
            expect(n).toBe(1);
            expect(signal[0]().mode).toBe('replace');
            resolve();
          });
        });
      }));
  });

  describe('have member `isRouting` which should', () => {
    test.skip('be true when the push or replace causes transition', () => {
      throw new Error('Test not implemented');
    });
  });
});
