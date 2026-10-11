"use client";

import {
  ArrowLeft,
  BookOpenCheck,
  BrainCircuit,
  Check,
  LoaderCircle,
  Stethoscope,
  TimerReset,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { SpecialtyIcon } from "../content/SpecialtyIcon";
import { BrandLogo } from "../brand/BrandLogo";
import { BRAND_NAME } from "@/lib/brand";
import { isLearningPriorityAvailable, ONBOARDING_ASKS_SPECIALTIES } from "@/lib/features";

type SpecialtyOption = {
  id: string;
  name: string;
  icon: string | null;
};

type OnboardingFlowProps = {
  minimumExamDate: string;
  nextPath: string;
  specialties: SpecialtyOption[];
};

const allPriorities = [
  { id: "fiches", label: "Réviser les fiches", detail: "Consolider rapidement les notions essentielles.", icon: BookOpenCheck },
  { id: "qcm", label: "Faire des QCM", detail: "Tester mes connaissances et corriger mes erreurs.", icon: BrainCircuit },
  { id: "cas_cliniques", label: "Travailler des cas", detail: "Développer mon raisonnement clinique.", icon: Stethoscope },
  { id: "seances", label: "Suivre des séances", detail: "Avancer avec un entraînement guidé de 30 minutes.", icon: TimerReset },
] as const;
// Seules les priorités dont le module est actif sont proposées. S'il n'en
// reste qu'une, elle est retenue d'office et l'étape disparaît.
const priorities = allPriorities.filter((priority) => isLearningPriorityAvailable(priority.id));
// Les spécialités ne sont demandées que si elles servent (fiches ou QCM actifs) :
// en périmètre ECOS seul, l'onboarding tient en un écran, que l'on peut passer.
const steps: ReadonlyArray<"studies" | "priority" | "specialties"> = [
  "studies",
  ...(priorities.length > 1 ? ["priority" as const] : []),
  ...(ONBOARDING_ASKS_SPECIALTIES ? ["specialties" as const] : []),
];

export function OnboardingFlow({ minimumExamDate, nextPath, specialties }: OnboardingFlowProps) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const step = steps[stepIndex];
  const stepNumber = stepIndex + 1;
  const isLastStep = stepIndex === steps.length - 1;
  const [university, setUniversity] = useState("lausanne");
  const [studyYear, setStudyYear] = useState("b3");
  const [examDate, setExamDate] = useState("");
  const [learningPriority, setLearningPriority] = useState<string>(priorities.length === 1 ? priorities[0].id : "");
  const [specialtyIds, setSpecialtyIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canContinue = step === "studies"
    ? Boolean(university && studyYear)
    : step === "priority"
      ? Boolean(learningPriority)
      : specialtyIds.length >= 2 && specialtyIds.length <= 3;

  function toggleSpecialty(id: string) {
    setError(null);
    setSpecialtyIds((current) => current.includes(id)
      ? current.filter((item) => item !== id)
      : current.length < 3 ? [...current, id] : current);
  }

  async function submit(mode: "complete" | "skip") {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(mode === "skip" ? { mode } : {
          mode,
          university,
          studyYear,
          examDate: examDate || null,
          learningPriority,
          specialtyIds,
        }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || "Enregistrement impossible.");
      router.push(nextPath);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Enregistrement impossible.");
      setBusy(false);
    }
  }

  function continueToNextStep() {
    if (!canContinue) return;
    setError(null);
    if (!isLastStep) setStepIndex((current) => current + 1);
    else void submit("complete");
  }

  return (
    <main className="onb-page">
      <div className="onb-inner">
        <header className="onb-top">
          <BrandLogo priority />
          <button className="text-link" disabled={busy} onClick={() => void submit("skip")} type="button">Passer pour le moment</button>
        </header>

        {steps.length > 1 && <div className="onb-progress" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }} aria-label={`Étape ${stepNumber} sur ${steps.length}`}>
          {steps.map((item, index) => <span className={index <= stepIndex ? "is-done" : undefined} key={item} />)}
        </div>}

        <section className="onb-card">
          {steps.length > 1 && <p className="onb-step">Étape {stepNumber} sur {steps.length}</p>}
          {step === "studies" && <><h1>Bienvenue sur {BRAND_NAME}. Où en es-tu dans tes études ?</h1><p className="onb-lead">{steps.length > 1 ? "Ces informations nous aident à proposer un rythme adapté." : "Cela nous aide à savoir pour qui construire les prochaines stations. Tu peux passer cette étape."}</p></>}
          {step === "priority" && <><h1>Quelle est ta priorité actuelle ?</h1><p className="onb-lead">Ton tableau de bord commencera par l’activité la plus utile pour toi.</p></>}
          {step === "specialties" && <><h1>Que veux-tu travailler en premier ?</h1><p className="onb-lead">Choisis deux ou trois spécialités. Tu pourras les modifier plus tard.</p></>}

          {step === "studies" && (
            <div className="onb-fields">
              <label>Université
                <select className="field" onChange={(event) => setUniversity(event.target.value)} value={university}>
                  <option value="lausanne">Université de Lausanne</option><option value="geneve">Université de Genève</option><option value="fribourg">Université de Fribourg</option><option value="berne">Université de Berne</option><option value="bale">Université de Bâle</option><option value="zurich">Université de Zurich</option><option value="autre">Autre université</option>
                </select>
              </label>
              <label>Année d’études
                <select className="field" onChange={(event) => setStudyYear(event.target.value)} value={studyYear}>
                  <option value="b1">Bachelor 1</option><option value="b2">Bachelor 2</option><option value="b3">Bachelor 3</option><option value="m1">Master 1</option><option value="m2">Master 2</option><option value="m3">Master 3</option><option value="autre">Autre</option>
                </select>
              </label>
              <label className="is-wide">Date du prochain examen <small>(facultatif)</small>
                <input className="field" min={minimumExamDate} onChange={(event) => setExamDate(event.target.value)} type="date" value={examDate} />
              </label>
            </div>
          )}

          {step === "priority" && (
            <div className="onb-choices">
              {priorities.map(({ id, label, detail, icon: Icon }) => {
                const selected = learningPriority === id;
                return <button aria-pressed={selected} className="onb-choice" key={id} onClick={() => setLearningPriority(id)} type="button"><Icon aria-hidden="true" size={20} /><span><strong>{label}</strong><span>{detail}</span></span></button>;
              })}
            </div>
          )}

          {step === "specialties" && (
            <div>
              <p className="onb-step" style={{ marginTop: 24 }}>{specialtyIds.length}/3 sélectionnées{specialtyIds.length >= 2 ? ", sélection suffisante" : ""}</p>
              <div className="onb-choices">
                {specialties.map((specialty) => {
                  const selected = specialtyIds.includes(specialty.id);
                  return <button aria-pressed={selected} className="onb-choice" key={specialty.id} onClick={() => toggleSpecialty(specialty.id)} type="button"><SpecialtyIcon name={specialty.icon} /><span><strong>{specialty.name}</strong></span>{selected && <Check aria-hidden="true" className="ml-auto" size={17} />}</button>;
                })}
              </div>
            </div>
          )}

          {error && <p className="onb-error" role="alert">{error}</p>}

          <footer className="onb-footer">
            <button className={`text-link ${stepIndex === 0 ? "invisible" : ""}`} disabled={busy || stepIndex === 0} onClick={() => setStepIndex((current) => Math.max(0, current - 1))} type="button"><ArrowLeft aria-hidden="true" size={17} /> Retour</button>
            <button className="button primary" disabled={busy || !canContinue} onClick={continueToNextStep} type="button">{busy ? <><LoaderCircle aria-hidden="true" className="animate-spin" size={17} /> Enregistrement…</> : isLastStep ? "Enregistrer et continuer" : "Continuer"}</button>
          </footer>
        </section>
        <p className="onb-note">Moins d’une minute. Modifiable à tout moment depuis ton profil.</p>
      </div>
    </main>
  );
}
