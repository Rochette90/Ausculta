/**
 * Images d'examen tierces (Wikimedia Commons), sous licence libre compatible
 * avec un usage commercial. Pendant la station, seuls l'auteur et la licence
 * s'affichent : le titre d'origine nomme souvent le diagnostic. La liste
 * complète (titre, auteur, source, licence) est dans
 * `lib/legal/third-party-images.ts`, hors du code envoyé à la station. Les ECG sont dessinés par
 * `scripts/generate-ecg.mjs` et n'ont pas de crédit.
 */
export type ImageLicense = "CC0 1.0" | "CC BY-SA 3.0" | "CC BY-SA 4.0";

export const LICENSE_URLS: Readonly<Record<ImageLicense, string>> = {
  "CC0 1.0": "https://creativecommons.org/publicdomain/zero/1.0/deed.fr",
  "CC BY-SA 3.0": "https://creativecommons.org/licenses/by-sa/3.0/deed.fr",
  "CC BY-SA 4.0": "https://creativecommons.org/licenses/by-sa/4.0/deed.fr",
};

export type ImageCredit = { author: string; license: ImageLicense };
