import { createSignal, createComputed, onCleanup } from 'solid-js';
import type {
  RouteUpdateMode,
  RouteUpdate,
  RouterIntegration,
  RouterUtils
} from './types';
import type { History } from 'history';

function bindEvent(target: EventTarget, type: string, handler: EventListener) {
  target.addEventListener(type, handler);
  return () => target.removeEventListener(type, handler);
}

export function createIntegration(
  get: () => string,
  set: (value: string, mode: RouteUpdateMode) => void,
  init?: (notify: (value?: string) => void) => () => void,
  utils?: Partial<RouterUtils>
): RouterIntegration {
  const signal = createSignal<RouteUpdate>(
    { value: get() },
    (a, b) => a.value === b.value
  );
  createComputed(() => {
    const { value, mode } = signal[0]();
    mode && set(value, mode);
  });
  if (init) {
    onCleanup(
      init((value = get()) => {
        signal[1]({ value });
      })
    );
  }
  return {
    signal,
    utils
  };
}

export function pathIntegration() {
  return createIntegration(
    () => window.location.pathname + window.location.search,
    (value, mode) => {
      if (mode === 'push') {
        window.history.pushState(null, '', value);
      } else {
        window.history.replaceState(null, '', value);
      }
    },
    (notify) => bindEvent(window, 'popstate', () => notify())
  );
}

export function hashIntegration() {
  return createIntegration(
    () => window.location.hash.slice(1),
    (value) => {
      window.location.hash = value;
    },
    (notify) => bindEvent(window, 'hashchange', () => notify()),
    {
      renderPath: (path) => `#${path}`
    }
  );
}

export function historyIntegration(history: History) {
  return createIntegration(
    () => history.location.pathname + history.location.search,
    (value, mode) => {
      if (mode === 'push') {
        history.push(value);
      } else {
        history.replace(value);
      }
    },
    (notify) =>
      history.listen((evt) => {
        if (evt.action === 'POP') {
          notify();
        }
      }),
    {
      renderPath: history.createHref
    }
  );
}
