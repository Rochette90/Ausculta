"use client";

import { Check, TriangleAlert } from "lucide-react";
import { Fragment, useEffect, useState } from "react";
import { GridTimer } from "@/components/grids/GridTimer";
import { GRID_STORAGE_PREFIX } from "@/lib/brand";
import { checklistRubric, markFromChecked, partMaximum, partScore, rubricLines, type GridPart } from "@/lib/grids/scoring";
import type { GridMark, GridRubric, GridSection, PracticeGrid } from "@/lib/grids/types";
import { cn } from "@/lib/utils";

type GridState = {
  /** Clé `partie:section` ; absente = non. */
  marks: Record<string, GridMark>;
  checked: Record<string, number[]>;
  cards: number[];
};

const EMPTY: GridState = { marks: {}, checked: {}, cards: [] };
const PARTS: GridPart[] = ["history", "exam", "synthesis"];
const markLabels: Record<GridMark, { short: string; long: string }> = {
  yes: { short: "Oui", long: "Oui, 2 points" },
  partial: { short: "±", long: "Partiel, 1 point" },
  no: { short: "Non", long: "Non, 0 point" },
};

const storageKey = (slug: string) => `${GRID_STORAGE_PREFIX}:v1:${slug}`;

function readState(slug: string): GridState {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey(slug)) ?? "null") as Partial<GridState> | null;
    if (!parsed || typeof parsed !== "object") return EMPTY;
    return { marks: parsed.marks ?? {}, checked: parsed.checked ?? {}, cards: parsed.cards ?? [] };
  } catch {
    return EMPTY;
  }
}

/** Seul le gras `**…**` est autorisé dans les encadrés. */
function Emphasis({ text }: { text: string }) {
  return text.split("**").map((chunk, index) => (index % 2 === 1 ? <strong key={index}>{chunk}</strong> : <Fragment key={index}>{chunk}</Fragment>));
}

function MarkPicker({ label, onChange, value }: { label: string; onChange: (mark: GridMark) => void; value: GridMark }) {
  return (
    <div aria-label={`Note : ${label}`} className="grid-mark" role="radiogroup">
      {(["yes", "partial", "no"] as const).map((mark) => (
        <button aria-checked={value === mark} aria-label={markLabels[mark].long} className={`is-${mark}`} key={mark} onClick={() => onChange(mark)} role="radio" type="button">
          {markLabels[mark].short}
        </button>
      ))}
    </div>
  );
}

function Rubric({ lines }: { lines: ReadonlyArray<string> }) {
  if (lines.length === 0) return null;
  return <p className="grid-rubric">{lines.join(" · ")}</p>;
}

