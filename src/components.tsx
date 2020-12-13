import {
  Component,
  Show,
  Match,
  createMemo,
  splitProps,
  untrack,
  JSX
} from 'solid-js';
import { assignProps } from 'solid-js/web';
import {
  useRouter,
  createRouter,
  createRoute,
  RouterContext,
  RouteContext,
  useRoute
} from './routing';
import type {
  RouteUpdateSignal,
  RouterUtils,
  RouteRenderFunction,
  RouterState,
  RouterIntegration
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

interface LinkBaseProps extends JSX.AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string | undefined;
}

function LinkBase(props: LinkBaseProps) {
  const [, rest] = splitProps(props, ['to', 'href', 'onClick']);
  const router = useRouter();
  const href = createMemo(() =>
    props.to !== undefined ? router.utils.renderPath(props.to) : props.href
  );

  function handleClick(evt: TargetEvent<HTMLAnchorElement, MouseEvent>) {
    callEventHandlerUnion(props.onClick, evt);
    if (
      props.to !== undefined &&
      !evt.defaultPrevented &&
      evt.button === 0 &&
      (!props.target || props.target === '_self') &&
      !(evt.metaKey || evt.altKey || evt.ctrlKey || evt.shiftKey)
    ) {
      evt.preventDefault();
      router.push(props.to);
    }
  }

  return <a {...rest} href={href()} onClick={handleClick} />;
}

export interface LinkProps extends JSX.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
}

export function Link(props: LinkProps) {
  const [, rest] = splitProps(props, ['ref']);
  const route = useRoute();
  const to = createMemo(() => route.resolvePath(props.href));

  return <LinkBase {...rest} to={to()} />;
}

export interface NavLinkProps extends LinkProps {
  activeClass?: string;
  end?: boolean;
}

export function NavLink(props: NavLinkProps) {
  props = assignProps({}, { activeClass: 'is-active' }, props);
  const [, rest] = splitProps(props, ['activeClass', 'end', 'ref']);
  const router = useRouter();
  const route = useRoute();
  const to = createMemo(() => route.resolvePath(props.href));
  const matcher = createMemo(() => {
    const path = to();
    return path !== undefined
      ? router.utils.createMatcher(path, { end: !!props.end })
      : undefined;
  });
  const isActive = createMemo(
    () => {
      const m = matcher();
      return m && !!m(router.location.path);
    },
    false,
    true
  );

  return (
    <Link
      {...rest}
      classList={{ [props.activeClass!]: isActive() }}
      aria-current={isActive() ? 'page' : undefined}
    />
  );
}

export interface RedirectProps {
  href: ((router: RouterState) => string) | string;
}

export function Redirect(props: RedirectProps) {
  const router = useRouter();
  const href = props.href;
  const path = typeof href === 'function' ? href(router) : href;
  const to = router.base.resolvePath(path);
  if (to === undefined) {
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
    when: boolean;
    children: JSX.Element;
  }>;
}

export function Route(props: RouteProps) {
  const { path, end, component: Comp = Show } = props;
  const router = useRouter();
  const route = createRoute(path, end);
  const childDesc = Object.getOwnPropertyDescriptor(props, 'children')!.value;
  const callFn = typeof childDesc === 'function' && childDesc.length;

  return (
    <Comp when={route.match() !== undefined}>
      <RouteContext.Provider value={route}>
        {callFn
          ? untrack(() =>
              (props.children as RouteRenderFunction)(route, router)
            )
          : (props.children as JSX.Element)}
      </RouteContext.Provider>
    </Comp>
  );
}

export interface RouterProps {
  integration?: RouterIntegration | RouteUpdateSignal;
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
