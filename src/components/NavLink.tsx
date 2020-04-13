import { useMatch } from '../routeContext';
import Link, { Props as LinkProps } from './Link';

export interface Props extends LinkProps {
  href: string;
  end?: boolean;
  strict?: boolean;
  activeClass?: string;
}

export default (props: Props) => {
  const isActive = useMatch(props.href, props.end, props.strict);

  return (
    <Link
      {...(props as any)}
      classList={{ [props.activeClass ?? 'is-active']: isActive() }}
    />
  );
};
