import { createEffect, createMemo } from 'solid-js';
import { useRoute } from '../routeContext';
import { useRouter } from '../routerContext';

export interface Props {
  to: string;
  push?: boolean;
}

export default (props: Props) => {
  const { push, replace } = useRouter();
  const { resolvePath } = useRoute();

  const resolvedTo = createMemo(() => resolvePath(props.to));

  createEffect(() => {
    if (resolvedTo()) {
      if (props.push) {
        push(resolvedTo());
      } else {
        replace(resolvedTo());
      }
    }
  });

  return null;
};
