import test from 'ava';

import { createRoot  } from 'solid-js';

import Link from './Link';
import RouterProvider from './RouterProvider';
import { memoryRouting } from '../routing';
import { ShowRoute } from './Route';

function render<T extends HTMLElement>(comp: JSX.Element): T {
  const div = (<div>{comp}</div>) as HTMLDivElement;
  return div.firstChild as T;
}

test('Elements can be inspected', (t) =>
  createRoot(() => {
    const el = render(<div id="foo">bar</div>);

    t.is(el.outerHTML, '<div id="foo">bar</div>');
  }));

test('Link renders and anchor element', (t) =>
  createRoot(() => {
    const el = render(
      <RouterProvider handler={memoryRouting('/', '/')}>
        <ShowRoute path="/">
          <Link href="hello">foo</Link>
        </ShowRoute>
      </RouterProvider>
    );

    t.is(el.outerHTML, `<a href="/hello>foo</a>`);
  }));
