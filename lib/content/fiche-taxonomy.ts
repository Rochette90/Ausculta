/**
 * Squelette canonique des fiches — inspiré des articles de référence type
 * AMBOSS : quelle que soit la manière dont une fiche a été rédigée (vault
 * importé, éditeur admin, titres approximatifs), elle se lit toujours dans le
 * même ordre et sous les mêmes intitulés. Le lecteur apprend la structure une
 * fois, puis navigue à l'identique dans les 150 fiches.
 *
 * Deux niveaux :
 *  - le **chapitre** (`FicheChapter`) : la brique clinique reconnue à partir du
 *    titre rédigé (« Symptômes », « Signes fonctionnels », « CAT »…) ;
 *  - la **phase** (`FicheGroup`) : le regroupement de lecture affiché dans le
 *    sommaire (Synthèse → Tableau clinique → Démarche diagnostique → Prise en
 *    charge → Ressources), qui correspond au raisonnement clinique.
 */

export type FicheGroupKey = "synthese" | "clinique" | "diagnostic" | "traitement" | "ressources";

export type FicheGroupMeta = {
  key: FicheGroupKey;
  /** Intitulé affiché dans le sommaire et en tête de phase. */
  label: string;
  /** Une ligne qui explique ce que la phase répond, pour situer la lecture. */
  hint: string;
};

export const FICHE_GROUPS: FicheGroupMeta[] = [
  { key: "synthese", label: "Synthèse", hint: "De quoi parle-t-on, chez qui, pourquoi" },
  { key: "clinique", label: "Tableau clinique", hint: "Ce que le patient raconte et ce que l'on trouve" },
  { key: "diagnostic", label: "Démarche diagnostique", hint: "Ce que l'on demande et ce que l'on élimine" },
  { key: "traitement", label: "Prise en charge", hint: "Ce que l'on fait, dans quel ordre, avec quel suivi" },
  { key: "ressources", label: "Ressources", hint: "Renvois, sources et provenance" },
];

const GROUP_BY_KEY = new Map(FICHE_GROUPS.map((group) => [group.key, group]));

export function ficheGroupMeta(key: FicheGroupKey): FicheGroupMeta {
  return GROUP_BY_KEY.get(key) ?? FICHE_GROUPS[0];
}

/** Clés d'icônes : la correspondance avec `lucide-react` reste côté rendu. */
export type FicheIconKey =
  | "book"
  | "layers"
  | "users"
  | "activity"
  | "stethoscope"
  | "eye"
  | "clipboard"
  | "flask"
  | "split"
  | "siren"
  | "route"
  | "pill"
  | "alert"
  | "heart"
  | "link"
  | "quote";

export type FicheChapter = {
  key: string;
  /** Intitulé canonique : ce que la fiche « devrait » afficher. */
  label: string;
  group: FicheGroupKey;
  icon: FicheIconKey;
  /** Testé sur le titre normalisé (minuscules, sans accents). */
  match: RegExp;
};

/**
 * L'ordre de ce tableau EST l'ordre de lecture canonique. Il colle
 * volontairement au corpus existant (définition → épidémio → physiopath →
 * clinique → examens → prise en charge → traitement → annexes) : sur une fiche
 * bien rédigée le reclassement ne bouge rien, il ne rattrape que les fiches
 * dont les blocs sont dans le désordre.
 */
const FICHE_CHAPTERS: FicheChapter[] = [
  { key: "resume", label: "En bref", group: "synthese", icon: "book", match: /^(resume|en bref|objectifs?|introduction|points? cles?)/ },
  { key: "definition", label: "Définition", group: "synthese", icon: "book", match: /^(definition|generalites|nosologie|rappel)/ },
  { key: "classification", label: "Classification", group: "synthese", icon: "layers", match: /^(classification|formes|types|sous-?types|stades?|variantes)/ },
  { key: "epidemiologie", label: "Épidémiologie", group: "synthese", icon: "users", match: /^(epidemiolog|prevalence|incidence|frequence)/ },
  { key: "etiologie", label: "Étiologies & facteurs de risque", group: "synthese", icon: "split", match: /^(etiolog|causes?|facteurs? (de )?risque|terrain)/ },
  { key: "physiopathologie", label: "Physiopathologie", group: "synthese", icon: "activity", match: /^(physiopath|physiolog|mecanisme|pathogen)/ },

  { key: "symptomes", label: "Symptômes", group: "clinique", icon: "stethoscope", match: /^(symptomes?|signes? fonctionnels?|plaintes?|motif)/ },
  { key: "signes", label: "Signes", group: "clinique", icon: "eye", match: /^signes?\b(?! fonctionnels| d'alarme| de gravite)/ },
  { key: "presentation", label: "Présentation clinique", group: "clinique", icon: "stethoscope", match: /^(presentation|tableau clinique|clinique|manifestations)/ },
  { key: "examen", label: "Examen clinique", group: "clinique", icon: "clipboard", match: /^(examen clinique|examen physique|evaluation clinique|anamnese)/ },

  { key: "diagnostic", label: "Diagnostic", group: "diagnostic", icon: "flask", match: /^(diagnostic(?!s? differentiel)|criteres? diagnos|demarche diagnos|scores?)/ },
  { key: "examens", label: "Examens complémentaires", group: "diagnostic", icon: "flask", match: /^(examens? (complementaires?|paracliniques?)|bilan|imagerie|biologie|explorations?|paraclinique)/ },
  { key: "differentiel", label: "Diagnostics différentiels", group: "diagnostic", icon: "split", match: /^(diagnostics? differentiels?|differentiels?|dd\b)/ },

  { key: "urgence", label: "Conduite à tenir immédiate", group: "traitement", icon: "siren", match: /^(urgence|conduite a tenir|cat\b|criteres? de gravite|gravite|signes? d.alarme)/ },
  { key: "prise-en-charge", label: "Prise en charge", group: "traitement", icon: "route", match: /^(prise en charge|strategie|mesures|management|orientation)/ },
  { key: "traitement", label: "Traitement", group: "traitement", icon: "pill", match: /^(traitements?|therapeutique|medicaments?|prescription|posologie|chirurgie)/ },
  { key: "complications", label: "Complications & pronostic", group: "traitement", icon: "alert", match: /^(complications?|pronostic|evolution)/ },
  { key: "suivi", label: "Suivi & prévention", group: "traitement", icon: "heart", match: /^(suivi|surveillance|prevention|depistage|education|rhd|vaccination)/ },

  { key: "liens", label: "Liens", group: "ressources", icon: "link", match: /^(liens?|voir aussi|renvois)/ },
  { key: "references", label: "Références", group: "ressources", icon: "quote", match: /^(references?|sources?|bibliographie)/ },
  { key: "provenance", label: "Provenance", group: "ressources", icon: "quote", match: /^(provenance|origine)/ },
];

const RANK_BY_KEY = new Map(FICHE_CHAPTERS.map((chapter, index) => [chapter.key, index]));

function normalizeTitle(title: string) {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "'")
    .replace(/\s+/g, " ")
    .replace(/^[\d.\s-]+/, "")
    .trim();
}

/** Chapitre canonique d'un titre rédigé, `null` si la fiche invente sa section. */
export function classifyFicheSection(title: string): FicheChapter | null {
  const normalized = normalizeTitle(title);
  if (!normalized) return null;
  return FICHE_CHAPTERS.find((chapter) => chapter.match.test(normalized)) ?? null;
}

export function chapterRank(chapter: FicheChapter | null): number | null {
  return chapter ? RANK_BY_KEY.get(chapter.key) ?? null : null;
}
