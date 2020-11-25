import regexparam from "regexparam";
import type { RouteOptions, RouteMatcher } from "./types";

const hasSchemeRegex = /^(?:[a-z0-9]+:)?\/\//i;
const normalizeRegex = /^\/+|\/+$|\s+/;

function normalize(path: string) {
  const s = path.replace(normalizeRegex, "");
  return s ? "/" + s : "";
}

export function resolvePath(
  base: string,
  path: string,
  from?: string
): string | undefined {
  if (hasSchemeRegex.test(path)) {
    return undefined;
  }

  const basePath = normalize(base);
  const fromPath = from && normalize(from);
  let result = "";
  if (!fromPath || path.charAt(0) === "/") {
    result = basePath;
  } else if (fromPath.toLowerCase().indexOf(basePath.toLowerCase()) !== 0) {
    result = basePath + fromPath;
  } else {
    result = fromPath;
  }
  return result + normalize(path) || "/";
}

export function createMatcher(
  path: string,
  options: RouteOptions
): RouteMatcher {
  const { keys, pattern } = regexparam(path, !options.end);
  return (p) => {
    const matches = pattern.exec(p);
    if (!matches) {
      return null;
    }
    const params = keys.reduce<Record<string, string>>((acc, _, i) => {
      acc[keys[i]] = matches[i + 1];
      return acc;
    }, {});
    return [matches[0] || '/', params];
  };
}

export function parseQuery(queryString: string): Record<string, string> {
  return queryString.split("&").reduce<Record<string, string>>((acc, pair) => {
    const [key, value] = pair.split("=", 2);
    if (key) {
      acc[key.toLowerCase()] = value;
    }
    return acc;
  }, {});
}
