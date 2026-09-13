import type { AuthAdapter, LoginInput, RegisterInput, Session } from "@/lib/auth/types";
import { findDemoUserByEmail } from "@/lib/auth/mock-users";
import { createRegisteredUser, findRegisteredUserByEmail } from "@/lib/auth/registered-users-store";

const SESSION_STORAGE_KEY = "brickbasket.session";
/** Demo-only session length so expiry behavior is actually observable. */
const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

/**
 * localStorage-backed mock implementation. Client-side only (guarded —
 * every method is safe to call from a Client Component). This is a frontend
 * demonstration adapter, not a security boundary: there is no server
 * verifying these sessions. See docs/AUTHENTICATION.md for what a real
 * implementation must replace.
 */
class MockAuthAdapter implements AuthAdapter {
  async login({ email, password }: LoginInput): Promise<Session> {
    await delay(400);
    if (!password.trim()) {
      throw new Error("Enter a password.");
    }
    // Checks the fixed demo persona directory first, then accounts created
    // through the Register form (see registered-users-store.ts).
    const user = findDemoUserByEmail(email) ?? findRegisteredUserByEmail(email);
    if (!user) {
      throw new Error("No account found for that email. Try one of the demo accounts below, or register.");
    }
    const session: Session = {
      user,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
    };
    this.persist(session);
    return session;
  }

  async register({ name, email, password }: RegisterInput): Promise<Session> {
    await delay(400);
    if (!name.trim()) {
      throw new Error("Enter your name.");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      throw new Error("Enter a valid email address.");
    }
    if (password.trim().length < 6) {
      throw new Error("Choose a password with at least 6 characters.");
    }
    if (findDemoUserByEmail(email)) {
      throw new Error("An account with that email already exists. Try signing in instead.");
    }
    // createRegisteredUser throws its own "already exists" error for a
    // duplicate self-registered email.
    const user = createRegisteredUser(name, email);
    const session: Session = {
      user,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
    };
    this.persist(session);
    return session;
  }

  async logout(): Promise<void> {
    await delay(150);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }

  getSession(): Session | null {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    try {
      const session = JSON.parse(raw) as Session;
      if (new Date(session.expiresAt).getTime() <= Date.now()) {
        window.localStorage.removeItem(SESSION_STORAGE_KEY);
        return null;
      }
      return session;
    } catch {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
  }

  private persist(session: Session) {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    }
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const authAdapter: AuthAdapter = new MockAuthAdapter();
