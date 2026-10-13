"use client";

import { AlertTriangle, ArrowDown, ArrowUp, CheckCircle2, ExternalLink, Eye, LoaderCircle, Plus, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition, type ReactNode } from "react";
import { saveAdminPracticeGrid } from "@/app/actions/admin-training";
import { GridTrainer } from "@/components/grids/GridTrainer";
import { Button, buttonVariants } from "@/components/ui/button";
import type { AdminPracticeGrid } from "@/lib/admin/training-content";
import { checklistRubric } from "@/lib/grids/scoring";
import type { DifferentialCard, GridContent, GridRubric } from "@/lib/grids/types";
import { validateGridContent } from "@/lib/grids/validate";

/** Les types de grille sont en lecture seule ; l'éditeur travaille sur une copie modifiable. */
type Draft<T> = T extends string | number | boolean ? T : T extends ReadonlyArray<infer U> ? Draft<U>[] : { -readonly [K in keyof T]: Draft<T[K]> };
type DraftContent = Draft<GridContent>;
type DraftSection = DraftContent["history"]["sections"][number];
type DraftRubric = Draft<GridRubric> | undefined;
type View = "history" | "exam" | "synthesis" | "preview";

const VIEWS: Array<{ key: View; label: string }> = [
  { key: "history", label: "Anamnèse" },
  { key: "exam", label: "Examen" },
  { key: "synthesis", label: "Synthèse" },
  { key: "preview", label: "Aperçu" },
];
const LEVELS: Array<{ value: DifferentialCard["level"]; label: string }> = [
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "Fréquent" },
  { value: "mid", label: "Possible" },
  { value: "low", label: "Rare" },
];
const field = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100";
const label = "mb-1 block text-xs font-bold text-slate-600";

function move<T>(list: T[], index: number, delta: number) {
  const target = index + delta;
  if (target < 0 || target >= list.length) return;
  [list[index], list[target]] = [list[target], list[index]];
}

/** Id stable et unique : il sert de clé aux coches sauvegardées par les étudiants. */
function freshId(taken: string[], base: string) {
  const root = base.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 30) || "section";
  let id = root;
  for (let n = 2; taken.includes(id); n += 1) id = `${root}-${n}`;
  return id;
}

function RowTools({ index, count, onMove, onRemove, removeLabel }: { index: number; count: number; onMove: (delta: number) => void; onRemove: () => void; removeLabel: string }) {
  return (
    <span className="flex shrink-0 gap-1">
      <button aria-label="Monter" className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30" disabled={index === 0} onClick={() => onMove(-1)} type="button"><ArrowUp size={15} /></button>
      <button aria-label="Descendre" className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30" disabled={index === count - 1} onClick={() => onMove(1)} type="button"><ArrowDown size={15} /></button>
      <button aria-label={removeLabel} className="rounded-md p-1.5 text-rose-600 hover:bg-rose-50" onClick={onRemove} type="button"><Trash2 size={15} /></button>
    </span>
  );
}

function RubricField({ value, onChange }: { value: DraftRubric; onChange: (next: DraftRubric) => void }) {
  const mode = value === undefined ? "none" : value === "quality" ? "quality" : "custom";
  return (
    <div className="grid gap-2">
      <label><span className={label}>Barème</span>
        <select className={field} onChange={(event) => onChange(event.target.value === "none" ? undefined : event.target.value === "quality" ? "quality" : ["… = oui", "… = ±", "… = non"])} value={mode}>
          <option value="none">Aucun barème affiché</option>
          <option value="quality">Qualité : bien = oui · suffisant = ± · insuffisant = non</option>
          <option value="custom">Personnalisé</option>
        </select>
      </label>
      {Array.isArray(value) && (
        <label><span className={label}>Une ligne par niveau</span>
          <textarea className={`${field} min-h-20`} onChange={(event) => onChange(event.target.value.split("\n"))} value={value.join("\n")} />
        </label>
      )}
    </div>
  );
}

function Card({ children, title, tools }: { children: ReactNode; title: ReactNode; tools?: ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <header className="mb-3 flex items-start justify-between gap-3">{title}{tools}</header>
      <div className="grid gap-3">{children}</div>
    </section>
  );
}

