import { Match, Show } from 'solid-js/dom';
import { createRoute } from '../routeContext';
import RouteProvider, { Props as RouteProviderProps } from './RouteProvider';

export type Props = Omit<RouteProviderProps, 'route'> & {
  path?: string;
  end?: boolean;
  strict?: boolean;
}

export function MatchRoute(props: Props) {
  const [route, isMatch] = createRoute(props.path, props.end, props.strict);
  return (
    <Match when={isMatch()}>
      <RouteProvider {...props} route={route} />
    </Match>
  );
}

export function ShowRoute(props: Props) {
  const [route, isMatch] = createRoute(props.path, props.end, props.strict);
  return (
    <Show when={isMatch()}>
      <RouteProvider {...props} route={route} />
    </Show>
  );
}
