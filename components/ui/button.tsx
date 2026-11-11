import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost";

const base =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-md px-5 py-3 text-sm font-medium transition duration-200 ease-out-strong active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

const variants: Record<Variant, string> = {
  primary: "bg-foreground text-background hover:bg-accent hover:text-white",
  ghost: "border border-border text-foreground hover:border-foreground",
};

type ButtonProps = {
  variant?: Variant;
  className?: string;
} & (
  | ({ href: string } & Omit<ComponentPropsWithoutRef<typeof Link>, "href" | "className">)
  | ({ href?: undefined } & Omit<ComponentPropsWithoutRef<"button">, "className">)
);

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  const classes = cn(base, variants[variant], className);

  if (props.href) {
    return <Link className={classes} {...props} />;
  }

  return <button className={classes} {...(props as ComponentPropsWithoutRef<"button">)} />;
}
