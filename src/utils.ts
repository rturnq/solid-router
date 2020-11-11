import regexparam from 'regexparam';
import type { RouteOptions, ParamsCollection, RouteMatcher } from './types';

const hasSchemeRegex = /^(?:[a-z0-9]+:)?\/\//i;
const normalizeRegex = /^\/+|\/+$|\s+/;

function normalize(path: string) {
  const s = path.replace(normalizeRegex, '');
  return s ? '/' + s : '';
}

export function resolvePath(
  base: string,
  path: string,
  from?: string
): string | undefined {
  if (hasSchemeRegex.test(path)) {
    return undefined;
  }

  const basePath = normalize(base);
  const fromPath = from && normalize(from);
  let result = '';
  if (!fromPath || path.charAt(0) === '/') {
    result = basePath;
  } else if (!fromPath.toLowerCase().startsWith(basePath.toLowerCase())) {
    result = basePath + fromPath;
  } else {
    result = fromPath;
  }
  return result + normalize(path) || '/';
}

export function createMatcher(
  path: string,
  options: RouteOptions
): RouteMatcher {
  const { keys, pattern } = regexparam(path, !options.end);
  return (p) => {
    const matches = pattern.exec(p);
    return matches
      ? keys.reduce((acc, _, i) => {
          acc[keys[i]] = matches[i + 1];
          return acc;
        }, {} as ParamsCollection)
      : null;
  };
}

export function parseQuery(queryString: string): ParamsCollection {
  return queryString.split('&').reduce((acc, pair) => {
    const [key, value] = pair.split('=', 2);
    if (key) {
      acc[key.toLowerCase()] = value;
    }
    return acc;
  }, {} as ParamsCollection);
}
