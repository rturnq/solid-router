import { createMemo } from 'solid-js';
import { useRoute } from '../routeContext';
import { useRouter } from '../routerContext';

export interface Props extends JSX.AnchorHTMLAttributes<HTMLAnchorElement> {
  onClick?: JSX.EventHandler<HTMLAnchorElement, MouseEvent>;
}

export default (props: Props) => {
  const router = useRouter();
  const { resolvePath } = useRoute();

  const fullHref = createMemo(() =>
    props.href !== undefined ? resolvePath(props.href) : undefined
  );

  const handleClick: JSX.EventHandler<HTMLAnchorElement, MouseEvent> = (
    evt
  ) => {
    evt.preventDefault();
    props.onClick && props.onClick(evt);

    const href = fullHref();
    href && router.push(href);
  };

  return <a {...props} href={fullHref()} onClick={handleClick} />;
};
