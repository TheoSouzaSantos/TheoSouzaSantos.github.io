import { GithubIcon, LinkedinIcon } from "@/components/icons/brand-icons";
import { Section } from "@/components/ui/section";
import { IconLink } from "@/components/ui/icon-link";
import { profile, socials } from "@/lib/content";

export function Contact() {
  return (
    <Section id="contato" label="Contato">
      <p className="max-w-xl text-lg leading-8">
        Aberto a estágios e projetos. O jeito mais rápido de falar comigo é por e-mail.
      </p>
      <a
        href={socials.email}
        className="link-draw mt-6 inline-block break-all font-display text-3xl tracking-tight hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent sm:text-5xl"
      >
        {profile.email}
      </a>
      <div className="-ml-3 mt-8 flex items-center">
        <IconLink href={socials.github} label="GitHub" icon={GithubIcon} />
        <IconLink href={socials.linkedin} label="LinkedIn" icon={LinkedinIcon} />
      </div>
    </Section>
  );
}
