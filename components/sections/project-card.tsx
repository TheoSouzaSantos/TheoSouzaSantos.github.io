import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SensorDemo } from "@/components/sections/sensor-demo";
import type { Project } from "@/lib/projects";

export function ProjectCard({ project }: { project: Project }) {
  const isUpcoming = project.status === "upcoming";

  const content = (
    <div className="grid gap-3 py-8 sm:grid-cols-[1fr_auto] sm:gap-10">
      <div>
        <h3 className="flex items-center gap-2 font-display text-2xl tracking-tight">
          <span className="link-draw">{project.title}</span>
          {isUpcoming ? (
            <span className="font-sans text-xs font-medium text-muted">Em breve</span>
          ) : (
            <ArrowUpRight
              aria-hidden="true"
              className="h-5 w-5 text-muted transition duration-200 ease-out-strong group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
            />
          )}
        </h3>
        <p className="mt-3 max-w-xl leading-7 text-muted">{project.description}</p>
      </div>
      <p className="text-sm text-muted sm:pt-2 sm:text-right">{project.tags.join(" · ")}</p>
    </div>
  );

  if (isUpcoming || !project.href) {
    return <li className="border-b border-border">{content}</li>;
  }

  return (
    <li className="border-b border-border">
      <Link
        href={project.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Ver repositório do projeto ${project.title} no GitHub`}
        className="group block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {content}
      </Link>
      {project.featured && (
        <div className="-mt-2 pb-8">
          <SensorDemo />
        </div>
      )}
    </li>
  );
}
