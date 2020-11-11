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
import { Router, pathIntegration } from '@rturnq/solid-router';

function App() {
  return (
    <Router integration={pathIntegration()}>
      <Root />
    </Router>
  );
}
```

Create some routes and links

```tsx
import { Swich } from 'solid-js';
import { Link, MatchRoute } from '@rturnq/solid-router';

function Root() {
  return (
    <>
      <nav>
        <Link href="/">Home</Link>
        <Link href="/about">About</Link>
        <Link href="/widgets/1234">Widget #1234</Link>
      </nav>
      <main>
        <Switch fallback={<h1>404</h1>}>
          <MatchRoute path="" end>
            <IndexPage />
          </MatchRoute>
          <MatchRoute path="about">
            <AboutPage />
          </MatchRoute>
          <MatchRoute path="widgets/:id">
            {(route) => <WidgetPage id={route.params.id}/>}
          </MatchRoute>
        </Router>
      </main>
    </>
  );
}
```

## API

### `useRouter`
Access the router context provided by the `<Router>` component.

```typescript
useRouter(): Router

interface RouterState {
   // top level route
  base: Route;

  // state containing the current path and query string
  location: { path: string, queryString: string};

  // state containing the current query string parsed to a map
  query: Record<string, string>;
  
  // change current location to the new path and maintain history
  push: (path: string) => void;

  // replace current location to the new path
  replace: (path: string) => void;

  // signal containing the current transition state
  isRouting: () => boolean;
}
```


### `useRoute`
 Access the the route context provided by the closest `<Route>` component.

```typescript
useRoute(): Route

interface RouteState {
  // path definition for the route - relative paths defintions (not starting with a `/`) will be resolved against the next closest path or router base path
  path: string;

  // signal containing the current matched path for the route
  isMatch: () => bool;

  // state containing any path paramaters for the full route
  params: Record<string, string>

  // function that resolves relative paths again the route's path - will return undefined if the path passed in contains a scheme (eg. http://, https://, //)
  resolvePath: (path: string) => string | undefined;
}
```

## Components

### `<Router>`
Wraps your applcation with the router context and integrates with the routing system of your choice.
```typescript
interface RouterProps {
  // Routing integration. If not provided, the router will still work but not be connected to anything external.
  integration?: [() => T, (value: T) => void];

  // Base path provided to the Router context
  basePath?: string;

  // Override any of the utils used by the router
  utils?: Partial<Utils>;

  // Children
  children: JSX.Children;
}
```
### `<Route>`
Provides both control flow based on the path definition and the router's current location as well as access for descendants to path parameters and a base to resolve relative paths against. Routes build up a tree where each route's path is joined with its parent's path and path parameters. When defining your routes make sure you define the path relative to the parent.

```typescript
interface RouteProps {
  // Path definition to match - An empty string or undefined will resolve to the parent route's path meaning it will always be matched unles modified with the `end` property.
  path?: string;

  // Controls if the path will match additional path segments after the what is provided by the `path` property. Useful for index content that should be displayed by default.
  end?: boolean = false;

  // Component to handle control flow. Designed for Solid's <Show> and <Match> components but could use anything with a `when` property and children - defaults to <Show>.
  component?: { when: bool, children: JSX.Children } = Show; 

  // Children to render when the path defintion provided matches the router's current location. For convenience this can be a render function which will be passed the current route and the router are aruments. NOTE, the render function will only be called once while the route matches even if the location, parameters or query parameter change.
  children: ((route: Route, router: Router) => JSX.Children) | JSX.Children;
}
```

### `<MatchRoute>`
Wrapper for `<Route>` which uses Solid's `<Switch>` as the `component` property for control flow.

```typescript
// Seee RouteProps for details
interface MatchRouteProps {
  path?: string;
  end?: boolean = false;
  children: ((route: Route, router: Router) => JSX.Children) | JSX.Children;
}
```

### `<Link>`
Renders an anchor tag when clicked will update the router's location. Relative hrefs not starting with a '/' will be resolved against the parent route and those starting with a '/' will be resolved against the router's base path. Absolute hrefs with a scheme or authority (eg. http://, https://, \/\/) will act like a normal anchor tags and not interact with the router at all.

```typescript
interface LinkProps extends JSX.AnchorHTMLAttributes<HTMLAnchorElement> {
  // Require Links to have an href
  href: string
}
```

### `<NavLink>`
A wrapper around `<Link>` which will be assigned an active class when its href matches the current route. Absolute hrefs will never match.

```typescript
interface NavLinkProps extends LinkProps {
  // Class to apply when the href matches the current route
  activeClass?: string = "is-active"

