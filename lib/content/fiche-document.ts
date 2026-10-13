import type { Block, ListItem } from "@/app/markdown-parser";
import {
  chapterRank,
  classifyFicheSection,
  FICHE_GROUPS,
  ficheGroupMeta,
  type FicheChapter,
  type FicheGroupKey,
  type FicheGroupMeta,
} from "./fiche-taxonomy.ts";

export type FicheHeading = { id: string; title: string };
export type FicheSection = FicheHeading & {
  blocks: Block[];
  subsections: FicheHeading[];
  /** Chapitre canonique reconnu, `null` si la fiche invente sa section. */
  chapter: FicheChapter | null;
  /** Phase de lecture : toujours renseignée, par héritage si besoin. */
  group: FicheGroupKey;
};

/** Une phase de lecture non vide, dans l'ordre du squelette canonique. */
export type FicheGroup = FicheGroupMeta & { sections: FicheSection[] };

export type FicheDocument = {
  /** Blocs situés avant la première section (statut éditorial, synonymes…). */
  preamble: Block[];
  sections: FicheSection[];
  /** Les mêmes sections, groupées par phase pour le sommaire et le fil. */
  groups: FicheGroup[];
  /** Liens, sources et provenance : utiles mais hors du fil de lecture. */
  appendix: FicheSection[];
  words: number;
  minutes: number;
  /** Vrai quand la fiche importée n'avait aucun découpage exploitable. */
  autoSectioned: boolean;
  /** Vrai quand le squelette canonique a dû remettre des sections en ordre. */
  reordered: boolean;
};

const APPENDIX_TITLE = /^(liens|r[ée]f[ée]rences?|sources?|provenance|bibliographie)/i;
const LEADING_LABEL = /^\*\*([^*]{2,70}?)\s*:?\*\*/;
const LABEL_ONLY = /^\*\*([^*]{2,70}?)\s*:?\*\*\s*:?$/;

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createIdFactory() {
  const used = new Set<string>();
  return (value: string, fallback: string) => {
    const base = slugify(value) || fallback;
    let id = base;
    let suffix = 2;
    while (used.has(id)) {
      id = `${base}-${suffix}`;
      suffix += 1;
    }
    used.add(id);
    return id;
  };
}

