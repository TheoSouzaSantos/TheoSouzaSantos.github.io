import { Section } from "@/components/ui/section";
import { ProjectCard } from "@/components/sections/project-card";
import { projects } from "@/lib/projects";

export function Projects() {
  return (
    <Section id="projetos" label="Projetos">
      <ul className="-mt-8">
        {projects.map((project) => (
          <ProjectCard key={project.slug} project={project} />
        ))}
      </ul>
    </Section>
  );
}
