import type { Metadata } from "next";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { PageBanner } from "@/components/marketing/page-banner";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Register",
  description: "Create a BrickBasket customer account to track your project online.",
};

export default function RegisterPage() {
  return (
    <>
      <PageBanner title="Register" current="Register" />
      <section className="container py-16 md:py-20">
        <Suspense
          fallback={
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-brand-red" aria-hidden />
            </div>
          }
        >
          <RegisterForm />
        </Suspense>
      </section>
    </>
  );
}
