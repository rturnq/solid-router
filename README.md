# solid-router

A router for [solid-js](https://github.com/ryansolid/solid)

## Getting Started

### Installation

```
> npm i @rturnq/solid-router
```

### Usage

Wrap the root of you application with the provider element

```tsx
import { RouterProvider, browserPathRouting } from '@rturnq/solid-router`

() => {
  return (
    <RouterProvider handler={browserPathRouting()}>
      <MyApp />
    </RouterProvider>
  )
}
```


## API

### useRouter
Access the router context provided by the `<RouterProvider>` component.

```typescript
useRouter(): Router

interface Router {
   // The path all subsequent paths will be resolved against (ie. a link to /foo/bar will be resolved to /basepath/foo/bar). This is path your application is served from
  basePath: string;

  // Signal contain the current location
  location: () => Loc;

  // Signal containing the current query string (naivly) parsed into a map
  query: <T extends { [key: string]: string }>() => T;
  
  // change current location to the new path and maintain history
  push: (path: string, options?: Partial<RerouteOptions>) => void;

  // replace current location to the new path
  replace: (path: string, options?: Partial<RerouteOptions>) => void;

  // signal containing the current transition state
  isRouting: () => boolean;
}

interface Loc {
  // Path including query string
  path: string;

  // Path not including query
  pathName: string;

  // Query string
  queryString: string;
}

interface RerouteOptions {
  // Use solid transition while changing route
  transition: Boolean = true;

  // Resolve the path to the router base path
  resolvePath: Boolean = false;
}
```


### useRoute
 Access the the route context provided by the closest `<ShowRoute>` or `<MatchRoute>` component.

```typescript
useRoute(): Route

interface Route {
  // Path defined by the route. Relative paths will be resolved against the next closest path or router base path
  path: string;

  // Signal containing the current matched path for the route
  matchedPath: () => string;

  // A function that returns a map containing any path paramaters for all routes within the route heirarchy
  getParams: <T extends { [key: string]: string }>() => T;

  // A function that resolves relative paths again the route's 
  resolvePath: (path: string) => string;
}
```

### Routing

The Routing interface provides the connection between the router and the browser or other integration. The following integrations are shipped with the library.

```typescript
interface Routing {
  listen: (set: (value: Loc) => void) => () => void;
  get: () => Loc;
  push: (next: Loc) => true | void;
  replace: (next: Loc) => true | void;
  origin: () => string
}
```

**browserPathRouting** - Integration with the browser using the path 

**browserHashRouting** - Integration with the browser using the location hash

**memoryRouting** - Simple memory integration using an array


## Components

### \<RouterProvider>
Wraps your applcation with the router context and integrates with the routing system of your choice.
```typescript
interface Props {
  // Routing integration
  handler: Routing;

  // Base path provided to the Router context
  basePath?: string = '/';

  // Redirect immediately to the base path if the current location is outside of the base path
  autoRedirect?: boolean = false;

  // Value used for the useTransition timeout for routing suspense
  transitionTimeoutMs?: number = 300;

  // Children
  children?: JSX.Children;
}
```

### \<MatchRoute>
Similar to solid's `<Match>`, should be used within a `<Switch>` component. The first to mac th the current location will display's its children. If the path provided is relative (ie. does not start with '/') it will be resolved against the parent route provided by any other `<MatchRoute>` or `<ShowRoute>`. If it does start with a '/' it will be resolved agains the router base path.

```typescript
interface Props {
  // Path to match - An empty string or undefined will resolve to the parent route context's path or router base path meaning it will always be matched
  path?: string;

  // End option passed to path-to-regexp - controls wether the path must match to the end
  end?: boolean = false;

  // Strict option passed to path-to-regexp - determines if a trailing '/' is required
  strict?: boolean = false;

  // Render function pattern - if specified will be used instead of children
  render?: (params: RenderProps) => JSX.Children;

  // Children
  children?: JSX.Children;
}

interface RenderProps {
  // Current path parameters map
  params: { [key: string]: string };

  // Current query parameters map
  query: { [key: string]: string };

  // Current location
  location: Loc;
}
```

### \<ShowRoute>
Similar to Solid's `<Show>`, will display its children on a route match. Paths not starting with a '/' will be resolved against the parent route and those starting with a '/' will be resolved agains the router's base path

_Same props as `<MatchRoute>`_

### \<Link>
Renders an anchor tag when clicked will update the router's location. Hrefs not starting with a '/' will be resolved against the parent route and those starting with a '/' will be resolved agains the router's base path.

_Same props as `<a>`_

### \<NavLink>
A `<Link>` which will be assigned an active class when its href matches the current route.

```typescript
interface Props extends Link.Props {
  // Option passed to path-to-regexp
  end?: boolean = false;
  
  // Option passed to path-to-regexp
  strict?: boolean = false;

  // Class to apply when the href matches the current route
  activeClass?: string = "is-active"
}
```

### \<Redirect>
Immediatly redirect to the provided path. The path will be resolved in the same way as `<Link>` hrefs.

```typescript
interface Props {
  // Path to redirect to
  to: string;

  // When true, use push to change the route instead of replace and thus preserve the history of the redirect
  push?: boolean = false;
}
```

## TODO

Figure out Solid's server side rendering, hydration and make that all work nicely.