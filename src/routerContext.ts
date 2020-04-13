import {
  createContext,
  createSignal,
  onCleanup,
  useContext,
  useTransition
} from 'solid-js';
import {
  normalizePath,
  createPathResolver,
  parseQueryString,
  pathToLocation
} from './utils';
import { Router, Routing, Loc, StringMap, RerouteOptions } from './types';

export const RouterContext = createContext<Router>();

export const useRouter = () => useContext(RouterContext);

export function createRouter(handler: Routing, basePath: string = '/'): Router {
  const resolvePath = createPathResolver(basePath);
  let query: StringMap = {};
  const [location, setLocation] = createSignal(
    execMiddelware(handler.get()),
    (a, b) => a.path === b.path
  );
  const [isRouting, start] = useTransition({ timeoutMs: 500 });
  const unlisten = handler.listen((next: Loc) =>
    start(() => setLocation(execMiddelware(next)))
  );
  onCleanup(unlisten);

  // let transitionDuration: number = Date.now();
  // createEffect(() => {
  //   if (isRouting()) {
  //     transitionDuration = Date.now();
  //     console.log(`Routing transition started`);
  //   } else {
  //     transitionDuration = Date.now() - transitionDuration;
  //     console.log(`Routing transition lasted ${transitionDuration}ms`);
  //   }
  // });

  function execMiddelware(location: Loc) {
    query = parseQueryString(location.queryString);

    // RT:C: Could do other things here right before state update

    return location;
  }

  function handleReroute(
    fn: (next: Loc) => true | void,
    next: string,
    options: Partial<RerouteOptions> = {}
  ) {
    const finalOptions: RerouteOptions = {
      transition: true,
      resolvePath: false,
      ...options
    };
    const path = finalOptions.resolvePath ? resolvePath(next) : next;
    if (path !== location().path) {
      const location = pathToLocation(path);
      if (!fn(location)) {
        start(() => setLocation(execMiddelware(location)));
      }
    }
  }

  return {
    basePath: normalizePath(basePath),
    location,
    query: <T extends StringMap = StringMap>() => query as T,
    push: (next: string, options?: Partial<RerouteOptions>) => {
      handleReroute(handler.push, next, options);
    },
    replace: (next: string, options?: Partial<RerouteOptions>) => {
      handleReroute(handler.replace, next, options);
    },
    isRouting
  };
}
