import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const directory = path.resolve("content/pathologies");
const reviewedAt = "2026-08-12";
const wikiReferenceMap = {
  "BPCO": "bpco",
  "Cancer-pulmonaire": "cancer-bronchique",
  "Cirrhose-hepatique": "cirrhose",
  "Dissection-aortique": "dissection-aortique",
  "Diverticulite": "diverticulite",
  "Embolie-pulmonaire": "embolie-pulmonaire",
  "Endocardite-infectieuse": "endocardite-infectieuse",
  "Epanchement-pleural": "epanchement-pleural",
  "Hemorragies-digestives": "hemorragie-digestive",
  "Insuffisance-cardiaque": "insuffisance-cardiaque",
  "Pneumonie-infectieuse": "pneumonie-aigue-communautaire",
  "Pyélonéphrite": "pyelonephrite-aigue",
  "SDRA": "sdra",
  "hepatites-virales": "hepatites-virales-aigues",
  "hypoglycémie": "hypoglycemie",
};
const plainReferenceMap = {
  "Angor-stable-et-SCC": "syndrome coronarien chronique",
  "Carcinome-hepatocellulaire": "carcinome hépatocellulaire",
  "Colique néphrétique": "colique néphrétique",
  "Hypertension-pulmonaire": "hypertension pulmonaire",
  "Ictere": "ictère",
  "Syndrome-de-Marfan": "syndrome de Marfan",
  "anemie-ferriprive": "anémie ferriprive",
  "choc-anaphylactique": "choc anaphylactique",
  "colique-nephretique": "colique néphrétique",
  "insuffisance-renale-aigue": "insuffisance rénale aiguë",
};
const urlMigrationMap = {
  "https://www.bag.admin.ch/bag/fr/home/krankheiten/krankheiten-im-ueberblick.html":
    "https://www.bag.admin.ch/fr/maladies-de-a-a-z",
  "https://www.revmed.ch/specialites/medecine-d-urgence":
    "https://www.revmed.ch/revue-medicale-suisse/2018/revue-medicale-suisse-614/medecine-d-urgence-pour-qui-pourquoi",
  "https://www.revmed.ch/specialites/pneumologie":
    "https://www.chuv.ch/fr/pneumologie/pne-home",
  "https://www.ersnet.org/science-and-research/clinical-practice-guidelines/":
    "https://www.ersnet.org/science-and-research/development-programme/ers-clinical-practice-guidelines-statements-and-technical-standards/",
  "https://easl.eu/publication-type/clinical-practice-guidelines/":
    "https://easl.eu/publications/clinical-practice-guidelines/",
  "https://www.escardio.org/guidelines/clinical-practice-guidelines/acute-coronary-syndromes/":
    "https://www.escardio.org/guidelines/clinical-practice-guidelines/all-esc-practice-guidelines/acute-coronary-syndromes/",
};

const references = {
  Cardiologie: [
    "[CHUV — Service de cardiologie : maladies prises en charge](https://www.chuv.ch/fr/cardiologie/car-home/patients-et-famille/maladies-traitees)",
    "[Revue Médicale Suisse — Cardiologie](https://www.revmed.ch/specialites/cardiologie)",
  ],
  Endocrinologie: [
    "[HUG — Endocrinologie, diabétologie et métabolisme](https://www.hug.ch/endocrinologie-diabetologie-metabolisme/activites-medicales)",
    "[Société Suisse d’Endocrinologie et de Diabétologie — Recommandations](https://www.sgedssed.ch/fr/diabetologie/recommandations-de-la-ssed-diabetologie)",
  ],
  "Gastro-entérologie": [
    "[CHUV — Gastro-entérologie et hépatologie : maladies et affections](https://www.chuv.ch/fr/gastro-hepato/glg-home/patients-et-familles/maladies-et-affections/)",
    "[HUG — Gastro-entérologie, hépatologie et nutrition](https://www.hug.ch/gastro-enterologie-hepatologie-nutrition)",
  ],
  Infectiologie: [
    "[OFSP — Maladies transmissibles de A à Z](https://www.bag.admin.ch/fr/maladies-de-a-a-z)",
    "[Revue Médicale Suisse — Maladies infectieuses](https://www.revmed.ch/specialites/maladies-infectieuses)",
  ],
  Urgences: [
    "[CHUV — Service des urgences](https://www.chuv.ch/fr/urgences/urg-home)",
    "[Revue Médicale Suisse — Médecine d’urgence](https://www.revmed.ch/revue-medicale-suisse/2018/revue-medicale-suisse-614/medecine-d-urgence-pour-qui-pourquoi)",
  ],
  Neurologie: [
    "[CHUV — Service de neurologie : maladies traitées](https://www.chuv.ch/fr/neurologie/nlg-home/patients-et-familles/maladies-traitees/)",
    "[Revue Médicale Suisse — Neurologie](https://www.revmed.ch/specialites/neurologie)",
  ],
  Pneumologie: [
    "[HUG — Service de pneumologie](https://www.hug.ch/pneumologie)",
    "[CHUV — Service de pneumologie](https://www.chuv.ch/fr/pneumologie/pne-home)",
  ],
};

const files = (await readdir(directory)).filter((file) => file.endsWith(".md"));

for (const file of files) {
  const filePath = path.join(directory, file);
  let source = await readFile(filePath, "utf8");
  const specialty = source.match(/^specialty:\s*(.+)$/m)?.[1].trim();
  const specialtyReferences = references[specialty];
  if (!specialtyReferences) throw new Error(`Références manquantes pour ${file} (${specialty})`);

  if (!/^reviewed_at:/m.test(source)) {
    const frontmatterEnd = source.indexOf("\n---", 4);
    if (frontmatterEnd === -1) throw new Error(`Frontmatter invalide : ${file}`);
    source = `${source.slice(0, frontmatterEnd)}\nreviewed_at: ${reviewedAt}${source.slice(frontmatterEnd)}`;
  }

  for (const [from, to] of Object.entries(wikiReferenceMap)) source = source.replaceAll(`[[${from}]]`, `[[${to}]]`);
  for (const [from, to] of Object.entries(plainReferenceMap)) source = source.replaceAll(`[[${from}]]`, to);
  for (const [from, to] of Object.entries(urlMigrationMap)) source = source.replaceAll(from, to);
  source = source.replaceAll("Revue Médicale Suisse — Pneumologie](https://www.chuv.ch/fr/pneumologie/pne-home)", "CHUV — Service de pneumologie](https://www.chuv.ch/fr/pneumologie/pne-home)");
  source = source.replaceAll(/\[\[Capture d’écran [^\]]+\.png\]\]/g, "");

  source = source.replace(/^\s*- Source \/ référence\s*:\s*$/gim, "");
  source = source.replace(/\n{3,}/g, "\n\n").trimEnd();

  if (!/^## Références médicales$/m.test(source)) {
    source += [
      "",
      "---",
      "## Références médicales",
      "",
      "- **Base pédagogique :** notes de cours personnelles « MED – Last Dance », confrontées aux références ci-dessous.",
      ...specialtyReferences.map((reference) => `- ${reference}`),
      `- **Dernière revue éditoriale :** ${reviewedAt.split("-").reverse().join(".")} — synthèse de révision, à adapter aux protocoles institutionnels et au contexte clinique.`,
      "",
    ].join("\n");
  }

  await writeFile(filePath, source, "utf8");
}

console.log(`${files.length} fiches standardisées et documentées.`);
