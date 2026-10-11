"use client";

import NumberFlow from "@number-flow/react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, Clock, ShieldCheck, Sparkles, Star } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { useMediaQuery } from "../../hooks/use-media-query";
import { cn } from "../../lib/utils";
import { Label } from "./label";
import { Switch } from "./switch";
import { BRAND_PLAN_LABEL } from "@/lib/brand";

export type PricingPlan = {
  name: string;
  eyebrow: string;
  monthlyPrice: number | null;
  yearlyPrice: number | null;
  features: string[];
  description: string;
  buttonText: string;
  href?: string;
  isPopular?: boolean;
  isAvailable?: boolean;
};

type PricingProps = {
  plans: PricingPlan[];
  title?: string;
  description?: string;
};

export function Pricing({
  plans,
  title = "Un tarif simple pour apprendre à votre rythme.",
  description = `Commencez gratuitement, puis passez à ${BRAND_PLAN_LABEL} lorsque vous avez besoin d’un entraînement plus intensif.`,
}: PricingProps) {
  const [isAnnual, setIsAnnual] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 900px)");
  const reduceMotion = useReducedMotion();
  const switchRef = useRef<HTMLButtonElement>(null);
  const hasAvailablePaidPlan = plans.some((plan) => plan.isAvailable !== false && (plan.monthlyPrice ?? 0) > 0);

  async function handleToggle(checked: boolean) {
    setIsAnnual(checked);
    if (!checked || reduceMotion || !switchRef.current) return;

    const rect = switchRef.current.getBoundingClientRect();
    try {
      const confetti = (await import("canvas-confetti")).default;
      confetti({
        particleCount: 44,
        spread: 55,
        origin: {
          x: (rect.left + rect.width / 2) / window.innerWidth,
          y: (rect.top + rect.height / 2) / window.innerHeight,
        },
        colors: ["#0d9488", "#2dd4bf", "#99f6e4", "#fbbf24"],
        ticks: 170,
        gravity: 1.1,
        decay: 0.94,
        startVelocity: 28,
        shapes: ["circle"],
        disableForReducedMotion: true,
      });
    } catch {
      // Ignorer silencieusement si confetti ne peut pas être chargé
    }
  }

  return (
    <section className="mx-auto w-full max-w-[1240px] px-4 pb-20 pt-14 sm:px-6 sm:pt-20 lg:px-8 lg:pb-28">
      <div className="mx-auto max-w-3xl text-center">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2 text-xs font-bold tracking-[0.13em] text-[var(--primary)] shadow-sm">
          <Sparkles aria-hidden="true" size={15} /> TARIFS TRANSPARENTS
        </div>
        <h1 className="m-0 text-balance text-[clamp(2.7rem,7vw,5.2rem)] leading-[0.98] text-[var(--ink)]">
          {title}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-7 text-[var(--muted)] sm:text-lg">
          {description}
        </p>
      </div>

      <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <div className="flex items-center gap-3 rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 shadow-sm">
          <span className={cn("text-sm font-semibold transition-colors", !isAnnual ? "text-[var(--ink)]" : "text-[var(--muted)]")}>Mensuel</span>
          <Label className="flex cursor-pointer items-center text-[var(--ink)]" htmlFor="annual-billing">
            <span className="sr-only">Activer la facturation annuelle</span>
            <Switch id="annual-billing" ref={switchRef} checked={isAnnual} onCheckedChange={handleToggle} />
          </Label>
          <span className={cn("text-sm font-semibold transition-colors", isAnnual ? "text-[var(--ink)]" : "text-[var(--muted)]")}>Annuel</span>
        </div>
        {hasAvailablePaidPlan && <span className="rounded-full bg-[var(--mint)] px-3 py-1.5 text-xs font-bold text-[var(--mint-dark)]">Économisez CHF 59.80</span>}
      </div>

      <div className={cn(
        "mx-auto mt-12 grid grid-cols-1 items-stretch gap-5",
        plans.length === 2 ? "max-w-[900px] lg:grid-cols-2" : "lg:grid-cols-3 lg:gap-0",
      )}>
        {plans.map((plan, index) => {
          const price = isAnnual ? plan.yearlyPrice : plan.monthlyPrice;
          const isOuterCard = index === 0 || index === plans.length - 1;
          const isUnavailable = plan.isAvailable === false;

          return (
            <motion.article
              key={plan.name}
              initial={reduceMotion ? false : { y: 24, opacity: 1 }}
              whileInView={reduceMotion ? undefined : {
                y: isDesktop && plan.isPopular ? -18 : 0,
                x: 0,
                scale: isDesktop && isOuterCard && !plan.isPopular ? 0.97 : 1,
                opacity: 1,
              }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.65, type: "spring", stiffness: 90, damping: 18, delay: index * 0.08 }}
              className={cn(
                "relative flex min-h-[570px] flex-col overflow-hidden rounded-[28px] border bg-[var(--surface)] p-7 text-left shadow-[var(--shadow-md)] sm:p-8",
                plan.isPopular
                  ? "z-10 border-2 border-[var(--primary)] shadow-[var(--shadow-lg)]"
                  : "z-0 border-[var(--line)]",
              )}
            >
              {isUnavailable ? (
                <div className="absolute right-0 top-0 flex items-center gap-1.5 rounded-bl-2xl bg-amber-500 px-4 py-2 text-xs font-bold text-white">
                  <Clock aria-hidden="true" size={14} /> Bientôt disponible
                </div>
              ) : plan.isPopular ? (
                <div className="absolute right-0 top-0 flex items-center gap-1.5 rounded-bl-2xl bg-[var(--primary)] px-4 py-2 text-xs font-bold text-white">
                  <Star aria-hidden="true" className="fill-current" size={14} /> Le plus choisi
                </div>
              ) : null}

              <p className="m-0 text-xs font-bold tracking-[0.14em] text-[var(--primary)]">{plan.eyebrow}</p>
              <h2 className="mb-0 mt-3 text-3xl text-[var(--ink)]">{plan.name}</h2>
              <p className="mb-0 mt-3 min-h-12 text-sm leading-6 text-[var(--muted)]">{plan.description}</p>

              <div className="mt-8 min-h-[82px]">
                {price === null ? (
                  <div className="text-[2.55rem] font-extrabold leading-none tracking-[-0.04em] text-[var(--ink)]">Sur devis</div>
                ) : isUnavailable ? (
                  <div className="flex items-end gap-2 opacity-50">
                    <span className="pb-1 text-base font-bold text-[var(--muted)] line-through">CHF</span>
                    <span className="text-[3.5rem] font-extrabold leading-none tracking-[-0.055em] text-[var(--ink)] tabular-nums line-through decoration-2">
                      {Number.isInteger(price) ? price : price.toFixed(2)}
                    </span>
                    {price > 0 && <span className="pb-1.5 text-sm font-semibold text-[var(--muted)] line-through">/ {isAnnual ? "an" : "mois"}</span>}
                  </div>
                ) : (
                  <div className="flex items-end gap-2">
                    <span className="pb-1 text-base font-bold text-[var(--muted)]">CHF</span>
                    <NumberFlow
                      value={price}
                      format={{ minimumFractionDigits: Number.isInteger(price) ? 0 : 2, maximumFractionDigits: 2 }}
                      transformTiming={{ duration: 450, easing: "ease-out" }}
                      className="text-[3.5rem] font-extrabold leading-none tracking-[-0.055em] text-[var(--ink)] tabular-nums"
                    />
                    {price > 0 && <span className="pb-1.5 text-sm font-semibold text-[var(--muted)]">/ {isAnnual ? "an" : "mois"}</span>}
                  </div>
                )}
                <p className="mb-0 mt-2 text-xs font-medium text-[var(--muted)]">
                  {isUnavailable ? "Formule en préparation — reste gratuite pour le moment" : price === null ? "Pour une faculté, une association ou une promotion" : price === 0 ? "Gratuit, sans carte bancaire" : isAnnual ? `Facturé une fois par an · soit CHF ${(price / 12).toFixed(2)} / mois` : "Facturation mensuelle, résiliable à tout moment"}
                </p>
              </div>

              <div className="my-7 h-px bg-[var(--line)]" />
              <ul className="m-0 flex flex-1 list-none flex-col gap-3.5 p-0">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm leading-6 text-[var(--ink-secondary)]">
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-[var(--mint)] text-[var(--mint-dark)]">
                      <Check aria-hidden="true" strokeWidth={3} size={12} />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              {plan.href && !isUnavailable ? (
                <Link
                  href={plan.href}
                  className={cn(
                    "group mt-8 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border px-5 py-3 text-sm font-bold no-underline transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2",
                    plan.isPopular
                      ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-[var(--shadow-glow)] hover:bg-[var(--primary-hover)]"
                      : "border-[var(--line)] bg-[var(--surface-subtle)] text-[var(--ink)] hover:border-[var(--primary)] hover:text-[var(--primary)]",
                  )}
                >
                  {plan.buttonText}<ArrowRight aria-hidden="true" className="transition-transform group-hover:translate-x-1" size={16} />
                </Link>
              ) : (
                <button className="mt-8 min-h-12 w-full cursor-not-allowed rounded-2xl border border-[var(--line)] bg-[var(--surface-subtle)] px-5 py-3 text-sm font-bold text-[var(--muted)]" disabled type="button">
                  {plan.buttonText}
                </button>
              )}
            </motion.article>
          );
        })}
      </div>

      <div className="mt-14 flex flex-col items-center justify-center gap-3 text-center text-sm text-[var(--muted)] sm:flex-row sm:gap-7">
        <span className="inline-flex items-center gap-2"><ShieldCheck aria-hidden="true" className="text-[var(--primary)]" size={17} /> Paiement sécurisé par Stripe</span>
        <span>Résiliable à tout moment</span>
        <span>Support en français</span>
      </div>
    </section>
  );
}
