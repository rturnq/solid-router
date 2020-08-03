import { createContext, createMemo, useContext, createState } from 'solid-js';
import { useRouter } from './routerContext';
import { createMatchResultFn, createMatchTestFn, resolvePath } from './utils';
import { Route, MatchTestFn, StringMap } from './types';

interface State {
  params: StringMap,
  matchedPath: string
}

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
  return () => matchFn()(location().pathName);
}

export function createMatchRoute(
  basePath: string,
  parentRoute?: Route,
  path?: string,
  end?: boolean,
  strict?: boolean
): [Route, MatchTestFn] {
  const [state, setState] = createState<State>({
    params: {},
    matchedPath: ''
  });

  const allParams = createMemo<StringMap>(() => ({
    ...parentRoute?.getParams(),
    ...state.params
  }))

  const fullPath = resolvePath(basePath, parentRoute?.path, path);
  const matchFn = createMatchResultFn(fullPath, end, strict);

  const route: Route = {
    path: fullPath,
    matchedPath: () => state.matchedPath,
    getParams: <T extends StringMap = StringMap>() => allParams() as T,
    resolvePath: (path) => resolvePath(basePath, state.matchedPath, path)
  };

  const match = (path: string) => {
    const result = matchFn(path);
    if (result) {
      setState({
        params: result.params,
        matchedPath: result.path
      });
      return true;
    }
    return false
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
  const isMatch = () => match(location().pathName);

  return [route, isMatch];
}
