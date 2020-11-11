import { Component, createMemo, splitProps, untrack } from 'solid-js';
import { Show, Match, assignProps } from 'solid-js/web';
import {
  useRouter,
  createRouter,
  createRouteScope,
  RouterContext,
  useMatch
} from './routing';
import type {
  RouteUpdateSignal,
  RouterUtils,
  RouteRenderFunction
} from './types';

type TargetEvent<T, E extends Event> = E & {
  currentTarget: T;
  target: T;
};

function callEventHandlerUnion<T, E extends Event>(
  handler: JSX.EventHandlerUnion<T, E> | undefined,
  evt: TargetEvent<T, E>
) {
  if (typeof handler === 'function') {
    handler(evt);
  } else if (handler) {
    handler[0](handler[1], evt);
  }
}

export interface LinkProps extends JSX.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
}

export function Link(props: LinkProps) {
  const [, rest] = splitProps(props, ['href', 'onClick']);
  const router = useRouter();
  const to = createMemo(
    () => router.base.resolvePath(props.href),
    undefined,
    true
  );

  function handleClick(evt: TargetEvent<HTMLAnchorElement, MouseEvent>) {
    callEventHandlerUnion(props.onClick, evt);
    const href = to();
    if (href) {
      evt.preventDefault();
      router.push(href);
    }
  }

  return <a {...rest} href={to() ?? props.href} onClick={handleClick} />;
}

export interface NavLinkProps extends LinkProps {
  activeClass?: string;
  end?: boolean;
}

export function NavLink(props: NavLinkProps) {
  assignProps(props, { activeClass: 'is-active' });
  const [, rest] = splitProps(props, ['activeClass', 'end', 'ref']);
  const match = useMatch(props.href, props.end);
  return <Link {...rest} classList={{ [props.activeClass!]: match() != undefined }} />;
}

export interface RedirectProps {
  href: string;
}

export function Redirect(props: RedirectProps) {
  const router = useRouter();
  const to = router.base.resolvePath(props.href);
  if (!to) {
    throw new Error(`${to} is not a relative path`);
  }
  router.replace(to);
  return null;
}

export interface MatchRouteProps {
  path?: string;
  end?: boolean;
  children: RouteRenderFunction | JSX.Element;
}

export function MatchRoute(props: MatchRouteProps) {
  return <Route {...props} component={Match} />;
}

export interface RouteProps extends MatchRouteProps {
  component?: Component<{
    when: boolean | undefined;
    children: JSX.Element;
  }>;
}

export function Route(props: RouteProps) {
  const { path, end, component: Comp = Show } = props;
  const [scope, route] = createRouteScope(path, end);
  const childDesc = Object.getOwnPropertyDescriptor(props, "children")!.value;
  const callFn = typeof childDesc === "function" && childDesc.length;

  return (
    <Comp when={route.match() != undefined}>
      {scope((route, router) => {
        if (callFn) {
          return untrack(() => (props.children as RouteRenderFunction)(route, router));
        }
        return props.children as JSX.Element;
      })}
    </Comp>
  );
}

export interface RouterProps {
  integration?: RouteUpdateSignal;
  basePath?: string;
  utils?: Partial<RouterUtils>;
  children: JSX.Element;
}

export function Router(props: RouterProps) {
  const { integration, basePath, utils } = props;
  const router = createRouter(integration, basePath, utils);

  return (
    <RouterContext.Provider value={router}>
      {props.children}
    </RouterContext.Provider>
  );
}
