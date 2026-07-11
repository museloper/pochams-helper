/**
 * Base path the site is served under. Empty in local dev; set to the repo
 * subpath (e.g. "/pochams-helper") for GitHub Pages via NEXT_PUBLIC_BASE_PATH.
 * Must match `basePath` in next.config.ts.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Prefix a public asset path with the base path (for raw <img>/href use). */
export function asset(path: string): string {
  return `${BASE_PATH}${path}`;
}
