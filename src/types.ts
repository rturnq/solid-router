export interface Route {
  path: string;
  matchedPath: () => string;
  getParams: <T extends StringMap = StringMap>() => T;
  resolvePath: (path: string) => string;
}

export interface Router {
  basePath: string;
  location: () => Loc;
  query: <T extends StringMap = StringMap>() => T;
  push: (path: string, options?: Partial<RerouteOptions>) => void;
  replace: (path: string, options?: Partial<RerouteOptions>) => void;
  isRouting: () => boolean;
}

export interface Routing {
  listen: (set: (value: Loc) => void) => () => void;
  get: () => Loc;
  push: (next: Loc) => true | void;
  replace: (next: Loc) => true | void;
  origin: () => string
}

export interface Loc {
  path: string;
  pathName: string;
  queryString: string;
}

export interface StringMap {
  [key: string]: string;
}

export interface RerouteOptions {
  transition: Boolean;
  resolvePath: Boolean;
}

export interface MatchResult {
  params: any;
  path: string;
}
export type MatchResultFn = (path: string) => MatchResult | undefined;
export type MatchTestFn = (path: string) => boolean;