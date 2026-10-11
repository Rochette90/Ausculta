/** Texte comparable pour une recherche : sans accents, en minuscules, sans espaces autour. */
export function normalizeSearch(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr").trim();
}
