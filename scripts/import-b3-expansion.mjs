import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BRAND_NAME } from "../lib/brand.ts";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const vaultRoot = process.argv[2] ?? "/Users/dylandarocha/Desktop/Médecine/MED - Last Dance";
const catalogPath = path.join(projectRoot, "content/pathologies/index.json");
const outputRoot = path.join(projectRoot, "content/pathologies");
const importedAt = "2026-08-21";

const entries = [
  { source: "Nouvelles fiches/À relire/Cholestase.md", slug: "cholestase", title: "Cholestase", specialty: "Gastro-entérologie", criticality: "important", summary: "Approche clinique et biologique d'une cholestase, de l'ictère à l'identification d'un obstacle biliaire ou d'une cause intra-hépatique.", keyPoints: ["Confirmer le profil cholestatique et rechercher les signes de gravité", "Distinguer une cause extra-hépatique d'une atteinte intra-hépatique", "L'échographie hépatobiliaire est l'imagerie initiale habituelle"] },
  { source: "Nouvelles fiches/À relire/Cholangite-angiocholite.md", slug: "cholangite-aigue", title: "Cholangite aiguë", specialty: "Gastro-entérologie", criticality: "urgent", summary: "Infection aiguë des voies biliaires sur obstacle, associant syndrome infectieux et cholestase avec risque de sepsis.", keyPoints: ["Reconnaître fièvre, douleur de l'hypochondre droit et ictère", "Évaluer immédiatement sepsis et défaillances d'organe", "Antibiothérapie et drainage biliaire urgent structurent la prise en charge"] },
  { source: "Nouvelles fiches/À relire/Cystite aiguë.md", slug: "cystite-aigue", title: "Cystite aiguë", specialty: "Néphrologie", criticality: "frequent", summary: "Infection urinaire basse fréquente : symptômes typiques, situations compliquées et stratégie diagnostique raisonnée.", keyPoints: ["Rechercher dysurie, pollakiurie et urgenturie sans signe systémique", "Fièvre ou douleur lombaire font évoquer une atteinte haute", "Adapter les examens et le traitement au terrain et au risque de complication"] },
  { source: "Nouvelles fiches/À relire/Prostatite aiguë.md", slug: "prostatite-aigue", title: "Prostatite aiguë", specialty: "Néphrologie", criticality: "important", summary: "Infection bactérienne aiguë de la prostate, souvent fébrile, pouvant se compliquer de rétention ou de sepsis.", keyPoints: ["Associer symptômes urinaires, douleur pelvienne et syndrome infectieux", "Éviter le massage prostatique en phase aiguë", "Rechercher rétention, abcès et sepsis selon la présentation"] },
  { source: "Nouvelles fiches/À relire/Hypertrophie-benigne-de-la-prostate-HBP.md", slug: "hypertrophie-benigne-prostate", title: "Hyperplasie bénigne de la prostate", specialty: "Néphrologie", criticality: "frequent", summary: "Cause fréquente de symptômes urinaires du bas appareil chez l'homme vieillissant, à évaluer selon la gêne et les complications.", keyPoints: ["Distinguer symptômes de stockage et de vidange", "Rechercher rétention, infections, hématurie et retentissement rénal", "La stratégie dépend du retentissement, du volume prostatique et des préférences"] },
  { source: "Nouvelles fiches/À relire/Syndrome-nephrotique.md", slug: "syndrome-nephrotique", title: "Syndrome néphrotique", specialty: "Néphrologie", criticality: "important", summary: "Protéinurie importante, hypoalbuminémie et œdèmes exposant à des complications thrombotiques, infectieuses et métaboliques.", keyPoints: ["Quantifier la protéinurie et confirmer l'hypoalbuminémie", "Rechercher une cause primitive ou secondaire", "Prévenir et reconnaître thrombose, infection et insuffisance rénale"] },
  { source: "Nouvelles fiches/À relire/Polykystose-renale.md", slug: "maladie-polykystique-renale", title: "Maladie polykystique rénale", specialty: "Néphrologie", criticality: "important", summary: "Maladie génétique kystique rénale, cause fréquente d'insuffisance rénale chronique familiale avec manifestations extrarénales.", keyPoints: ["Rechercher une histoire familiale et mesurer le retentissement rénal", "Contrôler étroitement la pression artérielle et les facteurs de progression", "Connaître les principales manifestations extrarénales et complications kystiques"] },
  { source: "Nephrologie/Néphropathie diabétique.md", slug: "nephropathie-diabetique", title: "Néphropathie diabétique", specialty: "Néphrologie", criticality: "important", summary: "Atteinte rénale chronique du diabète, dépistée par l'albuminurie et le débit de filtration glomérulaire.", keyPoints: ["Dépister régulièrement albuminurie et baisse du DFG", "Optimiser contrôle glycémique, tensionnel et protection cardiovasculaire", "Évoquer une autre néphropathie devant une présentation atypique"] },

  { source: "Immuno/Hypersensibilité et immunopathologie.md", slug: "hypersensibilite-immunopathologie", title: "Hypersensibilités et immunopathologie", specialty: "Rhumatologie", criticality: "important", summary: "Mécanismes des quatre types d'hypersensibilité et traduction clinique des réponses immunitaires pathologiques.", keyPoints: ["Relier le mécanisme immunitaire à la chronologie clinique", "Distinguer réponses médiées par anticorps, complexes immuns et lymphocytes T", "Le mécanisme guide les examens et le traitement"] },
  { source: "Nouvelles fiches/À relire/Allergie-et-anaphylaxie.md", slug: "allergie-anaphylaxie", title: "Allergie et anaphylaxie", specialty: "Rhumatologie", criticality: "urgent", summary: "Reconnaissance d'une réaction allergique systémique et traitement immédiat de l'anaphylaxie.", keyPoints: ["Reconnaître rapidement atteinte respiratoire ou cardiovasculaire", "L'adrénaline intramusculaire est le traitement de première intention", "Observer, documenter le déclencheur et organiser la prévention secondaire"] },
  { source: "Immuno/Immunodéficiences primaires de l’adulte.md", slug: "immunodeficiences-primaires-adulte", title: "Immunodéficiences primaires de l'adulte", specialty: "Rhumatologie", criticality: "important", summary: "Déficits immunitaires révélés à l'âge adulte par des infections inhabituelles, répétées ou sévères et parfois une auto-immunité.", keyPoints: ["Repérer fréquence, sévérité, germes et localisations inhabituelles", "Éliminer d'abord les causes secondaires d'immunodépression", "Orienter le bilan selon le compartiment immunitaire suspecté"] },
  { source: "Immuno/Maladies auto-inflammatoires.md", slug: "maladies-auto-inflammatoires", title: "Maladies auto-inflammatoires", specialty: "Rhumatologie", criticality: "important", summary: "Syndromes d'inflammation récurrente liés à l'immunité innée, souvent sans auto-anticorps spécifiques.", keyPoints: ["Caractériser la périodicité de la fièvre et des poussées inflammatoires", "Distinguer auto-inflammation, infection, malignité et auto-immunité", "Le phénotype clinique et familial oriente les analyses génétiques"] },
  { source: "Immuno/Sarcoidose et maladie à IgG4.md", slug: "sarcoidose-maladie-igg4", title: "Sarcoïdose et maladie liée aux IgG4", specialty: "Rhumatologie", criticality: "important", summary: "Deux maladies systémiques inflammatoires pouvant atteindre plusieurs organes et mimer infection ou néoplasie.", keyPoints: ["Cartographier les atteintes d'organes et rechercher les diagnostics alternatifs", "La confirmation repose souvent sur l'analyse histologique d'un site adapté", "Évaluer la gravité fonctionnelle avant de décider d'un traitement"] },
  { source: "Nouvelles fiches/À relire/Vasculites.md", slug: "vasculites-systemiques", title: "Vasculites systémiques", specialty: "Rhumatologie", criticality: "important", summary: "Inflammation de la paroi vasculaire, classée selon le calibre atteint et responsable d'atteintes d'organes multiples.", keyPoints: ["Rechercher une combinaison de signes cutanés, rénaux, pulmonaires et neurologiques", "Identifier rapidement les atteintes menaçant un organe", "Biologie, imagerie et biopsie sont orientées par le vaisseau et l'organe suspects"] },
  { source: "Immuno/Principes de la vaccination.md", slug: "principes-vaccination", title: "Principes de la vaccination", specialty: "Infectiologie", criticality: "frequent", summary: "Bases immunologiques, types de vaccins, contre-indications et raisonnement autour d'un calendrier vaccinal.", keyPoints: ["Distinguer vaccins vivants atténués et vaccins non vivants", "Vérifier âge, terrain, immunosuppression et antécédents avant vaccination", "Un retard vaccinal conduit le plus souvent à un rattrapage sans recommencer le schéma"] },
  { source: "Immuno/Inflammation de type 2.md", slug: "inflammation-type-2", title: "Inflammation de type 2", specialty: "Rhumatologie", criticality: "important", summary: "Réponse immunitaire impliquant notamment cytokines de type 2, IgE et éosinophiles dans plusieurs maladies allergiques.", keyPoints: ["Relier voies immunitaires et phénotypes asthme, dermatite ou polypose", "Identifier les biomarqueurs utilisables dans le contexte clinique", "Les biothérapies ciblent des étapes différentes de cette cascade"] },

  { source: "Pédiatrie/Croissance et déficit en GH.md", slug: "croissance-deficit-gh", title: "Croissance et déficit en hormone de croissance", specialty: "Pédiatrie", criticality: "important", summary: "Évaluation longitudinale de la croissance staturale et démarche devant un ralentissement ou une petite taille.", keyPoints: ["Reporter taille, poids et vitesse de croissance sur les courbes adaptées", "Comparer la trajectoire à la taille cible familiale", "Un ralentissement statural persistant impose une démarche étiologique structurée"] },
  { source: "Pédiatrie/Troubles du développement pubertaire.md", slug: "troubles-developpement-pubertaire", title: "Troubles du développement pubertaire", specialty: "Pédiatrie", criticality: "important", summary: "Puberté précoce ou retardée : repères cliniques, retentissement sur la croissance et orientation diagnostique.", keyPoints: ["Évaluer le stade pubertaire et la vitesse de progression", "Interpréter âge osseux, croissance et signes neurologiques associés", "Distinguer variations constitutionnelles et causes organiques"] },
  { source: "Pédiatrie/Alimentation du nouveau-né et de l'enfant.md", slug: "alimentation-nouveau-ne-enfant", title: "Alimentation du nouveau-né et de l'enfant", specialty: "Pédiatrie", criticality: "frequent", summary: "Principes de l'alimentation du nourrisson, diversification et repérage des difficultés nutritionnelles.", keyPoints: ["Suivre croissance et apports dans une perspective longitudinale", "Adapter les conseils à l'âge, au développement et au contexte familial", "Rechercher des signes d'alarme devant difficultés alimentaires ou cassure pondérale"] },
  { source: "Pédiatrie/Dépistage chez le nouveau-né (1H).md", slug: "depistage-nouveau-ne", title: "Dépistage chez le nouveau-né", specialty: "Pédiatrie", criticality: "important", summary: "Dépistages néonataux systématiques et examen clinique permettant d'identifier précocement des maladies traitables.", keyPoints: ["Connaître le calendrier des principaux dépistages néonataux", "Vérifier la réalisation et la traçabilité avant la sortie", "Un résultat anormal doit déclencher confirmation et prise en charge sans délai"] },
  { source: "Pédiatrie/Obésité pédiatrique.md", slug: "obesite-pediatrique", title: "Obésité pédiatrique", specialty: "Pédiatrie", criticality: "frequent", summary: "Excès d'adiposité chez l'enfant, évalué sur les courbes d'IMC et pris en charge avec la famille sans stigmatisation.", keyPoints: ["Analyser trajectoire d'IMC, vitesse de croissance et contexte familial", "Rechercher comorbidités métaboliques, respiratoires et psychosociales", "La prise en charge est multidisciplinaire, progressive et centrée sur des habitudes durables"] },
  { source: "Pédiatrie/Infection urinaire chez l'enfant.md", slug: "infection-urinaire-enfant", title: "Infection urinaire chez l'enfant", specialty: "Pédiatrie", criticality: "important", summary: "Diagnostic et prise en charge d'une infection urinaire pédiatrique selon l'âge, la présentation et le risque d'anomalie urologique.", keyPoints: ["Obtenir un prélèvement urinaire fiable avant l'antibiothérapie si possible", "Fièvre sans foyer du nourrisson doit faire évoquer une infection urinaire", "L'indication d'imagerie dépend de l'âge, de l'évolution et du caractère atypique"] },
  { source: "Pédiatrie/Diarrhées aiguës et chroniques.md", slug: "diarrhees-enfant", title: "Diarrhées aiguës et chroniques chez l'enfant", specialty: "Pédiatrie", criticality: "important", summary: "Approche des diarrhées pédiatriques avec évaluation de la déshydratation, de la durée et des signes d'alarme.", keyPoints: ["Évaluer d'abord hydratation, perfusion et tolérance orale", "Distinguer diarrhée aiguë infectieuse et diarrhée chronique", "Sang, cassure pondérale, douleur importante ou terrain fragile imposent une évaluation ciblée"] },
  { source: "Pédiatrie/Vomissements aigus et chroniques.md", slug: "vomissements-enfant", title: "Vomissements aigus et chroniques chez l'enfant", specialty: "Pédiatrie", criticality: "important", summary: "Raisonnement devant des vomissements de l'enfant selon l'âge, la chronicité et les signes digestifs ou neurologiques associés.", keyPoints: ["Des vomissements bilieux sont une urgence jusqu'à preuve du contraire", "Rechercher déshydratation, douleur, distension et signes neurologiques", "L'âge et la trajectoire pondérale orientent fortement le diagnostic"] },
  { source: "Nouvelles fiches/À relire/Bronchiolite.md", slug: "bronchiolite", title: "Bronchiolite du nourrisson", specialty: "Pédiatrie", criticality: "important", summary: "Infection virale des petites voies aériennes du nourrisson, évaluée sur la respiration, l'oxygénation et l'alimentation.", keyPoints: ["Évaluer fréquence respiratoire, tirage, oxygénation et prise alimentaire", "Le traitement est principalement symptomatique et de support", "Le jeune âge, les apnées et les comorbidités augmentent le risque de forme sévère"] },
  { source: "Pédiatrie/Immunodéficiences primaires chez l'enfant.md", slug: "immunodeficiences-primaires-enfant", title: "Immunodéficiences primaires chez l'enfant", specialty: "Pédiatrie", criticality: "important", summary: "Déficits immunitaires pédiatriques à évoquer devant infections répétées, sévères ou inhabituelles et cassure staturo-pondérale.", keyPoints: ["Évaluer type d'infection, germes, localisation et réponse aux traitements", "Rechercher manifestations auto-immunes, inflammatoires et histoire familiale", "Un déficit sévère suspecté nécessite des précautions vaccinales et un avis spécialisé rapide"] },
];

