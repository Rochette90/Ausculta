export default function DashboardLoading() {
  return (
    <main className="learning-page animate-pulse" aria-label="Chargement du tableau de bord">
      <div className="h-6 w-48 rounded-full bg-[var(--line)]" />
      <div className="mt-5 h-12 w-2/3 rounded-2xl bg-[var(--line)]" />
      <div className="mt-4 h-12 w-1/2 rounded-2xl bg-[var(--line)]" />
      <div className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => <div className="h-20 rounded-2xl bg-[var(--line)] opacity-60" key={index} />)}
      </div>
      <div className="mt-10 grid gap-3">{Array.from({ length: 3 }, (_, index) => <div className="h-24 rounded-2xl bg-[var(--line)] opacity-50" key={index} />)}</div>
      <span className="sr-only">Chargement…</span>
    </main>
  );
}
