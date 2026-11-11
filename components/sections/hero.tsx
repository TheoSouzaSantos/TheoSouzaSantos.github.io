"use client";

import Image from "next/image";
import { useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { profile, socials } from "@/lib/content";
import { scrollToHash } from "@/lib/utils";

// The page-wide BurnIntro is the hero's entrance, so nothing here animates on load.
export function Hero() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section id="inicio" className="py-16 sm:py-24">
      <Container className="grid items-center gap-12 md:grid-cols-[1.4fr_1fr] md:gap-16">
        <div>
          <p className="text-sm font-medium text-accent">{profile.role}</p>
          <h1 className="mt-4 font-display text-5xl font-normal leading-[1.02] tracking-tight sm:text-7xl">
            {profile.name}
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-muted">{profile.bio[0]}</p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Button href="#projetos" onClick={(e) => scrollToHash(e, "#projetos", shouldReduceMotion)}>
              Ver projetos
            </Button>
            <Button href={socials.email} variant="ghost">
              Enviar e-mail
            </Button>
          </div>
        </div>

        <div className="w-full max-w-xs md:max-w-none">
          <Image
            src={profile.avatarUrl}
            alt={`Foto de ${profile.name}`}
            width={640}
            height={640}
            priority
            sizes="(min-width: 768px) 360px, 320px"
            className="aspect-square w-full rounded-sm object-cover"
          />
        </div>
      </Container>
    </section>
  );
}
