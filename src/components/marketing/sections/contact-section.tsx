import { MapPin, Phone, Mail, Globe } from "lucide-react";
import { ContactForm } from "@/components/marketing/contact-form";
import { ImagePlaceholder } from "@/components/marketing/image-placeholder";
import { Card } from "@/components/ui/card";
import { CONTACT_INFO } from "@/lib/content/public-site";
import { cn } from "@/lib/utils/cn";

// FRONTEND IMPLEMENTATION DECISION (post-Part-20 stabilization pass, Phase
// 8): address/phone/email/website now come from the shared `CONTACT_INFO`
// (so this page and the footer can't disagree), and phone/email/website
// are real `tel:`/`mailto:`/`https:` links instead of plain text — a
// visitor can now actually act on them. See docs/OPEN_QUESTIONS.md #46.
const CONTACT_DETAILS = [
  { icon: MapPin, label: "Address", value: CONTACT_INFO.address, href: undefined },
  {
    icon: Phone,
    label: "Phone",
    value: CONTACT_INFO.phones.join(", "),
    href: `tel:+91${CONTACT_INFO.phones[0]}`,
  },
  { icon: Mail, label: "Email", value: CONTACT_INFO.email, href: `mailto:${CONTACT_INFO.email}` },
  { icon: Globe, label: "Website", value: CONTACT_INFO.website, href: `https://${CONTACT_INFO.website}` },
];

/**
 * Contact content, extracted so both the standalone `/contact` page and the
 * Home page's one-pager section render the exact same info block, form, and
 * closing band — see `docs/OPEN_QUESTIONS.md` #46 for the drift problem this
 * pattern avoids.
 */
export function ContactSection({ id, className }: { id?: string; className?: string }) {
  return (
    <>
      <section id={id} className={cn("container grid gap-10 py-16 md:grid-cols-2 md:py-20", className)}>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-red">Get in Touch</p>
          <h2 className="mt-2 font-heading text-2xl font-bold text-ink">
            We are here to help
          </h2>
          <p className="mt-2 text-ink-muted">
            Reach out to us for any inquiries or project consultations.
          </p>

          <ul className="mt-6 flex flex-col gap-4">
            {CONTACT_DETAILS.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.label} className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-red/10 text-brand-red">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      {item.label}
                    </div>
                    {item.href ? (
                      <a href={item.href} className="text-sm text-ink hover:text-brand-red hover:underline">
                        {item.value}
                      </a>
                    ) : (
                      <div className="text-sm text-ink">{item.value}</div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          {/* FRONTEND IMPLEMENTATION DECISION (post-Part-20 stabilization
             pass, Phase 8): the Facebook/Instagram/LinkedIn icons here used
             to link to `href="#"` — dead links with no confirmed
             destination. No real social URLs exist anywhere in the owner
             requirements, so the icons were removed rather than guessed;
             add them back (with real URLs) the moment the client confirms
             their social profiles. See docs/OPEN_QUESTIONS.md #46. */}

          <div className="mt-8">
            <ImagePlaceholder alt="Map showing the BrickBasket office location in Gomti Nagar, Lucknow" />
          </div>
        </div>

        <Card className="p-6 md:p-8">
          <ContactForm />
        </Card>
      </section>

      {/* FRONTEND IMPLEMENTATION DECISION (post-Part-20 stabilization pass,
         Phase 8): "We typically respond within 24 hours" was an
         unconfirmed response-time SLA — reworded to a neutral statement
         that doesn't promise a timeframe the owner hasn't confirmed. See
         docs/OPEN_QUESTIONS.md #46. */}
      <section className="bg-brand-red text-white">
        <div className="container py-4 text-center text-sm font-medium">
          We look forward to hearing from you.
        </div>
      </section>
    </>
  );
}
