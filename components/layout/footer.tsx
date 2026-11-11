import { Container } from "@/components/ui/container";
import { profile } from "@/lib/content";

// Static year: the site is a static export, so a computed year would freeze at
// build time anyway. Bump manually when redeploying in a new year.
const COPYRIGHT_YEAR = 2026;

export function Footer() {
  return (
    <footer className="border-t border-border py-8">
      <Container>
        <p className="text-sm text-muted">
          © {COPYRIGHT_YEAR} {profile.name}
        </p>
      </Container>
    </footer>
  );
}
