import type { Metadata } from "next";
import { PageBanner } from "@/components/marketing/page-banner";
import { ContactSection } from "@/components/marketing/sections/contact-section";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with BrickBasket.",
};

export default function ContactPage() {
  return (
    <>
      <PageBanner title="Contact Us" current="Contact" />
      <ContactSection />
    </>
  );
}
