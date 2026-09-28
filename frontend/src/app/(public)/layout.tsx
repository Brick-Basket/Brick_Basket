import { SiteHeader } from "@/components/marketing/header";
import { SiteFooter } from "@/components/marketing/footer";
import { LanguageProvider } from "@/components/providers/language-provider";

/**
 * Layout for every public marketing route. Shared header/footer only —
 * no auth/permission gating here (that starts at (portal) and (internal)).
 *
 * `LanguageProvider` (English/Hindi, docs/OPEN_QUESTIONS.md #77) is mounted
 * here — scoped to this route group only, so the internal admin and
 * customer-portal shells (which have their own layouts) never pick it up
 * and stay English-only, consistent with how every other staff-facing
 * module in this app is built.
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </div>
    </LanguageProvider>
  );
}
