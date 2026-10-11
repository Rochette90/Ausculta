import { ArrowLeft, ArrowRight, BookOpenCheck, LockKeyhole, Sparkles } from "lucide-react";
import Link from "next/link";
import { DailyQuizCard } from "../../../components/quiz/DailyQuizCard";
import { SpecialtyIcon } from "../../../components/content/SpecialtyIcon";
import { requireUser } from "../../../lib/auth/require-user";
import { getDailyQuiz, getDailyQuizAttempt } from "../../../lib/quiz/daily";
import { getSpecialtyQuizCatalog } from "../../../lib/quiz/specialty";

export const dynamic = "force-dynamic";
export const metadata = { title: "Quiz — Ausculta" };

export default async function QuizPage() {
  const user = await requireUser("/quiz");
  const [quiz, specialties] = await Promise.all([
    getDailyQuiz(),
    getSpecialtyQuizCatalog(user.id),
  ]);
  const initialAttempt = await getDailyQuizAttempt(user.id, quiz);
  const specialtyName = specialties.find((specialty) => specialty.id === quiz.question.specialtyId)?.name ?? "Toutes spécialités";
  const availableCount = specialties.filter((specialty) => specialty.questionCount > 0).length;

  return (
    <main className="page-enter mx-auto w-full max-w-6xl px-4 pb-28 pt-8 sm:px-6 lg:px-8">
      <Link className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 no-underline hover:text-teal-700" href="/dashboard"><ArrowLeft size={17} /> Tableau de bord</Link>
      <header className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div><p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Centre d’entraînement</p><h1 className="m-0">Testez vos <em className="text-teal-700">réflexes cliniques</em></h1><p className="mb-0 mt-3 max-w-2xl leading-7 text-slate-600">Commencez par la question du jour, puis lancez une série ciblée dans la spécialité que vous souhaitez travailler.</p></div>
        <div className="flex gap-3 text-sm"><span className="rounded-full bg-white px-4 py-2 font-semibold shadow-sm"><strong>{availableCount}</strong> quiz disponibles</span><span className="rounded-full bg-teal-50 px-4 py-2 font-semibold text-teal-800"><strong>{specialties.length}</strong> spécialités</span></div>
      </header>

      <DailyQuizCard initialAttempt={initialAttempt} quiz={quiz} specialtyName={specialtyName} />

      <section className="scroll-mt-24 pt-14" id="quiz-par-specialite">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Entraînement libre</p><h2 className="m-0 text-3xl">Quiz par spécialité</h2><p className="mb-0 mt-2 text-slate-600">Les questions non maîtrisées sont proposées en priorité.</p></div><span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500"><Sparkles size={16} /> XP attribuée une fois par question</span></div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {specialties.map((specialty) => {
            const available = specialty.questionCount > 0;
            const progress = specialty.questionCount === 0 ? 0 : Math.round((specialty.masteredCount / specialty.questionCount) * 100);
            const content = <><div className="flex items-start justify-between gap-4"><span className={`grid size-12 place-items-center rounded-2xl ${available ? "bg-teal-50 text-teal-700" : "bg-slate-100 text-slate-400"}`}><SpecialtyIcon name={specialty.icon} /></span>{available ? <ArrowRight className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-teal-700" size={18} /> : <LockKeyhole className="text-slate-300" size={18} />}</div><h3 className="mb-2 mt-5 text-xl">{specialty.name}</h3><p className="min-h-12 text-sm leading-6 text-slate-500">{specialty.description}</p><div className="mt-5 flex items-center justify-between text-sm font-semibold"><span>{available ? `${specialty.questionCount} question${specialty.questionCount > 1 ? "s" : ""}` : "Questions bientôt"}</span>{available && <span className="text-teal-700">{specialty.masteredCount}/{specialty.questionCount} maîtrisées</span>}</div>{available && <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-teal-500" style={{ width: `${progress}%` }} /></div>}</>;
            return available ? <Link className="group rounded-3xl border border-slate-200 bg-white p-5 text-slate-900 no-underline shadow-sm transition hover:-translate-y-1 hover:border-teal-200 hover:shadow-lg" href={`/quiz/${specialty.slug}`} key={specialty.id}>{content}</Link> : <article className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 p-5 text-slate-500" key={specialty.id}>{content}</article>;
          })}
        </div>
      </section>

      <section className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-slate-950 p-6 text-white sm:p-8"><div className="flex items-center gap-4"><span className="grid size-12 place-items-center rounded-2xl bg-teal-400/15 text-teal-300"><BookOpenCheck size={23} /></span><div><h2 className="m-0 text-xl text-white">Renforcez une question avec la fiche associée</h2><p className="mb-0 mt-1 text-sm text-slate-400">La bibliothèque médicale reste accessible entre deux séries.</p></div></div><Link className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-950 no-underline" href="/specialties">Voir les spécialités <ArrowRight size={16} /></Link></section>
    </main>
  );
}
