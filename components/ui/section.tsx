import { Container } from "@/components/ui/container";

export function Section({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="border-t border-border py-16 sm:py-24">
      <Container className="grid gap-8 md:grid-cols-[200px_1fr] md:gap-12">
        <h2 className="text-sm font-medium text-muted">{label}</h2>
        <div>{children}</div>
      </Container>
    </section>
  );
}
