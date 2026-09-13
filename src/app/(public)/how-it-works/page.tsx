import type { Metadata } from "next";
import { PageBanner } from "@/components/marketing/page-banner";
import { HowItWorksSection } from "@/components/marketing/sections/how-it-works-section";

export const metadata: Metadata = {
  title: "How It Works",
  description: "From your first enquiry to handover — how BrickBasket takes a project from idea to completion.",
};

export default function HowItWorksPage() {
  return (
    <>
      <PageBanner title="How It Works" current="How It Works" />
      <HowItWorksSection />
    </>
  );
}
