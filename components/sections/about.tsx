import { Section } from "@/components/ui/section";
import { profile, skills } from "@/lib/content";

export function About() {
  return (
    <Section id="sobre" label="Sobre">
      <div className="max-w-2xl space-y-5 text-lg leading-8">
        {profile.bio.slice(1).map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>

      <h3 className="mt-14 text-sm font-medium text-muted">Tecnologias</h3>
      <ul className="mt-4 grid grid-cols-2 border-t border-border sm:grid-cols-4">
        {skills.map((skill) => (
          <li key={skill} className="border-b border-border py-3 pr-4 text-[15px]">
            {skill}
          </li>
        ))}
      </ul>
    </Section>
  );
}
