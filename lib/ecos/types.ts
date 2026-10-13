export type EcosMessageRole = "patient" | "student" | "system";

export type EcosMessage = {
  role: EcosMessageRole;
  content: string;
};

/**
 * One line of the evaluation grid. Each keyword group is one observable
 * behaviour; a group counts when any of its keywords starts a word of the
 * student's messages (accents and case ignored).
 */
export type EcosCriterionDefinition = {
  id: string;
  label: string;
  hint: string;
  points: number;
  groups: string[][];
};

export type EcosCriterion = {
  id: string;
  label: string;
  hint: string;
  points: number;
  earned: number;
  /** Points accordés à la relecture par le modèle (question posée autrement). */
  reviewed?: number;
};

export type EcosProcedureCategory = "constantes" | "examen" | "complementaire";

/**
 * A gesture or test offered during the clinical-exam phase. Choosing it
 * unlocks its result. `pertinent` gestures are expected by the examiner; the
 * others are plausible but do not help (they cost time in exam mode).
 */
export type EcosProcedure = {
  id: string;
  label: string;
  category: EcosProcedureCategory;
  pertinent: boolean;
  /** Result text; defaults to the reply of the examiner rule with this topic. */
  result?: string;
  topic?: string;
};

/** Final question of the station: the correct diagnosis and three distractors. */
export type EcosDiagnosisChoice = { correct: string; distractors: string[] };

export type EcosMode = "training" | "exam";

export type EcosSource = { label: string; url: string };

export type EcosDebrief = {
  diagnosis: string;
  summary: string;
  keyFindings: string[];
  redFlags: string[];
  management: string[];
  differentials: string[];
  /** Lecture attendue des examens complémentaires (stations avec une étape « Analyse »). */
  examReading?: string[];
  sources: EcosSource[];
  pathologySlugs: string[];
};

/** A scripted answer. `examiner` answers describe an exam or a result. */
export type EcosRule = {
  topic: string;
  keywords: string[];
  reply: string;
  examiner?: boolean;
  /** Only used when no other station rule matches (e.g. reactions to the plan). */
  low?: boolean;
};

/** Answers every station must give, in the patient's own words. */
export type EcosHistory = {
  identity: string;
  occupation: string;
  /** Vie quotidienne : logement, entourage, autonomie. */
  living: string;
  /** Réponse à « Comment vous sentez-vous ? ». */
  feeling: string;
  /** Réponse à « Ça vous est déjà arrivé ? ». */
  previousEpisodes: string;
  /** Réponse à « Comment ça a évolué ? ». */
  course: string;
  /**
   * Réponse à une question ouverte (« Avez-vous d'autres symptômes ? ») :
   * un seul élément, le plus gênant. Le reste n'est dit que sur question précise.
   */
  otherSymptoms: string;
  medications: string;
  allergies: string;
  personalHistory: string;
  familyHistory: string;
  tobacco: string;
  alcohol: string;
  drugs: string;
  concerns: string;
};

export type EcosSetting = "urgences" | "cabinet";

export type EcosScenario = {
  slug: string;
  version: number;
  setting: EcosSetting;
  patient: { name: string; age: number; sex: "F" | "M" };
  /** A relative answers for the patient (e.g. aphasia). */
  proxy?: boolean;
  /** Sex of the speaking voice when it is not the patient's (the relative who answers). */
  voiceSex?: "F" | "M";
  /** The complaint is a pain: unscripted pain questions are not denied outright. */
  painful?: boolean;
  /** Tone and behaviour of the simulated patient. */
  persona: string;
  /** Lines of the candidate instructions shown before the station. */
  brief: string[];
  opening: string;
  history: EcosHistory;
  /** Presenting complaint, pertinent negatives, exam findings and results. */
  rules: EcosRule[];
  /** Clinical-exam phase: gestures and tests the student can choose. */
  examination: EcosProcedure[];
  diagnosisChoice: EcosDiagnosisChoice;
  criteria: EcosCriterionDefinition[];
  debrief: EcosDebrief;
};

/** What the browser receives before the station: no facts, no diagnosis. */
export type EcosStationView = {
  /** Neutral public code (`station-04`), never the slug that names the diagnosis. */
  code: string;
  candidateTitle: string;
  specialty: string | null;
  patientLabel: string;
  setting: EcosSetting;
  brief: string[];
  /** Gestures offered in the exam phase: labels only, never results or relevance. */
  procedures: Array<Pick<EcosProcedure, "id" | "label" | "category">>;
  /** Une étape « Analyse » suit l'examen clinique : l'étudiant interprète par écrit les examens demandés. */
  analysis: boolean;
  /** Grid total, exam and diagnosis lines included. */
  maxScore: number;
  /** Duration of the exam mode. Training has no clock. */
  examDurationSeconds: number;
};
