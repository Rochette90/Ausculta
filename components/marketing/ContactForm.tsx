"use client";

import { type FormEvent, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { BRAND_EMAIL_FROM, BRAND_NAME } from "@/lib/brand";

const CONTACT_EMAIL = BRAND_EMAIL_FROM;

type Status = "idle" | "pending" | "sent" | "invalid" | "limited" | "error";

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");

  async function submitContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "pending") return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const topic = String(form.get("topic") ?? "Question générale").trim();
    const message = String(form.get("message") ?? "").trim();

    if (message.length < 5) {
      setStatus("invalid");
      return;
    }

    setStatus("pending");
    let responseStatus = 0;
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, topic, message }),
      });
      responseStatus = response.status;
    } catch {
      responseStatus = 0;
    }

    if (responseStatus >= 200 && responseStatus < 300) {
      formElement.reset();
      setStatus("sent");
      return;
    }
    // Un champ refusé ou une limite atteinte se corrige sur place : ouvrir la
    // messagerie n'a de sens que si le service est réellement indisponible.
    if (responseStatus === 400 || responseStatus === 429) {
      setStatus(responseStatus === 400 ? "invalid" : "limited");
      return;
    }
    setStatus("error");
    // Repli local : un brouillon reste disponible si l'envoi serveur échoue.
    const subject = encodeURIComponent(`[${BRAND_NAME}] ${topic}`);
    const body = encodeURIComponent(`${message}\n\n—\n${name}\n${email}`);
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  }

  const feedback = {
    idle: "Votre message est enregistré et transmis directement à notre équipe.",
    pending: "Envoi en cours…",
    sent: "Message envoyé. Nous répondons généralement sous 48 heures.",
    invalid: "Merci de vérifier les champs : un nom, une adresse e-mail valide et un message d’au moins 5 caractères.",
    limited: `Plusieurs messages viennent d’être envoyés depuis cette connexion. Réessayez dans une heure ou écrivez-nous à ${CONTACT_EMAIL}.`,
    error: `L’envoi a échoué. Un brouillon s’est ouvert dans votre messagerie, ou écrivez-nous directement à ${CONTACT_EMAIL}.`,
  }[status];

  return (
    <form className="contact-form" onSubmit={(event) => void submitContact(event)}>
      <h2>Écrivez-nous</h2>
      <div className="form-row">
        <label>Nom<input autoComplete="name" className="field" name="name" placeholder="Votre nom" required type="text" /></label>
        <label>Adresse e-mail<input autoComplete="email" className="field" name="email" placeholder="prenom.nom@unil.ch" required type="email" /></label>
      </div>
      <label>Sujet<select className="field" defaultValue="Question générale" name="topic"><option>Question générale</option><option>Problème technique</option><option>Contenu médical</option><option>Partenariat ou faculté</option><option>Compte et abonnement</option></select></label>
      <label>Message<textarea className="field" maxLength={4000} minLength={5} name="message" placeholder="Expliquez-nous votre demande…" required /></label>
      <button className="button primary" disabled={status === "pending"} type="submit">
        {status === "pending" && <LoaderCircle aria-hidden="true" className="animate-spin" size={17} />}
        Envoyer le message
      </button>
      <p aria-live="polite">{feedback}</p>
    </form>
  );
}
