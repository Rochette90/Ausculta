import type { ImageCredit, ImageLicense } from "../ecos/image-credits.ts";

/**
 * Images tierces affichées pendant les stations, pour les mentions légales :
 * titre d'origine, auteur, source et licence, sans lien avec les stations.
 */
/** Œuvres utilisées, dans l'ordre alphabétique des titres (aucun ordre de station). Images non modifiées, renommées. */
export const THIRD_PARTY_IMAGES: ReadonlyArray<ImageCredit & { title: string; source: string }> = [
  { title: "02-Sigmadivertikulitis CT ax 001 Verdickte Wand.png", author: "Hellerhoff", license: "CC BY-SA 3.0" },
  { title: "04-01-Infiltrat Ausgang.png", author: "Hellerhoff", license: "CC BY-SA 3.0" },
  { title: "10-01-Pneumothorax.png", author: "Hellerhoff", license: "CC BY-SA 3.0" },
  { title: "Basale Subarachnoidalblutung bei Anterioraneurysma 43M - CT axial - 001.jpg", author: "Hellerhoff", license: "CC BY-SA 4.0" },
  { title: "Chest radiograph of a lung with Kerley B lines.jpg", author: "Mikael Häggström", license: "CC0 1.0" },
  { title: "Chest x-ray - posteroanterior view.jpg", author: "O’Dea", license: "CC BY-SA 3.0" },
  { title: "Mediale Schenkelhalsfraktur links 83W - CR ap - 001.jpg", author: "Hellerhoff", license: "CC BY-SA 4.0" },
  { title: "Segond-Fraktur mit Ruptur des vorderen Kreuzbandes 18M - CR ap - 001.jpg", author: "Hellerhoff", license: "CC BY-SA 4.0" },
].map((item) => ({ ...item, license: item.license as ImageLicense, source: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(item.title.replace(/ /g, "_"))}` }));