function normalizeVaultMarkdown(markdown, title) {
  let body = markdown.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, "");
  body = body
    .replace(/!\[\[[^\]]+\]\]/g, "")
    .replace(/^#\S.*$/gm, "")
    .replace(/^#\s+(.+)$/gm, "## $1")
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
  const firstHeading = body.match(/^##\s+(.+)$/m);
  if (firstHeading?.[1].trim().toLocaleLowerCase("fr") === title.toLocaleLowerCase("fr")) body = body.replace(firstHeading[0], "").trimStart();
  return body;
}

const currentCatalog = JSON.parse(await readFile(catalogPath, "utf8"));
const importedSlugs = new Set(entries.map((entry) => entry.slug));
const nextCatalog = currentCatalog.filter((entry) => !importedSlugs.has(entry.slug));

for (const entry of entries) {
  const source = await readFile(path.join(vaultRoot, entry.source), "utf8");
  const content = `---
slug: ${entry.slug}
title: ${JSON.stringify(entry.title)}
specialty: ${JSON.stringify(entry.specialty)}
criticality: ${entry.criticality}
tags:
  - import-vault
  - bachelor-3-lausanne
  - a-reviser
resume: ${JSON.stringify(entry.summary)}
review_status: needs_review
source_vault: ${JSON.stringify(entry.source)}
imported_at: ${importedAt}
---

> [!warning] Statut éditorial
> **À réviser.** Cette fiche provient du vault pédagogique MED - Last Dance. Elle doit être relue, corrigée si nécessaire puis signée nominativement dans ${BRAND_NAME} avant d'être considérée comme révisée.

---

${normalizeVaultMarkdown(source, entry.title)}

---

## Provenance pédagogique

- Source interne : \`${entry.source}\` dans le vault MED - Last Dance
- Import ${BRAND_NAME} : 21 août 2026
- Statut : **À réviser — non signée**
`;
  await writeFile(path.join(outputRoot, `${entry.slug}.md`), content, "utf8");
  nextCatalog.push({ ...entry, status: "ready" });
}

nextCatalog.sort((first, second) => first.specialty.localeCompare(second.specialty, "fr-CH") || first.title.localeCompare(second.title, "fr-CH"));
const catalogEntries = nextCatalog.map((entry) => Object.fromEntries(Object.entries(entry).filter(([key]) => key !== "source")));
await writeFile(catalogPath, `${JSON.stringify(catalogEntries, null, 2)}\n`, "utf8");
console.log(`Imported ${entries.length} B3 notes. Catalog now contains ${nextCatalog.length} pathologies.`);
