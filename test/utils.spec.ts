import { createMatcher, parseQuery, resolvePath } from '../src/utils';

describe('resolvePath should', () => {
  test('normalize the base arg', () => {
    const expected = '/base';
    const actual = resolvePath('base', '');
    expect(actual).toBe(expected);
  });

  test('normalize the path arg', () => {
    const expected = '/path';
    const actual = resolvePath('', 'path');
    expect(actual).toBe(expected);
  });

  test('normalize the from arg', () => {
    const expected = '/from';
    const actual = resolvePath('', '', 'from');
    expect(actual).toBe(expected);
  });

  test('returns the default path when all ags are empty', () => {
    const expected = '/';
    const actual = resolvePath('', '');
    expect(actual).toBe(expected);
  });

  test('resolve root path against base and ignore from', () => {
    const expected = '/base';
    const actual = resolvePath('/base', '/', '/base/foo');
    expect(actual).toBe(expected);
  });

  test('resolve rooted paths against base and ignore from', () => {
    const expected = '/base/bar';
    const actual = resolvePath('/base', '/bar', '/base/foo');
    expect(actual).toBe(expected);
  });

  test('resolve empty path against from', () => {
    const expected = '/base/foo';
    const actual = resolvePath('/base', '', '/base/foo');
    expect(actual).toBe(expected);
  });

  test('resolve relative paths against from', () => {
    const expected = '/base/foo/bar';
    const actual = resolvePath('/base', 'bar', '/base/foo');
    expect(actual).toBe(expected);
  });

  test('prepend base if from does not start with it', () => {
    const expected = '/base/foo/bar';
    const actual = resolvePath('/base', 'bar', '/foo');
    expect(actual).toBe(expected);
  });

  test(`test start of from against base case-insensitive`, () => {
    const expected = '/BASE/foo/bar';
    const actual = resolvePath('/base', 'bar', 'BASE/foo');
    expect(actual).toBe(expected);
  });
});

describe('parseQuery should', () => {
  test('return empty object for empty string', () => {
    const expected = {};
    const actual = parseQuery('');
    expect(actual).toEqual(expected);
  });

  test('work for one parameter', () => {
    const expected = { foo: 'bar' };
    const actual = parseQuery('foo=bar');
    expect(actual).toEqual(expected);
  });

  test('work for two parameter', () => {
    const expected = { foo: 'bar', two: '2' };
    const actual = parseQuery('foo=bar&two=2');
    expect(actual).toEqual(expected);
  });

  test('be naive and overrite duplicate keys', () => {
    const expected = { foo: 'baz', two: '2' };
    const actual = parseQuery('foo=bar&two=2&foo=baz');
    expect(actual).toEqual(expected);
  });
});

describe('createMatcher should', () => {
  test('return empty object when location matches simple path', () => {
    const expected = ['/foo/bar', {}];
    const matcher = createMatcher('/foo/bar', { end: false });
    expect(matcher('/foo/bar')).toEqual(expected);
  });

  test('return null when location does not match', () => {
    const expected = null;
    const matcher = createMatcher('/foo/bar', { end: false });
    expect(matcher('/foo/baz')).toEqual(expected);
  });

  test('return params collection when location matches parameterized path', () => {
    const expected = ['/foo/abc-123', { id: 'abc-123' }];
    const matcher = createMatcher('/foo/:id', { end: false });
    expect(matcher('/foo/abc-123')).toEqual(expected);
  });

  test('match past end when end option is false', () => {
    const expected = ['/foo/bar', {}];
    const matcher = createMatcher('/foo/bar', { end: false });
    expect(matcher('/foo/bar/baz')).toEqual(expected);
  });

  test('not match past end when end option is true', () => {
    const expected = null;
    const matcher = createMatcher('/foo/bar', { end: true });
    expect(matcher('/foo/bar/baz')).toEqual(expected);
  });
});
