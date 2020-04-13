import { createContext, createMemo, useContext } from 'solid-js';
import { useRouter } from './routerContext';
import { createMatchResultFn, createMatchTestFn, resolvePath } from './utils';
import { Route, MatchTestFn, StringMap } from './types';

export const RouteContext = createContext<Route>();

export function useRoute() {
  return useContext(RouteContext);
}

export function useMatch(path: string, end?: boolean, strict?: boolean) {
  const { location } = useRouter();
  const { resolvePath } = useRoute();
  const matchFn = createMemo(() =>
    createMatchTestFn(resolvePath(path), end, strict)
  );
  return () => matchFn()(location().path);
}

export function createMatchRoute(
  basePath: string,
  parentRoute?: Route,
  path?: string,
  end?: boolean,
  strict?: boolean
): [Route, MatchTestFn] {
  let params: StringMap = {};
  let matchedPath = '';

  const fullPath = resolvePath(basePath, parentRoute?.path, path);
  const matchFn = createMatchResultFn(fullPath, end, strict);

  const route: Route = {
    path: fullPath,
    matchedPath: () => matchedPath,
    getParams: <T extends StringMap = StringMap>() =>
      ({
        ...parentRoute?.getParams(),
        ...params
      } as T),
    resolvePath: (path) => resolvePath(basePath, matchedPath, path)
  };

  const match = (path: string) => {
    const result = matchFn(path);
    if (result) {
      params = result.params;
      matchedPath = result.path;
    }
    return !!result;
  };

  return [route, match];
}

export function createRoute(
  path?: string,
  end?: boolean,
  strict?: boolean
): [Route, () => boolean] {
  const { location, basePath } = useRouter();
  const parentRoute = useRoute();
  const [route, match] = createMatchRoute(
    basePath,
    parentRoute,
    path,
    end,
    strict
  );
  return [route, () => match(location().path)];
}
