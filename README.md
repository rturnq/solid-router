# solid-router

A router for [Solidjs](https://github.com/solidjs/solid)

## Getting Started

### Installation

```
> npm i @rturnq/solid-router
```

### Usage

Wrap the root of your application with the router component and provide an [integration](#integrations)

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
import { Switch } from 'solid-js';
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
          <MatchRoute end>
            <IndexPage />
          </MatchRoute>
          <MatchRoute path="about">
            <AboutPage />
          </MatchRoute>
          <MatchRoute path="widgets/:id">
            {(route) => <WidgetPage id={route.params.id}/>}
          </MatchRoute>
        </Switch>
      </main>
    </>
  );
}
```

## API

### `useRouter`
Access the router context provided by the `<Router>` component.

```typescript
useRouter(): RouterState

interface RouterState {
   // Top level route
  base: Route;

  // Reactive state containing the current path and query string.
  location: { path: string, queryString: string };

  // Reactive state containing the current query string parsed to a map.
  query: Record<string, string>;

  // Signal containing the current transition state.
  isRouting: () => boolean;
  
  // Change current location to the new path and maintain history.
  push: (path: string) => void;

  // Replace current location to the new path.
  replace: (path: string) => void;
}
```

### `useRoute`
Access the the route context provided by the closest `<Route>` or `<MatchRoute>` component.

```typescript
useRoute(): RouteState

interface RouteState {
  // Path definition for the route. Relative paths defintions (not starting with a `/`) will be
  // resolved against the next closest path or router base path.
  path: string;

  // Flag indicating if the route is terminal or matches 
  end: boolean

  // Signal containing the route's matched portion of the current location or undefined if the route
  // does not match.
  match: () => string | undefined;

  // Reactive state containing any path paramaters for the full route.
  params: Record<string, string>

  // Resolves paths again the route's current matched path, the router's base or undefined if the
  // route does not match the current location. Uses the resolvePath utility (see overrides) which
  // by default will resolve paths starting with '/' to the router's base path, and undefined for
  // paths which contains a scheme or authority (eg. http://, https://, //).
  resolvePath: (path: string) => string | undefined;
}
```

## Components

### `<Router>`
Wraps your applcation with the router context and integrates with the routing system of your choice.
```typescript
interface RouterProps {
  // Routing integration to an external system like the browser. If not provided, the router will
  // still work, but will only be controlled through its API and components and will not update the
  // browser. This can be a simple signal or a more customizable RouteIntegration.
  integration?: RouteIntegration | [() => RouteUpdate, (value: RouteUpdate) => void];

  // Base path provided to the Router context. Generally this will be the path your application is
  // served at.
  basePath?: string;

  // Override any of the utils used by the router to provide custom functionality. This will
  // take precedence over any overrides defined in the integration.
  utils?: Partial<Utils>;

  // Children, your app.
  children: JSX.Children;
}

```
### `<Route>`
Provides both control flow based on the path definition and the router's current location as well as access for descendants to path parameters and a base to resolve relative paths against. Routes build up a tree where each route's path is joined with its parent's path and path parameters. Routes starting with a '/' will be relative to the router's base path, otherwise they will be relative to their parent route.

```typescript
interface RouteProps {
  // Path definition to match. An empty string or undefined will resolve to the parent route's path
  //meaning it will always be matched unles modified with the `end` property.
  path?: string;

  // Controls if the route will match additional path segments after the what is provided by the
  // `path` property. Useful for index content that should be displayed by default.
  end?: boolean = false;

  // Component to handle control flow. Designed for Solid's <Show> and <Match> components but could
  // use anything with a `when` property and children - defaults to <Show>.
  component?: { when: bool, children: JSX.Children } = Show; 

  // Children to render when the path defintion provided matches the router's current location. For
  // convenience this can be a render function which will be passed the current route and the router
  // as arguments. NOTE, the render function will only be called once while the route matches even
  // if the location, parameters or query parameter change.
  children: ((route: Route, router: Router) => JSX.Children) | JSX.Children;
}
```

### `<MatchRoute>`
Wrapper for `<Route>` which uses Solid's `<Match>` as the `component` property for control flow, and therefore must be used within a `<Switch>` component.

```typescript
// Seee RouteProps for details
interface MatchRouteProps {
  path?: string;
  end?: boolean = false;
  children: ((route: Route, router: Router) => JSX.Children) | JSX.Children;
}
```

### `<Link>`
Renders an anchor tag which when clicked, will update the router's location. Relative hrefs not starting with a '/' will be resolved against the parent route and those starting with a '/' will be resolved against the router's base path. Absolute hrefs with a scheme or authority (eg. http://, https://, \/\/) will act like a normal anchor tags and not interact with the router at all.

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
  // Path to redirect to. Relative hrefs will be resolved in the same way as a Link component except
  // absolute hrefs will throw an error.
  href: string;
}
```

## Integrations
Integration between the router and external systems such as the browser. This can be a simple signal with the following type:

```typescript
interface RouteUpdate {
  // string representing the current route in the integrated system - external changes this to this
  // will update the router, and changes to this by the router should update the external system.
  value: string,

  // method the route was updated by the router - external changes to this are ignored but it will
  // always be defined when the router causes an update. The special value `init` will be used for
  // a one-time update if the initial value of the signal is empty.
  mode?: 'push' | 'replace' | 'init'
}
```

If the integration needs to override the router's utils you can use the following form.

```typescript
interface RouterIntegration {
  signal: [() => RouteUpdate, (value: RouteUpdate) => void],

  utils?: Partial<RouterUtils>
}
```

