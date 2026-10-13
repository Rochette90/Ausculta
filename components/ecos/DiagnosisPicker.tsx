"use client";
import { useId, useState } from "react";
import { X } from "lucide-react";
import { DIAGNOSIS_BY_ID, DIAGNOSIS_SEARCH_MIN_LETTERS, searchDiagnoses } from "@/lib/ecos/diagnosis-catalog";

/**
 * Saisie d'un diagnostic dans la liste commune : rien n'est proposé avant
 * trois lettres, l'étudiant cherche au lieu de reconnaître. `max` à 1 pour le
 * diagnostic principal, à 3 pour les différentiels.
 */
export function DiagnosisPicker({ label, hint, selected, onChange, max, exclude = [], disabled = false }: {
  label: string;
  hint?: string;
  selected: string[];
  onChange: (ids: string[]) => void;
  max: number;
  exclude?: readonly string[];
  disabled?: boolean;
}) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const results = searchDiagnoses(query).filter((entry) => !selected.includes(entry.id) && !exclude.includes(entry.id));
  const typed = query.replace(/\s/g, "").length;
  const full = selected.length >= max;
  const choose = (entryId: string) => {
    onChange(max === 1 ? [entryId] : [...selected, entryId].slice(0, max));
    setQuery("");
    setActive(0);
  };
  const listId = `${id}-results`;
  return (
    <div className="diagnosis-picker">
      <label htmlFor={`${id}-input`}>{label}</label>
      {hint && <p className="diagnosis-hint">{hint}</p>}
      {selected.length > 0 && (
        <ul className="diagnosis-chosen" aria-label="Diagnostics choisis">
          {selected.map((entryId) => (
            <li key={entryId}>
              {DIAGNOSIS_BY_ID.get(entryId)?.label ?? entryId}
              <button type="button" aria-label={`Retirer ${DIAGNOSIS_BY_ID.get(entryId)?.label ?? ""}`} disabled={disabled} onClick={() => onChange(selected.filter((item) => item !== entryId))}><X size={14} aria-hidden="true" /></button>
            </li>
          ))}
        </ul>
      )}
      {!full && (
        <div className="diagnosis-search">
          <input
            id={`${id}-input`}
            type="search"
            role="combobox"
            aria-expanded={results.length > 0}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={results[active] ? `${id}-option-${results[active].id}` : undefined}
            autoComplete="off"
            disabled={disabled}
            value={query}
            placeholder={`Tape au moins ${DIAGNOSIS_SEARCH_MIN_LETTERS} lettres`}
            onChange={(event) => { setQuery(event.target.value); setActive(0); }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown" && results.length) { event.preventDefault(); setActive((index) => (index + 1) % results.length); }
              else if (event.key === "ArrowUp" && results.length) { event.preventDefault(); setActive((index) => (index - 1 + results.length) % results.length); }
              else if (event.key === "Enter") { event.preventDefault(); if (results[active]) choose(results[active].id); }
              else if (event.key === "Escape") setQuery("");
            }}
          />
          {results.length > 0 && (
            <ul className="diagnosis-results" id={listId} role="listbox">
              {results.map((entry, index) => (
                <li key={entry.id} id={`${id}-option-${entry.id}`} role="option" aria-selected={index === active} className={index === active ? "is-active" : ""} onMouseDown={(event) => { event.preventDefault(); choose(entry.id); }} onMouseEnter={() => setActive(index)}>{entry.label}</li>
              ))}
            </ul>
          )}
          {typed >= DIAGNOSIS_SEARCH_MIN_LETTERS && results.length === 0 && <p className="diagnosis-empty" role="status">Aucun diagnostic de la liste ne correspond. Essaie un autre terme ou un synonyme.</p>}
        </div>
      )}
    </div>
  );
}
