
export { ShowRoute, MatchRoute } from './components/Route';
export { default as Link } from './components/Link';
export { default as NavLink } from './components/NavLink';
export { default as RouterProvider } from './components/RouterProvider';
export { default as Redirect } from './components/Redirect';
export { RouterContext, useRouter, createRouter } from './routerContext';
export { RouteContext, useRoute, createRoute, createMatchRoute } from './routeContext';
export * from './routing';
export * from './utils';
export * from './types';

// Workaround for Babel being unable to re-export types
import * as Route from './components/Route';
export type RouteProps = Route.Props;

import * as Link from './components/Link';
export type LinkProps = Link.Props;

import * as NavLink from './components/NavLink';
export type NavLinkProps = NavLink.Props;

import * as RouterProvider from './components/RouterProvider';
export type RouterProviderProps = RouterProvider.Props;

import * as Redirect from './components/Redirect';
export type RedirectProps = Redirect.Props;
