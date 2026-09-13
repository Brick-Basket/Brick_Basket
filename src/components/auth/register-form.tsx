"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, AlertTriangle } from "lucide-react";
import { useSession } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Card } from "@/components/ui/card";
import { PORTAL_ROUTES, PUBLIC_ROUTES } from "@/lib/constants/routes";

/**
 * Demo-mode self-registration: creates a new `customer` account (see
 * src/lib/auth/registered-users-store.ts) and signs the visitor straight
 * in — there is no email verification step or backend, consistent with the
 * rest of this mock auth implementation. Staff accounts are never created
 * here; they only exist in the fixed demo persona directory
 * (src/lib/auth/mock-users.ts). See docs/AUTHENTICATION.md.
 */
export function RegisterForm() {
  const { status, session, register } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated" && session) {
      router.replace(next ?? PORTAL_ROUTES.home);
    }
  }, [status, session, next, router]);

  async function doRegister() {
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setSubmitting(true);
    try {
      const newSession = await register({ name, email, password });
      router.replace(next ?? PORTAL_ROUTES.home);
      void newSession;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "loading" || status === "authenticated") {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-brand-red" aria-hidden />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <Card className="p-6 md:p-8">
        <h2 className="font-heading text-xl font-bold text-ink">Create your account</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Demo mode — this creates a local customer account, not a real one.
        </p>

        <form
          className="mt-6 flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            doRegister();
          }}
          noValidate
        >
          <FormField label="Full name" htmlFor="register-name" required>
            <Input
              id="register-name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </FormField>
          <FormField label="Email" htmlFor="register-email" required>
            <Input
              id="register-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </FormField>
          <FormField label="Password" htmlFor="register-password" required hint="At least 6 characters.">
            <Input
              id="register-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </FormField>
          <FormField label="Confirm password" htmlFor="register-confirm-password" required>
            <Input
              id="register-confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </FormField>

          {error && (
            <div className="flex items-center gap-2 rounded-md border border-error/30 bg-error/5 px-3 py-2 text-sm text-error">
              <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
              {error}
            </div>
          )}

          <Button type="submit" size="lg" disabled={submitting} className="mt-2">
            {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            Create Account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-muted">
          Already have an account?{" "}
          <Link
            href={next ? `${PUBLIC_ROUTES.login}?next=${encodeURIComponent(next)}` : PUBLIC_ROUTES.login}
            className="font-medium text-brand-red hover:underline"
          >
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
