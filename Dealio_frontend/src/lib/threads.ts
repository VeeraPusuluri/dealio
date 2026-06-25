// Private per-deal chat threads are keyed by the canonical (alphabetically sorted)
// pair of the two participating roles — mirrors the backend's utils/thread.ts.
// With roles ordered builder < cp < customer the only valid keys are:
//   "builder-cp" | "builder-customer" | "cp-customer"

export type ChatRole = 'builder' | 'cp' | 'customer';

/** Canonical threadKey for the conversation between two distinct roles. */
export function threadKey(a: ChatRole, b: ChatRole): string {
  return [a, b].sort().join('-');
}

export const ROLE_LABEL: Record<ChatRole, string> = {
  builder: 'Builder',
  cp: 'Channel Partner',
  customer: 'Customer',
};