function plainText(value: string) {
  return value
    .replace(/\[\[([a-z0-9-]+)\]\]/g, (_, slug: string) => slug.replaceAll("-", " "))
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*`=]/g, "")
    .replace(/\u2028/g, " ")
    .trim();
}

function countItems(items: ListItem[]): number {
  return items.reduce((total, item) => total + item.text.split(/\s+/).length + countItems(item.children), 0);
}

function countWords(blocks: Block[]): number {
  return blocks.reduce((total, block) => {
    if (block.kind === "p" || block.kind === "label" || block.kind === "h2" || block.kind === "h3" || block.kind === "h4") {
      return total + block.text.split(/\s+/).length;
    }
    if (block.kind === "callout") return total + countWords(block.blocks);
    if (block.kind === "table") return total + [...block.header, ...block.rows.flat()].join(" ").split(/\s+/).length;
    if (block.kind === "list") return total + countItems(block.items);
    return total;
  }, 0);
}

/**
 * Beaucoup de fiches importées empilent des puces « **Titre :** » suivies de
 * leurs propres sous-puces. On les remonte en intertitres pour rendre la
 * hiérarchie visible au lieu d'une liste indifférenciée.
 */
function promoteLabelLists(blocks: Block[]): Block[] {
  const output: Block[] = [];
  for (const block of blocks) {
    const promotable =
      block.kind === "list" &&
      block.items.length >= 2 &&
      block.items.every((item) => item.children.length > 0 && LABEL_ONLY.test(item.text));
    if (!promotable || block.kind !== "list") {
      output.push(block);
      continue;
    }
    for (const item of block.items) {
      output.push({ kind: "label", text: item.text.match(LABEL_ONLY)![1].trim() });
      output.push({ kind: "list", ordered: item.childrenOrdered, items: item.children });
    }
  }
  return output;
}

/** Les intertitres en gras deviennent des ancres : le sommaire gagne un 2e niveau. */
function headingsFromLabels(blocks: Block[], nextId: (value: string, fallback: string) => string): Block[] {
  return blocks.map((block, index) =>
    block.kind === "label"
      ? ({ kind: "h3", text: block.text, id: nextId(block.text, `bloc-${index + 1}`) } satisfies Block)
      : block);
}

const TITLE_MAX = 48;

function shorten(value: string) {
  const clean = plainText(value).replace(/\s+/g, " ").replace(/[.;,]+$/, "").trim();
  if (clean.length <= TITLE_MAX) return clean;
  const cut = clean.slice(0, TITLE_MAX);
  return `${cut.slice(0, cut.lastIndexOf(" ") > 12 ? cut.lastIndexOf(" ") : TITLE_MAX).trim()}…`;
}

/**
 * Les fiches importées n'ont pas toujours de titre explicite : on en dérive un
 * depuis l'amorce du bloc (intertitre, libellé en gras, clause introductive)
 * plutôt que de laisser une section anonyme dans le sommaire.
 */
const isTaskList = (block: Block) => block.kind === "list" && block.items.every((item) => item.checked !== null);

function titleFromBlocks(blocks: Block[]): string | null {
  for (const block of blocks.slice(0, 3)) {
    if (isTaskList(block)) continue;
    if (block.kind === "h3" || block.kind === "h4") return block.text;
    if (block.kind === "callout" && block.title) return block.title;
    if (block.kind === "p") {
      const label = block.text.match(LEADING_LABEL)?.[1];
      if (label) return label;
      const clause = plainText(block.text).split(/\s+:\s+|\s+:$|[.!?]\s/)[0];
      if (clause && clause.length >= 3) return shorten(clause);
      return shorten(block.text);
    }
    if (block.kind === "list") {
      const label = block.items[0]?.text.match(LEADING_LABEL)?.[1];
      if (label) return label;
      if (block.items[0]) return shorten(block.items[0].text);
    }
    if (block.kind === "table" && block.header.length) return shorten(block.header.join(" · "));
  }
  return null;
}

type RawSection = { title: string; blocks: Block[]; id?: string; fromHeading?: boolean };

function splitOnHeadings(blocks: Block[]) {
  const preamble: Block[] = [];
  const sections: RawSection[] = [];
  let current: RawSection | null = null;
  for (const block of blocks) {
    if (block.kind === "h2") {
      current = { title: block.text, blocks: [], id: block.id, fromHeading: true };
      sections.push(current);
    } else if (current) current.blocks.push(block);
    else preamble.push(block);
  }
  return { preamble, sections };
}

/** Découpage de repli : les filets `---` du vault servent de frontières. */
function splitOnRules(blocks: Block[]) {
  const preamble: Block[] = [];
  const sections: RawSection[] = [];
  let chunk: Block[] | null = null;

  for (const block of blocks) {
    if (block.kind === "hr") {
      if (chunk?.length) sections.push({ title: "", blocks: chunk });
      chunk = [];
      continue;
    }
    if (chunk) chunk.push(block);
    else preamble.push(block);
  }
  if (chunk?.length) sections.push({ title: "", blocks: chunk });

  return {
    preamble,
    sections: sections.map((section, index) => {
      const [first] = section.blocks;
      if (first && (first.kind === "h3" || first.kind === "h4")) {
        return { title: first.text, id: first.id, blocks: section.blocks.slice(1) };
      }
      return { title: titleFromBlocks(section.blocks) ?? `Partie ${index + 1}`, blocks: section.blocks };
    }),
  };
}

/* -------------------------------------------------------------------------- */
/* Squelette canonique                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Une section au titre non reconnu (« Perfusion cérébrale », « Score de
 * Wells ») appartient à la phase de la section qui la précède : c'est là
 * qu'elle a été rédigée, et c'est là qu'elle garde son sens.
 */
function inheritGroups(sections: FicheSection[]): FicheSection[] {
  let current: FicheGroupKey = "synthese";
  return sections.map((section) => {
    if (section.chapter) {
      current = section.chapter.group;
      return section;
    }
    return { ...section, group: current };
  });
}

/**
 * Remet les sections dans l'ordre du squelette. Le tri est stable et une
 * section non reconnue emprunte le rang de celle qui la précède : elle ne
 * décolle jamais de son contexte, seuls les blocs reconnus hors séquence
 * (un « Diagnostic » placé après le « Traitement ») remontent à leur place.
 */
function canonicalOrder(sections: FicheSection[]): FicheSection[] {
  let inherited = -1;
  const ranked = sections.map((section, index) => {
    const rank = chapterRank(section.chapter);
    if (rank !== null) inherited = rank;
    // `+ index / 1000` : à rang égal, l'ordre de rédaction fait foi.
    return { section, sort: (rank ?? inherited) + index / 1000, index };
  });
  return ranked.sort((a, b) => a.sort - b.sort || a.index - b.index).map((entry) => entry.section);
}

function groupSections(sections: FicheSection[]): FicheGroup[] {
  return FICHE_GROUPS.map((group) => ({
    ...ficheGroupMeta(group.key),
    sections: sections.filter((section) => section.group === group.key),
  })).filter((group) => group.sections.length > 0);
}

/**
 * `keepOrder` : garder l'ordre de rédaction. Le squelette canonique décrit une
 * pathologie ; une fiche de méthode (la trame d'une anamnèse) a son propre fil.
 */
export function buildFicheDocument(source: Block[], { keepOrder = false }: { keepOrder?: boolean } = {}): FicheDocument {
  const nextId = createIdFactory();
  const normalized = headingsFromLabels(promoteLabelLists(source), nextId);

  const byHeading = splitOnHeadings(normalized);
  const isAppendix = (section: RawSection) => section.fromHeading === true && APPENDIX_TITLE.test(section.title);
  const clinicalHeadings = byHeading.sections.filter((section) => !isAppendix(section));
  // Une fiche importée sans découpage exploitable retombe sur ses filets `---`.
  const autoSectioned = clinicalHeadings.length < 3;

  let preamble = byHeading.preamble;
  const raw: RawSection[] = [];

  if (autoSectioned) {
    const fromPreamble = splitOnRules(byHeading.preamble);
    preamble = fromPreamble.preamble;
    raw.push(...fromPreamble.sections);
    for (const section of byHeading.sections) {
      if (isAppendix(section)) {
        raw.push(section);
        continue;
      }
      const inner = splitOnRules(section.blocks);
      if (inner.preamble.length > 0) raw.push({ ...section, blocks: inner.preamble });
      else if (inner.sections.length > 0) inner.sections[0] = { ...inner.sections[0], title: section.title, id: section.id };
      raw.push(...inner.sections);
    }
  } else {
    raw.push(...byHeading.sections);
  }

  const appendixIds = new Set(raw.filter(isAppendix).map((section) => section.id));
  const toSection = (section: RawSection, index: number): FicheSection => {
    const title = plainText(section.title).replace(/\s*:$/, "") || `Partie ${index + 1}`;
    const chapter = classifyFicheSection(title);
    return {
      id: section.id ?? nextId(title, `section-${index + 1}`),
      title,
      chapter,
      group: chapter?.group ?? "synthese",
      blocks: section.blocks,
      subsections: section.blocks
        .filter((block): block is Extract<Block, { kind: "h3" }> => block.kind === "h3")
        .map((block) => ({ id: block.id, title: plainText(block.text).replace(/\s*:$/, "") })),
    };
  };

  const all = raw
    .filter((section) => section.blocks.length > 0 && !section.blocks.every(isTaskList))
    .map(toSection);
  const words = countWords(normalized);

  const body = inheritGroups(all.filter((section) => !appendixIds.has(section.id)));
  // Une fiche découpée automatiquement n'a que des titres devinés : les
  // reclasser reviendrait à mélanger un texte dont on ne maîtrise pas le fil.
  const sections = autoSectioned || keepOrder ? body : canonicalOrder(body);
  const appendix = all
    .filter((section) => appendixIds.has(section.id))
    .map((section) => ({ ...section, group: "ressources" as FicheGroupKey }));

  return {
    preamble,
    sections,
    groups: groupSections(sections),
    appendix,
    words,
    minutes: Math.max(1, Math.round(words / 200)),
    autoSectioned,
    reordered: sections.some((section, index) => section !== body[index]),
  };
}
