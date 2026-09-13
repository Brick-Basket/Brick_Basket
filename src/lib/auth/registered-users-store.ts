import type { CurrentUser } from "@/lib/auth/types";
import { permissionsForRoles } from "@/lib/permissions/permissions";

/**
 * localStorage-backed registry of self-registered demo accounts, kept
 * separate from the fixed `DEMO_USERS` fixture in `mock-users.ts` — that
 * file is a static persona directory (one account per role, for exercising
 * RBAC), while this one is a runtime-mutable store that grows every time
 * someone submits the Register form. Every account created here is a
 * `customer` — self-registration never grants a staff role. Not a security
 * boundary: same caveats as `auth-adapter.ts`'s MockAuthAdapter. See
 * docs/AUTHENTICATION.md.
 */
const REGISTERED_USERS_KEY = "brickbasket.registered_users";

interface StoredRegisteredUser {
  id: string;
  name: string;
  email: string;
}

function readAll(): StoredRegisteredUser[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(REGISTERED_USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredRegisteredUser[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(users: StoredRegisteredUser[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
}

function toCurrentUser(stored: StoredRegisteredUser): CurrentUser {
  return { ...stored, roles: ["customer"], permissions: permissionsForRoles(["customer"]) };
}

export function findRegisteredUserByEmail(email: string): CurrentUser | null {
  const match = readAll().find((u) => u.email === email.trim().toLowerCase());
  return match ? toCurrentUser(match) : null;
}

/** Throws if the email is already taken by an existing registered account. */
export function createRegisteredUser(name: string, email: string): CurrentUser {
  const normalizedEmail = email.trim().toLowerCase();
  const users = readAll();
  if (users.some((u) => u.email === normalizedEmail)) {
    throw new Error("An account with that email already exists. Try signing in instead.");
  }
  const stored: StoredRegisteredUser = {
    id: `u_reg_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    name: name.trim(),
    email: normalizedEmail,
  };
  writeAll([...users, stored]);
  return toCurrentUser(stored);
}
