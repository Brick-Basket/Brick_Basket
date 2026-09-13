import { Card } from "@/components/ui/card";
import type { PublicService } from "@/lib/content/public-site";

/**
 * Shared services-card grid — used by the standalone `/services` page and by
 * the Home page's Services section, so the two can never drift apart (the
 * same reasoning `public-site.ts`'s header comment already applies to the
 * underlying data; this applies it to the rendering too).
 */
export function ServicesGrid({ services }: { services: PublicService[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {services.map((service) => {
        const Icon = service.icon;
        return (
          <Card key={service.title} className="p-6 transition-shadow hover:shadow-lg">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-red/10 text-brand-red">
              <Icon className="h-5 w-5" aria-hidden />
            </div>
            <h3 className="mt-4 font-heading text-base font-semibold text-ink">
              {service.title}
            </h3>
            <p className="mt-2 text-sm text-ink-muted">{service.description}</p>
          </Card>
        );
      })}
    </div>
  );
}
