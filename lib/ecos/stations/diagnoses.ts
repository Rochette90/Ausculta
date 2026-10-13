/**
 * Réponses attendues de chaque station dans la liste commune des diagnostics
 * (`lib/ecos/diagnosis-catalog.ts`). Serveur seulement : ce fichier nomme le
 * diagnostic de chaque cas.
 *
 * - `accepted` : entités qui valent le diagnostic principal (tolérance à
 *   l'entité clinique, sans côté ni stade).
 * - `differentials` : diagnostics différentiels du débriefing ; chacun est
 *   repéré si l'étudiant a choisi l'une de ses entités.
 */
export type StationDiagnoses = {
  accepted: readonly string[];
  differentials: ReadonlyArray<{ label: string; ids: readonly string[] }>;
};

import { MOCK_STATION_DIAGNOSES } from "./mock/diagnoses.ts";

const d = (label: string, ...ids: string[]) => ({ label, ids });

export const STATION_DIAGNOSES: Readonly<Record<string, StationDiagnoses>> = {
  "douleur-thoracique-aigue": { accepted: ["sca-st"], differentials: [d("Dissection aortique", "dissection-aortique"), d("Embolie pulmonaire", "embolie-pulmonaire"), d("Péricardite aiguë", "pericardite"), d("Pneumothorax", "pneumothorax")] },
  "fibrillation-auriculaire": { accepted: ["fibrillation-auriculaire"], differentials: [d("Flutter auriculaire", "flutter-auriculaire"), d("Tachycardie sinusale (hyperthyroïdie, sepsis, anémie)", "tachycardie-sinusale", "hyperthyroidie", "sepsis", "anemie"), d("Tachycardie jonctionnelle", "tachycardie-jonctionnelle")] },
  "avc-ischemique-sylvien-gauche": { accepted: ["avc-ischemique"], differentials: [d("Hémorragie intracérébrale", "hemorragie-intracerebrale"), d("Hypoglycémie", "hypoglycemie"), d("Déficit post-critique", "paralysie-todd", "epilepsie"), d("Migraine avec aura, tumeur ou hématome sous-dural", "migraine-aura", "tumeur-cerebrale", "hematome-sous-dural")] },
  "meningite-aigue": { accepted: ["meningite-bacterienne", "purpura-fulminans"], differentials: [d("Méningite virale", "meningite-virale"), d("Encéphalite herpétique", "encephalite-herpetique"), d("Hémorragie sous-arachnoïdienne", "hemorragie-sous-arachnoidienne"), d("Sepsis d’une autre origine", "sepsis")] },
  "pneumonie-communautaire": { accepted: ["pneumonie-communautaire"], differentials: [d("Bronchite aiguë", "bronchite-aigue"), d("Exacerbation de BPCO", "exacerbation-bpco"), d("Embolie pulmonaire", "embolie-pulmonaire"), d("Cancer bronchique", "cancer-bronchique")] },
  "pneumothorax-spontane": { accepted: ["pneumothorax"], differentials: [d("Embolie pulmonaire", "embolie-pulmonaire"), d("Péricardite aiguë", "pericardite"), d("Douleur pariétale", "douleur-parietale"), d("Pneumonie avec réaction pleurale", "pneumonie-communautaire", "epanchement-pleural")] },
  "embolie-pulmonaire-post-voyage": { accepted: ["embolie-pulmonaire"], differentials: [d("Pneumonie", "pneumonie-communautaire"), d("Pneumothorax", "pneumothorax"), d("Péricardite", "pericardite"), d("Syndrome coronarien aigu", "sca-st", "sca-nst")] },
  "appendicite-aigue": { accepted: ["appendicite"], differentials: [d("Adénite mésentérique, gastro-entérite", "adenite-mesenterique", "gastro-enterite"), d("Colique néphrétique ou pyélonéphrite droite", "colique-nephretique", "pyelonephrite-aigue"), d("Iléite de Crohn", "maladie-crohn"), d("Chez la femme : grossesse extra-utérine, salpingite, torsion d’annexe", "grossesse-extra-uterine", "salpingite", "torsion-annexe")] },
  "pancreatite-aigue": { accepted: ["pancreatite-aigue"], differentials: [d("Ulcère gastroduodénal perforé", "ulcere-perfore"), d("Cholécystite ou angiocholite aiguë", "cholecystite-aigue", "angiocholite"), d("Syndrome coronarien aigu inférieur", "sca-st", "sca-nst"), d("Ischémie mésentérique, anévrisme de l’aorte abdominale", "ischemie-mesenterique", "rupture-aaa")] },
  "acidocetose-diabetique": { accepted: ["acidocetose-diabetique"], differentials: [d("Gastro-entérite ou appendicite", "gastro-enterite", "appendicite"), d("État hyperglycémique hyperosmolaire", "etat-hyperosmolaire"), d("Acidocétose alcoolique ou de jeûne", "acidocetose-alcoolique"), d("Intoxication", "intoxication")] },
  "endocardite-infectieuse": { accepted: ["endocardite-infectieuse"], differentials: [d("Pneumonie ou abcès pulmonaire", "pneumonie-communautaire", "abces-pulmonaire"), d("Bactériémie sur abcès cutané", "abces-cutane", "sepsis"), d("Infection aiguë par le VIH, tuberculose", "primo-infection-vih", "tuberculose"), d("Lymphome ou autre fièvre prolongée", "lymphome", "fievre-origine-inconnue")] },
  "crise-asthme": { accepted: ["exacerbation-asthme"], differentials: [d("Pneumothorax", "pneumothorax"), d("Pneumonie", "pneumonie-communautaire"), d("Anaphylaxie", "anaphylaxie"), d("Dysfonction des cordes vocales, crise d’angoisse", "dysfonction-cordes-vocales", "attaque-panique")] },
  "humeur-depressive-idees-suicidaires": { accepted: ["episode-depressif-majeur"], differentials: [d("Trouble de l’adaptation", "trouble-adaptation"), d("Trouble bipolaire", "trouble-bipolaire"), d("Cause organique (hypothyroïdie, anémie)", "hypothyroidie", "anemie"), d("Trouble lié à l’usage d’alcool", "trouble-usage-alcool")] },
  "convulsion-febrile": { accepted: ["convulsion-febrile"], differentials: [d("Méningite ou encéphalite", "meningite-bacterienne", "meningite-virale", "encephalite-herpetique"), d("Convulsion fébrile complexe", "convulsion-febrile-complexe"), d("Épilepsie révélée par la fièvre", "epilepsie"), d("Hypoglycémie ou trouble électrolytique", "hypoglycemie", "trouble-electrolytique")] },
  "erysipele-jambe": { accepted: ["erysipele"], differentials: [d("Thrombose veineuse profonde", "tvp"), d("Fasciite nécrosante", "fasciite-necrosante"), d("Dermite de stase ou eczéma de contact", "dermite-stase", "eczema-contact"), d("Bursite ou arthrite septique", "bursite", "arthrite-septique")] },
  "cholecystite-aigue": { accepted: ["cholecystite-aigue"], differentials: [d("Colique hépatique simple", "colique-hepatique"), d("Angiocholite aiguë", "angiocholite"), d("Pancréatite aiguë biliaire", "pancreatite-aigue"), d("Ulcère perforé, pyélonéphrite droite, pneumonie basale droite", "ulcere-perfore", "pyelonephrite-aigue", "pneumonie-communautaire")] },
  "colique-nephretique": { accepted: ["colique-nephretique"], differentials: [d("Pyélonéphrite aiguë", "pyelonephrite-aigue"), d("Torsion testiculaire", "torsion-testicule"), d("Anévrisme de l’aorte abdominale fissuré", "rupture-aaa"), d("Appendicite, sigmoïdite ou lombalgie mécanique", "appendicite", "diverticulite", "lombalgie-commune")] },
  "hemorragie-sous-arachnoidienne": { accepted: ["hemorragie-sous-arachnoidienne"], differentials: [d("Syndrome de vasoconstriction cérébrale réversible", "vasoconstriction-cerebrale"), d("Méningite", "meningite-bacterienne", "meningite-virale"), d("Dissection cervicale, thrombose veineuse cérébrale, apoplexie hypophysaire", "dissection-arterielle-cervicale", "thrombose-veineuse-cerebrale", "apoplexie-hypophysaire"), d("Migraine", "migraine", "migraine-aura")] },
  "pyelonephrite-aigue": { accepted: ["pyelonephrite-aigue"], differentials: [d("Cystite simple", "cystite"), d("Colique néphrétique", "colique-nephretique"), d("Cause gynécologique : grossesse extra-utérine, salpingite, torsion d’annexe", "grossesse-extra-uterine", "salpingite", "torsion-annexe"), d("Appendicite rétrocæcale, cholécystite", "appendicite", "cholecystite-aigue")] },
  "insuffisance-cardiaque-decompensee": { accepted: ["insuffisance-cardiaque-decompensee"], differentials: [d("Exacerbation de BPCO", "exacerbation-bpco"), d("Pneumonie", "pneumonie-communautaire"), d("Embolie pulmonaire", "embolie-pulmonaire"), d("Syndrome coronarien aigu", "sca-st", "sca-nst")] },
  "rupture-ligament-croise-anterieur": { accepted: ["rupture-lca"], differentials: [d("Lésion du ligament collatéral médial", "lesion-lli"), d("Luxation de la rotule", "luxation-rotule"), d("Lésion méniscale isolée", "lesion-meniscale"), d("Lésion ostéochondrale ou fracture du plateau tibial", "lesion-osteochondrale", "fracture-plateau-tibial")] },
  "fracture-col-femoral": { accepted: ["fracture-col-femur"], differentials: [d("Fracture pertrochantérienne", "fracture-pertrochanterienne"), d("Fracture des branches pubiennes", "fracture-branches-pubiennes"), d("Luxation de hanche ou de prothèse", "luxation-hanche")] },
  "fracture-cheville-weber-b": { accepted: ["fracture-malleole-laterale"], differentials: [d("Entorse du ligament talo-fibulaire antérieur", "entorse-cheville"), d("Fracture de Maisonneuve", "fracture-maisonneuve"), d("Fracture de la base du 5e métatarsien", "fracture-5e-metatarsien"), d("Fracture bimalléolaire ou instable", "fracture-bimalleolaire")] },
  ...MOCK_STATION_DIAGNOSES,
};
