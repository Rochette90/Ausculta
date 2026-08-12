import type { ReactNode } from "react";
import pathologyCatalog from "../content/pathologies/index.json";

type NavigateHandler = (slug: string) => void;
const catalogBySlug = new Map(pathologyCatalog.map((entry) => [entry.slug, entry]));

type ListItem = { text: string; children: ListItem[] };
export type Block =
  | { kind: "h2"; text: string; id: string }
  | { kind: "label"; text: string }
  | { kind: "hr" }
  | { kind: "p"; text: string }
  | { kind: "callout"; tone: string; title: string; paragraphs: string[] }
  | { kind: "table"; header: string[]; rows: string[][] }
  | { kind: "list"; ordered: boolean; items: ListItem[] };

function slugify(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function stripFrontmatter(source: string) {
  if (!source.startsWith("---")) return source;
  const end = source.indexOf("\n---", 3);
  return end === -1 ? source : source.slice(source.indexOf("\n", end + 1) + 1);
}

export function parseMarkdown(source: string): Block[] {
  const lines = stripFrontmatter(source).split(/\r?\n/);
  const blocks: Block[] = [];
  const usedIds = new Set<string>();
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    const text = paragraph.join(" ").trim();
    paragraph = [];
    if (!text) return;
    const label = text.match(/^\*\*([^*]+)\*\*$/);
    if (label) blocks.push({ kind: "label", text: label[1] });
    else blocks.push({ kind: "p", text });
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) { flushParagraph(); continue; }

    if (/^#{2,6}\s+/.test(trimmed)) {
      flushParagraph();
      const text = trimmed.replace(/^#{2,6}\s+/, "");
      let id = slugify(text) || "section";
      while (usedIds.has(id)) id = `${id}-x`;
      usedIds.add(id);
      blocks.push({ kind: "h2", text, id });
      continue;
    }

    if (/^-{3,}$/.test(trimmed) || /^\*{3,}$/.test(trimmed)) { flushParagraph(); blocks.push({ kind: "hr" }); continue; }

    if (trimmed.startsWith(">")) {
      flushParagraph();
      const quoteLines: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith(">")) {
        quoteLines.push(lines[index].trim().replace(/^>\s?/, ""));
        index += 1;
      }
      index -= 1;
      const tag = quoteLines[0]?.match(/^\[!(\w+)\]\s*(.*)$/);
      const body = tag ? quoteLines.slice(1) : quoteLines;
      const paragraphs: string[] = [];
      let current: string[] = [];
      for (const quoteLine of body) {
        if (!quoteLine.trim()) { if (current.length) { paragraphs.push(current.join(" ")); current = []; } }
        else current.push(quoteLine.trim());
      }
      if (current.length) paragraphs.push(current.join(" "));
      blocks.push({ kind: "callout", tone: tag?.[1]?.toLowerCase() ?? "info", title: tag?.[2] ?? "", paragraphs });
      continue;
    }

    if (trimmed.startsWith("|")) {
      flushParagraph();
      const tableLines: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith("|")) {
        tableLines.push(lines[index].trim());
        index += 1;
      }
      index -= 1;
      const cells = (row: string) => row.replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
      const rows = tableLines.filter((row) => !/^\|[\s:|-]+\|$/.test(row)).map(cells);
      if (rows.length) blocks.push({ kind: "table", header: rows[0], rows: rows.slice(1) });
      continue;
    }

    const listMatch = line.match(/^(\s*)(?:[-*]|(\d+)\.)\s+(.*)$/);
    if (listMatch) {
      flushParagraph();
      const ordered = listMatch[2] !== undefined;
      const items: ListItem[] = [];
      while (index < lines.length) {
        const itemMatch = lines[index].match(/^(\s*)(?:[-*]|\d+\.)\s+(.*)$/);
        if (!itemMatch) break;
        const item: ListItem = { text: itemMatch[2].trim(), children: [] };
        if (itemMatch[1].length > 0 && items.length) items[items.length - 1].children.push(item);
        else items.push(item);
        index += 1;
      }
      index -= 1;
      blocks.push({ kind: "list", ordered, items });
      continue;
    }

    paragraph.push(trimmed);
  }
  flushParagraph();

  // Les fiches séparent chaque section par `---` suivi d'un titre : le filet du titre suffit.
  return blocks.filter((block, position) => !(block.kind === "hr" && blocks[position + 1]?.kind === "h2"));
}

function renderInline(text: string, onNavigate?: NavigateHandler): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|\[\[([a-z0-9-]+)\]\]/g;
  let cursor = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > cursor) nodes.push(text.slice(cursor, match.index));
    if (match[1] !== undefined) nodes.push(<strong key={key}>{renderInline(match[1], onNavigate)}</strong>);
    else if (match[2] !== undefined) nodes.push(<em key={key}>{match[2]}</em>);
    else if (match[3] !== undefined) nodes.push(<code key={key}>{match[3]}</code>);
    else {
      const slug = match[4];
      const target = catalogBySlug.get(slug);
      const label = target?.title ?? slug.replaceAll("-", " ");
      if (target?.status === "ready" && onNavigate) nodes.push(<button key={key} type="button" className="wiki-ref" onClick={() => onNavigate(slug)}>{label}</button>);
      else nodes.push(<span key={key} className="wiki-ref inert">{label}</span>);
    }
    cursor = match.index + match[0].length;
    key += 1;
  }
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}

function renderItems(items: ListItem[], onNavigate?: NavigateHandler) {
  return items.map((item, index) => (
    <li key={index}>
      {renderInline(item.text, onNavigate)}
      {item.children.length > 0 && <ul>{renderItems(item.children, onNavigate)}</ul>}
    </li>
  ));
}

const calloutMeta: Record<string, { icon: string; fallbackTitle: string }> = {
  info: { icon: "ℹ", fallbackTitle: "À savoir" },
  warning: { icon: "△", fallbackTitle: "Attention" },
  danger: { icon: "⚠", fallbackTitle: "Ne pas manquer" },
};

export function MarkdownBlocks({ blocks, onNavigate }: { blocks: Block[]; onNavigate?: NavigateHandler }) {
  return (
    <>
      {blocks.map((block, index) => {
        if (block.kind === "h2") return <h2 key={index} id={block.id}>{block.text}</h2>;
        if (block.kind === "label") return <h3 key={index}>{block.text}</h3>;
        if (block.kind === "hr") return <hr key={index} />;
        if (block.kind === "p") return <p key={index}>{renderInline(block.text, onNavigate)}</p>;
        if (block.kind === "callout") {
          const meta = calloutMeta[block.tone] ?? calloutMeta.info;
          return (
            <aside key={index} className={`callout callout-${block.tone in calloutMeta ? block.tone : "info"}`}>
              <strong><span aria-hidden="true">{meta.icon}</span>{block.title || meta.fallbackTitle}</strong>
              {block.paragraphs.map((paragraphText, paragraphIndex) => <p key={paragraphIndex}>{renderInline(paragraphText, onNavigate)}</p>)}
            </aside>
          );
        }
        if (block.kind === "table") {
          return (
            <div key={index} className="table-scroll">
              <table>
                <thead><tr>{block.header.map((cell, cellIndex) => <th key={cellIndex}>{renderInline(cell, onNavigate)}</th>)}</tr></thead>
                <tbody>{block.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}>{renderInline(cell, onNavigate)}</td>)}</tr>)}</tbody>
              </table>
            </div>
          );
        }
        const items = renderItems(block.items, onNavigate);
        return block.ordered ? <ol key={index}>{items}</ol> : <ul key={index}>{items}</ul>;
      })}
    </>
  );
}
