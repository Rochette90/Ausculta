export type TutorialQuestion = { question: string; options: string[]; answer: number; explanation: string };

export const ecgQuestions: TutorialQuestion[] = [
  { question: "Le tracé est réglé à 50 mm/s. Quelle est la première conséquence ?", options: ["Les amplitudes sont doublées", "Les durées occupent deux fois plus de carreaux", "La fréquence cardiaque est réellement divisée par deux", "Le QT n'est plus mesurable"], answer: 1, explanation: "Le papier défile deux fois plus vite qu'à 25 mm/s : un même intervalle temporel occupe deux fois plus de distance horizontale." },
  { question: "DI est positif, aVF négatif. Quel contrôle affine immédiatement l'axe ?", options: ["aVR", "V1", "DII", "V6"], answer: 2, explanation: "La polarité de DII aide à distinguer un axe encore physiologique à gauche d'une véritable déviation axiale gauche." },
  { question: "Quelle synthèse est la plus utile ?", options: ["ECG anormal", "Possible problème cardiaque", "Rythme sinusal à 72/min, axe normal, PR et QRS normaux, sans anomalie aiguë de repolarisation", "Pas de STEMI"], answer: 2, explanation: "Elle suit une structure reproductible et précise rythme, axe, conduction et repolarisation sans surinterpréter." },
];

export const chestQuestions: TutorialQuestion[] = [
  { question: "Pourquoi la silhouette cardiaque paraît-elle souvent plus grande sur un cliché AP portable ?", options: ["Le cœur se dilate immédiatement en décubitus", "La projection crée un agrandissement géométrique", "Le poumon devient plus dense", "Le diaphragme disparaît"], answer: 1, explanation: "Le cœur est plus éloigné du détecteur en AP et subit une magnification ; une inspiration moindre peut accentuer l'impression." },
  { question: "Quel signe soutient un pneumothorax ?", options: ["Bronchogramme aérien", "Liseré pleural avec absence de trame au-delà", "Lignes de Kerley B", "Effacement isolé du bord droit du cœur"], answer: 1, explanation: "Le liseré correspond à la plèvre viscérale ; la zone périphérique ne montre plus de vaisseaux pulmonaires." },
  { question: "Une opacité efface le bord droit du cœur. Quelle localisation est classiquement suggérée ?", options: ["Lobe supérieur gauche", "Lobe moyen droit", "Segment apical du lobe inférieur droit", "Plèvre gauche"], answer: 1, explanation: "Le signe de silhouette indique que l'opacité est au contact du bord cardiaque droit, classiquement dans le lobe moyen." },
];

const tutorials: Record<string, TutorialQuestion[]> = {
  "tutoriel-ecg": ecgQuestions,
  "tutoriel-radiographie-thorax": chestQuestions,
};
export function gradeTutorial(slug: string, answers: unknown): number | null {
  const questions = Object.hasOwn(tutorials, slug) ? tutorials[slug] : undefined;
  if (!questions || !Array.isArray(answers) || answers.length !== questions.length) return null;
  if (answers.some((answer, index) => !Number.isInteger(answer) || answer < 0 || answer >= questions[index].options.length)) return null;
  return Math.round(100 * questions.filter((question, index) => question.answer === answers[index]).length / questions.length);
}
