import { match } from 'path-to-regexp';
import { MatchResultFn, MatchTestFn, StringMap, Loc } from './types';

export function isPathRelative(path: string) {
  return !path.startsWith('/');
}

export function resolvePath(
  basePath: string,
  prevPath?: string,
  nextPath?: string
): string {
  if (!nextPath) {
    return prevPath ?? basePath;
  }
  if (isPathRelative(nextPath)) {
    return normalizePath(`${prevPath ?? basePath}/${nextPath}`);
  }
  return normalizePath(`${basePath}/${nextPath}`);
}

export function normalizePath(path: string) {
  return '/' + path.replace(/[\/\\]+/g, '/').replace(/^\/|\/$/g, '');
}

function splitPath(path: string) {
  return path.split('/').filter((p) => !!p);
}

export function isBase(basePath: string, testPath: string) {
  const basePathParts = splitPath(basePath.toLowerCase());
  const testPathParts = splitPath(testPath.toLowerCase());
  return basePathParts.every((p, i) => p === testPathParts[i]);
}

export function createMatchResultFn(
  path?: string,
  end: boolean = false,
  strict: boolean = false
): MatchResultFn {
  if (!path) {
    return () => ({
      params: {},
      path: ''
    });
  }
  const [pathName] = path.split('?');
  const fn = match(pathName, { end, strict });
  return (path) => fn(path) || undefined;
}

export function createMatchTestFn(
  path?: string,
  end: boolean = false,
  strict: boolean = false
): MatchTestFn {
  if (!path) {
    return () => true;
  }
  const fn = createMatchResultFn(path, end, strict);
  return (path) => !!fn(path);
}

export function createPathResolver(basePath: string) {
  return (path: string) => resolvePath(basePath, undefined, path);
}

export function createUriResolver(origin: string, basePath: string) {
  const trimmedOrigin = origin.replace(/\/+$/, '');
  return (path: string) =>
    trimmedOrigin + resolvePath(basePath, undefined, path);
}

export function pathToLocation(path: string): Loc {
  const [pathName, queryString = ''] = path.split('?');
  return {
    path,
    pathName,
    queryString
  };
}

export function pathNameToLocation(pathName: string, queryString: string = ''): Loc {
  const path = queryString ? `${pathName}?${queryString}` : pathName;
  return {
    path,
    pathName,
    queryString
  };
}

export function parseQueryString(queryString: string = '') {
  const map: StringMap = {};
  return queryString
    ? queryString.split('&').reduce((acc, pair) => {
        const [key, value] = pair.split('=');
        acc[key] = value;
        return acc;
      }, map)
    : map;
}