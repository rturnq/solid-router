import { Match, Show } from 'solid-js/dom';
import { createRoute, RouteContext } from '../routeContext';
import { useRouter } from '../routerContext';
import { Loc, StringMap } from '../types';

export interface Props {
  path?: string;
  end?: boolean;
  strict?: boolean;
  render?: (params: RenderProps) => JSX.Children;
  children?: JSX.Children;
}

export interface RenderProps {
  params: StringMap;
  query: StringMap;
  location: Loc;
}

export function MatchRoute(props: Props) {
  const { location, query } = useRouter();
  const [route, isMatch] = createRoute(props.path, props.end, props.strict);

  return (
    <Match when={isMatch()}>
      <RouteContext.Provider value={route}>
        {props.render
          ? props.render({
              params: route.getParams(),
              query: query(),
              location: location()
            })
          : props.children}
      </RouteContext.Provider>
    </Match>
  );
}

export function ShowRoute(props: Props) {
  const { location, query } = useRouter();
  const [route, isMatch] = createRoute(props.path, props.end, props.strict);

  return (
    <Show when={isMatch()}>
      <RouteContext.Provider value={route}>
        {props.render
          ? props.render({
              params: route.getParams(),
              query: query(),
              location: location()
            })
          : props.children}
      </RouteContext.Provider>
    </Show>
  );
}
