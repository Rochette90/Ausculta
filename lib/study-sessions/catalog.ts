export type StudySessionStepKind = "sheet" | "tutorial" | "quiz" | "case";

export type StudySessionStep = {
  id: string;
  kind: StudySessionStepKind;
  title: string;
  description: string;
  durationMinutes: number;
  href: string;
};

export type StudySession = {
  slug: string;
  /**
   * Sujet clinique de la séance, sans verbe. Le titre affiché est composé par
   * `studySessionTitle(subject, mastery)` : le verbe dépend du niveau de
   * maîtrise de l'utilisateur, il n'est jamais écrit en dur.
   */
  subject: string;
  eyebrow: string;
  description: string;
  specialty: string;
  durationMinutes: number;
  level: string;
  accent: "teal" | "sky" | "violet" | "emerald" | "amber" | "rose" | "indigo" | "cyan";
  steps: StudySessionStep[];
};

export const studySessions: StudySession[] = [
  {
    slug: "douleur-thoracique-sca",
    subject: "la cardiologie",
    eyebrow: "Douleur thoracique · SCA",
    description: "Relie sémiologie, ECG et décision urgente autour d'une douleur thoracique suspecte.",
    specialty: "Cardiologie",
    durationMinutes: 30,
    level: "Essentiel",
    accent: "teal",
    steps: [
      { id: "fiche-sca", kind: "sheet", title: "Fiche · Syndrome coronarien aigu", description: "Reconnaître, confirmer et reperfuser", durationMinutes: 8, href: "/pathologies/infarctus-myocarde-sca" },
      { id: "tutoriel-ecg", kind: "tutorial", title: "Tutoriel · Lecture systématique ECG", description: "VIP, rythme, axe, conduction et ST-T", durationMinutes: 8, href: "/tutoriels/ecg" },
      { id: "quiz-douleur-thoracique", kind: "quiz", title: "QCM · Douleur thoracique", description: "Questions ciblées de cardiologie", durationMinutes: 6, href: "/quiz/cardiologie" },
      { id: "cas-sca", kind: "case", title: "Cas clinique · Douleur thoracique aiguë", description: "Raisonnement clinique interactif", durationMinutes: 8, href: "/cas/douleur-thoracique-aigue" },
    ],
  },
  {
    slug: "dyspnee-aigue",
    subject: "la dyspnée aiguë",
    eyebrow: "Dyspnée · Imagerie thoracique",
    description: "Structure l'évaluation d'une dyspnée aiguë, de l'embolie pulmonaire à la lecture du cliché thoracique.",
    specialty: "Pneumologie",
    durationMinutes: 30,
    level: "Intermédiaire",
    accent: "sky",
    steps: [
      { id: "fiche-ep", kind: "sheet", title: "Fiche · Embolie pulmonaire", description: "Probabilité clinique, imagerie et gravité", durationMinutes: 8, href: "/pathologies/embolie-pulmonaire" },
      { id: "tutoriel-radio-thorax", kind: "tutorial", title: "Tutoriel · Radiographie thoracique", description: "DRS, RIPE et cinq compartiments", durationMinutes: 8, href: "/tutoriels/radiographie-thorax" },
      { id: "quiz-pneumologie", kind: "quiz", title: "QCM · Dyspnée et pneumologie", description: "Décisions rapides et signes de gravité", durationMinutes: 6, href: "/quiz/pneumologie" },
      { id: "cas-dyspnee", kind: "case", title: "Cas clinique · Détresse respiratoire", description: "Hiérarchiser les urgences respiratoires", durationMinutes: 8, href: "/cas/embolie-pulmonaire-post-voyage" },
    ],
  },
  {
    slug: "palpitations-syncope",
    subject: "les palpitations et la syncope",
    eyebrow: "Palpitations · Syncope",
    description: "Passe du symptôme au rythme, puis du tracé à la conduite clinique.",
    specialty: "Cardiologie",
    durationMinutes: 30,
    level: "Intermédiaire",
    accent: "violet",
    steps: [
      { id: "fiche-fa", kind: "sheet", title: "Fiche · Fibrillation auriculaire", description: "Diagnostic, risque embolique et stratégie", durationMinutes: 8, href: "/pathologies/fibrillation-auriculaire" },
      { id: "tutoriel-ecg-rythme", kind: "tutorial", title: "Tutoriel · Rythme et conduction", description: "Appliquer la lecture ECG pas à pas", durationMinutes: 8, href: "/tutoriels/ecg" },
      { id: "quiz-troubles-rythme", kind: "quiz", title: "QCM · Troubles du rythme", description: "Fréquence, régularité et urgence", durationMinutes: 6, href: "/quiz/cardiologie" },
      { id: "cas-palpitations", kind: "case", title: "Cas clinique · Malaise et palpitations", description: "Décider avec les signes de tolérance", durationMinutes: 8, href: "/cas/fibrillation-auriculaire" },
    ],
  },
  {
    slug: "deficit-neurologique-brutal",
    subject: "l'urgence AVC",
    eyebrow: "AVC · Fenêtre thérapeutique",
    description: "Du dernier moment vu normal à la décision de thrombolyse, structurez la filière AVC.",
    specialty: "Neurologie",
    durationMinutes: 30,
    level: "Essentiel",
    accent: "emerald",
    steps: [
      { id: "fiche-avc", kind: "sheet", title: "Fiche · AVC et AIT", description: "Territoires, délais et reperfusion", durationMinutes: 8, href: "/pathologies/avc-ait" },
      { id: "fiche-imagerie-cerebrale", kind: "sheet", title: "Fiche · Imagerie cérébrale", description: "Scanner sans injection, IRM et pièges", durationMinutes: 7, href: "/pathologies/imagerie-cerebrale" },
      { id: "quiz-neurologie-avc", kind: "quiz", title: "QCM · Urgences neurologiques", description: "Déficit focal, NIHSS et contre-indications", durationMinutes: 7, href: "/quiz/neurologie" },
      { id: "cas-avc", kind: "case", title: "Cas clinique · Déficit neurologique brutal", description: "Structurer l’examen et prioriser les urgences", durationMinutes: 8, href: "/cas/avc-ischemique-sylvien-gauche" },
    ],
  },
  {
    slug: "fievre-cephalees",
    subject: "le syndrome méningé",
    eyebrow: "Fièvre · Céphalées · Raideur",
    description: "Reconnaître le syndrome méningé, hiérarchiser ponction lombaire, imagerie et antibiothérapie.",
    specialty: "Infectiologie",
    durationMinutes: 30,
    level: "Avancé",
    accent: "rose",
    steps: [
      { id: "fiche-meningite", kind: "sheet", title: "Fiche · Méningite et encéphalite", description: "Triade, PL et antibiothérapie probabiliste", durationMinutes: 8, href: "/pathologies/meningite-encephalite" },
      { id: "fiche-sepsis", kind: "sheet", title: "Fiche · Sepsis et choc septique", description: "Reconnaître la défaillance et la première heure", durationMinutes: 7, href: "/pathologies/sepsis-choc-septique" },
      { id: "quiz-infectiologie-meninge", kind: "quiz", title: "QCM · Infections graves", description: "Indications, délais et molécules", durationMinutes: 7, href: "/quiz/infectiologie" },
      { id: "cas-meningite", kind: "case", title: "Cas clinique · Céphalée fébrile", description: "Identifier les signes de gravité et organiser le bilan", durationMinutes: 8, href: "/cas/meningite-aigue" },
    ],
  },
  {
    slug: "douleur-abdominale-aigue",
    subject: "l'abdomen aigu",
    eyebrow: "Abdomen aigu · Fosse iliaque droite",
    description: "Du raisonnement topographique à l'indication chirurgicale, sans oublier les diagnostics à ne pas manquer.",
    specialty: "Gastro-entérologie",
    durationMinutes: 30,
    level: "Essentiel",
    accent: "amber",
    steps: [
      { id: "fiche-abdomen-aigu", kind: "sheet", title: "Fiche · Abdomen aigu", description: "Orientation par cadran et urgences à exclure", durationMinutes: 8, href: "/pathologies/abdomen-aigu" },
      { id: "fiche-appendicite", kind: "sheet", title: "Fiche · Appendicite aiguë", description: "Scores, imagerie et prise en charge", durationMinutes: 7, href: "/pathologies/appendicite-aigue" },
      { id: "quiz-gastro-abdomen", kind: "quiz", title: "QCM · Urgences digestives", description: "Examens complémentaires et décisions", durationMinutes: 7, href: "/quiz/gastro-enterologie" },
      { id: "cas-appendicite", kind: "case", title: "Cas clinique · Douleur de la fosse iliaque droite", description: "Examiner et hiérarchiser les hypothèses", durationMinutes: 8, href: "/cas/appendicite-aigue" },
    ],
  },
  {
    slug: "douleur-epigastrique",
    subject: "la douleur épigastrique",
    eyebrow: "Pancréatite · Voies biliaires",
    description: "Lipase, étiologie biliaire ou alcoolique, scores de gravité et surveillance des 48 premières heures.",
    specialty: "Gastro-entérologie",
    durationMinutes: 30,
    level: "Intermédiaire",
    accent: "indigo",
    steps: [
      { id: "fiche-pancreatite", kind: "sheet", title: "Fiche · Pancréatite aiguë", description: "Diagnostic, gravité et remplissage", durationMinutes: 8, href: "/pathologies/pancreatite-aigue" },
      { id: "fiche-lithiase-biliaire", kind: "sheet", title: "Fiche · Lithiase biliaire et cholécystite", description: "Migration lithiasique et complications", durationMinutes: 7, href: "/pathologies/lithiase-biliaire-cholecystite" },
      { id: "quiz-gastro-pancreas", kind: "quiz", title: "QCM · Pancréas et voies biliaires", description: "Biologie, imagerie et complications", durationMinutes: 7, href: "/quiz/gastro-enterologie" },
      { id: "cas-pancreatite", kind: "case", title: "Cas clinique · Douleur épigastrique transfixiante", description: "Caractériser la douleur et rechercher la gravité", durationMinutes: 8, href: "/cas/pancreatite-aigue" },
    ],
  },
  {
    slug: "decompensation-diabetique",
    subject: "l'acidocétose diabétique",
    eyebrow: "Diabète · Urgence métabolique",
    description: "Reconnaître la décompensation, corriger dans le bon ordre et éviter les pièges du potassium.",
    specialty: "Endocrinologie",
    durationMinutes: 30,
    level: "Avancé",
    accent: "cyan",
    steps: [
      { id: "fiche-acidocetose", kind: "sheet", title: "Fiche · Acidocétose diabétique", description: "Critères, réhydratation, insuline et kaliémie", durationMinutes: 8, href: "/pathologies/acidocetose-diabetique" },
      { id: "fiche-diabete-1", kind: "sheet", title: "Fiche · Diabète de type 1", description: "Physiopathologie et facteurs déclenchants", durationMinutes: 7, href: "/pathologies/diabete-type-1" },
      { id: "quiz-endocrinologie-urgence", kind: "quiz", title: "QCM · Urgences métaboliques", description: "Ordre des gestes et surveillance", durationMinutes: 7, href: "/quiz/endocrinologie" },
      { id: "cas-acidocetose", kind: "case", title: "Cas clinique · Polyuro-polydipsie et douleurs abdominales", description: "Identifier la décompensation et ses signes de gravité", durationMinutes: 8, href: "/cas/acidocetose-diabetique" },
    ],
  },
  {
    slug: "fievre-toux-pneumonie",
    subject: "la pneumonie communautaire",
    eyebrow: "Toux fébrile · Radiographie",
    description: "Du foyer auscultatoire au score de gravité, décidez ambulatoire ou hospitalisation.",
    specialty: "Pneumologie",
    durationMinutes: 30,
    level: "Essentiel",
    accent: "teal",
    steps: [
      { id: "fiche-pac", kind: "sheet", title: "Fiche · Pneumonie aiguë communautaire", description: "Germes, CRB-65 et antibiothérapie", durationMinutes: 8, href: "/pathologies/pneumonie-aigue-communautaire" },
      { id: "tutoriel-radio-pac", kind: "tutorial", title: "Tutoriel · Radiographie thoracique", description: "Repérer un foyer et un épanchement", durationMinutes: 7, href: "/tutoriels/radiographie-thorax" },
      { id: "quiz-pneumologie-infection", kind: "quiz", title: "QCM · Infections respiratoires", description: "Gravité, terrain et traitement", durationMinutes: 7, href: "/quiz/pneumologie" },
      { id: "cas-pneumonie", kind: "case", title: "Cas clinique · Fièvre, toux et dyspnée", description: "Évaluer la gravité selon le terrain", durationMinutes: 8, href: "/cas/pneumonie-communautaire" },
    ],
  },
  {
    slug: "crise-asthme-aigue",
    subject: "la crise d'asthme",
    eyebrow: "Asthme · Signes de gravité",
    description: "Évaluer la sévérité, traiter sans délai et reconnaître l'asthme aigu grave.",
    specialty: "Pneumologie",
    durationMinutes: 30,
    level: "Intermédiaire",
    accent: "sky",
    steps: [
      { id: "fiche-asthme", kind: "sheet", title: "Fiche · Asthme", description: "Diagnostic, contrôle et paliers de traitement", durationMinutes: 8, href: "/pathologies/asthme" },
      { id: "fiche-exacerbation", kind: "sheet", title: "Fiche · Exacerbation asthme et BPCO", description: "Critères de gravité et traitement d'urgence", durationMinutes: 7, href: "/pathologies/exacerbation-asthme-bpco" },
      { id: "quiz-asthme", kind: "quiz", title: "QCM · Obstruction bronchique", description: "DEP, gazométrie et orientation", durationMinutes: 7, href: "/quiz/pneumologie" },
      { id: "cas-asthme", kind: "case", title: "Cas clinique · Dyspnée sifflante aiguë", description: "Rechercher les signes de mauvaise tolérance", durationMinutes: 8, href: "/cas/crise-asthme" },
    ],
  },
  {
    slug: "douleur-thoracique-brutale",
    subject: "le pneumothorax",
    eyebrow: "Douleur brutale · Sujet jeune",
    description: "Différencie les douleurs thoraciques brutales et repère la mauvaise tolérance qui impose l'exsufflation.",
    specialty: "Urgences",
    durationMinutes: 30,
    level: "Intermédiaire",
    accent: "violet",
    steps: [
      { id: "fiche-pneumothorax", kind: "sheet", title: "Fiche · Pneumothorax", description: "Spontané, compressif et modalités de drainage", durationMinutes: 8, href: "/pathologies/pneumothorax" },
      { id: "tutoriel-radio-pno", kind: "tutorial", title: "Tutoriel · Radiographie thoracique", description: "Ligne pleurale, déviation et pièges", durationMinutes: 7, href: "/tutoriels/radiographie-thorax" },
      { id: "quiz-urgences-thorax", kind: "quiz", title: "QCM · Urgences thoraciques", description: "Trier les douleurs brutales", durationMinutes: 7, href: "/quiz/urgences" },
      { id: "cas-pneumothorax", kind: "case", title: "Cas clinique · Douleur thoracique brutale", description: "Évaluer la tolérance et hiérarchiser les hypothèses", durationMinutes: 8, href: "/cas/pneumothorax-spontane" },
    ],
  },
  {
    slug: "fievre-prolongee-souffle",
    subject: "l'endocardite infectieuse",
    eyebrow: "Fièvre prolongée · Souffle",
    description: "Hémocultures avant antibiotiques, critères de Duke et recherche des complications emboliques.",
    specialty: "Infectiologie",
    durationMinutes: 30,
    level: "Avancé",
    accent: "emerald",
    steps: [
      { id: "fiche-endocardite", kind: "sheet", title: "Fiche · Endocardite infectieuse", description: "Critères de Duke, porte d'entrée et complications", durationMinutes: 8, href: "/pathologies/endocardite-infectieuse" },
      { id: "fiche-antibiotherapie", kind: "sheet", title: "Fiche · Principes d'antibiothérapie", description: "Spectre, bithérapie et durée", durationMinutes: 7, href: "/pathologies/antibiotherapie-principes" },
      { id: "quiz-endocardite", kind: "quiz", title: "QCM · Infections cardiovasculaires", description: "Hémocultures, échographie et traitement", durationMinutes: 7, href: "/quiz/infectiologie" },
      { id: "cas-endocardite", kind: "case", title: "Cas clinique · Fièvre prolongée et altération générale", description: "Mener l’anamnèse et prioriser le bilan", durationMinutes: 8, href: "/cas/endocardite-infectieuse" },
    ],
  },
];

export const featuredStudySession = studySessions[0];

export function getStudySession(slug: string) {
  return studySessions.find((session) => session.slug === slug) ?? null;
}
