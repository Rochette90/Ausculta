"use client";

import { CheckCircle2, Flag, LoaderCircle, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { createPathologyReport } from "../../app/actions/reports";
import type { PathologySectionKey } from "../../types/content";
import { Button } from "../ui/button";

type SelectedPassage = {
  start: number;
  end: number;
  text: string;
  contextBefore: string;
  contextAfter: string;
};

type ReportableTextProps = {
  pathologyId: string;
  sectionKey: PathologySectionKey;
  text: string;
  className?: string;
};

export function ReportableText({ pathologyId, sectionKey, text, className }: ReportableTextProps) {
  const containerRef = useRef<HTMLParagraphElement>(null);
  const [selection, setSelection] = useState<SelectedPassage | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  const captureSelection = useCallback(() => {
    const container = containerRef.current;
    const browserSelection = window.getSelection();
    if (!container || !browserSelection || browserSelection.rangeCount === 0 || browserSelection.isCollapsed) return;

    const range = browserSelection.getRangeAt(0);
    if (!container.contains(range.startContainer) || !container.contains(range.endContainer)) return;

    const beforeRange = document.createRange();
    beforeRange.selectNodeContents(container);
    beforeRange.setEnd(range.startContainer, range.startOffset);
    const start = beforeRange.toString().length;
    const selectedText = range.toString();
    const end = start + selectedText.length;
    if (!selectedText.trim() || start < 0 || end > text.length) return;

    setSelection({
      start,
      end,
      text: selectedText,
      contextBefore: text.slice(Math.max(0, start - 180), start),
      contextAfter: text.slice(end, Math.min(text.length, end + 180)),
    });
    setMessage(null);
    setSent(false);
    browserSelection.removeAllRanges();
  }, [text]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener("pointerup", captureSelection);
    return () => {
      container.removeEventListener("pointerup", captureSelection);
    };
  }, [captureSelection]);

  function submitReport() {
    if (!selection || comment.trim().length < 5) {
      setMessage("Ajoutez un commentaire d’au moins 5 caractères.");
      return;
    }

    setMessage(null);
    startTransition(async () => {
      const result = await createPathologyReport({
        pathologyId,
        sectionKey,
        selectedText: selection.text,
        contextBefore: selection.contextBefore,
        contextAfter: selection.contextAfter,
        comment,
      });
      if (result.success) {
        setSent(true);
        setMessage("Merci, le signalement a été transmis à l’équipe médicale.");
        setComment("");
        return;
      }
      setMessage(result.error ?? "Impossible d’envoyer le signalement.");
    });
  }

  function closeDialog() {
    if (pending) return;
    setDialogOpen(false);
    if (sent) setSelection(null);
  }

  return (
    <div className="relative">
      <p
        className={className ?? "m-0 whitespace-pre-line leading-7 text-slate-600"}
        ref={containerRef}
      >
        {selection ? (
          <>
            {text.slice(0, selection.start)}
            <mark className="rounded bg-amber-200/80 px-0.5 text-inherit">{text.slice(selection.start, selection.end)}</mark>
            {text.slice(selection.end)}
          </>
        ) : text}
      </p>

      {selection && !dialogOpen && (
        <button
          className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900 shadow-sm transition hover:bg-amber-100"
          onClick={() => setDialogOpen(true)}
          type="button"
        >
          <Flag aria-hidden="true" size={14} /> Signaler ce passage
        </button>
      )}

      {dialogOpen && selection && (
        <div aria-labelledby={`report-title-${sectionKey}`} aria-modal="true" className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm" role="dialog">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="m-0 text-xs font-bold uppercase tracking-[0.14em] text-amber-700">Signaler une erreur</p>
                <h2 className="mb-0 mt-2 text-2xl" id={`report-title-${sectionKey}`}>Quel est le problème ?</h2>
              </div>
              <button aria-label="Fermer" className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200" disabled={pending} onClick={closeDialog} type="button"><X size={18} /></button>
            </div>

            <blockquote className="my-5 rounded-2xl border-l-4 border-amber-400 bg-amber-50 p-4 text-sm leading-6 text-slate-700">« {selection.text} »</blockquote>

            {!sent && (
              <label>
                <span className="mb-2 block text-sm font-bold text-slate-800">Ton commentaire</span>
                <textarea
                  className="min-h-32 w-full resize-y rounded-2xl border border-slate-200 p-4 leading-6 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  maxLength={2000}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Expliquez l’erreur ou proposez une correction…"
                  value={comment}
                />
                <span className="mt-1 block text-right text-xs text-slate-400">{comment.length}/2000</span>
              </label>
            )}

            {message && <p aria-live="polite" className={`mt-4 flex items-center gap-2 text-sm font-semibold ${sent ? "text-emerald-700" : "text-rose-700"}`}>{sent && <CheckCircle2 size={17} />}{message}</p>}

            <div className="mt-6 flex justify-end gap-3">
              <Button disabled={pending} onClick={closeDialog} type="button" variant="outline">{sent ? "Fermer" : "Annuler"}</Button>
              {!sent && <Button disabled={pending || comment.trim().length < 5} onClick={submitReport} type="button">{pending ? <LoaderCircle className="animate-spin" size={17} /> : <Flag size={17} />}{pending ? "Envoi…" : "Envoyer"}</Button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
