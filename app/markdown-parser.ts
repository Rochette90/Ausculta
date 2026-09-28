export type ListItem = { text: string; children: ListItem[]; childrenOrdered: boolean; checked: boolean | null };
export type ColumnAlign = "left" | "center" | "right";
export type CalloutTone =
  | "info"
  | "note"
  | "tip"
  | "success"
  | "warning"
  | "danger"
  | "important"
  | "example"
  | "quote";

export type Block =
  | { kind: "h2"; text: string; id: string }
  | { kind: "h3"; text: string; id: string }
  | { kind: "h4"; text: string; id: string }
  | { kind: "label"; text: string }
  | { kind: "hr" }
  | { kind: "p"; text: string }
  | { kind: "callout"; tone: CalloutTone; title: string; blocks: Block[] }
  | { kind: "table"; header: string[]; rows: string[][]; align: ColumnAlign[] }
  | { kind: "list"; ordered: boolean; items: ListItem[] };

/** Séparateur de ligne conservé dans une cellule de tableau (issu de `<br>`). */
export const SOFT_BREAK = "\u2028";

/* -------------------------------------------------------------------------- */
/* Frontmatter                                                                 */
/* -------------------------------------------------------------------------- */

export type Frontmatter = {
  title?: string;
  specialty?: string;
  criticality?: string;
  resume?: string;
  synonymes: string[];
  tags: string[];
  reviewStatus?: string;
  sourceVault?: string;
};

function unquote(value: string) {
  const trimmed = value.trim();
  if (trimmed.length > 1 && /^("[\s\S]*"|'[\s\S]*')$/.test(trimmed)) return trimmed.slice(1, -1);
  return trimmed;
}

function frontmatterBounds(source: string) {
  if (!source.startsWith("---")) return null;
  const end = source.indexOf("\n---", 3);
  if (end === -1) return null;
  const bodyStart = source.indexOf("\n", end + 1);
  return { raw: source.slice(source.indexOf("\n") + 1, end), bodyStart: bodyStart === -1 ? source.length : bodyStart + 1 };
}

/**
 * Les fiches importées portent des métadonnées (synonymes, tags, statut) qui
 * n'étaient jusqu'ici que supprimées : elles alimentent désormais l'en-tête.
 */
export function parseFrontmatter(source: string): Frontmatter {
  const meta: Frontmatter = { synonymes: [], tags: [] };
  const bounds = frontmatterBounds(source);
  if (!bounds) return meta;

  let listTarget: string[] | null = null;
  for (const line of bounds.raw.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const listItem = line.match(/^\s+-\s+(.*)$/);
    if (listItem && listTarget) {
      const value = unquote(listItem[1]);
      if (value) listTarget.push(value);
      continue;
    }
    const entry = line.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/);
    if (!entry) continue;
    const [, key, rawValue] = entry;
    const value = unquote(rawValue);
    listTarget = null;
    if (key === "synonymes" || key === "tags") {
      listTarget = key === "synonymes" ? meta.synonymes : meta.tags;
      if (value) listTarget.push(...value.replace(/^\[|\]$/g, "").split(",").map(unquote).filter(Boolean));
      continue;
    }
    if (key === "title") meta.title = value;
    else if (key === "specialty") meta.specialty = value;
    else if (key === "criticality") meta.criticality = value;
    else if (key === "resume") meta.resume = value;
    else if (key === "review_status") meta.reviewStatus = value;
    else if (key === "source_vault") meta.sourceVault = value;
  }
  return meta;
}

function stripFrontmatter(source: string) {
  const bounds = frontmatterBounds(source);
  return bounds ? source.slice(bounds.bodyStart) : source;
}

/* -------------------------------------------------------------------------- */
/* Normalisation : LaTeX résiduel et HTML collé depuis Obsidian                */
/* -------------------------------------------------------------------------- */

const GREEK: Record<string, string> = {
  alpha: "α", beta: "β", gamma: "γ", delta: "δ", epsilon: "ε", varepsilon: "ε", zeta: "ζ",
  eta: "η", theta: "θ", iota: "ι", kappa: "κ", lambda: "λ", mu: "μ", nu: "ν", xi: "ξ",
  rho: "ρ", sigma: "σ", tau: "τ", upsilon: "υ", phi: "φ", chi: "χ", psi: "ψ", omega: "ω",
  Gamma: "Γ", Delta: "Δ", Theta: "Θ", Lambda: "Λ", Xi: "Ξ", Pi: "Π", Sigma: "Σ",
  Phi: "Φ", Psi: "Ψ", Omega: "Ω", pi: "π",
};

