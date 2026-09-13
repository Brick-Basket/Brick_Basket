import type { Metadata } from "next";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { PageBanner } from "@/components/marketing/page-banner";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to your BrickBasket customer portal or operations dashboard.",
};

export default function LoginPage() {
  return (
    <>
      <PageBanner title="Login" current="Login" />
      <section className="container py-16 md:py-20">
        <Suspense
          fallback={
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-brand-red" aria-hidden />
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </section>
    </>
  );
}
