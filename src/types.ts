import { JSX } from 'solid-js';

export interface RouteOptions {
  end: boolean;
}

export type RouteUpdateMode = 'push' | 'replace' | 'init';

export interface RouteUpdate {
  value: string;
  mode?: RouteUpdateMode;
}

export type RouteMatch = [string, Record<string, string>];

export interface RouterIntegration {
  signal: RouteUpdateSignal;
  utils?: Partial<RouterUtils>;
}

export type RouteUpdateSignal = [
  () => RouteUpdate,
  (value: RouteUpdate) => void
];

export interface RouterLocation {
  path: string;
  queryString: string;
}

export interface RouteMatcher {
  (path: string): RouteMatch | null;
}

export interface RouterUtils {
  resolvePath(base: string, path: string, from?: string): string | undefined;
  createMatcher(pathDefinition: string, options: RouteOptions): RouteMatcher;
  parseQuery(queryString: string): Record<string, string>;
  renderPath(path: string): string;
}

export interface RouteState {
  path: string;
  end: boolean;
  match: () => string | undefined;
  params: Record<string, string>;
  resolvePath(path: string): string | undefined;
}

export type RouteRenderFunction = (
  route: RouteState,
  router: RouterState
) => JSX.Element;

export interface RedirectOptions {
  resolve: boolean
}

export interface RouterState {
  base: RouteState;
  location: RouterLocation;
  query: Record<string, string>;
  isRouting: () => boolean;
  utils: RouterUtils;
  push(to: string, options?: RedirectOptions): void;
  replace(to: string, options?: RedirectOptions): void;
}
