import type { EcosCriterionDefinition, EcosRule } from "../types.ts";

/** Grid lines that every station shares. Keywords are accent-free prefixes. */
export const presentationCriterion: EcosCriterionDefinition = {
  id: "presentation",
  label: "Se présente et installe l’entretien",
  hint: "Saluer, donner son nom et sa fonction, annoncer le déroulement",
  points: 1,
  groups: [["bonjour", "bonsoir", "je m appelle", "je suis le medecin", "je suis la medecin", "je suis l assistant", "je suis docteur", "je suis le docteur", "je suis la docteure"]],
};

export const communicationCriterion: EcosCriterionDefinition = {
  id: "communication",
  label: "Explique et vérifie la compréhension",
  hint: "Reformuler, expliquer la suite, laisser la place aux questions",
  points: 1,
  groups: [["je comprends", "vous comprenez", "inquiet", "inquiete", "rassur", "expliqu", "avez vous des questions", "des questions", "si je resume", "je resume"]],
};

export const treatmentsCriterion: EcosCriterionDefinition = {
  id: "treatments",
  label: "Vérifie traitements et allergies",
  hint: "Médicaments habituels, automédication et allergies",
  points: 2,
  groups: [
    ["medicament", "traitement habituel", "traitements habituels", "traitement regulier", "quel traitement", "quels traitements", "sous traitement", "avez vous un traitement", "avez vous des traitements", "suivez vous un traitement", "prenez vous", "vous prenez", "ordonnance", "comprime"],
    ["allerg"],
  ],
};

export const ONSET = ["depuis quand", "depuis combien", "depuis", "combien de temps", "il y a combien", "quelle heure", "quand est ce", "quand a", "quand ca", "quand avez", "a quel moment", "commence", "debut", "apparu", "apparition", "comment c est arrive", "que s est il passe", "qu est ce qui s est passe", "racontez"];
export const LOCATION = ["ou avez vous", "ou est ce", "ou ca", "ou exactement", "ou se situe", "ou se trouve", "ou sentez", "ou localis", "localis", "endroit", "montrez moi", "montrer"];
export const CHARACTER = ["type de douleur", "quel type", "quel genre", "decri", "comment est la douleur", "a quoi ressemble", "ressemble", "sensation", "serre", "serrement", "oppress", "pesant", "coup de poignard", "crampe", "comme une brulure", "ca brule"];
export const INTENSITY = ["intensit", "sur 10", "sur dix", "de 0 a 10", "de 1 a 10", "echelle", "combien sur", "a quel point", "tres fort"];
export const RADIATION = ["irrad", "diffuse", "descend", "remonte", "se propage", "ailleurs"];
export const DYSPNEA = ["essouffl", "souffle court", "le souffle", "du souffle", "respirer", "respiration", "respirez", "dyspn", "manquer d air", "manque d air"];
export const NAUSEA = ["nausee", "vomi", "envie de vomir", "mal au coeur"];
export const FEVER = ["fievre", "de la temperature", "frisson", "fievreux", "chaud"];
export const SYNCOPE = ["malaise", "evanoui", "perte de connaissance", "connaissance", "syncope", "tombe", "vertige"];
export const VITALS = ["constante", "parametres vitaux", "parametre", "signes vitaux", "prends la tension", "mesure la tension", "tension arterielle", "pression arterielle", "frequence cardiaque", "pouls", "saturation", "spo2", "sature", "frequence respiratoire", "prends la temperature", "mesure la temperature", "prise de temperature"];
export const LABS = ["prise de sang", "bilan sanguin", "bilan biologique", "biologie", "laboratoire", "labo", "formule sanguine", "fsc", "crp", "ionogramme", "electrolytes", "creatinine", "fonction renale"];

/** Plan announced to the patient: a short, in-character reaction. */
export function planReaction(reply: string, extraKeywords: string[] = []): EcosRule {
  return {
    topic: "réaction au plan",
    low: true,
    keywords: [
      "vous hospitaliser", "vous garder", "rester a l hopital", "on va vous traiter", "nous allons vous traiter", "je vais vous traiter",
      "je vais vous donner", "on va vous donner", "nous allons vous donner", "je vous donne", "je vous prescris", "je vais vous prescrire",
      "je vous propose", "je vais vous expliquer", "voici ce que", "je vais appeler", "vous transferer", "vous mettre sous",
      "on va vous mettre", "nous allons vous mettre", "je vais vous mettre", "on commence", "nous commencons", "je commence", ...extraKeywords,
    ],
    reply,
  };
}
