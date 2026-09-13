import type { PermissionKey, Role } from "@/lib/permissions/permissions";

/**
 * Abstract session shape the frontend is built against — see
 * docs/AUTHENTICATION.md. The mock adapter in this folder implements it
 * today; a real backend-issued session (JWT or server session — TBD, see
 * docs/OPEN_QUESTIONS.md #7) must fit this same shape or the shape adjusts
 * in one place.
 */
export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  roles: Role[];
  permissions: PermissionKey[];
}

export interface Session {
  user: CurrentUser;
  /** ISO timestamp. The mock adapter uses a short demo window so
   *  session-expiry behavior is actually observable — see mock-users.ts. */
  expiresAt: string;
}

export interface LoginInput {
  email: string;
  /** Accepted but not verified against anything — mock/demo only. */
  password: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  /** Accepted but not verified/hashed anywhere — mock/demo only. */
  password: string;
}

/**
 * Auth adapter boundary. Components/hooks depend on this interface only —
 * see src/components/providers/auth-provider.tsx. Swapping to a real
 * backend means adding `auth-adapter.rest.ts` implementing this same
 * interface.
 */
export interface AuthAdapter {
  login(input: LoginInput): Promise<Session>;
  /**
   * Self-service sign-up. Mock implementation always provisions a
   * `customer` role — staff accounts are provisioned internally, not via
   * public self-registration. See docs/AUTHENTICATION.md.
   */
  register(input: RegisterInput): Promise<Session>;
  logout(): Promise<void>;
  getSession(): Session | null;
}
