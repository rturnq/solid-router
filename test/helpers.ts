import { createMemo } from "solid-js";

export function createCounter(fn: () => void, start: number = -1) {
  return createMemo((n) => {
    fn();
    return n + 1;
  }, start);
}
