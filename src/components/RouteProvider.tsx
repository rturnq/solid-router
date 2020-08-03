import { RouteContext } from '../routeContext';
import { useRouter } from '../routerContext';
import { Loc, StringMap, Route } from '../types';

export interface Props {
  route: Route;
  render?: (params: RenderProps) => JSX.Element;
  children?: JSX.Element;
}

export interface RenderProps {
  params: StringMap;
  query: StringMap;
  location: Loc;
}

export default function RouteProvider(props: Props) {
  const { location, query } = useRouter();
  const children = () =>
    props.render
      ? props.render({
          params: props.route.getParams(),
          query: query(),
          location: location()
        })
      : props.children;

  return (
    <RouteContext.Provider value={props.route}>
      {children}
    </RouteContext.Provider>
  );
}