const SYMBOLS: Record<string, string> = {
  to: "→", rightarrow: "→", longrightarrow: "⟶", Rightarrow: "⇒", implies: "⇒",
  leftarrow: "←", Leftarrow: "⇐", leftrightarrow: "↔", Leftrightarrow: "⇔",
  uparrow: "↑", downarrow: "↓", nearrow: "↗", searrow: "↘",
  ge: "≥", geq: "≥", le: "≤", leq: "≤", ne: "≠", neq: "≠", ll: "≪", gg: "≫",
  approx: "≈", simeq: "≃", equiv: "≡", propto: "∝", sim: "~",
  pm: "±", mp: "∓", times: "×", div: "÷", cdot: "·", ast: "*", bullet: "•",
  infty: "∞", circ: "°", degree: "°", percent: "%",
  ldots: "…", dots: "…", cdots: "…",
  cap: "∩", cup: "∪", subset: "⊂", supset: "⊃", in: "∈", notin: "∉",
  forall: "∀", exists: "∃", emptyset: "∅", partial: "∂", nabla: "∇",
  quad: " ", qquad: "  ", space: " ",
};

const SUPERSCRIPT: Record<string, string> = {
  "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
  "+": "⁺", "-": "⁻", "=": "⁼", "(": "⁽", ")": "⁾", n: "ⁿ", i: "ⁱ",
};

const SUBSCRIPT: Record<string, string> = {
  "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄", "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉",
  "+": "₊", "-": "₋", "=": "₌", "(": "₍", ")": "₎",
  a: "ₐ", e: "ₑ", h: "ₕ", i: "ᵢ", j: "ⱼ", k: "ₖ", l: "ₗ", m: "ₘ", n: "ₙ",
  o: "ₒ", p: "ₚ", r: "ᵣ", s: "ₛ", t: "ₜ", u: "ᵤ", v: "ᵥ", x: "ₓ",
};

function applyScript(inner: string, table: Record<string, string>) {
  const mapped = [...inner].map((char) => table[char]).join("");
  if (mapped.length === inner.length) return mapped;
  // Indice/exposant textuel (`Na_{urinaire}`) : on le rend lisible en clair.
  return inner.length === 1 ? inner : ` ${inner}`;
}

