import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageBanner } from "@/components/marketing/page-banner";
import { ServicesGrid } from "@/components/marketing/services-grid";
import { buttonVariants } from "@/components/ui/button";
import { PUBLIC_ROUTES } from "@/lib/constants/routes";
import { CONFIRMED_SERVICES } from "@/lib/content/public-site";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = {
  title: "Services",
  description:
    "End-to-end solutions tailored to your every need — project finance, land purchase, Vaastu, planning & architectural services, construction & interior, and more.",
};

export default function ServicesPage() {
  return (
    <>
      <PageBanner title="Our Services" current="Services" />

      <section className="container py-16 md:py-20">
        <p className="mx-auto max-w-2xl text-center text-lg font-medium text-ink">
          End-to-end solutions tailored to your every need
        </p>

        <div className="mt-10">
          <ServicesGrid services={CONFIRMED_SERVICES} />
        </div>

        {/* FRONTEND HARDENING (BrickBasket final hardening pass): a
           "Pending confirmation" section used to render `PENDING_SERVICES`
           (e.g. "Post Construction Support") on this public page — clearly
           labeled as unconfirmed, but still visible to every visitor. This
           pass's explicit instruction is that `PENDING_SERVICES` must never
           render publicly at all, regardless of labeling — it exists in
           `src/lib/content/public-site.ts` as internal content awaiting
           owner confirmation only. Removed. See docs/OPEN_QUESTIONS.md #46. */}
      </section>

      <section className="bg-brand-red text-white">
        <div className="container flex flex-col items-center justify-between gap-6 py-12 text-center md:flex-row md:text-left">
          <div>
            <h2 className="font-heading text-2xl font-bold md:text-3xl">Have a Project in Mind?</h2>
            <p className="mt-1 text-white/85">Let&apos;s discuss how we can help you build the future.</p>
          </div>
          <Link
            href={PUBLIC_ROUTES.contact}
            className={cn(buttonVariants({ size: "lg" }), "bg-white text-brand-red hover:bg-white/90")}
          >
            Get a Quote <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