  // Same as end property on Route components
  end?: boolean = false;
}
```

### `<Redirect>`
Immediatly redirect to the provided path.

```typescript
interface RedirectProps {
  // Path to redirect to. Relative hrefs will be resolved in the same way as a Link component except absolute hrefs will throw an error.
  href: string;
}
```

## Integration
Integration between the router and external systems such as the browser is provided by a simple signal with the following type:

```typescript
interface RouteUpdate {
  // string representing the current route in the integrated system - external changes this to this will update the router, and changes to this by the router should update the external system.
  value: string,

  // method the route was updated by the router - external changes to this are ignored but it will always be defined when the router causes an update
  mode?: 'push' | 'replace'
}
```

The library provides some pre-made integrations for common use cases

### `pathIntegration`
Integration with the browser path via `window.location`, `window.history` and `onpopstate` event
```tsx
import { Router, pathIntegration } from '@rturnq/solid-router';

function App() {
  return (
    <Router integration={pathIntegration()}>
      <MyApp />
    </Router>
  );
}
```

### `hashIntegration`
Integration with the browser hash via `window.location`, and `hashchange` event 
```tsx
import { Router, hashIntegration } from '@rturnq/solid-router';

function App() {
  return (
    <Router integration={hashIntegration()}>
      <MyApp />
    </Router>
  );
}
```

### `historyIntegration`
Integration for the [history](https://github.com/ReactTraining/history) package
```tsx
import { Router, hashIntegration } from '@rturnq/solid-router';
import { createBrowserHistory } from 'history'

function App() {
  const history = createBrowserHistory();
  return (
    <Router integration={historyIntegration(history)}>
      <MyApp />
    </Router>
  );
}
```

### `createIntegration`
Bring your own integration
```typescript
createIntegration(
  // Function called to get the current route from the integrated system
  get: () => string;

  // Function called to update the current route in the integrated system
  set: (value: string, mode: 'push' | 'replace') => void;

  // Optional function called immediately to setup any events or tracking the integrated system. When the source value changes call the provided `notify` method either with the new value or with no value, in which case it will use the value returned from the `get` function. Optionally return a function to be called for disposal.
  init?: (notify: (next?: string) => void) => (() => void) | undefined;
)
```

## Don't Like How Something Works? 

The router tries to provide sensible defaults but also allows a few places where you can override the behavior.

### Integrations
As discussed previously, integration with an external system like the browser is just a signal. This package provides several common options but you can easily customize this however you want.

### Overrides
There are several functions which can be overridden to change how the router handles routes and other things.
```typescript
interface RouterUtils {
  // This utility takes two or three paths and resolves them into a single path. It serves a couple purposes
  // 1. Normalize path strings (eg "base" --> "/base"; "" --> "/")
  // 2. Combine relative paths (eg "/base" + "foo/bar/" --> "/base/foo/bar")
  // 3. When called with the optional third parameter, determines if the `path` parameter is relative to `from` or `base`.
  //    eg. given base = "/base" and from = "/base/foo" then
  //      "/baz" --> "/base/baz"
  //      "baz" --> "/base/foo/baz"
  //
  //    It should also ensure the resulting path starts with the base
  //    eg. given base = "/base" and from = "/foo" then
  //      "/baz" --> "/base/baz"
  //      "baz" --> "/base/foo/baz"
  resolvePath(base: string, path: string, from?: string): string;

  // The factory takes the path defined on each <Route> and returns a matcher function which will return an object containing all route parameters when it matches the router's location or null when it does not. The default matcher uses regexparam (https://github.com/lukeed/regexparam) to create a route matching function. Overriding this along with `resolvePath`  will allow you to use any path format you would like.
  createMatcher(pathDefinition: string, options: RouteOptions): RouteMatcher;

  // Parse the location query string into a map of key/values. The default query string parser is extremely naive and simply splits on '&' for each key/value pair and then on '=' to get the key and value.
  parseQuery(queryString: string): ParamsCollection;
}
```

To override these utils, provide your own to the \<Router> component utils property:
```tsx
<Router utils={{ ...myUtils }}>
```
It should have the following signature



## TODO

Write more tests