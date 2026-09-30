import type { AppEnvironment, Bindings } from './types';

const environments: ReadonlySet<string> = new Set([
  'local',
  'test',
  'staging',
  'production',
]);

export function configuredEnvironment(env: Bindings): AppEnvironment | null {
  return env.APP_ENV && environments.has(env.APP_ENV)
    ? (env.APP_ENV as AppEnvironment)
    : null;
}

export function newId(): string {
  return crypto.randomUUID();
}

export const isId = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