export function GridEditor({ grid }: { grid: AdminPracticeGrid }) {
  const router = useRouter();
  const [meta, setMeta] = useState({ title: grid.title, themes: grid.themes, position: grid.position, isPublished: grid.isPublished });
  const [content, setContent] = useState<DraftContent>(() => structuredClone(grid.content) as DraftContent);
  const [version, setVersion] = useState(grid.version);
  const [view, setView] = useState<View>("history");
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const validation = useMemo(() => validateGridContent(content), [content]);

  function edit(mutate: (draft: DraftContent) => void) {
    setDirty(true);
    setMessage(null);
    setContent((current) => {
      const next = structuredClone(current);
      mutate(next);
      return next;
    });
  }

  function editMeta(patch: Partial<typeof meta>) {
    setDirty(true);
    setMessage(null);
    setMeta((current) => ({ ...current, ...patch }));
  }

  function save() {
    if (!validation.ok) return;
    startTransition(async () => {
      const result = await saveAdminPracticeGrid({ id: grid.id, version, slug: grid.slug, ...meta, content: validation.content });
      if (result.success && result.version) {
        setVersion(result.version);
        setDirty(false);
        setMessage({ tone: "success", text: "Grille enregistrée." });
        router.refresh();
      } else {
        setMessage({ tone: "error", text: result.error ?? "Enregistrement impossible" });
      }
    });
  }

  function sectionsEditor(part: "history" | "exam") {
    const tab = content[part];
    const taken = tab.sections.map((section) => section.id);
    const addSection = (kind: DraftSection["kind"]) => edit((draft) => {
      const id = freshId(taken, "nouvelle-section");
      draft[part].sections.push(kind === "checklist"
        ? { id, title: "Nouvelle section", kind, items: ["Item 1", "Item 2"], rule: { yes: 2, partial: 1 } }
        : { id, title: "Nouvelle section", kind, rubric: "quality" });
    });
    return (
      <div className="grid gap-4">
        <Card title={<h3 className="m-0 !text-base">Onglet</h3>}>
          <label><span className={label}>Nom de l&apos;onglet</span><input className={field} onChange={(event) => edit((draft) => { draft[part].label = event.target.value; })} value={tab.label} /></label>
          <label><span className={label}>Encadré d&apos;alerte (facultatif, <code>**gras**</code> accepté)</span>
            <textarea className={`${field} min-h-20`} onChange={(event) => edit((draft) => { if (event.target.value) draft[part].alert = event.target.value; else delete draft[part].alert; })} value={tab.alert ?? ""} />
          </label>
        </Card>
        {tab.sections.map((section, index) => (
          <Card
            key={section.id}
            title={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">Section {index + 1} · <code className="normal-case">{section.id}</code></span>}
            tools={<RowTools count={tab.sections.length} index={index} onMove={(delta) => edit((draft) => move(draft[part].sections, index, delta))} onRemove={() => edit((draft) => { draft[part].sections.splice(index, 1); })} removeLabel="Supprimer la section" />}
          >
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <label><span className={label}>Titre</span><input className={field} onChange={(event) => edit((draft) => { draft[part].sections[index].title = event.target.value; })} value={section.title} /></label>
              <label><span className={label}>Type</span>
                <select className={field} onChange={(event) => edit((draft) => {
                  const current = draft[part].sections[index];
                  draft[part].sections[index] = event.target.value === "checklist"
                    ? { id: current.id, title: current.title, kind: "checklist", items: ["Item 1", "Item 2"], rule: { yes: 2, partial: 1 } }
                    : { id: current.id, title: current.title, kind: "judgement", rubric: "quality" };
                })} value={section.kind}>
                  <option value="checklist">Checklist (note calculée)</option>
                  <option value="judgement">Jugement de l&apos;évaluateur</option>
                </select>
              </label>
            </div>
            {section.kind === "checklist" ? (
              <>
                <ol className="m-0 grid list-none gap-2 p-0">
                  {section.items.map((item, itemIndex) => (
                    <li className="flex items-center gap-2" key={itemIndex}>
                      <span className="w-6 text-right text-xs font-bold text-slate-400">{itemIndex + 1}</span>
                      <input aria-label={`Item ${itemIndex + 1}`} className={field} onChange={(event) => edit((draft) => { (draft[part].sections[index] as Extract<DraftSection, { kind: "checklist" }>).items[itemIndex] = event.target.value; })} value={item} />
                      <RowTools count={section.items.length} index={itemIndex} onMove={(delta) => edit((draft) => move((draft[part].sections[index] as Extract<DraftSection, { kind: "checklist" }>).items, itemIndex, delta))} onRemove={() => edit((draft) => { (draft[part].sections[index] as Extract<DraftSection, { kind: "checklist" }>).items.splice(itemIndex, 1); })} removeLabel="Supprimer l'item" />
                    </li>
                  ))}
                </ol>
                <button className="justify-self-start text-sm font-bold text-teal-700" onClick={() => edit((draft) => { (draft[part].sections[index] as Extract<DraftSection, { kind: "checklist" }>).items.push(""); })} type="button"><Plus className="inline" size={14} /> Ajouter un item</button>
                <div className="grid gap-3 rounded-xl bg-slate-50 p-3 sm:grid-cols-[auto_auto_1fr] sm:items-end">
                  <label><span className={label}>Items pour « oui »</span><input className={`${field} w-24`} min={1} onChange={(event) => edit((draft) => { (draft[part].sections[index] as Extract<DraftSection, { kind: "checklist" }>).rule.yes = Number(event.target.value); })} type="number" value={section.rule.yes} /></label>
                  <label><span className={label}>Items pour « ± »</span><input className={`${field} w-24`} min={1} onChange={(event) => edit((draft) => { (draft[part].sections[index] as Extract<DraftSection, { kind: "checklist" }>).rule.partial = Number(event.target.value); })} type="number" value={section.rule.partial} /></label>
                  <p className="m-0 text-sm text-slate-600">Barème affiché : <strong>{checklistRubric(section).join(" · ")}</strong></p>
                </div>
              </>
            ) : (
              <RubricField onChange={(next) => edit((draft) => { const target = draft[part].sections[index] as Extract<DraftSection, { kind: "judgement" }>; if (next === undefined) delete target.rubric; else target.rubric = next; })} value={section.rubric} />
            )}
          </Card>
        ))}
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => addSection("checklist")} size="sm" variant="outline"><Plus size={15} /> Section checklist</Button>
          <Button onClick={() => addSection("judgement")} size="sm" variant="outline"><Plus size={15} /> Section jugement</Button>
        </div>
      </div>
    );
  }

  function synthesisEditor() {
    const synthesis = content.synthesis;
    return (
      <div className="grid gap-4">
        <Card title={<h3 className="m-0 !text-base">Onglet</h3>}>
          <label><span className={label}>Nom de l&apos;onglet</span><input className={field} onChange={(event) => edit((draft) => { draft.synthesis.label = event.target.value; })} value={synthesis.label} /></label>
        </Card>
        <h3 className="m-0 mt-2 !text-lg">Critères notés</h3>
        {synthesis.criteria.map((criterion, index) => (
          <Card
            key={criterion.id}
            title={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">Critère {index + 1} · <code className="normal-case">{criterion.id}</code></span>}
            tools={<RowTools count={synthesis.criteria.length} index={index} onMove={(delta) => edit((draft) => move(draft.synthesis.criteria, index, delta))} onRemove={() => edit((draft) => { draft.synthesis.criteria.splice(index, 1); })} removeLabel="Supprimer le critère" />}
          >
            <label><span className={label}>Intitulé</span><textarea className={`${field} min-h-16`} onChange={(event) => edit((draft) => { draft.synthesis.criteria[index].title = event.target.value; })} value={criterion.title} /></label>
            <RubricField onChange={(next) => edit((draft) => { if (next === undefined) delete draft.synthesis.criteria[index].rubric; else draft.synthesis.criteria[index].rubric = next; })} value={criterion.rubric} />
          </Card>
        ))}
        <Button className="justify-self-start" onClick={() => edit((draft) => { draft.synthesis.criteria.push({ id: freshId(synthesis.criteria.map((entry) => entry.id), "critere"), title: "Nouveau critère", rubric: "quality" }); })} size="sm" variant="outline"><Plus size={15} /> Critère</Button>

        <h3 className="m-0 mt-4 !text-lg">Cartes (non notées)</h3>
        <label><span className={label}>Titre du bloc de cartes</span><input className={field} onChange={(event) => edit((draft) => { draft.synthesis.cardsLabel = event.target.value; })} value={synthesis.cardsLabel} /></label>
        {synthesis.cards.map((card, index) => (
          <Card
            key={index}
            title={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">Carte {index + 1}</span>}
            tools={<RowTools count={synthesis.cards.length} index={index} onMove={(delta) => edit((draft) => move(draft.synthesis.cards, index, delta))} onRemove={() => edit((draft) => { draft.synthesis.cards.splice(index, 1); })} removeLabel="Supprimer la carte" />}
          >
            <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr_1fr]">
              <label><span className={label}>Nom</span><input className={field} onChange={(event) => edit((draft) => { draft.synthesis.cards[index].name = event.target.value; })} value={card.name} /></label>
              <label><span className={label}>Niveau (couleur)</span>
                <select className={field} onChange={(event) => edit((draft) => { draft.synthesis.cards[index].level = event.target.value as DifferentialCard["level"]; })} value={card.level}>
                  {LEVELS.map((level) => <option key={level.value} value={level.value}>{level.label}</option>)}
                </select>
              </label>
              <label><span className={label}>Étiquette affichée</span><input className={field} onChange={(event) => edit((draft) => { draft.synthesis.cards[index].levelLabel = event.target.value; })} value={card.levelLabel} /></label>
            </div>
            <label><span className={label}>Description</span><textarea className={`${field} min-h-16`} onChange={(event) => edit((draft) => { draft.synthesis.cards[index].description = event.target.value; })} value={card.description} /></label>
            <label><span className={label}>Tags (séparés par des virgules)</span><input className={field} onChange={(event) => edit((draft) => { draft.synthesis.cards[index].tags = event.target.value.split(",").map((tag) => tag.trimStart()); })} value={card.tags.join(",")} /></label>
          </Card>
        ))}
        <Button className="justify-self-start" onClick={() => edit((draft) => { draft.synthesis.cards.push({ name: "Nouveau diagnostic", level: "mid", levelLabel: "Possible", description: "", tags: [] }); })} size="sm" variant="outline"><Plus size={15} /> Carte</Button>
      </div>
    );
  }

  const preview = validation.ok ? { slug: grid.slug, title: meta.title, themes: meta.themes, ...validation.content } : null;

  return (
    <div className="pb-32">
      <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-[1fr_1.4fr_auto_auto] sm:items-end sm:p-6">
        <label><span className={label}>Titre</span><input className={`${field} font-semibold`} maxLength={200} onChange={(event) => editMeta({ title: event.target.value })} value={meta.title} /></label>
        <label><span className={label}>Thèmes</span><input className={field} maxLength={300} onChange={(event) => editMeta({ themes: event.target.value })} value={meta.themes} /></label>
        <label><span className={label}>Position</span><input className={`${field} w-24`} min={0} max={10000} onChange={(event) => editMeta({ position: Number(event.target.value) })} type="number" value={meta.position} /></label>
        <label className="flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3">
          <input checked={meta.isPublished} onChange={(event) => editMeta({ isPublished: event.target.checked })} type="checkbox" />
          <span className="text-sm font-semibold">{meta.isPublished ? "Publiée" : "Brouillon"}</span>
        </label>
      </div>

      <nav aria-label="Parties de la grille" className="my-5 flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
        {VIEWS.map((entry) => (
          <button aria-current={view === entry.key ? "page" : undefined} className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold ${view === entry.key ? "bg-white text-teal-800 shadow-sm" : "text-slate-600"}`} key={entry.key} onClick={() => setView(entry.key)} type="button">
            {entry.key === "preview" && <Eye size={15} />}{entry.label}
          </button>
        ))}
      </nav>

      {!validation.ok && (
        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="status">
          <p className="m-0 flex items-center gap-2 font-bold"><AlertTriangle size={16} /> À corriger avant d&apos;enregistrer</p>
          <ul className="mb-0 mt-2 pl-5">{validation.errors.slice(0, 8).map((error) => <li key={error}>{error}</li>)}</ul>
        </div>
      )}

      {view === "history" && sectionsEditor("history")}
      {view === "exam" && sectionsEditor("exam")}
      {view === "synthesis" && synthesisEditor()}
      {view === "preview" && (preview ? <GridTrainer grid={preview} persist={false} /> : <p className="text-slate-500">L&apos;aperçu s&apos;affiche quand la grille est valide.</p>)}

      <div className="fixed inset-x-0 bottom-16 z-30 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-10px_30px_rgba(15,23,42,.08)] backdrop-blur md:bottom-0">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div aria-live="polite">{message && <span className={`inline-flex items-center gap-2 text-sm font-semibold ${message.tone === "success" ? "text-emerald-700" : "text-rose-700"}`}>{message.tone === "success" && <CheckCircle2 size={17} />}{message.text}</span>}</div>
          <div className="flex gap-2">
            <Link className={buttonVariants({ variant: "outline" })} href={`/grilles/${grid.slug}`} target="_blank">Page étudiante <ExternalLink size={16} /></Link>
            <Button disabled={pending || !dirty || !validation.ok} onClick={save}>{pending ? <LoaderCircle className="animate-spin" size={17} /> : <Save size={17} />}{pending ? "Enregistrement…" : dirty ? "Enregistrer" : "Enregistré"}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
