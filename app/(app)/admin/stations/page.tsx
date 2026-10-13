import Link from "next/link";
import { AdminEcosFeedbackList } from "@/components/admin/AdminEcosFeedbackList";
import { AdminSectionNav } from "@/components/admin/AdminSectionNav";
import { getAdminAppErrors, getAdminEcosFeedback, getAdminStationStats } from "@/lib/admin/ecos-insights";
import { requireAdminUser } from "@/lib/auth/admin";
import { pageTitle } from "@/lib/brand";

export const dynamic = "force-dynamic";
export const metadata = { title: pageTitle("Administration · Stations") };

const PERIODS = [7, 30, 90] as const;
const dateFormat = new Intl.DateTimeFormat("fr-CH", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Zurich" });

type PageProps = { searchParams: Promise<{ jours?: string }> };

export default async function Page({ searchParams }: PageProps) {
  // La garde précède toute lecture, comme pour les autres pages d'administration.
  const user = await requireAdminUser("/admin/stations");
  const requested = Number((await searchParams).jours);
  const days = PERIODS.find((value) => value === requested) ?? 30;
  const [stats, feedback, errors] = await Promise.all([getAdminStationStats(user.id, days), getAdminEcosFeedback(), getAdminAppErrors()]);
  const totals = stats.reduce((sum, row) => ({ started: sum.started + row.started, completed: sum.completed + row.completed, abandoned: sum.abandoned + row.abandoned }), { started: 0, completed: 0, abandoned: 0 });
  const openFeedback = feedback.filter((item) => item.status === "open").length;

  return (
    <main className="page-enter mx-auto w-full max-w-6xl px-4 pb-28 pt-8 sm:px-6 lg:px-8">
      <AdminSectionNav />
      <header className="rounded-[28px] bg-slate-950 p-7 text-white sm:p-10">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-teal-300">Phase de test</p>
        <h1 className="m-0 !text-4xl !text-white">Stations ECOS</h1>
        <p className="mb-0 mt-3 text-slate-300">{totals.started} stations lancées, {totals.completed} terminées, {totals.abandoned} abandonnées sur {days} jours · {openFeedback} avis à traiter · {errors.length} erreurs récentes.</p>
      </header>

      <section className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="m-0 !text-2xl">Fréquentation et scores</h2>
          <nav aria-label="Période" className="flex gap-2 text-sm">
            {PERIODS.map((value) => <Link aria-current={value === days ? "page" : undefined} className={`rounded-full border px-3 py-1 no-underline ${value === days ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 text-slate-700"}`} href={`/admin/stations?jours=${value}`} key={value}>{value} j</Link>)}
          </nav>
        </div>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr><th className="px-4 py-3">Station</th><th className="px-3 py-3 text-right">Lancées</th><th className="px-3 py-3 text-right">Terminées</th><th className="px-3 py-3 text-right">Abandons</th><th className="px-3 py-3 text-right">Joueurs</th><th className="px-3 py-3 text-right">Score moyen</th><th className="px-4 py-3 text-right">Avis</th></tr>
            </thead>
            <tbody>
              {stats.map((row) => (
                <tr className="border-t border-slate-100" key={row.slug}>
                  <td className="px-4 py-2.5"><strong>{row.code}</strong> <span className="text-slate-600">{row.diagnosis}</span></td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{row.started}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{row.completed}</td>
                  <td className={`px-3 py-2.5 text-right tabular-nums ${row.started >= 3 && row.abandoned / row.started > 0.4 ? "font-bold text-rose-700" : ""}`}>{row.abandoned}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{row.players}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{row.averagePercent === null ? "—" : `${row.averagePercent} %`}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{row.feedbackCount ? `${row.averageRating} ★ (${row.feedbackCount})` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-slate-500">Une station encore ouverte trois heures après son lancement compte comme abandonnée. En rouge : plus de 40 % d’abandons.</p>
      </section>

      <section className="mt-10">
        <h2 className="m-0 !text-2xl">Avis des étudiants</h2>
        <p className="m-0 text-sm text-slate-500">Les avis à traiter d’abord, chacun avec le transcript de la station.</p>
        <AdminEcosFeedbackList items={feedback} />
      </section>

      <section className="mt-10">
        <h2 className="m-0 !text-2xl">Erreurs récentes</h2>
        <p className="m-0 text-sm text-slate-500">Serveur et navigateur (comptes connectés), conservées 30 jours.</p>
        {errors.length === 0 ? <p className="mt-3 text-sm text-slate-500">Aucune erreur enregistrée.</p> : (
          <ul className="mt-4 grid list-none gap-2 p-0">
            {errors.map((item) => (
              <li className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm" key={item.id}>
                <div className="flex flex-wrap gap-x-3 text-xs text-slate-500"><span className={`font-bold uppercase ${item.source === "server" ? "text-rose-700" : "text-amber-700"}`}>{item.source === "server" ? "Serveur" : "Navigateur"}</span><code>{item.path}</code><span className="ml-auto">{dateFormat.format(new Date(item.createdAt))}</span></div>
                <p className="mb-0 mt-1 break-words font-mono text-[13px]">{item.message}{item.digest ? <span className="text-slate-400"> · {item.digest}</span> : null}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
