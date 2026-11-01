"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, AlertTriangle } from "lucide-react";
import { useSession } from "@/components/providers/auth-provider";
import { demoUserDirectory } from "@/lib/auth/mock-users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Card } from "@/components/ui/card";
import { PORTAL_ROUTES, ADMIN_ROUTES, PUBLIC_ROUTES } from "@/lib/constants/routes";

// UI FIX (broad audit pass): Login previously used plain `useState` with
// `required`/`type="email"` attributes on bare `<input>`s while also
// setting `noValidate` on the `<form>` — so the browser's native validation
// popup never fired, but there was nothing wired to `FormField`'s `error`
// prop to replace it either. A blank/invalid submit fell through to the
// mock `authAdapter`'s generic ~400ms-delayed error banner instead of a
// clear inline message under the field — inconsistent with every other
// form in the app, which wires zod + react-hook-form + `FormField error`.
const loginFormSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  customer: "Customer",
  project_manager: "Project Manager",
  site_engineer: "Site Engineer",
  purchaser: "Purchaser",
  store_personnel: "Store Personnel",
  finance: "Finance",
  approver: "Approver",
};

function homeForRoles(roles: string[]) {
  return roles.includes("customer") ? PORTAL_ROUTES.home : ADMIN_ROUTES.home;
}

/**
 * Demo-mode login: a real-looking email/password form (checked against the
 * mock user directory only — see src/lib/auth/mock-users.ts) plus a
 * "Continue as" quick picker so every role's permission-gated UI can
 * actually be exercised without a backend. Clearly labeled as demo mode —
 * this is not a real authentication flow. See docs/AUTHENTICATION.md.
 */
export function LoginForm() {
  const { status, session, login } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const expired = searchParams.get("reason") === "expired";

  const [demoSubmitting, setDemoSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (status === "authenticated" && session) {
      router.replace(next ?? homeForRoles(session.user.roles));
    }
  }, [status, session, next, router]);

  async function doLogin(loginEmail: string, loginPassword: string) {
    setError(null);
    try {
      const newSession = await login({ email: loginEmail, password: loginPassword });
      router.replace(next ?? homeForRoles(newSession.user.roles));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    }
  }

  const onSubmit = (values: LoginFormValues) => doLogin(values.email, values.password);

  async function doDemoLogin(loginEmail: string, loginPassword: string) {
    setDemoSubmitting(true);
    try {
      await doLogin(loginEmail, loginPassword);
    } finally {
      setDemoSubmitting(false);
    }
  }

  const submitting = isSubmitting || demoSubmitting;

  if (status === "loading" || status === "authenticated") {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-brand-red" aria-hidden />
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-8 md:grid-cols-2">
      <Card className="p-6 md:p-8">
        <h2 className="font-heading text-xl font-bold text-ink">Sign in</h2>
        <p className="mt-1 text-sm text-ink-muted">Demo mode — use one of the accounts on the right.</p>

        {expired && (
          <div className="mt-4 flex items-center gap-2 rounded-md border border-warning/30 bg-warning/5 px-3 py-2 text-sm text-warning">
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
            Your session expired. Please sign in again.
          </div>
        )}

        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <FormField label="Email" htmlFor="login-email" required error={errors.email?.message}>
            <Input id="login-email" type="email" autoComplete="email" invalid={!!errors.email} {...register("email")} />
          </FormField>
          <FormField label="Password" htmlFor="login-password" required error={errors.password?.message}>
            <Input
              id="login-password"
              type="password"
              autoComplete="current-password"
              invalid={!!errors.password}
              {...register("password")}
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
            Sign In
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-muted">
          New to BrickBasket?{" "}
          <Link
            href={next ? `${PUBLIC_ROUTES.register}?next=${encodeURIComponent(next)}` : PUBLIC_ROUTES.register}
            className="font-medium text-brand-red hover:underline"
          >
            Create an account
          </Link>
        </p>
      </Card>

      <div>
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-ink-muted">
          Or continue as (demo)
        </h3>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {demoUserDirectory().map((user) => (
            <button
              key={user.email}
              type="button"
              disabled={submitting}
              onClick={() => doDemoLogin(user.email, "demo")}
              className="rounded-md border border-border bg-surface p-3 text-left text-sm hover:border-brand-red hover:bg-brand-red/5 disabled:opacity-50"
            >
              <span className="block font-medium text-ink">{user.name}</span>
              <span className="block text-xs text-ink-muted">
                {ROLE_LABELS[user.roles[0]!] ?? user.roles[0]}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
