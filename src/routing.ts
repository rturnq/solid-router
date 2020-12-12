import {
  createContext,
  createState,
  createComputed,
  useContext,
  createMemo,
  createSignal,
  createRenderEffect,
  useTransition,
  untrack,
  reconcile
} from 'solid-js';
import { isServer } from 'solid-js/web';
import { createMatcher, parseQuery, resolvePath, renderPath } from './utils';
import type {
  RouteUpdateSignal,
  RouteState,
  RouterState,
  RouterLocation,
  RouteUpdateMode,
  RouterUtils,
  RouteMatch,
  RouterIntegration
} from './types';

const MAX_REDIRECTS = 100;

interface Referrer {
  ref: string;
  mode: RouteUpdateMode;
}

export const RouterContext = createContext<RouterState>();
export const RouteContext = createContext<RouteState>();

export const useRouter = () => useContext(RouterContext);
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

  const route = createRouteState(utils, path, path, false, () => [path, {}]);
  const referrers: Referrer[] = [];
  const [isRouting, start] = useTransition();
  const [reference, setReference] = createSignal(source().value, true);
  const location = createStateMemo<RouterLocation>(() => {
    const [path, queryString = ''] = reference().split('?', 2);
    return {
      path,
      queryString
    };
  });
  const query = createStateMemo<Record<string, string>>(() => {
    const qs = location.queryString;
    return qs ? utils.parseQuery(qs) : {};
  });

  function redirect(mode: RouteUpdateMode, to: string) {
    const redirectCount = referrers.push({
      ref: untrack(reference),
      mode
    });

    if (redirectCount > MAX_REDIRECTS) {
      throw new Error('Too many redirects');
    }

    start(() => setReference(to));
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

  createComputed(() => {
    start(() => setReference(source().value));
  });

  if (isServer) {
    let notifyTimeout: any;
    createComputed(() => {
      const nextRef = reference();
      clearTimeout(notifyTimeout);
      notifyTimeout = setTimeout(() => handleRouteEnd(nextRef));
    });
  } else {
    createRenderEffect(() => {
      handleRouteEnd(reference());
    });
  }

  return {
    base: route,
    location,
    query,
    isRouting,
    utils,
    push(to) {
      redirect('push', to);
    },
    replace(to) {
      redirect('replace', to);
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
  const match = createMemo(
    () => {
      const routeMatch = matchSignal();
      return routeMatch ? routeMatch[0] : undefined;
    },
    undefined,
    true
  );
  return {
    path,
    end,
    match,
    params: createStateMemo(() => {
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

function createStateMemo<T extends {}>(fn: () => T) {
  const [state, setState] = createState({} as T);
  createComputed(() => {
    setState(reconcile(fn(), { key: null }));
  });
  return state;
}
