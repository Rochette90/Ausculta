import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BRAND_NAME } from "../lib/brand.ts";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const vaultRoot = process.argv[2] ?? "/Users/dylandarocha/Desktop/Médecine/MED - Last Dance";
const catalogPath = path.join(projectRoot, "content/pathologies/index.json");
const outputRoot = path.join(projectRoot, "content/pathologies");

const entries = [
  { source: "Chirurgie/Abdomen aigue — Anamnèse ciblée, examen, diagnostics majeurs et conduites.md", slug: "abdomen-aigu", title: "Abdomen aigu", specialty: "Urgences", criticality: "urgent", summary: "Approche structurée d'une douleur abdominale aiguë, de la stabilisation initiale aux diagnostics chirurgicaux à ne pas manquer.", keyPoints: ["Évaluer immédiatement la stabilité hémodynamique et rechercher péritonisme ou choc", "Orienter l'imagerie selon le contexte clinique et le terrain", "Antalgie, jeûne, voie veineuse et avis chirurgical précoce si signes de gravité"] },
  { source: "Pédiatrie/Enfant et brûlure.md", slug: "brulures-aigues", title: "Brûlures aiguës", specialty: "Urgences", criticality: "urgent", summary: "Évaluation initiale d'une brûlure, estimation de l'étendue et recherche des atteintes menaçant immédiatement le pronostic.", keyPoints: ["Commencer par l'approche ABCDE et rechercher une inhalation de fumées", "Estimer profondeur, surface brûlée et localisation", "Refroidir précocement sans provoquer d'hypothermie et organiser l'orientation adaptée"] },
  { source: "Neurologie/Intoxications aiguës (1H).md", slug: "intoxications-aigues", title: "Intoxications aiguës", specialty: "Urgences", criticality: "urgent", summary: "Reconnaissance des toxidromes, stabilisation et prise en charge initiale d'une exposition toxique aiguë.", keyPoints: ["La stabilisation ABCDE précède l'identification précise du toxique", "Associer anamnèse ciblée, examen, ECG et bilan orienté", "Contacter précocement le centre antipoison et discuter antidote ou décontamination"] },
  { source: "Pédiatrie/État de choc.md", slug: "etat-de-choc-approche", title: "État de choc : approche initiale", specialty: "Urgences", criticality: "urgent", summary: "Reconnaître une défaillance circulatoire, identifier son mécanisme et débuter sans délai les mesures de stabilisation.", keyPoints: ["Rechercher hypoperfusion, altération neurologique, oligurie et anomalies cutanées", "Différencier rapidement choc hypovolémique, distributif, cardiogénique et obstructif", "Réévaluer après chaque intervention sur des objectifs cliniques et biologiques"] },

  { source: "Radiologie/Imagerie thoracique.md", slug: "imagerie-thoracique", title: "Imagerie thoracique", specialty: "Radiologie", criticality: "important", summary: "Lecture systématique du cliché thoracique : qualité, compartiments anatomiques et grands syndromes radiologiques.", keyPoints: ["Valider d'abord identité, incidence, rotation, inspiration, pénétration et champ exploré", "Analyser systématiquement paroi, plèvres, parenchyme, hiles et médiastin", "Conclure par une description localisée, une hypothèse et la conduite à tenir"] },
  { source: "Radiologie/Imagerie cérébrale (2H).md", slug: "imagerie-cerebrale", title: "Imagerie cérébrale", specialty: "Radiologie", criticality: "important", summary: "Choix et interprétation initiale de l'imagerie cérébrale dans les situations neurologiques fréquentes et urgentes.", keyPoints: ["Choisir scanner ou IRM selon l'urgence et la question clinique", "Lire de façon symétrique et systématique parenchyme, espaces et structures osseuses", "Rechercher en priorité hémorragie, effet de masse, hydrocéphalie et signes d'ischémie"] },
  { source: "Radiologie/Imagerie abdomen aigu.md", slug: "imagerie-abdomen-aigu", title: "Imagerie de l'abdomen aigu", specialty: "Radiologie", criticality: "urgent", summary: "Stratégie d'imagerie devant un abdomen aigu et sémiologie des principales urgences abdominales.", keyPoints: ["Adapter la modalité à l'âge, au terrain et à l'hypothèse clinique", "Rechercher occlusion, perforation, inflammation, ischémie et saignement", "Interpréter l'image dans son contexte clinique et biologique"] },
  { source: "Radiologie/Produits de contraste — réactions, prévention, reins, gadolinium.md", slug: "produits-de-contraste", title: "Produits de contraste", specialty: "Radiologie", criticality: "important", summary: "Utilisation raisonnée des produits de contraste, réactions aiguës, risque rénal et précautions liées au gadolinium.", keyPoints: ["Vérifier indication, antécédents de réaction, fonction rénale et facteurs de risque", "Reconnaître et traiter rapidement une réaction immédiate", "Choisir produit et protocole en concertation avec la radiologie quand le risque est élevé"] },

  { source: "Nephrologie/Insuffisance Rénale Aiguë (IRA).md", slug: "insuffisance-renale-aigue", title: "Insuffisance rénale aiguë", specialty: "Néphrologie", criticality: "urgent", summary: "Dégradation rapide de la fonction rénale : classification, recherche de cause pré-, intra- ou post-rénale et complications urgentes.", keyPoints: ["Comparer la créatinine au niveau basal et surveiller la diurèse", "Éliminer rapidement une obstruction et rechercher les causes réversibles", "Traiter sans délai hyperkaliémie, surcharge, acidose et complications urémiques"] },
  { source: "Nephrologie/Insuffisance rénale chronique.md", slug: "maladie-renale-chronique", title: "Maladie rénale chronique", specialty: "Néphrologie", criticality: "important", summary: "Altération persistante de la structure ou de la fonction rénale : stadification, complications et ralentissement de la progression.", keyPoints: ["Combiner débit de filtration glomérulaire et albuminurie pour stratifier le risque", "Rechercher et traiter les causes et facteurs de progression", "Anticiper complications cardiovasculaires, anémie, troubles minéraux et suppléance"] },
  { source: "Nephrologie/Glomérulonéphrite.md", slug: "glomerulonephrites", title: "Glomérulonéphrites", specialty: "Néphrologie", criticality: "important", summary: "Atteintes inflammatoires glomérulaires responsables de syndromes néphritiques ou néphrotiques et parfois d'une perte rénale rapide.", keyPoints: ["Reconnaître hématurie glomérulaire, protéinurie, HTA, œdèmes et baisse du DFG", "Le contexte systémique et le bilan immunologique orientent l'étiologie", "Une évolution rapidement progressive impose un avis néphrologique urgent"] },
  { source: "Nephrologie/Lithiase urinaire & colique néphrétique.md", slug: "lithiase-colique-nephretique", title: "Lithiase urinaire et colique néphrétique", specialty: "Néphrologie", criticality: "frequent", summary: "Douleur lombaire aiguë liée à un calcul urinaire, avec recherche systématique d'obstruction compliquée.", keyPoints: ["La colique néphrétique typique est brutale, intense, unilatérale et irradie vers l'aine", "Fièvre, rein unique, anurie ou sepsis obstructif imposent une prise en charge urgente", "Prévention secondaire guidée par analyse du calcul et bilan métabolique"] },
  { source: "Nephrologie/Dialyse chronique.md", slug: "dialyse-chronique", title: "Dialyse chronique", specialty: "Néphrologie", criticality: "important", summary: "Principes, indications, accès et complications de l'hémodialyse et de la dialyse péritonéale au long cours.", keyPoints: ["Préparer la suppléance avant le stade terminal quand cela est possible", "Surveiller accès vasculaire, volémie, électrolytes et complications infectieuses", "Le choix de modalité est partagé et intègre autonomie, comorbidités et projet de vie"] },

  { source: "Hématologie/Hémostase.md", slug: "hemostase", title: "Hémostase", specialty: "Hématologie", criticality: "important", summary: "Physiologie de l'hémostase et interprétation structurée d'un bilan devant saignement ou thrombose.", keyPoints: ["Distinguer hémostase primaire, coagulation et fibrinolyse", "Interpréter plaquettes, TP/INR, aPTT et fibrinogène dans le contexte clinique", "Un saignement actif sévère impose contrôle de la source et correction ciblée"] },
  { source: "Hématologie/Thrombocytopénie et thrombose.md", slug: "thrombocytopenie-et-thrombose", title: "Thrombocytopénie et thrombose", specialty: "Hématologie", criticality: "urgent", summary: "Approche des situations associant baisse plaquettaire et thrombose, dont TIH et microangiopathies thrombotiques.", keyPoints: ["Confirmer la thrombocytopénie et rechercher une pseudo-thrombocytopénie", "L'association thrombose-thrombopénie doit faire évoquer TIH, MAT et CIVD", "Suspendre l'héparine et agir sans attendre si la probabilité de TIH est élevée"] },
  { source: "Hématologie/Anticoagulation.md", slug: "anticoagulation", title: "Anticoagulation", specialty: "Hématologie", criticality: "important", summary: "Choix, surveillance, interactions et gestion péri-procédurale des principaux traitements anticoagulants.", keyPoints: ["L'indication et le risque hémorragique doivent être réévalués régulièrement", "Adapter molécule et dose à la fonction rénale, au poids et aux interactions", "En hémorragie grave, arrêter le traitement et discuter une réversion spécifique urgente"] },
  { source: "Hématologie/Transfusion.md", slug: "transfusion-produits-sanguins", title: "Transfusion de produits sanguins", specialty: "Hématologie", criticality: "urgent", summary: "Indications, vérifications de sécurité et reconnaissance des réactions transfusionnelles.", keyPoints: ["Vérifier identité, compatibilité, indication et consentement avant administration", "Surveiller étroitement le patient au début et pendant la transfusion", "Devant une réaction, arrêter immédiatement, maintenir la voie et alerter le service transfusionnel"] },
  { source: "Hématologie/Groupes sanguins.md", slug: "groupes-sanguins", title: "Groupes sanguins et compatibilité", specialty: "Hématologie", criticality: "important", summary: "Systèmes ABO et Rhésus, compatibilité immuno-hématologique et bases de la sécurité transfusionnelle.", keyPoints: ["Les anticorps naturels du système ABO expliquent le risque d'hémolyse aiguë", "Le contrôle ultime au lit du patient est une barrière de sécurité essentielle", "La prévention de l'allo-immunisation dépend du contexte clinique et obstétrical"] },

  { source: "Oncologie/Cancer du pancréas.md", slug: "cancer-du-pancreas", title: "Cancer du pancréas", specialty: "Oncologie", criticality: "important", summary: "Adénocarcinome pancréatique souvent diagnostiqué tardivement : signes d'alerte, bilan d'extension et principes thérapeutiques.", keyPoints: ["Ictère indolore, amaigrissement et douleur dorsale sont des signes d'alerte", "Le scanner pancréatique évalue résécabilité et extension", "La chirurgie est le seul traitement potentiellement curatif des formes résécables"] },
  { source: "Oncologie/Immunothérapie du cancer.md", slug: "immunotherapie-du-cancer", title: "Immunothérapie du cancer", specialty: "Oncologie", criticality: "important", summary: "Principes des inhibiteurs de checkpoints et reconnaissance des toxicités immuno-induites multisystémiques.", keyPoints: ["Les toxicités peuvent toucher tout organe et survenir tardivement", "Rechercher activement diarrhée, dyspnée, endocrinopathie, hépatite et atteinte neurologique", "Le grade de toxicité guide interruption, corticothérapie et avis spécialisé"] },
  { source: "Oncologie/Pathologie des lymphomes pédiatriques.md", slug: "lymphomes-pediatriques", title: "Lymphomes pédiatriques", specialty: "Oncologie", criticality: "important", summary: "Présentation, bilan diagnostique et particularités des lymphomes de Hodgkin et non hodgkiniens chez l'enfant.", keyPoints: ["Adénopathie persistante, masse médiastinale ou symptômes B nécessitent une évaluation", "Le diagnostic repose sur une biopsie tissulaire adaptée", "Une masse médiastinale peut compliquer anesthésie et voies aériennes"] },
  { source: "Oncologie/Tumeurs pédiatriques - vue générale.md", slug: "tumeurs-pediatriques", title: "Tumeurs pédiatriques : vue générale", specialty: "Oncologie", criticality: "important", summary: "Signes d'appel, démarche diagnostique et principes de prise en charge des cancers de l'enfant.", keyPoints: ["Les signes initiaux sont souvent peu spécifiques mais persistants ou inhabituels", "Éviter les gestes invasifs avant discussion multidisciplinaire lorsqu'une tumeur est suspectée", "Le traitement centralisé combine oncologie, chirurgie, radiothérapie et soins de support"] },

  { source: "Pédiatrie/Développement de l'enfant (2h).md", slug: "developpement-enfant", title: "Développement de l'enfant", specialty: "Pédiatrie", criticality: "frequent", summary: "Repères du développement psychomoteur, surveillance longitudinale et identification précoce des signaux d'alerte.", keyPoints: ["Évaluer motricité globale et fine, langage, cognition et compétences sociales", "Interpréter les acquisitions dans le temps plutôt qu'à partir d'un seul repère", "Une régression développementale est toujours un signal d'alarme"] },
  { source: "Pédiatrie/État fébrile chez l'enfant - approche diagnostique.md", slug: "fievre-enfant", title: "Fièvre chez l'enfant", specialty: "Pédiatrie", criticality: "urgent", summary: "Évaluation du risque et recherche d'infection grave chez l'enfant fébrile selon âge, état général et foyer clinique.", keyPoints: ["L'âge, l'apparence et les signes vitaux priment sur la hauteur isolée de la fièvre", "Rechercher sepsis, méningite, détresse respiratoire et déshydratation", "Le bilan et l'orientation dépendent du groupe d'âge et du niveau de risque"] },
  { source: "Pédiatrie/Convulsions fébriles et épilepsies pédiatriques.md", slug: "convulsions-febriles", title: "Convulsions fébriles", specialty: "Pédiatrie", criticality: "important", summary: "Différencier convulsion fébrile simple, forme complexe et crise nécessitant une exploration urgente.", keyPoints: ["Sécuriser l'enfant, chronométrer la crise et rechercher une mauvaise tolérance", "Caractériser durée, focalité, répétition et récupération", "Rechercher une infection du système nerveux central devant les signes d'alerte"] },
  { source: "Pédiatrie/Obstruction des voies aériennes hautes.md", slug: "obstruction-voies-aeriennes-enfant", title: "Obstruction des voies aériennes hautes chez l'enfant", specialty: "Pédiatrie", criticality: "urgent", summary: "Reconnaissance et prise en charge initiale du stridor et des obstructions hautes pédiatriques.", keyPoints: ["Limiter l'agitation et évaluer stridor, tirage, voix et capacité à s'alimenter", "Différencier laryngite, épiglottite, corps étranger et réaction allergique", "Une obstruction sévère nécessite une équipe experte des voies aériennes sans délai"] },
  { source: "Pédiatrie/Asthme en pédiatrie.md", slug: "asthme-enfant", title: "Asthme de l'enfant", specialty: "Pédiatrie", criticality: "frequent", summary: "Diagnostic, contrôle au long cours et traitement des exacerbations d'asthme chez l'enfant.", keyPoints: ["Le diagnostic associe épisodes compatibles et obstruction bronchique variable", "Évaluer gravité d'une exacerbation avant et après traitement bronchodilatateur", "Technique d'inhalation, plan d'action et observance conditionnent le contrôle"] },

  { source: "Psychiatrie/Troubles anxieux (3H).md", slug: "troubles-anxieux", title: "Troubles anxieux", specialty: "Psychiatrie", criticality: "frequent", summary: "Reconnaissance des principaux troubles anxieux, diagnostics différentiels et principes de prise en charge.", keyPoints: ["Préciser déclencheurs, évitements, retentissement et durée", "Éliminer une cause somatique ou médicamenteuse selon le contexte", "Psychothérapie et mesures hygiéniques constituent des piliers du traitement"] },
  { source: "Psychiatrie/Troubles de l'humeur (3H).md", slug: "troubles-de-humeur", title: "Troubles de l'humeur", specialty: "Psychiatrie", criticality: "important", summary: "Épisodes dépressifs et maniaques : repérage, risque suicidaire et distinction entre troubles unipolaires et bipolaires.", keyPoints: ["Rechercher systématiquement antécédents d'hypomanie ou manie", "Évaluer idées suicidaires, moyens, intention et facteurs protecteurs", "Le diagnostic bipolaire modifie profondément la stratégie thérapeutique"] },
  { source: "Psychiatrie/Troubles psychotiques (2H).md", slug: "troubles-psychotiques", title: "Troubles psychotiques", specialty: "Psychiatrie", criticality: "important", summary: "Approche des hallucinations, idées délirantes et désorganisation, avec exclusion des causes somatiques et toxiques.", keyPoints: ["Décrire précisément symptômes positifs, négatifs, cognitifs et affectifs", "Éliminer delirium, substances et causes neurologiques ou métaboliques", "Évaluer immédiatement danger pour soi ou autrui et capacité de soins"] },
  { source: "Psychiatrie/Suicide.md", slug: "risque-suicidaire", title: "Évaluation du risque suicidaire", specialty: "Psychiatrie", criticality: "urgent", summary: "Entretien direct et structuré pour identifier urgence suicidaire, dangerosité, protection et niveau de soins requis.", keyPoints: ["Questionner directement idées, scénario, accès aux moyens et intention", "Rechercher antécédents, impulsivité, substances, isolement et facteurs protecteurs", "Un risque imminent impose sécurisation, surveillance et évaluation spécialisée urgente"] },
  { source: "Psychiatrie/Troubles de la personnalité (3H).md", slug: "troubles-personnalite", title: "Troubles de la personnalité", specialty: "Psychiatrie", criticality: "frequent", summary: "Modes durables de fonctionnement, retentissement relationnel et principes d'une alliance thérapeutique structurée.", keyPoints: ["Le diagnostic repose sur un fonctionnement stable, ancien et transversal", "Évaluer comorbidités, conduites à risque et risque suicidaire", "Un cadre cohérent et une psychothérapie adaptée sont centraux"] },

  { source: "Rhumatologie/Maladie de Bechterew ou spondylarthrite ankylosante (SA).md", slug: "spondyloarthrite-axiale", title: "Spondyloarthrite axiale", specialty: "Rhumatologie", criticality: "important", summary: "Rhumatisme inflammatoire axial du sujet jeune, associé aux enthésites et manifestations extra-articulaires.", keyPoints: ["La lombalgie inflammatoire s'améliore à l'exercice et réveille en deuxième partie de nuit", "Rechercher uvéite, psoriasis, MICI et antécédents familiaux", "L'IRM sacro-iliaque détecte une inflammation avant les lésions radiographiques"] },
  { source: "Rhumatologie/Maladie de Forestier (DISH).md", slug: "maladie-de-forestier", title: "Maladie de Forestier (DISH)", specialty: "Rhumatologie", criticality: "frequent", summary: "Hyperostose vertébrale diffuse caractérisée par des ossifications ligamentaires et une raideur rachidienne.", keyPoints: ["Le diagnostic est radiographique et doit être distingué d'une spondyloarthrite", "La rigidité rachidienne augmente le risque de fracture après traumatisme", "La prise en charge est surtout symptomatique et fonctionnelle"] },
  { source: "Immuno/Maladies à complexes immuns et lupus érythémateux systémique.md", slug: "lupus-erythemateux-systemique", title: "Lupus érythémateux systémique", specialty: "Rhumatologie", criticality: "important", summary: "Maladie auto-immune systémique aux atteintes cutanées, articulaires, rénales, hématologiques et neurologiques.", keyPoints: ["La présentation est polymorphe et le diagnostic associe clinique et immunologie", "Rechercher systématiquement atteinte rénale, cytopénies et signes neurologiques", "Le traitement dépend de l'organe atteint et de la gravité"] },
  { source: "Immuno/Syndrome sec et Sjogren.md", slug: "syndrome-sjogren", title: "Syndrome de Sjögren", specialty: "Rhumatologie", criticality: "important", summary: "Maladie auto-immune caractérisée par sécheresse oculaire et buccale, avec manifestations systémiques possibles.", keyPoints: ["Objectiver la sécheresse et rechercher médicaments ou autres causes", "Les anticorps anti-SSA et l'évaluation glandulaire orientent le diagnostic", "Surveiller atteintes systémiques et risque lymphoprolifératif"] },
  { source: "Immuno/Phénomène de Raynaud.md", slug: "phenomene-de-raynaud", title: "Phénomène de Raynaud", specialty: "Rhumatologie", criticality: "frequent", summary: "Vasospasme digital déclenché par froid ou émotion, primitif ou révélateur d'une connectivite.", keyPoints: ["Préciser caractère symétrique, âge de début et séquence des changements de couleur", "Douleur, ulcère, asymétrie ou début tardif suggèrent une forme secondaire", "Protection contre le froid et arrêt du tabac sont fondamentaux"] },

  { source: "Dermatologie/Maladies inflammatoires de la peau - Psoriasis.md", slug: "psoriasis", title: "Psoriasis", specialty: "Dermatologie", criticality: "frequent", summary: "Dermatose inflammatoire chronique en plaques, associée à un risque articulaire et cardiométabolique.", keyPoints: ["Plaques érythémato-squameuses bien limitées sur sites d'extension et cuir chevelu", "Rechercher atteinte unguéale, rhumatisme psoriasique et comorbidités", "Le traitement dépend de l'étendue, des localisations et du retentissement"] },
  { source: "Immuno/Urticaire.md", slug: "urticaire", title: "Urticaire", specialty: "Dermatologie", criticality: "important", summary: "Papules prurigineuses fugaces avec ou sans angio-œdème, à distinguer immédiatement de l'anaphylaxie.", keyPoints: ["Chaque lésion d'urticaire disparaît habituellement en moins de 24 heures", "Rechercher atteinte respiratoire, cardiovasculaire ou digestive évoquant une anaphylaxie", "Une urticaire chronique est rarement expliquée par une allergie alimentaire simple"] },
  { source: "Pédiatrie/Dermatoses pédiatriques fréquentes.md", slug: "dermatoses-pediatriques", title: "Dermatoses pédiatriques fréquentes", specialty: "Dermatologie", criticality: "frequent", summary: "Reconnaissance des éruptions fréquentes de l'enfant et repérage des signes cutanés nécessitant une évaluation urgente.", keyPoints: ["Décrire lésion élémentaire, distribution, chronologie et symptômes associés", "Fièvre, purpura non blanchissant, bulles ou décollement sont des signaux d'alarme", "L'âge et le contexte infectieux, atopique ou médicamenteux orientent le diagnostic"] },
];

