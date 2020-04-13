import { createRouter, RouterContext } from '../routerContext';
import { Routing } from '../types';
import { isBase } from '../utils';
import { ShowRoute } from './Route';

export interface Props {
  handler: Routing;
  children: JSX.Children;
  basePath?: string;
  autoRedirect?: boolean;
  transitionTimeoutMs?: number
}

export default (props: Props) => {
  const router = createRouter(props.handler, props.basePath);

  if (props.autoRedirect && !isBase(router.basePath, router.location().path)) {
    console.log(`Auto-redirecting to ${router.basePath}`);
    router.replace(router.basePath);
  }

  return (
    <RouterContext.Provider value={router}>
      <ShowRoute>{props.children}</ShowRoute>
    </RouterContext.Provider>
  );
};
