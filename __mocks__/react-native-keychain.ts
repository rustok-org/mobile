/**
 * In-memory mock of react-native-keychain (a native boundary) for Jest.
 * Models one credential per `service`, plus the enum constants our wrapper
 * pins. `__resetKeychain` clears state between tests; `__failNextKeychainOp`
 * simulates a native rejection for failure-path coverage.
 */

/* eslint-env jest */

interface Options {
  readonly service?: string;
}

interface Credential {
  readonly username: string;
  readonly password: string;
}

const store = new Map<string, Credential>();
let nextError: Error | null = null;

function serviceOf(options?: Options): string {
  return options?.service ?? 'default';
}

function takeError(): void {
  if (nextError !== null) {
    const error = nextError;
    nextError = null;
    throw error;
  }
}

export const ACCESS_CONTROL = {
  BIOMETRY_CURRENT_SET_OR_DEVICE_PASSCODE: 'BiometryCurrentSetOrDevicePasscode',
} as const;

export const SECURITY_LEVEL = {
  SECURE_HARDWARE: 'SECURE_HARDWARE',
} as const;

export const ACCESSIBLE = {
  WHEN_PASSCODE_SET_THIS_DEVICE_ONLY: 'AccessibleWhenPasscodeSetThisDeviceOnly',
} as const;

export async function setGenericPassword(
  username: string,
  password: string,
  options?: Options,
): Promise<{ service: string; storage: string } | false> {
  takeError();
  store.set(serviceOf(options), { username, password });
  return { service: serviceOf(options), storage: 'keystore' };
}

export async function getGenericPassword(
  options?: Options,
): Promise<(Credential & { service: string }) | false> {
  takeError();
  const credential = store.get(serviceOf(options));
  return credential ? { ...credential, service: serviceOf(options) } : false;
}

export async function resetGenericPassword(options?: Options): Promise<boolean> {
  takeError();
  return store.delete(serviceOf(options));
}

export async function hasGenericPassword(options?: Options): Promise<boolean> {
  takeError();
  return store.has(serviceOf(options));
}

/** Test helper: clear all stored credentials and any queued error. */
export function __resetKeychain(): void {
  store.clear();
  nextError = null;
}

/** Test helper: make the next keychain op reject with `error`. */
export function __failNextKeychainOp(error: Error): void {
  nextError = error;
}