/** Traduit les rares fragments LaTeX du vault en texte Unicode lisible. */
function decodeMath(expression: string) {
  let output = expression;
  output = output.replace(/\\(?:left|right|,|;|:|!)/g, " ");
  output = output.replace(/\\(?:text|mathrm|mathbf|mathit|operatorname)\{([^{}]*)\}/g, "$1");
  output = output.replace(/\^\{([^{}]*)\}|\^(\S)/g, (_, braced?: string, single?: string) =>
    applyScript(braced ?? single ?? "", SUPERSCRIPT));
  output = output.replace(/_\{([^{}]*)\}|_(\S)/g, (_, braced?: string, single?: string) =>
    applyScript(braced ?? single ?? "", SUBSCRIPT));
  output = output.replace(/\\([A-Za-z]+)/g, (whole, name: string) => GREEK[name] ?? SYMBOLS[name] ?? name);
  output = output.replace(/\\([%${}&#_])/g, "$1");
  output = output.replace(/~/g, " ");
  return output.replace(/[ \t]{2,}/g, " ").trim();
}

/**
 * Le vault pédagogique surligne l'essentiel en rouge via `<font>`/`<span>` :
 * on le convertit en marqueur `==…==` pour le rendre comme point à retenir.
 */
function normalizeSource(source: string) {
  let output = source;
  output = output.replace(/\$\$([\s\S]+?)\$\$/g, (_, expression: string) => decodeMath(expression));
  output = output.replace(/\$([^$\n]+)\$/g, (_, expression: string) => decodeMath(expression));
  output = output.replace(/<font\b[^>]*>([\s\S]*?)<\/font>/gi, (_, inner: string) =>
    inner.trim() ? `==${inner.trim()}==` : "");
  output = output.replace(/<span\b[^>]*color\s*:\s*rgb\(\s*255\s*,\s*0\s*,\s*0\s*\)[^>]*>([\s\S]*?)<\/span>/gi,
    (_, inner: string) => (inner.trim() ? `==${inner.trim()}==` : ""));
  output = output.replace(/<span\b[^>]*>([\s\S]*?)<\/span>/gi, "$1");
  output = output.replace(/<b>([\s\S]*?)<\/b>/gi, (_, inner: string) => (inner.trim() ? `**${inner.trim()}**` : ""));
  output = output.replace(/<(?:i|em)>([\s\S]*?)<\/(?:i|em)>/gi, (_, inner: string) => (inner.trim() ? `*${inner.trim()}*` : ""));
  output = output.replace(/<br\s*\/?>/gi, SOFT_BREAK);
  output = output.replace(/<\/?(?:font|span|b|i|u|em|strong|div|p|small)\b[^>]*>/gi, "");
  return output;
}

/* -------------------------------------------------------------------------- */
/* Blocs                                                                       */
/* -------------------------------------------------------------------------- */

const CALLOUT_TONES: Record<string, CalloutTone> = {
  info: "info", infos: "info", abstract: "info", summary: "info", tldr: "info",
  note: "note", cite: "quote", quote: "quote",
  tip: "tip", hint: "tip", astuce: "tip",
  success: "success", check: "success", done: "success",
  question: "example", help: "example", faq: "example", example: "example", exemple: "example",
  todo: "note",
  warning: "warning", caution: "warning", attention: "warning", alert: "warning", alerte: "warning",
  danger: "danger", error: "danger", bug: "danger", failure: "danger", fail: "danger", missing: "danger",
  important: "important",
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const LIST_PATTERN = /^([ \t]*)(?:[-*+]|(\d+)[.)])[ \t]+(.*)$/;
const TABLE_DIVIDER = /^\|?[\s:|-]+\|[\s:|-]*$/;

function indentWidth(prefix: string) {
  let width = 0;
  for (const char of prefix) width += char === "\t" ? 4 : 1;
  return width;
}

function readTable(lines: string[], start: number) {
  let index = start;
  const rawRows: string[] = [];
  while (index < lines.length && lines[index].trim().startsWith("|")) {
    rawRows.push(lines[index].trim());
    index += 1;
  }
  const cells = (row: string) => row.replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
  const dividerIndex = rawRows.findIndex((row) => TABLE_DIVIDER.test(row));
  const align: ColumnAlign[] = dividerIndex === -1 ? [] : cells(rawRows[dividerIndex]).map((marker) => {
    const left = marker.startsWith(":");
    const right = marker.endsWith(":");
    if (left && right) return "center";
    return right ? "right" : "left";
  });
  const rows = rawRows.filter((row) => !TABLE_DIVIDER.test(row)).map(cells);
  const block: Block | null = rows.length
    ? { kind: "table", header: rows[0], rows: rows.slice(1), align }
    : null;
  return { block, next: index - 1 };
}

type ListEntry = { indent: number; ordered: boolean; text: string; checked: boolean | null };

function buildListBlocks(entries: ListEntry[]): Block[] {
  const blocks: Block[] = [];
  let run: ListEntry[] = [];
  const baseIndent = Math.min(...entries.map((entry) => entry.indent));

  const flushRun = () => {
    if (!run.length) return;
    const root: ListItem[] = [];
    const stack: Array<{ indent: number; items: ListItem[] }> = [{ indent: run[0].indent, items: root }];
    for (const entry of run) {
      while (stack.length > 1 && entry.indent < stack[stack.length - 1].indent) stack.pop();
      const top = stack[stack.length - 1];
      if (entry.indent > top.indent && top.items.length > 0) {
        const parent = top.items[top.items.length - 1];
        parent.childrenOrdered = entry.ordered;
        stack.push({ indent: entry.indent, items: parent.children });
      }
      stack[stack.length - 1].items.push({ text: entry.text, children: [], childrenOrdered: false, checked: entry.checked });
    }
    blocks.push({ kind: "list", ordered: run[0].ordered, items: root });
    run = [];
  };

  for (const entry of entries) {
    // Une bascule puces ↔ numéros au premier niveau marque deux listes distinctes.
    if (run.length && entry.indent === baseIndent && entry.ordered !== run[0].ordered) flushRun();
    run.push(entry);
  }
  flushRun();
  return blocks;
}

function readList(lines: string[], start: number) {
  const entries: ListEntry[] = [];
  let index = start;
  while (index < lines.length) {
    const match = lines[index].match(LIST_PATTERN);
    if (match) {
      const task = match[3].match(/^\[([ xX])\]\s*(.*)$/);
      entries.push({
        indent: indentWidth(match[1]),
        ordered: match[2] !== undefined,
        text: (task ? task[2] : match[3]).trim(),
        checked: task ? task[1].toLowerCase() === "x" : null,
      });
      index += 1;
      continue;
    }
    // Une ligne vide isolée entre deux puces ne casse pas la liste (export Obsidian).
    if (!lines[index].trim() && index + 1 < lines.length && LIST_PATTERN.test(lines[index + 1])) {
      index += 1;
      continue;
    }
    // Continuation indentée d'une puce : on la recolle au texte de la puce.
    const continuation = lines[index].match(/^([ \t]{2,})(\S.*)$/);
    const continuationText = continuation?.[2].trim() ?? "";
    if (continuation && entries.length && !continuationText.startsWith("|") && !continuationText.startsWith(">") && !/^#{1,6}\s/.test(continuationText)) {
      entries[entries.length - 1].text += ` ${continuationText}`;
      index += 1;
      continue;
    }
    break;
  }
  // On rembobine les lignes vides consommées en fin de liste.
  while (index > start && !lines[index - 1].trim()) index -= 1;
  return { blocks: buildListBlocks(entries), next: index - 1 };
}

function readCallout(lines: string[], start: number) {
  const quoted: string[] = [];
  let index = start;
  while (index < lines.length && lines[index].trim().startsWith(">")) {
    quoted.push(lines[index].trim().replace(/^>[ \t]?/, ""));
    index += 1;
  }
  const tag = quoted[0]?.match(/^\[!(\w+)\][+-]?\s*(.*)$/);
  const body = tag ? quoted.slice(1) : quoted;
  const tone = CALLOUT_TONES[tag?.[1]?.toLowerCase() ?? ""] ?? (tag ? "info" : "quote");
  const block: Block = {
    kind: "callout",
    tone,
    title: tag?.[2]?.trim() ?? "",
    blocks: parseBlocks(body),
  };
  return { block, next: index - 1 };
}

const LABEL_PATTERN = /^\*\*([^*]+?)\s*:?\*\*\s*:?$/;

function parseBlocks(lines: string[]): Block[] {
  const blocks: Block[] = [];
  const usedIds = new Set<string>();
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    const text = paragraph.join(" ").trim();
    paragraph = [];
    if (!text) return;
    const label = text.match(LABEL_PATTERN);
    if (label) blocks.push({ kind: "label", text: label[1].trim() });
    else blocks.push({ kind: "p", text });
  };

  const headingId = (text: string) => {
    let id = slugify(text) || "section";
    let suffix = 2;
    while (usedIds.has(id)) {
      id = `${slugify(text) || "section"}-${suffix}`;
      suffix += 1;
    }
    usedIds.add(id);
    return id;
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      continue;
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      flushParagraph();
      const level = heading[1].length;
      const text = heading[2].replace(/\s*#+\s*$/, "").trim();
      if (!text) continue;
      const kind = level <= 2 ? "h2" : level === 3 ? "h3" : "h4";
      blocks.push({ kind, text, id: headingId(text) });
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      flushParagraph();
      blocks.push({ kind: "hr" });
      continue;
    }

    if (trimmed.startsWith(">")) {
      flushParagraph();
      const { block, next } = readCallout(lines, index);
      blocks.push(block);
      index = next;
      continue;
    }

    if (trimmed.startsWith("|")) {
      flushParagraph();
      const { block, next } = readTable(lines, index);
      if (block) blocks.push(block);
      index = next;
      continue;
    }

    if (LIST_PATTERN.test(line)) {
      flushParagraph();
      const { blocks: listBlocks, next } = readList(lines, index);
      blocks.push(...listBlocks);
      index = next;
      continue;
    }

    paragraph.push(trimmed);
  }
  flushParagraph();
  return blocks;
}

/**
 * Les fiches importées enchaînent des `---` orphelins : on ne conserve un filet
 * que lorsqu'il sépare réellement deux contenus.
 */
function tidyRules(blocks: Block[]) {
  const output: Block[] = [];
  for (const block of blocks) {
    if (block.kind !== "hr") {
      output.push(block);
      continue;
    }
    const previous = output[output.length - 1];
    if (!previous || previous.kind === "hr") continue;
    output.push(block);
  }
  while (output.length && output[output.length - 1].kind === "hr") output.pop();
  // Le filet placé juste avant un titre fait doublon avec le liseré du titre.
  return output.filter((block, position) => {
    if (block.kind !== "hr") return true;
    const next = output[position + 1];
    return !(next && (next.kind === "h2" || next.kind === "h3"));
  });
}

export function parseMarkdown(source: string): Block[] {
  const lines = normalizeSource(stripFrontmatter(source)).split(/\r?\n/);
  return tidyRules(parseBlocks(lines));
}
