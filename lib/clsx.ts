// ABOUTME: Tiny className concatenator — filters out falsy values.
// ABOUTME: Used across components instead of adding a dep for trivial joins.
export function clsx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
