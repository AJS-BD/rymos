/**
 * Deterministic pseudo-random integer in [min, max] derived from a seed string.
 * Stable across server and client renders (no hydration mismatch) unlike Math.random().
 */
export function seededCount(seed: string, min: number, max: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  const range = max - min + 1;
  return min + (Math.abs(hash) % range);
}
