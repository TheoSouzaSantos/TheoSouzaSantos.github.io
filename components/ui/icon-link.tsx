import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import { cn } from "@/lib/utils";

export function IconLink({
  href,
  label,
  icon: Icon,
  className,
}: {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  className?: string;
}) {
  const isExternal = href.startsWith("http");

  return (
    <Link
      href={href}
      aria-label={label}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className={cn(
        "flex h-11 w-11 cursor-pointer items-center justify-center rounded-md text-muted transition-colors duration-200 ease-out-strong hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        className,
      )}
    >
      <Icon aria-hidden="true" className="h-[18px] w-[18px]" />
    </Link>
  );
}
