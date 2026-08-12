export default function DashboardLoading() {
  return (
    <main className="mx-auto w-full max-w-7xl animate-pulse px-4 pb-28 pt-8 sm:px-6 lg:px-8 lg:pt-10" aria-label="Chargement du tableau de bord">
      <div className="h-80 rounded-[30px] bg-slate-200" />
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => <div className="h-24 rounded-2xl bg-slate-200" key={index} />)}
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1.45fr_.75fr]"><div className="h-[32rem] rounded-2xl bg-slate-200" /><div className="h-[32rem] rounded-2xl bg-slate-200" /></div>
      <span className="sr-only">Chargement…</span>
    </main>
  );
}
