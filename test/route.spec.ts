import { createRoot, createSignal } from 'solid-js';
import { unwrap } from 'solid-js/store'
import { defaultUtils, createRouteState } from '../src/routing';
import { RouteMatch } from '../src/types';
import { createCounter } from './helpers';

describe('RouteState should', () => {
  describe('have member `path` which should', () => {
    test('be the value passed in to createRouteState', () => {
      createRoot(() => {
        for (let expected of ['test', '/test', '//test', '/', '']) {
          const { path } = createRouteState(
            defaultUtils,
            '',
            expected,
            false,
            () => ['', {}]
          );
          expect(path).toBe(expected);
        }
      });
    });
  });

  describe('have member `match` which should', () => {
    test('be the first item route when matchSignal is a tuple', () => {
      createRoot(() => {
        const { match } = createRouteState(defaultUtils, '', '', false, () => [
          'foo',
          {}
        ]);
        expect(match()).toBe('foo');
      });
    });

    test('be undefined when matchSignal is null', () => {
      createRoot(() => {
        const { match } = createRouteState(
          defaultUtils,
          '',
          '',
          false,
          () => null
        );
        expect(match()).toBe(undefined);
      });
    });

    test('react to matchSignal changing from null to a tuple', () =>
      createRoot(() => {
        const [matchSignal, setMatchSignal] = createSignal<RouteMatch | null>(
          null
        );
        const { match } = createRouteState(
          defaultUtils,
          '',
          '',
          false,
          matchSignal
        );

        expect(match()).toBe(undefined);
        setMatchSignal(['foo', {}]);
        expect(match()).toBe('foo');
      }));

    test('react to matchSignal changing from an tuple to null', () =>
      createRoot(() => {
        const [matchSignal, setMatchSignal] = createSignal<RouteMatch | null>([
          'foo',
          {}
        ]);
        const { match } = createRouteState(
          defaultUtils,
          '',
          '',
          false,
          matchSignal
        );

        expect(match()).toBe('foo');
        setMatchSignal(null);
        expect(match()).toBe(undefined);
      }));

    test('react to matchSignal changing the first tuple element', () =>
      createRoot(() => {
        const [matchSignal, setMatchSignal] = createSignal<RouteMatch | null>([
          'foo',
          {}
        ]);
        const { match } = createRouteState(
          defaultUtils,
          '',
          '',
          false,
          matchSignal
        );

        expect(match()).toBe('foo');
        setMatchSignal(['bar', {}]);
        expect(match()).toBe('bar');
      }));

    test('not react to matchSignal changing the second tuple element', () =>
      createRoot(() => {
        const [matchSignal, setMatchSignal] = createSignal<RouteMatch | null>([
          'foo',
          {}
        ]);
        const { match } = createRouteState(
          defaultUtils,
          '',
          '',
          false,
          matchSignal
        );
        const count = createCounter(() => match());

        expect(match()).toBe('foo');
        setMatchSignal(['foo', { bar: 'baz' }]);
        expect(match()).toBe('foo');
        expect(count()).toBe(0);
      }));
  });

  describe('have member `params` which should', () => {
    test('be an empty object when matchSignal second tuple element is an empty object', () => {
      createRoot(() => {
        const match: RouteMatch = ['', {}];
        const { params } = createRouteState(
          defaultUtils,
          '',
          '',
          false,
          () => match
        );
        expect(unwrap(params)).toEqual(match[1]);
      });
    });

    test('be an equivelant object when matchSignal second tuple element is a non-empty object', () => {
      createRoot(() => {
        const match: RouteMatch = ['', { foo: new Date().toISOString() }];
        const { params } = createRouteState(
          defaultUtils,
          '',
          '',
          false,
          () => match
        );
        expect(unwrap(params)).toEqual(match[1]);
      });
    });

    test('be an empty object when matchSignal is null', () => {
      createRoot(() => {
        const match = null;
        const { params } = createRouteState(
          defaultUtils,
          '',
          '',
          false,
          () => match
        );
        expect(unwrap(params)).toEqual({});
      });
    });

    test('react to matchSignal changing from null to a tuple', () =>
      createRoot(() => {
        const match: RouteMatch = ['', { foo: new Date().toISOString() }];
        const [matchSignal, setMatchSignal] = createSignal<RouteMatch | null>(
          null
        );
        const { params } = createRouteState(
          defaultUtils,
          '',
          '',
          false,
          matchSignal
        );

        expect(unwrap(params)).toEqual({});
        setMatchSignal(match);
        expect(unwrap(params)).toEqual(match[1]);
      }));

    test('react to matchSignal changing from a tuple to null', () =>
      createRoot(() => {
        const match: RouteMatch = ['', { foo: new Date().toISOString() }];
        const [matchSignal, setMatchSignal] = createSignal<RouteMatch | null>(
          match
        );
        const { params } = createRouteState(
          defaultUtils,
          '',
          '',
          false,
          matchSignal
        );

        expect(unwrap(params)).toEqual(match[1]);
        setMatchSignal(null);
        expect(unwrap(params)).toEqual({});
      }));

    test('not react to matchSignal changing the first tuple element', () =>
      createRoot(() => {
        const match: RouteMatch = ['', { foo: new Date().toISOString() }];
        const [matchSignal, setMatchSignal] = createSignal<RouteMatch | null>(
          match
        );
        const { params } = createRouteState(
          defaultUtils,
          '',
          '',
          false,
          matchSignal
        );
        const count = createCounter(() => params.foo);
        expect(unwrap(params)).toEqual(match[1]);
        setMatchSignal(['foo', match[1]]);
        expect(params.foo).toEqual(match[1].foo);
        expect(count()).toBe(0);
      }));

    test('react to fine-grained changes in matchSignal', () =>
      createRoot(() => {
        const matches: RouteMatch[] = [
          ['', { foo: 'hello' }],
          ['', { foo: 'hello', bar: 'world' }]
        ];
        const [matchSignal, setMatchSignal] = createSignal<RouteMatch | null>(
          matches[0]
        );
        const { params } = createRouteState(
          defaultUtils,
          '',
          '',
          false,
          matchSignal
        );
        const count = createCounter(() => params.foo);

        expect(unwrap(params)).toEqual(matches[0][1]);
        setMatchSignal(matches[1]);
        expect(unwrap(params)).toEqual(matches[1][1]);
        expect(params.bar).toBe('world');

        // Note: This really should be 0 but the underlying mapMemo is not perfect and causes existing properties to update when its keys change
        expect(count()).toBe(1);
      }));

    test('react to a existing property changing', () =>
      createRoot(() => {
        const matches: RouteMatch[] = [
          ['', { foo: 'hello' }],
          ['', { foo: 'world' }]
        ];
        const [matchSignal, setMatchSignal] = createSignal<RouteMatch | null>(
          matches[0]
        );
        const { params } = createRouteState(
          defaultUtils,
          '',
          '',
          false,
          matchSignal
        );
        const count = createCounter(() => params.foo);

        expect(params.foo).toBe('hello');
        setMatchSignal(matches[1]);
        expect(params.foo).toBe('world');
        expect(count()).toBe(1);
      }));
  });

  describe('have member `resolvePath` which should', () => {
    test('return undefined for paths with a schema', () => {
      const utils = { ...defaultUtils };
      const spy = jest.spyOn(utils, 'resolvePath');
      createRoot(() => {
        const { resolvePath } = createRouteState(utils, '', '', false, () => [
          '',
          {}
        ]);
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
        const { resolvePath } = createRouteState(utils, '', '', false, () => [
          '',
          {}
        ]);
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
        const { resolvePath } = createRouteState(
          utils,
          '/base',
          '/base/route',
          false,
          () => ['/base/route', {}]
        );
        expect(resolvePath('/')).toBe('/base');
        expect(resolvePath('/foo')).toBe('/base/foo');
        expect(spy).toBeCalledTimes(2);
      });
    });

    test(`use the route path for paths that don't start with '/'`, () => {
      const utils = { ...defaultUtils };
      const spy = jest.spyOn(utils, 'resolvePath');
      createRoot(() => {
        const { resolvePath } = createRouteState(
          utils,
          '/base',
          '/base/route',
          false,
          () => ['/base/route', {}]
        );
        expect(resolvePath('')).toBe('/base/route');
        expect(resolvePath('foo')).toBe('/base/route/foo');
        expect(spy).toBeCalledTimes(2);
      });
    });
  });
});
