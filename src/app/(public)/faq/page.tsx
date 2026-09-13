import type { Metadata } from "next";
import { PageBanner } from "@/components/marketing/page-banner";
import { FaqSection } from "@/components/marketing/sections/faq-section";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers to common questions about working with BrickBasket.",
};

export default function FaqPage() {
  return (
    <>
      <PageBanner title="Frequently Asked Questions" current="FAQ" />
      <FaqSection />
    </>
  );
}
