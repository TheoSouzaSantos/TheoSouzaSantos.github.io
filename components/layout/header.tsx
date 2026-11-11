"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { cn, scrollToHash } from "@/lib/utils";

const links = [
  { href: "#sobre", label: "Sobre" },
  { href: "#projetos", label: "Projetos" },
  { href: "#trajetoria", label: "Trajetória" },
  { href: "#contato", label: "Contato" },
];

function DesktopNav() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <nav aria-label="Navegação principal" className="hidden items-center gap-7 md:flex">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          onClick={(e) => scrollToHash(e, link.href, shouldReduceMotion)}
          className="link-draw cursor-pointer py-2 text-sm text-muted transition-colors duration-200 ease-out-strong hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

function MobileMenu() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;

    closeRef.current?.focus();
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Abrir menu"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen(true)}
        className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-md text-foreground md:hidden focus-visible:outline-2 focus-visible:outline-accent"
      >
        <Menu aria-hidden="true" className="h-4 w-4" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: shouldReduceMotion ? 0.01 : 0.2, ease: "easeOut" }}
              onClick={() => {
                setOpen(false);
                triggerRef.current?.focus();
              }}
            />
            <motion.div
              id="mobile-menu"
              role="dialog"
              aria-modal="true"
              aria-label="Menu de navegação"
              className="fixed inset-y-0 right-0 z-50 flex w-72 flex-col gap-1 border-l border-border bg-background p-6 md:hidden"
              initial={{ x: shouldReduceMotion ? 0 : "100%", opacity: shouldReduceMotion ? 0 : 1 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: shouldReduceMotion ? 0 : "100%", opacity: shouldReduceMotion ? 0 : 1 }}
              transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            >
              <div className="flex justify-end">
                <button
                  ref={closeRef}
                  type="button"
                  aria-label="Fechar menu"
                  onClick={() => {
                    setOpen(false);
                    triggerRef.current?.focus();
                  }}
                  className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-md focus-visible:outline-2 focus-visible:outline-accent"
                >
                  <X aria-hidden="true" className="h-4 w-4" />
                </button>
              </div>
              <nav aria-label="Navegação móvel" className="mt-4 flex flex-col gap-2">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={(e) => {
                      setOpen(false);
                      scrollToHash(e, link.href, shouldReduceMotion);
                    }}
                    className="cursor-pointer border-b border-border px-1 py-4 font-display text-2xl text-foreground transition-colors duration-200 ease-out-strong hover:text-accent focus-visible:outline-2 focus-visible:outline-accent"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b bg-background transition-colors duration-200 ease-out-strong",
        scrolled ? "border-border" : "border-transparent",
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3 sm:px-10">
        <Link
          href="#inicio"
          onClick={(e) => scrollToHash(e, "#inicio", shouldReduceMotion)}
          className="cursor-pointer font-display text-xl tracking-tight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Théo Souza
        </Link>

        <div className="flex items-center gap-4">
          <DesktopNav />
          <ThemeToggle />
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
