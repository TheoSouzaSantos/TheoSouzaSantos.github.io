import { BurnIntro } from "@/components/fx/burn-intro";
import { EmberField } from "@/components/fx/ember-field";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/sections/hero";
import { About } from "@/components/sections/about";
import { Projects } from "@/components/sections/projects";
import { Timeline } from "@/components/sections/timeline";
import { Contact } from "@/components/sections/contact";

export default function Home() {
  return (
    <>
      <BurnIntro />
      <EmberField />
      <Header />
      <main id="conteudo">
        <Hero />
        <About />
        <Projects />
        <Timeline />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
