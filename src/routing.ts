import {
  createContext,
  createState,
  useContext,
  createMemo,
  createSignal,
  createRenderEffect,
  useTransition,
  untrack,
  reconcile
} from 'solid-js';
import { createMatcher, parseQuery, resolvePath, renderPath } from './utils';
import type {
  RouteUpdateSignal,
  RouteState,
  RouterState,
  RouterLocation,
  RouteUpdateMode,
  RouterUtils,
  RouteMatch,
  RouterIntegration,
  RedirectOptions
} from './types';

const MAX_REDIRECTS = 100;

interface Referrer {
  ref: string;
  mode: RouteUpdateMode;
}

export const RouterContext = createContext<RouterState>();
export const RouteContext = createContext<RouteState>();

export const useRouter = () => {
  const router = useContext(RouterContext);
  if (!router) {
    throw new Error(
      'No router context defined - ensure your application is wrapped with a Router component'
    );
  }
  return router;
};
export const useRoute = () => useContext(RouteContext) || useRouter().base;

export const defaultUtils = {
  resolvePath,
  createMatcher,
  parseQuery,
  renderPath
};

function normalizeIntegration(
  integration: RouterIntegration | RouteUpdateSignal | undefined
): RouterIntegration {
  if (!integration) {
    return {
      signal: createSignal({ value: '' })
    };
  } else if (Array.isArray(integration)) {
    return {
      signal: integration
    };
  }
  return integration;
}

export function createRouter(
  integration?: RouterIntegration | RouteUpdateSignal,
  basePath: string = '',
  overrides?: Partial<RouterUtils>
): RouterState {
  const {
    signal: [source, setSource],
    utils: intUtils
  } = normalizeIntegration(integration);
  const utils = { ...defaultUtils, ...intUtils, ...overrides };
  const path = utils.resolvePath('', basePath);

  if (path === undefined) {
    throw new Error(`${basePath} is not a valid base path`);
  } else if (path && !source().value) {
    setSource({ value: path, mode: 'init' });
  }

  const baseRoute = createRouteState(utils, path, path, false, () => [
    path,
    {}
  ]);
  const referrers: Referrer[] = [];
  const [isRouting, start] = useTransition();
  const [reference, setReference] = createSignal(source().value);
  const [location] = createState<RouterLocation>({
    get path() {
      return reference().split('?', 1)[0];
    },
    get queryString() {
      return reference().split('?', 2)[1] || '';
    }
  });

  function redirect(
    mode: RouteUpdateMode,
    to: string,
    options: RedirectOptions = {
      resolve: false
    }
  ) {
    const currentRoute = useContext(RouteContext) || baseRoute;
    const resolvedTo = options.resolve
      ? currentRoute.resolvePath(to)
      : utils.resolvePath('', to);
    if (resolvedTo === undefined) {
      throw new Error(`Path '${path}' is not a routable path`);
    }

    const redirectCount = referrers.push({
      ref: untrack(reference),
      mode
    });

    if (redirectCount > MAX_REDIRECTS) {
      throw new Error('Too many redirects');
    }

    start(() => setReference(resolvedTo));
  }

  function handleRouteEnd(nextRef: string) {
    const first = referrers.shift();
    if (first) {
      if (nextRef !== first.ref) {
        setSource({
          value: nextRef,
          mode: first.mode
        });
      }
      referrers.length = 0;
    }
  }

  createRenderEffect(() => {
    start(() => setReference(source().value));
  });

  createRenderEffect(() => {
    handleRouteEnd(reference());
  });

  return {
    base: baseRoute,
    location,
    query: createMapMemo(() =>
      location.queryString ? utils.parseQuery(location.queryString) : {}
    ),
    isRouting,
    utils,
    push(to, options) {
      redirect('push', to, options);
    },
    replace(to, options) {
      redirect('replace', to, options);
    }
  };
}

export function createRoute(
  pattern: string = '',
  end: boolean = false
): RouteState {
  const router = useRouter();
  const parent = useRoute();
  const path = parent.resolvePath(pattern);
  if (path === undefined) {
    throw new Error(`${pattern} is not a valid path`);
  }
  if (parent.end && !end) {
    throw new Error(`Route '${path}' parent is a terminal route`);
  }
  const matcher = router.utils.createMatcher(path, { end });
  const match = createMemo(() => matcher(router.location.path));
  return createRouteState(router.utils, router.base.path, path, end, match);
}

export function createRouteState(
  utils: RouterUtils,
  basePath: string,
  path: string,
  end: boolean,
  matchSignal: () => RouteMatch | null
): RouteState {
  const match = createMemo(() => {
    const routeMatch = matchSignal();
    return routeMatch ? routeMatch[0] : undefined;
  });
  return {
    path,
    end,
    match,
    params: createMapMemo(() => {
      const routeMatch = matchSignal();
      return routeMatch ? routeMatch[1] : {};
    }),
    resolvePath(path: string) {
      const matchPath = match();
      return matchPath !== undefined
        ? utils.resolvePath(basePath, path, matchPath)
        : undefined;
    }
  };
}

function createMapMemo<T>(fn: () => Record<string, T>): Record<string, T> {
  const map = createMemo(fn);
  const data = createMemo(map, undefined, (a, b) => {
    reconcile(b, { key: null })(a as any);
    return true;
  });
  const [state] = createState({
    get map() {
      return data();
    }
  });
  return new Proxy(
    {},
    {
      get(_, key) {
        return state.map[key as any];
      },
      ownKeys() {
        return Reflect.ownKeys(map());
      },
      getOwnPropertyDescriptor() {
        return {
          enumerable: true,
          configurable: true
        };
      }
    }
  );
}
