"use client";

import { type FormEvent, useState } from "react";
import { ArrowUpRight, Mail, LoaderCircle } from "lucide-react";
import { BRAND_EMAIL_FROM, BRAND_NAME } from "@/lib/brand";

const CONTACT_EMAIL = BRAND_EMAIL_FROM;

type Status = "idle" | "pending" | "sent" | "error";

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");

  async function submitContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const topic = String(form.get("topic") ?? "Question générale").trim();
    const message = String(form.get("message") ?? "").trim();

    setStatus("pending");
    let ok = false;
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, topic, message }),
      });
      ok = response.ok;
    } catch {
      ok = false;
    }
    setStatus(ok ? "sent" : "error");

    if (!ok) {
      // Repli local : un brouillon reste disponible si l'envoi serveur échoue.
      const subject = encodeURIComponent(`[${BRAND_NAME}] ${topic}`);
      const body = encodeURIComponent(`${message}\n\n—\n${name}\n${email}`);
      window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    }
  }

  const fieldClass = "mt-2 min-h-12 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 text-[var(--ink)] outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary-glow)]";

  const feedback = {
    idle: "Votre message est transmis directement à notre équipe.",
    pending: "Envoi en cours…",
    sent: "Message envoyé. Nous répondons généralement sous 48 heures.",
    error: `L’envoi a échoué. Un brouillon s’est ouvert dans votre messagerie, ou écrivez-nous directement à ${CONTACT_EMAIL}.`,
  }[status];

  return (
    <form className="rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-md)] sm:p-8" onSubmit={(event) => void submitContact(event)}>
      <div className="mb-7 flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[var(--mint)] text-[var(--mint-dark)]"><Mail aria-hidden="true" size={20} /></span>
        <div><h2 className="m-0 text-2xl">Écrivez-nous</h2><p className="mb-0 mt-1 text-sm text-[var(--muted)]">Votre message est enregistré et transmis à notre équipe.</p></div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-bold text-[var(--ink)]">Nom<input autoComplete="name" className={fieldClass} name="name" placeholder="Votre nom" required type="text" /></label>
        <label className="text-sm font-bold text-[var(--ink)]">Adresse e-mail<input autoComplete="email" className={fieldClass} name="email" placeholder="prenom.nom@unil.ch" required type="email" /></label>
      </div>
      <label className="mt-5 block text-sm font-bold text-[var(--ink)]">Sujet<select className={fieldClass} defaultValue="Question générale" name="topic"><option>Question générale</option><option>Problème technique</option><option>Contenu médical</option><option>Partenariat ou faculté</option><option>Compte et abonnement</option></select></label>
      <label className="mt-5 block text-sm font-bold text-[var(--ink)]">Message<textarea className={`${fieldClass} min-h-40 resize-y py-3`} name="message" placeholder="Expliquez-nous votre demande…" required /></label>

      <button className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-3 font-bold text-white transition hover:-translate-y-0.5 hover:bg-[var(--primary-hover)] disabled:opacity-60 sm:w-auto" disabled={status === "pending"} type="submit">
        {status === "pending" ? <LoaderCircle aria-hidden="true" className="animate-spin" size={17} /> : <ArrowUpRight aria-hidden="true" size={17} />}
        Envoyer mon message
      </button>
      <p aria-live="polite" className="mb-0 mt-4 text-xs leading-5 text-[var(--muted)]">{feedback}</p>
    </form>
  );
}
