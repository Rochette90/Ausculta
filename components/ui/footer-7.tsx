import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

export type Footer7Props = {
  logo?: {
    url: string;
    src: string;
    alt: string;
    title: string;
    width?: number;
    height?: number;
  };
  sections?: Array<{
    title: string;
    links: Array<{ name: string; href: string }>;
  }>;
  description?: string;
  socialLinks?: Array<{
    icon: ReactNode;
    href: string;
    label: string;
  }>;
  copyright?: string;
  legalLinks?: Array<{
    name: string;
    href: string;
  }>;
};

export function Footer7({
  logo,
  sections = [],
  description,
  socialLinks = [],
  copyright,
  legalLinks = [],
}: Footer7Props) {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-6 lg:px-8">
        <div className="flex w-full flex-col justify-between gap-10 lg:flex-row lg:items-start lg:text-left">
          <div className="flex w-full flex-col justify-between gap-6 lg:items-start">
            {logo && (
              <div className="flex items-center gap-2 lg:justify-start">
                <Link className="footer-logo" href={logo.url}>
                  <Image alt={logo.alt} className="h-8 w-auto" height={logo.height ?? 52} src={logo.src} title={logo.title} width={logo.width ?? 242} />
                </Link>
              </div>
            )}
            {description && <p className="max-w-[70%] text-sm text-[var(--muted)]">{description}</p>}
            {socialLinks.length > 0 && (
              <ul className="flex items-center space-x-6 text-[var(--muted)]">
                {socialLinks.map((social) => (
                  <li key={social.label} className="font-medium hover:text-[var(--primary)]">
                    <a aria-label={social.label} href={social.href}>{social.icon}</a>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="grid w-full gap-6 md:grid-cols-3 lg:gap-20">
            {sections.map((section) => (
              <div key={section.title}>
                <h3 className="mb-4 font-bold text-[var(--ink)]">{section.title}</h3>
                <ul className="space-y-3 text-sm text-[var(--muted)]">
                  {section.links.map((link) => (
                    <li key={link.name} className="font-medium hover:text-[var(--primary)]">
                      <Link href={link.href}>{link.name}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        {(copyright || legalLinks.length > 0) && (
          <div className="mt-8 flex flex-col justify-between gap-4 border-t border-[var(--line)] py-8 text-xs font-medium text-[var(--muted)] md:flex-row md:items-center md:text-left">
            {copyright && <p className="order-2 lg:order-1">{copyright}</p>}
            {legalLinks.length > 0 && (
              <ul className="order-1 flex flex-col gap-2 md:order-2 md:flex-row">
                {legalLinks.map((link) => (
                  <li key={link.name} className="hover:text-[var(--primary)]">
                    <Link href={link.href}>{link.name}</Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
