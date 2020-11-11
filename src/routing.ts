import {
  createContext,
  createState,
  createComputed,
  useContext,
  onCleanup,
  createMemo,
  createSignal,
  createRenderEffect,
  useTransition,
  untrack,
  reconcile
} from 'solid-js';
import { createMatcher, parseQuery, resolvePath } from './utils';
import type {
  RouteUpdateSignal,
  ParamsCollection,
  RouteState,
  RouterState,
  RouterLocation,
  RouteUpdateMode,
  RouterUtils
} from './types';

const CurrentNode = Symbol('current-route-node');
const RootNode = Symbol('root-route-node');
const MAX_REDIRECTS = 100;

interface RouterInernal extends RouterState {
  [CurrentNode]: RouteNode;
  [RootNode]: RouteNode;
}

interface Referrer {
  ref: string;
  mode: RouteUpdateMode;
}

export const RouterContext = createContext<RouterState>();
export const useRouter = () => useContext(RouterContext);
export const useRoute = () => getRouteNode(useRouter() as RouterInernal).route;
export const useIsMatch = (pattern: string, end: boolean = false) => {
  const router = useRouter() as RouterInernal;
  const { route } = getRouteNode(router);
  const path = route.resolvePath(pattern);
  if (!path) {
    return () => false;
  }
  const matcher = router.utils.createMatcher(path, { end });
  return createMemo(() => matcher(router.location.path) === null, false, true);
};

export const defaultUtils = {
  resolvePath,
  createMatcher,
  parseQuery
};

export function createRouter(
  integration?: RouteUpdateSignal,
  basePath: string = '',
  overrides?: Partial<RouterUtils>
): RouterState {
  const utils = { ...defaultUtils, ...overrides };
  const path = utils.resolvePath('', basePath);
  if (!path) {
    throw new Error(`${basePath} is not a valid base path`);
  }

  const route = createRoute(utils, path, path, () => ({}));
  const root = new RouteNode(undefined, route, false);
  const referrers: Referrer[] = [];

  const [source, setSource] = integration ?? createSignal({ value: path });
  const [isRouting, start] = useTransition();
  const [reference, setReference] = createSignal(source().value, true);
  const location = createStateMemo<RouterLocation>(() => {
    const [path, queryString = ''] = reference().split('?', 2);
    return {
      path,
      queryString
    };
  });
  const query = createStateMemo<ParamsCollection>(() => {
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

  createComputed(() => {
    setReference(source().value);
  });

  createRenderEffect(() => {
    const nextRef = reference();
    if (referrers.length) {
      const { ref, mode } = referrers.shift()!;
      if (nextRef !== ref) {
        setSource({
          value: nextRef,
          mode
        });
      }
      referrers.length = 0;
    }
  });

  return {
    [RootNode]: root,
    [CurrentNode]: root,
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
  } as RouterInernal;
}

function getRouteNode(router: RouterInernal) {
  return router[CurrentNode] || new Error('No parent route');
}

export function createRouteScope(
  pattern: string = '',
  end: boolean = false
): [(fn: (route: RouteState, router: RouterState) => JSX.Element) => JSX.Element, RouteState] {
  const router = useRouter() as RouterInernal;
  const parent = getRouteNode(router);
  const path = router.utils.resolvePath(parent.route.path, pattern);
  if (!path) {
    throw new Error(`${pattern} is not a relative path`);
  }
  const node = createRouteNode(router, parent, path, end);

  return [
    (fn: (route: RouteState, router: RouterState) => any) => {
      router[CurrentNode] = node;
      return fn(node.route, router);
    },
    node.route
  ];
}

export function createRouteNode(
  router: RouterState,
  parent: RouteNode,
  path: string,
  terminal: boolean
): RouteNode {
  if (path === parent.route.path && terminal === parent.terminal) {
    return parent;
  } else if (parent.terminal) {
    throw new Error(`Route '${path}' parent is a terminal route`);
  }

  const matcher = router.utils.createMatcher(path, { end: terminal });
  const match = createMemo(() => matcher(router.location.path), null, true);
  const route = createRoute(router.utils, router.base.path, path, match);
  const node = parent.createChild(route, terminal);

  onCleanup(() => {
    node.dispose();
  });

  return node;
}

export function createRoute(
  utils: RouterUtils,
  basePath: string,
  path: string,
  matchSignal: () => ParamsCollection | null
): RouteState {
  return {
    path,
    isMatch: createMemo(() => !!matchSignal(), false, true),
    params: createStateMemo(() => matchSignal() ?? {}),
    resolvePath(p) {
      return utils.resolvePath(basePath, p, path);
    }
  };
}

function createStateMemo<T extends {}>(fn: (state: T) => T) {
  const [state, setState] = createState<T>({} as T);
  createComputed(() => {
    const prev = untrack(() => state) as T;
    setState(reconcile(fn(prev), { key: null }));
  });
  return state;
}

export class RouteNode {
  private parent: RouteNode | undefined;
  private readonly children: RouteNode[];
  public readonly route: RouteState;
  public readonly terminal: boolean;

  constructor(parent: RouteNode | undefined, route: RouteState, terminal: boolean) {
    this.parent = parent;
    this.children = [];
    this.route = route;
    this.terminal = terminal;
  }
  private removeChild(node: RouteNode) {
    if (!(node instanceof RouteNode)) {
      throw new Error('child is not a RouteNode instance');
    } else if (node.parent !== this) {
      throw new Error(`child node's parent is not this node`);
    }
    const index = this.children.indexOf(node);
    if (index < 0) {
      throw new Error(`child node was not in this node's children collection`);
    }
    node.parent = undefined;
    this.children.splice(index, 1);
  }
  createChild(route: RouteState, terminal: boolean) {
    if (this.terminal) {
      throw new Error('Route node is terminal');
    }
    const child = new RouteNode(this, route, terminal);
    this.children.push(child);
    return child;
  }
  dispose() {
    for (const child of this.children) {
      child.dispose();
    }
    this.parent?.removeChild(this);
  }
}
