/**
 * Compile-time exhaustiveness guard. Passing a value here is a type error unless
 * every case of a union has already been handled, so an unhandled variant fails
 * to compile. Throws if ever reached at runtime (only possible via unsound casts).
 */
export function assertNever(value: never): never {
  throw new Error(`unhandled case: ${String(value)}`);
}