function quoteYaml(value) {
  return JSON.stringify(value);
}

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

  const normalizedTitle = title.toLocaleLowerCase("fr");
  const firstHeading = body.match(/^##\s+(.+)$/m);
  if (firstHeading?.[1].trim().toLocaleLowerCase("fr") === normalizedTitle) {
    body = body.replace(firstHeading[0], "").trimStart();
  }
  return body;
}

const currentCatalog = JSON.parse(await readFile(catalogPath, "utf8"));
const importedSlugs = new Set(entries.map((entry) => entry.slug));
const nextCatalog = currentCatalog.filter((entry) => !importedSlugs.has(entry.slug));

for (const entry of entries) {
  const sourcePath = path.join(vaultRoot, entry.source);
  const source = await readFile(sourcePath, "utf8");
  const content = `---
slug: ${entry.slug}
title: ${quoteYaml(entry.title)}
specialty: ${quoteYaml(entry.specialty)}
criticality: ${entry.criticality}
tags:
  - import-vault
  - a-reviser
resume: ${quoteYaml(entry.summary)}
review_status: needs_review
source_vault: ${quoteYaml(entry.source)}
imported_at: 2026-08-12
---

> [!warning] Statut éditorial
> **À réviser.** Cette fiche a été adaptée depuis le vault pédagogique MED - Last Dance. Elle doit être relue, corrigée si nécessaire puis signée nominativement dans ${BRAND_NAME} avant d'être considérée comme révisée.

---

${normalizeVaultMarkdown(source, entry.title)}

---

## Provenance pédagogique

- Source interne : \`${entry.source}\` dans le vault MED - Last Dance
- Import ${BRAND_NAME} : 12 août 2026
- Statut : **À réviser — non signée**
`;

  await writeFile(path.join(outputRoot, `${entry.slug}.md`), content, "utf8");
  nextCatalog.push({
    slug: entry.slug,
    title: entry.title,
    specialty: entry.specialty,
    criticality: entry.criticality,
    summary: entry.summary,
    keyPoints: entry.keyPoints,
    status: "ready",
  });
}

nextCatalog.sort((first, second) =>
  first.specialty.localeCompare(second.specialty, "fr-CH") || first.title.localeCompare(second.title, "fr-CH"),
);
await writeFile(catalogPath, `${JSON.stringify(nextCatalog, null, 2)}\n`, "utf8");

console.log(`Imported ${entries.length} vault notes. Catalog now contains ${nextCatalog.length} pathologies.`);
