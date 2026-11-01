"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, AlertTriangle } from "lucide-react";
import { useSession } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Card } from "@/components/ui/card";
import { PORTAL_ROUTES, PUBLIC_ROUTES } from "@/lib/constants/routes";

// UI FIX (broad audit pass): same gap, and same fix, as `LoginForm` — this
// form used plain `useState` with `required`/`minLength` attributes on bare
// `<input>`s while also setting `noValidate` on the `<form>`, so neither the
// browser's native validation nor a custom inline error ever actually
// surfaced required/format problems. Matches the rest of the app's zod +
// react-hook-form + `FormField error` pattern; the cross-field
// password-confirmation check (which zod can't express per-field as neatly)
// stays as a `.superRefine()` targeting `confirmPassword`.
const registerFormSchema = z
  .object({
    name: z.string().min(1, "Full name is required"),
    email: z.string().min(1, "Email is required").email("Enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .superRefine((val, ctx) => {
    if (val.password !== val.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords don't match.",
        path: ["confirmPassword"],
      });
    }
  });

type RegisterFormValues = z.infer<typeof registerFormSchema>;

/**
 * Demo-mode self-registration: creates a new `customer` account (see
 * src/lib/auth/registered-users-store.ts) and signs the visitor straight
 * in — there is no email verification step or backend, consistent with the
 * rest of this mock auth implementation. Staff accounts are never created
 * here; they only exist in the fixed demo persona directory
 * (src/lib/auth/mock-users.ts). See docs/AUTHENTICATION.md.
 */
export function RegisterForm() {
  const { status, session, register: registerSession } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  useEffect(() => {
    if (status === "authenticated" && session) {
      router.replace(next ?? PORTAL_ROUTES.home);
    }
  }, [status, session, next, router]);

  const submitting = isSubmitting;

  async function onSubmit(values: RegisterFormValues) {
    setError(null);
    try {
      const newSession = await registerSession({ name: values.name, email: values.email, password: values.password });
      router.replace(next ?? PORTAL_ROUTES.home);
      void newSession;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
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

        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <FormField label="Full name" htmlFor="register-name" required error={errors.name?.message}>
            <Input id="register-name" type="text" autoComplete="name" invalid={!!errors.name} {...register("name")} />
          </FormField>
          <FormField label="Email" htmlFor="register-email" required error={errors.email?.message}>
            <Input id="register-email" type="email" autoComplete="email" invalid={!!errors.email} {...register("email")} />
          </FormField>
          <FormField
            label="Password"
            htmlFor="register-password"
            required
            error={errors.password?.message}
            hint={errors.password?.message ? undefined : "At least 6 characters."}
          >
            <Input
              id="register-password"
              type="password"
              autoComplete="new-password"
              invalid={!!errors.password}
              {...register("password")}
            />
          </FormField>
          <FormField label="Confirm password" htmlFor="register-confirm-password" required error={errors.confirmPassword?.message}>
            <Input
              id="register-confirm-password"
              type="password"
              autoComplete="new-password"
              invalid={!!errors.confirmPassword}
              {...register("confirmPassword")}
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
