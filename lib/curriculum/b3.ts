import type { PublicPathology } from "@/lib/marketing/catalog";

export type B3ModuleId = "b3-1" | "b3-2" | "b3-3" | "b3-4" | "b3-5";

export type B3Module = {
  id: B3ModuleId;
  code: string;
  title: string;
  shortTitle: string;
  description: string;
  specialties: string[];
  extraPathologySlugs?: string[];
  tone: string;
};

export const b3Modules: B3Module[] = [
  {
    id: "b3-1",
    code: "B3.1",
    title: "Cœur, poumons",
    shortTitle: "Cœur & poumons",
    description: "Cardiologie, pneumologie et lecture de l’imagerie thoracique.",
    specialties: ["Cardiologie", "Pneumologie"],
    extraPathologySlugs: ["imagerie-thoracique", "insuffisance-respiratoire-aigue"],
    tone: "from-teal-500 to-cyan-700",
  },
  {
    id: "b3-2",
    code: "B3.2",
    title: "Douleurs abdominales",
    shortTitle: "Abdomen",
    description: "Gastro-entérologie, hépatologie, urologie et néphrologie.",
    specialties: ["Gastro-entérologie", "Néphrologie"],
    extraPathologySlugs: ["abdomen-aigu", "imagerie-abdomen-aigu", "pyelonephrite-aigue", "hepatites-virales-aigues"],
    tone: "from-amber-500 to-orange-700",
  },
  {
    id: "b3-3",
    code: "B3.3",
    title: "Inflammation",
    shortTitle: "Inflammation",
    description: "Immunologie, allergologie et maladies inflammatoires systémiques.",
    specialties: ["Rhumatologie", "Dermatologie"],
    extraPathologySlugs: ["principes-vaccination", "immunotherapie-du-cancer"],
    tone: "from-rose-500 to-fuchsia-700",
  },
  {
    id: "b3-4",
    code: "B3.4",
    title: "Fonctions supérieures du système nerveux",
    shortTitle: "Système nerveux",
    description: "Neurologie centrale, périphérique et raisonnement neuroclinique.",
    specialties: ["Neurologie"],
    extraPathologySlugs: ["imagerie-cerebrale"],
    tone: "from-violet-500 to-indigo-700",
  },
  {
    id: "b3-5",
    code: "B3.5",
    title: "Croissance et développement",
    shortTitle: "Pédiatrie",
    description: "Développement, croissance et pathologies propres à l’enfant.",
    specialties: ["Pédiatrie"],
    extraPathologySlugs: ["dermatoses-pediatriques", "lymphomes-pediatriques", "tumeurs-pediatriques"],
    tone: "from-lime-500 to-emerald-700",
  },
];

export function pathologyBelongsToB3Module(pathology: PublicPathology, module: B3Module) {
  return module.specialties.includes(pathology.specialty) || module.extraPathologySlugs?.includes(pathology.slug) === true;
}

export function getB3ModuleCount(pathologies: PublicPathology[], module: B3Module) {
  return pathologies.filter((pathology) => pathologyBelongsToB3Module(pathology, module)).length;
}