A few pre-made integrations for common use cases are provided for convenience

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
Integration with the browser hash via `window.location`, and `hashchange` event. The router's `basePath` property will be used as a prefix to all hashes.
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
import { Router, historyIntegration } from '@rturnq/solid-router';
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
  get: () => string,

  // Function called to update the current route in the integrated system
  set: (value: string, mode: 'push' | 'replace' | 'init') => void,

  // Optional function called immediately to setup any events or tracking the integrated system.
  // When the source value changes call the provided `notify` method either with the new value or
  // with no value, in which case it will use the value returned from the `get` function. Optionally
  // return a function to be called for disposal.
  init?: (notify: (next?: string) => void) => (() => void) | undefined,

  // Optionally override any of the utils used by the router to provide custom functionality for
  // this integration. Note any utils defined on the Router component will take precedence over any
  // defined here.
  utils?: Partial<RouterUtils>
)
```

## Server-Side Rendering

A goal of this router is to supports server-side rendering as isomorphically as possible. To that end generally the only thing that you have to change is the integration passed to the `<Router>` component.

A simple setup using Express

```tsx
// App.tsx
import { Component, createSignal } from 'solid-js';
import { isServer } from 'solid-js/web';
import { Router, pathIntegration } from '@rturnq/solid-router';

function App(props: { url?: String }) {
  return (
    // This is the important bit: use `isServer` from Solid to pass in a simple signal as an
    // integration when running on the server.
    <Router integration={isServer ? createSignal({ value: props.url }) : pathIntegration()}>
      <Root />
    </Router>
  );
}
```

```tsx
// entry-client.tsx
import { hydrate } from 'solid-js/web';
import App from './App';

hydrate(() => <App />, document.getElementById('root')!);
```

```tsx
// entry-server.tsx
import { renderToNodeStream } from 'solid-js/web';
import App from './App';
import fetch from 'node-fetch';

globalThis.fetch = fetch;

export function render(url: string) {
  return renderToNodeStream(() => <App url={url} />);
}
```

```js
// server.ts
import express from 'express';
import { render } from './entry-server.tsx';

const app = express();

app.get('*', (req, res) => {
  // Pass the url from the request to your app
  const { stream, script } = render(req.originalUrl);

  // ...stream the response
});
```

Please note that handling redirects on the server is not supported currently.
  


## Don't Like How Something Works? 

The router tries to provide sensible defaults but also allows a few places where you can override the behavior.

### Integrations
As discussed previously, integration with an external system like the browser is just a signal. This package provides several common options but you can easily customize this however you want.

### Overrides
There are several functions which can be overridden to change how the router handles path strings and other things.
```typescript
interface RouterUtils {
  // This utility takes two or three paths and resolves them into a single path. It serves a few
  // purposes
  // 1. Normalize path strings (eg "base" --> "/base"; "" --> "/")
  // 2. Combine relative paths (eg "/base" + "foo/bar/" --> "/base/foo/bar")
  // 3. When called with the optional third parameter, determines if the `path` parameter is
  //    relative to `from` or `base`.
  //    eg. given base = "/base" and from = "/base/foo" then
  //      "/baz" --> "/base/baz"
  //      "baz" --> "/base/foo/baz"
  //
  //    It should also ensure the resulting path starts with the base
  //    eg. given base = "/base" and from = "/foo" then
  //      "/baz" --> "/base/baz"
  //      "baz" --> "/base/foo/baz"
  resolvePath(base: string, path: string, from?: string): string;

  // This factory takes the path defined on each <Route> and returns a matcher function which
  // returns an object containing all route parameters when the path matches the router's location
  // or null when it does not. The default matcher uses regexparam (https://github.com/lukeed/regexparam)
  // to create a route matching function. Overriding this along with `resolvePath`  will allow you
  // to use any path format you would like.
  createMatcher(pathDefinition: string, options: RouteOptions): RouteMatcher;

  // Parse the location query string into a map of key/values. The default query string parser is
  // extremely naive and simply splits on '&' for each key/value pair and then on '=' to get the key
  // and value.
  parseQuery(queryString: string): ParamsCollection;

  // Determines how a path is rendered in the underlying anchor's href attribute for <Link> or
  // <NavLink> components.
  renderPath(path: string): string
}
```

To override these utils, provide your own to the \<Router> component utils property:
```tsx
<Router utils={{ ...myUtils }}>
```


## Notes and Gotchas

### Vite
[Vite](https://vitejs.dev/) is an awesome project and you should at least check it out if you're not using it already. The following are known issues and their workarounds:


### SSR Externals
When using the router with SSR, you may encounter the following error.
> Error [ERR_REQUIRE_ESM]: Must use import to load ES Module

This is caused by an [optimization](https://vitejs.dev/guide/ssr.html#ssr-externals) where Vite attempts to use CommonJS builds shipped by a package instead of converting ESM to run in Node. A [bug](https://github.com/vitejs/vite/issues/2393) prevents this from working correctly on Windows so you'll need to manually exclude `@rturnq/solid-router` from the SSR externals in your Vite config:

```js
// vite.config.js
export default defineConfig({
  //...
  ssr: {
    noExternal: ['@rturnq/solid-router']
  },
});
```

## Questions

Feel free to file an issue if you find a bug, something isn't working correctly or you have good ideas. Additionally, if you have usage questions, want help troubleshooting an issue or otherwise want to discuss the router, I'm usually around in the [Solid Discord](https://discord.com/invite/solidjs) as @rturnq.

## TODO

 - Write more tests
 - Improve SSR
 - Examples
 - Better Documentation

