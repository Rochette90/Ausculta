import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { ECOS_SCENARIOS, ecosPublicCode } from "../lib/ecos/stations/index.ts";

/**
 * Exporte une note Obsidian éditable par station ECOS dans le vault projet :
 *   node scripts/export-station-notes.mjs <vault> [--force]   (vault projet : ../<nom>)
 * Une note existante n'est jamais écrasée sans --force : elle peut contenir
 * des corrections de l'auteur qui ne sont pas encore reportées dans le code.
 */
const [vault, flag] = process.argv.slice(2);
if (!vault) throw new Error("Usage: node scripts/export-station-notes.mjs <vault> [--force]");
const force = flag === "--force";
const folder = path.join(path.resolve(vault), "05 Contenu", "Stations ECOS");
await mkdir(folder, { recursive: true });

const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Zurich" }).format(new Date());
const SETTINGS = { urgences: "Urgences", cabinet: "Cabinet" };
const CATEGORIES = { constantes: "Constantes", examen: "Examen", complementaire: "Complémentaire" };
const HISTORY_LABELS = {
  identity: "Identité", occupation: "Profession", living: "Mode de vie", feeling: "Ressenti",
  previousEpisodes: "Épisodes antérieurs", course: "Évolution", otherSymptoms: "Autres symptômes",
  medications: "Médicaments", allergies: "Allergies", personalHistory: "Antécédents personnels",
  familyHistory: "Antécédents familiaux", tobacco: "Tabac", alcohol: "Alcool", drugs: "Drogues",
  concerns: "Inquiétudes",
};
const cell = (text) => String(text).replaceAll("|", "\\|").replaceAll("\n", " ");
const list = (items) => items.map((item) => `- ${item}`).join("\n");

function note(scenario, code) {
  const { patient, debrief } = scenario;
  const rules = scenario.rules.map((rule) =>
    `| ${cell(rule.topic)}${rule.examiner ? " *(examinateur)*" : ""} | ${cell(rule.keywords.join(", "))} | ${cell(rule.reply)} |`);
  const exam = scenario.examination.map((item) =>
    `| ${cell(item.label)} | ${CATEGORIES[item.category]} | ${item.pertinent ? "oui" : "non"} | ${cell(item.result ?? `→ règle « ${item.topic} »`)} |`);
  const criteria = scenario.criteria.map((criterion) =>
    `| ${cell(criterion.label)} | ${criterion.points} | ${cell(criterion.hint)} |`);
  return `---
type: station
titre: ${code} — ${debrief.diagnosis.split(" (")[0]}
code: ${code}
slug: ${scenario.slug}
fichier: lib/ecos/stations/${scenario.slug}.ts
statut: à réviser
updated: ${today}
tags:
  - ecos
  - station
---

# ${code} — ${scenario.diagnosisChoice.correct}

> [!info] Source éditoriale de la station
> Cette note décrit la station telle qu'elle est codée dans \`lib/ecos/stations/${scenario.slug}.ts\`.
> Modifie-la librement (réponses, critères, débriefing) et note tes demandes dans **Retours de l'auteur** :
> l'agent relit cette note avant tout travail sur la station et reporte les changements dans le code
> (voir [[00 - Protocole agents]] et [[ECOS - Stations]]).

## Retours de l'auteur

- *(Écris ici ce qui doit changer : réponse fausse, critère trop strict, piège à ajouter…)*

## Cadre

- **Lieu** : ${SETTINGS[scenario.setting]}
- **Patient** : ${patient.name}, ${patient.age} ans (${patient.sex})${scenario.proxy ? ` — un proche répond (voix ${scenario.voiceSex})` : ""}
- **Douleur** : ${scenario.painful ? "oui" : "non"}
- **Persona** : ${scenario.persona}

### Consigne au candidat

${list(scenario.brief)}

### Phrase d'ouverture

> ${scenario.opening}

## Anamnèse de base

| Rubrique | Réponse |
|---|---|
${Object.entries(scenario.history).map(([key, value]) => `| ${HISTORY_LABELS[key] ?? key} | ${cell(value)} |`).join("\n")}

## Réponses ciblées

Mots-clés sans accents ; \`$\` en fin de mot = mot entier.

| Thème | Mots-clés | Réponse |
|---|---|---|
${rules.join("\n")}

## Examen et examens complémentaires

| Geste | Catégorie | Pertinent | Résultat |
|---|---|---|---|
${exam.join("\n")}

## Diagnostic

- **Correct** : ${scenario.diagnosisChoice.correct}
- **Distracteurs** : ${scenario.diagnosisChoice.distractors.join(" · ")}

## Grille (${scenario.criteria.reduce((sum, criterion) => sum + criterion.points, 0)} points + 2 diagnostic)

| Critère | Points | Attendu |
|---|---|---|
${criteria.join("\n")}

## Débriefing

**${debrief.diagnosis}**

${debrief.summary}

### Éléments clés
${list(debrief.keyFindings)}

### Drapeaux rouges
${list(debrief.redFlags)}

### Prise en charge
${list(debrief.management)}

### Diagnostics différentiels
${list(debrief.differentials)}
${debrief.examReading ? `
### Lecture attendue des examens (étape Analyse)
${list(debrief.examReading)}
` : ""}
### Sources
${debrief.sources.map((source) => `- [${source.label}](${source.url})`).join("\n")}

### Fiches liées
${list(debrief.pathologySlugs.map((slug) => `\`${slug}\``))}
`;
}

let written = 0;
for (const scenario of ECOS_SCENARIOS) {
  const code = ecosPublicCode(scenario.slug);
  const file = path.join(folder, `${code} ${scenario.slug}.md`);
  const exists = await access(file).then(() => true, () => false);
  if (exists && !force) {
    console.log(`kept ${path.basename(file)}`);
    continue;
  }
  await writeFile(file, note(scenario, code));
  written += 1;
}
console.log(JSON.stringify({ folder, written, total: ECOS_SCENARIOS.length }));
