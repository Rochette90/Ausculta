export type EcosMessage = {
  role: "patient" | "student" | "system";
  content: string;
};

const criteria = [
  { id: "onset", label: "Caractérise le début", hint: "Début, durée et circonstances", points: 2, matches: [["depuis", "commencé", "début", "apparition"]] },
  {
    id: "pain", label: "Explore la douleur", hint: "Localisation, caractère, intensité, irradiation",
    points: 3,
    matches: [
      ["où", "localis", "endroit"],
      ["type", "sensation", "serrement", "intensité"],
      ["irrad", "bras", "mâchoire"],
    ],
  },
  {
    id: "associated", label: "Recherche les signes associés", hint: "Dyspnée, nausées, sueurs, syncope",
    points: 3,
    matches: [
      ["souffle", "dyspnée", "respir"],
      ["nausée", "vomi"],
      ["sueur", "malaise", "perte de connaissance", "syncope"],
    ],
  },
  {
    id: "risk", label: "Évalue le risque cardiovasculaire", hint: "Tabac, HTA, diabète, antécédents",
    points: 3,
    matches: [
      ["fum", "tabac"],
      ["tension", "hypertension", "diabète", "cholestérol"],
      ["antécédent", "famille", "cardiaque"],
    ],
  },
  { id: "medication", label: "Vérifie traitements et allergies", hint: "Médicaments usuels et allergies", points: 2, matches: [["médicament", "traitement", "allerg"]] },
  { id: "empathy", label: "Adopte une communication empathique", hint: "Écoute, reformulation et réassurance", points: 2, matches: [["comprends", "inquiet", "rassur", "désolé", "ensemble"]] },
  { id: "emergency", label: "Identifie l’urgence", hint: "ECG et prise en charge immédiate", points: 3, matches: [["ecg", "urgence", "ambulance", "monitor", "aspirine"]] },
] as const;

export const ECOS_MAX_SCORE = criteria.reduce((total, item) => total + item.points, 0);

export type EcosCriterion = {
  id: string;
  label: string;
  hint: string;
  points: number;
  earned: number;
};

export function calculateEcosCriteria(messages: EcosMessage[]): EcosCriterion[] {
  const text = messages
    .filter((message) => message.role === "student")
    .map((message) => message.content.toLocaleLowerCase("fr"))
    .join(" ");

  return criteria.map((criterion) => {
    const matchedGroups = criterion.matches.filter((group) =>
      group.some((term) => text.includes(term)),
    ).length;
    const earned = criterion.matches.length === 1 && criterion.points > 1
      ? matchedGroups > 0 ? criterion.points : 0
      : Math.min(criterion.points, matchedGroups);
    return { id: criterion.id, label: criterion.label, hint: criterion.hint, points: criterion.points, earned };
  });
}

export function scoreEcosTranscript(messages: EcosMessage[]) {
  const score = calculateEcosCriteria(messages).reduce((total, criterion) => total + criterion.earned, 0);
  return { score, maxScore: ECOS_MAX_SCORE, xp: Math.max(20, score * 3) };
}

export function calculateActivityReward(activityType: string, score: number) {
  const safeScore = Math.min(100, Math.max(0, Math.round(score)));
  switch (activityType) {
    case "fiche":
      return { score: 100, xp: 10 };
    case "quiz":
      return { score: safeScore, xp: 10 + Math.round(safeScore / 25) * 15 };
    case "diagnostic-flash":
      return { score: safeScore, xp: safeScore >= 100 ? 25 : 15 };
    case "rci":
      return { score: safeScore, xp: safeScore >= 100 ? 45 : 20 };
    case "tutorial":
      return { score: safeScore, xp: safeScore >= 80 ? 20 : 12 };
    default:
      return null;
  }
}
