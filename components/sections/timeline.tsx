import { Section } from "@/components/ui/section";
import { timeline } from "@/lib/content";

export function Timeline() {
  return (
    <Section id="trajetoria" label="Trajetória">
      <ol>
        {timeline.map((entry) => (
          <li
            key={entry.title}
            className="grid gap-2 border-b border-border py-6 first:pt-0 sm:grid-cols-[150px_1fr] sm:gap-8"
          >
            <p className="text-sm text-muted sm:pt-1">{entry.period}</p>
            <div>
              <h3 className="font-display text-xl tracking-tight">{entry.title}</h3>
              <p className="mt-2 max-w-xl leading-7 text-muted">{entry.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}