/** `persist={false}` : aperçu d'administration, sans toucher aux coches sauvegardées. */
export function GridTrainer({ grid, persist = true }: { grid: PracticeGrid; persist?: boolean }) {
  const [state, setState] = useState<GridState>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [part, setPart] = useState<GridPart>("history");

  useEffect(() => {
    if (!persist) return;
    // La sauvegarde vit dans le navigateur : elle ne peut être lue qu'après le montage.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(readState(grid.slug));
    setLoaded(true);
  }, [grid.slug, persist]);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(storageKey(grid.slug), JSON.stringify(state));
  }, [grid.slug, loaded, state]);

  const sectionIds = (name: GridPart) =>
    name === "synthesis" ? grid.synthesis.criteria.map((criterion) => criterion.id) : grid[name].sections.map((section) => section.id);
  const scores = PARTS.map((name) => {
    const prefix = `${name}:`;
    const marks = Object.fromEntries(Object.entries(state.marks).filter(([key]) => key.startsWith(prefix)).map(([key, mark]) => [key.slice(prefix.length), mark]));
    return { name, score: partScore(marks, sectionIds(name)), max: partMaximum(grid, name) };
  });
  const total = scores.reduce((sum, item) => sum + item.score, 0);
  const totalMax = scores.reduce((sum, item) => sum + item.max, 0);
  const partLabels: Record<GridPart, string> = { history: grid.history.label, exam: grid.exam.label, synthesis: grid.synthesis.label };

  function setMark(key: string, mark: GridMark) {
    setState((current) => ({ ...current, marks: { ...current.marks, [key]: mark } }));
  }

  function setChecked(name: GridPart, section: GridSection, indexes: number[]) {
    if (section.kind !== "checklist") return;
    const key = `${name}:${section.id}`;
    setState((current) => ({
      ...current,
      checked: { ...current.checked, [key]: indexes },
      marks: { ...current.marks, [key]: markFromChecked(section, indexes.length) },
    }));
  }

  function toggleCard(index: number) {
    setState((current) => ({
      ...current,
      cards: current.cards.includes(index) ? current.cards.filter((item) => item !== index) : [...current.cards, index],
    }));
  }

  function resetPart(name: GridPart) {
    setState((current) => {
      const keep = <T,>(record: Record<string, T>) => Object.fromEntries(Object.entries(record).filter(([key]) => !key.startsWith(`${name}:`)));
      return { marks: keep(current.marks), checked: keep(current.checked), cards: name === "synthesis" ? [] : current.cards };
    });
  }

  function renderSection(name: GridPart, section: { id: string; title: string; rubric?: GridRubric } | GridSection, index: number) {
    const key = `${name}:${section.id}`;
    const mark = state.marks[key] ?? "no";
    const checklist = "kind" in section && section.kind === "checklist" ? section : null;
    const checked = state.checked[key] ?? [];
    const complete = checklist !== null && checked.length === checklist.items.length;
    return (
      <li className="grid-section" key={section.id}>
        <div className="grid-section-head">
          <span className="grid-section-num">{String(index + 1).padStart(2, "0")}</span>
          <div className="grid-section-title">
            <h3>{section.title}</h3>
            {checklist && (
              <span className="grid-section-progress">
                <span className={cn(complete && "is-complete")}>{checked.length}/{checklist.items.length}</span>
                <button className="text-link" onClick={() => setChecked(name, checklist, complete ? [] : checklist.items.map((_, item) => item))} type="button">
                  {complete ? "Tout décocher" : "Tout cocher"}
                </button>
              </span>
            )}
          </div>
          <MarkPicker label={section.title} onChange={(value) => setMark(key, value)} value={mark} />
        </div>
        {checklist && (
          <ul className="grid-items">
            {checklist.items.map((item, itemIndex) => {
              const isChecked = checked.includes(itemIndex);
              return (
                <li key={item}>
                  <button
                    aria-pressed={isChecked}
                    className="grid-item"
                    onClick={() => setChecked(name, checklist, isChecked ? checked.filter((value) => value !== itemIndex) : [...checked, itemIndex])}
                    type="button"
                  >
                    <span aria-hidden="true" className="grid-item-box">{isChecked && <Check size={14} strokeWidth={3} />}</span>
                    {item}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <Rubric lines={checklist ? checklistRubric(checklist) : rubricLines("rubric" in section ? section.rubric : undefined)} />
      </li>
    );
  }

  const current = scores.find((item) => item.name === part)!;

  return (
    <div className="grid-trainer">
      <div className="grid-board">
        <GridTimer />
        <dl className="grid-scores">
          {scores.map((item) => (
            <div key={item.name}><dt>{partLabels[item.name]}</dt><dd>{item.score}<small>/{item.max}</small></dd></div>
          ))}
          <div className="is-total"><dt>Total</dt><dd>{total}<small>/{totalMax}</small></dd></div>
        </dl>
      </div>

      <div className="learning-tabs grid-tabs" role="tablist">
        {scores.map((item) => (
          <button aria-selected={part === item.name} key={item.name} onClick={() => setPart(item.name)} role="tab" type="button">
            {partLabels[item.name]} <span className="grid-tab-score">{item.score}/{item.max}</span>
          </button>
        ))}
      </div>

      <section aria-label={partLabels[part]} className="grid-panel" role="tabpanel">
        {part !== "synthesis" && grid[part].alert && (
          <p className="grid-alert"><TriangleAlert aria-hidden="true" size={18} /><span><Emphasis text={grid[part].alert!} /></span></p>
        )}
        <ol className="grid-sections">
          {part === "synthesis"
            ? grid.synthesis.criteria.map((criterion, index) => renderSection(part, criterion, index))
            : grid[part].sections.map((section, index) => renderSection(part, section, index))}
        </ol>

        {part === "synthesis" && (
          <div className="grid-cards-block">
            <h3 className="learning-eyebrow">{grid.synthesis.cardsLabel}</h3>
            <ul className="grid-cards">
              {grid.synthesis.cards.map((card, index) => (
                <li key={card.name}>
                  <button aria-pressed={state.cards.includes(index)} className="grid-card" onClick={() => toggleCard(index)} type="button">
                    <span className="grid-card-head"><strong>{card.name}</strong><span className={`grid-level is-${card.level}`}>{card.levelLabel}</span></span>
                    <span className="grid-card-desc">{card.description}</span>
                    <span className="grid-card-tags">{card.tags.map((tag) => <span key={tag}>{tag}</span>)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <footer className="grid-panel-foot">
          <p>{partLabels[part]} : <strong>{current.score}</strong> / {current.max} points</p>
          <button className="button quiet small" onClick={() => resetPart(part)} type="button">Réinitialiser cet onglet</button>
        </footer>
      </section>
    </div>
  );
}
