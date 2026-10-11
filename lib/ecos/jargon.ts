import { hasAnyKeyword, normalizeEcosText } from "./text.ts";

/**
 * Mots médicaux qu'un patient ne comprend pas. `keywords` suit la règle des
 * mots-clés de la grille (début de mot, sans accent, `$` pour un mot entier) ;
 * `plain` est la formulation à employer à la place.
 */
export type JargonTerm = { term: string; keywords: string[]; plain: string };

export const MEDICAL_JARGON: readonly JargonTerm[] = [
  { term: "dyspnée", keywords: ["dyspn"], plain: "essoufflement, du mal à respirer" },
  { term: "irradiation", keywords: ["irradi"], plain: "« Est-ce que la douleur va ailleurs ? »" },
  { term: "céphalées", keywords: ["cephal"], plain: "maux de tête" },
  { term: "syncope", keywords: ["syncop"], plain: "perte de connaissance, s’évanouir" },
  { term: "lipothymie", keywords: ["lipothym"], plain: "impression de tomber dans les pommes" },
  { term: "hémoptysie", keywords: ["hemoptys"], plain: "cracher du sang" },
  { term: "hématémèse", keywords: ["hematemes"], plain: "vomir du sang" },
  { term: "méléna", keywords: ["melena$"], plain: "selles noires" },
  { term: "rectorragies", keywords: ["rectorrag"], plain: "sang dans les selles" },
  { term: "dysurie", keywords: ["dysuri"], plain: "brûlures ou difficultés pour uriner" },
  { term: "pollakiurie", keywords: ["pollakiur"], plain: "uriner souvent" },
  { term: "polyurie", keywords: ["polyur"], plain: "uriner beaucoup" },
  { term: "polydipsie", keywords: ["polydips"], plain: "avoir très soif" },
  { term: "nycturie", keywords: ["nyctur"], plain: "se lever la nuit pour uriner" },
  { term: "hématurie", keywords: ["hematur"], plain: "sang dans les urines" },
  { term: "mictions", keywords: ["miction"], plain: "uriner" },
  { term: "asthénie", keywords: ["asthen"], plain: "fatigue" },
  { term: "anorexie", keywords: ["anorexi"], plain: "perte d’appétit" },
  { term: "photophobie", keywords: ["photophob"], plain: "« La lumière vous gêne-t-elle ? »" },
  { term: "phonophobie", keywords: ["phonophob"], plain: "« Le bruit vous gêne-t-il ? »" },
  { term: "paresthésies", keywords: ["paresthes"], plain: "fourmillements" },
  { term: "diplopie", keywords: ["diplopi"], plain: "voir double" },
  { term: "dysarthrie", keywords: ["dysarthri"], plain: "difficulté à articuler" },
  { term: "aphasie", keywords: ["aphasi"], plain: "difficulté à trouver ou à comprendre les mots" },
  { term: "déficit", keywords: ["deficit"], plain: "faiblesse, ne plus arriver à bouger" },
  { term: "hémiplégie", keywords: ["hemipleg", "hemipares"], plain: "paralysie ou faiblesse d’un côté du corps" },
  { term: "expectorations", keywords: ["expector"], plain: "crachats" },
  { term: "orthopnée", keywords: ["orthopn"], plain: "« Êtes-vous plus essoufflé couché à plat ? »" },
  { term: "polypnée", keywords: ["polypn", "tachypn"], plain: "respirer vite" },
  { term: "cyanose", keywords: ["cyanos"], plain: "lèvres ou doigts bleus" },
  { term: "précordialgie", keywords: ["precordialg"], plain: "douleur dans la poitrine" },
  { term: "rétrosternal", keywords: ["retrostern"], plain: "derrière l’os du milieu de la poitrine" },
  { term: "constrictive", keywords: ["constrict"], plain: "« Est-ce que ça serre ? »" },
  { term: "angor", keywords: ["angor"], plain: "douleur dans la poitrine à l’effort" },
  { term: "tachycardie", keywords: ["tachycard"], plain: "cœur qui bat vite" },
  { term: "épigastre", keywords: ["epigastr"], plain: "le creux de l’estomac" },
  { term: "hypochondre", keywords: ["hypochondr"], plain: "sous les côtes" },
  { term: "fosse iliaque", keywords: ["fosse iliaque"], plain: "le bas du ventre" },
  { term: "dysphagie", keywords: ["dysphag"], plain: "difficulté à avaler" },
  { term: "odynophagie", keywords: ["odynophag"], plain: "douleur en avalant" },
  { term: "pyrosis", keywords: ["pyrosis"], plain: "brûlures qui remontent dans la gorge" },
  { term: "ictère", keywords: ["ictere", "icterique"], plain: "peau ou yeux jaunes" },
  { term: "prurit", keywords: ["prurit"], plain: "démangeaisons" },
  { term: "météorisme", keywords: ["meteoris"], plain: "ventre gonflé" },
  { term: "diurèse", keywords: ["diures"], plain: "quantité d’urine" },
  { term: "fébrile", keywords: ["febrile"], plain: "avoir de la fièvre" },
  { term: "hyperthermie", keywords: ["hypertherm"], plain: "fièvre" },
  { term: "diaphorèse", keywords: ["diaphores"], plain: "transpirer beaucoup" },
  { term: "pétéchies", keywords: ["petechi", "purpura"], plain: "petites taches rouges sur la peau" },
  { term: "membres inférieurs", keywords: ["membres inferieurs", "membre inferieur"], plain: "les jambes" },
  { term: "claudication", keywords: ["claudicat"], plain: "douleur dans les jambes en marchant" },
  { term: "thrombose", keywords: ["thrombos", "tvp$"], plain: "caillot dans une veine" },
  { term: "dyslipidémie", keywords: ["dyslipid"], plain: "cholestérol" },
  { term: "paquets-années", keywords: ["paquets annee", "paquet annee"], plain: "« Combien de cigarettes par jour, et depuis quand ? »" },
  { term: "HTA", keywords: ["hta$"], plain: "hypertension, tension trop haute" },
  { term: "ATCD", keywords: ["atcd$"], plain: "« Avez-vous eu des problèmes de santé ? »" },
  { term: "BPCO", keywords: ["bpco$"], plain: "maladie des bronches liée au tabac" },
  { term: "AINS", keywords: ["ains$"], plain: "anti-inflammatoires comme l’ibuprofène" },
];

/**
 * « Dyspnée, c’est-à-dire… » : le mot est expliqué dans le même message, le
 * patient n'a pas à demander ce qu'il veut dire.
 */
const EXPLANATION = ["c est a dire", "autrement dit", "ca veut dire", "je veux dire", "en d autres termes", "en d autres mots", "en clair", "en gros"];

/** Mots médicaux non expliqués d'un message, dans l'ordre de la liste. */
export function unexplainedJargon(message: string): JargonTerm[] {
  const text = normalizeEcosText(message);
  if (hasAnyKeyword(text, EXPLANATION) || message.includes("(")) return [];
  return MEDICAL_JARGON.filter((entry) => hasAnyKeyword(text, entry.keywords));
}

/** Exemples cités dans la consigne du modèle. */
export const JARGON_EXAMPLES = ["dyspnée", "irradiation", "céphalées", "syncope", "hémoptysie", "asthénie", "HTA"];
