import { Fragment, type ReactNode } from "react";
import Link from "next/link";
import { AlertOctagon, AlertTriangle, BookMarked, CheckCircle2, Info, Lightbulb, PenLine, Quote, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import pathologyCatalog from "@/content/pathologies/index.json";
import { SOFT_BREAK, type Block, type CalloutTone, type ListItem } from "./markdown-parser";

export { parseMarkdown, parseFrontmatter, type Block } from "./markdown-parser";

const catalogBySlug = new Map(pathologyCatalog.map((entry) => [entry.slug, entry]));

const INLINE_PATTERN = new RegExp(
  [
    /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/, // lien externe
    /==([^=]+?)==/, // point à retenir (surlignage rouge du vault)
    /\*\*(.+?)\*\*|__(.+?)__/, // gras
    /`([^`]+?)`/, // code
    /\*([^*\n]+?)\*/, // italique
    /(?<![\w])_([^_\n]+?)_(?![\w])/, // italique souligné
    /\[\[([a-z0-9-]+)\]\]/, // renvoi interne
  ].map((part) => part.source).join("|"),
  "g",
);

function withSoftBreaks(text: string, key: number): ReactNode {
  if (!text.includes(SOFT_BREAK)) return text;
  const segments = text.split(SOFT_BREAK);
  return (
    <Fragment key={`br-${key}`}>
      {segments.map((segment, index) => (
        <Fragment key={index}>
          {index > 0 && <br />}
          {segment}
        </Fragment>
      ))}
    </Fragment>
  );
}

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let cursor = 0;
  let key = 0;

  // `matchAll` travaille sur une copie du motif : indispensable ici, car le
  // rendu est récursif (gras dans un surlignage, par exemple) et un `lastIndex`
  // partagé ferait repartir la boucle parente à zéro.
  for (const match of text.matchAll(INLINE_PATTERN)) {
    const index = match.index ?? 0;
    if (index > cursor) nodes.push(withSoftBreaks(text.slice(cursor, index), key));
    const [, linkLabel, linkHref, highlight, strongStar, strongScore, code, emStar, emScore, wikiSlug] = match;

    if (linkLabel !== undefined) {
      nodes.push(<a href={linkHref} key={key} rel="noreferrer" target="_blank">{linkLabel}</a>);
    } else if (highlight !== undefined) {
      nodes.push(<mark className="fiche-highlight" key={key}>{renderInline(highlight)}</mark>);
    } else if (strongStar !== undefined || strongScore !== undefined) {
      nodes.push(<strong key={key}>{renderInline(strongStar ?? strongScore ?? "")}</strong>);
    } else if (code !== undefined) {
      nodes.push(<code key={key}>{code}</code>);
    } else if (emStar !== undefined || emScore !== undefined) {
      nodes.push(<em key={key}>{renderInline(emStar ?? emScore ?? "")}</em>);
    } else {
      const slug = wikiSlug ?? "";
      const target = catalogBySlug.get(slug);
      const label = target?.title ?? slug.replaceAll("-", " ");
      nodes.push(
        target?.status === "ready"
          ? <Link className="wiki-ref" href={`/pathologies/${slug}`} key={key}>{label}</Link>
          : <span className="wiki-ref inert" key={key}>{label}</span>,
      );
    }
    cursor = index + match[0].length;
    key += 1;
  }
  if (cursor < text.length) nodes.push(withSoftBreaks(text.slice(cursor), key));
  return nodes;
}

function renderItems(items: ListItem[]) {
  return items.map((item, index) => (
    <li className={item.checked === null ? undefined : "fiche-task"} key={index}>
      {item.checked !== null && (
        <input aria-hidden="true" checked={item.checked} disabled readOnly tabIndex={-1} type="checkbox" />
      )}
      {renderInline(item.text)}
      {item.children.length > 0 && (item.childrenOrdered
        ? <ol>{renderItems(item.children)}</ol>
        : <ul>{renderItems(item.children)}</ul>)}
    </li>
  ));
}

const calloutMeta: Record<CalloutTone, { icon: LucideIcon; fallbackTitle: string }> = {
  info: { icon: Info, fallbackTitle: "À savoir" },
  note: { icon: PenLine, fallbackTitle: "Note clinique" },
  tip: { icon: Lightbulb, fallbackTitle: "Réflexe pratique" },
  success: { icon: CheckCircle2, fallbackTitle: "À retenir" },
  warning: { icon: AlertTriangle, fallbackTitle: "Attention" },
  danger: { icon: AlertOctagon, fallbackTitle: "Ne pas manquer" },
  important: { icon: Sparkles, fallbackTitle: "Point clé" },
  example: { icon: BookMarked, fallbackTitle: "Exemple" },
  quote: { icon: Quote, fallbackTitle: "Extrait" },
};

export function MarkdownBlocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((block, index) => {
        switch (block.kind) {
          case "h2":
            return <h2 id={block.id} key={index}>{renderInline(block.text)}</h2>;
          case "h3":
            return <h3 id={block.id} key={index}>{renderInline(block.text)}</h3>;
          case "h4":
            return <h4 id={block.id} key={index}>{renderInline(block.text)}</h4>;
          case "label":
            return <h3 key={index}>{renderInline(block.text)}</h3>;
          case "hr":
            return <hr key={index} />;
          case "p":
            return <p key={index}>{renderInline(block.text)}</p>;
          case "callout": {
            const meta = calloutMeta[block.tone] ?? calloutMeta.info;
            const Icon = meta.icon;
            return (
              <aside className={`callout callout-${block.tone}`} key={index}>
                <p className="callout-title"><Icon aria-hidden="true" size={16} />{block.title || meta.fallbackTitle}</p>
                <div className="callout-body"><MarkdownBlocks blocks={block.blocks} /></div>
              </aside>
            );
          }
          case "table":
            return (
              // Un tableau à défilement horizontal doit rester atteignable au clavier (WCAG 2.1.1).
              // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
              <div aria-label="Tableau — défilement horizontal" className="table-scroll" key={index} role="region" tabIndex={0}>
                <table>
                  <thead>
                    <tr>{block.header.map((cell, cellIndex) => (
                      <th key={cellIndex} style={{ textAlign: block.align[cellIndex] ?? "left" }}>{renderInline(cell)}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, rowIndex) => (
                      <tr key={rowIndex}>{row.map((cell, cellIndex) => (
                        <td key={cellIndex} style={{ textAlign: block.align[cellIndex] ?? "left" }}>{renderInline(cell)}</td>
                      ))}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          default: {
            const items = renderItems(block.items);
            return block.ordered ? <ol key={index}>{items}</ol> : <ul key={index}>{items}</ul>;
          }
        }
      })}
    </>
  );
}
