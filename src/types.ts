export interface RouteOptions {
  end: boolean;
}

export type ParamsCollection = Record<string, string>;

export type RouteUpdateMode = 'push' | 'replace';

export interface RouteUpdate {
  value: string;
  mode?: RouteUpdateMode;
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
  (path: string): ParamsCollection | null;
}

export interface RouterUtils {
  resolvePath(base: string, path: string, from?: string): string | undefined;
  createMatcher(pathDefinition: string, options: RouteOptions): RouteMatcher;
  parseQuery(queryString: string): ParamsCollection;
}

export interface RouteState {
  path: string;
  isMatch: () => boolean;
  params: ParamsCollection;
  resolvePath(path: string): string | undefined;
}

export type RouteRenderFunction = (route: RouteState, router: RouterState) => JSX.Element;

export interface RouterState {
  base: RouteState;
  location: RouterLocation;
  query: ParamsCollection;
  isRouting: () => boolean;
  utils: RouterUtils;
  push(to: string): void;
  replace(to: string): void;
}
