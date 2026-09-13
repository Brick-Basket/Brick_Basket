import type { Metadata } from "next";
import { PageBanner } from "@/components/marketing/page-banner";
import { WhyUsSection } from "@/components/marketing/sections/why-us-section";

export const metadata: Metadata = {
  title: "Why BrickBasket",
  description:
    "15+ years of experience, quality assurance, a transparent process and an expert team — why BrickBasket is the right construction partner for you.",
};

export default function WhyUsPage() {
  return (
    <>
      <PageBanner title="Why Choose BrickBasket?" current="Why Us" />
      <WhyUsSection />
    </>
  );
}
