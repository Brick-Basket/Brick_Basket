import type { Metadata } from "next";
import { PageBanner } from "@/components/marketing/page-banner";
import { AboutSection } from "@/components/marketing/sections/about-section";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "BrickBasket is a premium construction and real estate company delivering end-to-end building solutions with transparency, quality and commitment.",
};

export default function AboutPage() {
  return (
    <>
      <PageBanner title="About Us" current="About Us" />
      <AboutSection />
    </>
  );
}
