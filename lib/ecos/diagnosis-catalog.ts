import { normalizeEcosText } from "./text.ts";

/**
 * Liste commune des diagnostics proposés à la saisie (diagnostic principal et
 * diagnostics différentiels), identique pour toutes les stations : rien n'y
 * oriente vers le cas. Des entités cliniques, sans latéralité ni stade ; les
 * synonymes (`aliases`) servent seulement à la recherche. Publique : le
 * navigateur la reçoit pour la saisie, les réponses attendues restent sur le
 * serveur (`lib/ecos/stations/diagnoses.ts`).
 */
export type DiagnosisEntry = { id: string; label: string; aliases?: readonly string[] };

type Row = [id: string, label: string, aliases?: string[]];

const ROWS: Row[] = [
  // Cardiologie et vaisseaux
  ["sca-st", "Syndrome coronarien aigu avec sus-décalage ST", ["STEMI", "infarctus du myocarde", "IAM"]],
  ["sca-nst", "Syndrome coronarien aigu sans sus-décalage ST", ["NSTEMI", "angor instable"]],
  ["angor-stable", "Angor stable", ["angine de poitrine"]],
  ["pericardite", "Péricardite aiguë"],
  ["myocardite", "Myocardite"],
  ["tamponnade", "Tamponnade cardiaque"],
  ["dissection-aortique", "Dissection aortique"],
  ["rupture-aaa", "Anévrisme de l’aorte abdominale fissuré ou rompu", ["AAA"]],
  ["fibrillation-auriculaire", "Fibrillation auriculaire", ["FA", "arythmie complète"]],
  ["flutter-auriculaire", "Flutter auriculaire"],
  ["tachycardie-jonctionnelle", "Tachycardie jonctionnelle", ["tachycardie supraventriculaire", "TSV", "Bouveret"]],
  ["tachycardie-ventriculaire", "Tachycardie ventriculaire"],
  ["tachycardie-sinusale", "Tachycardie sinusale"],
  ["bloc-av", "Bloc auriculo-ventriculaire"],
  ["insuffisance-cardiaque-decompensee", "Insuffisance cardiaque décompensée", ["OAP", "œdème aigu du poumon", "insuffisance cardiaque aiguë"]],
  ["endocardite-infectieuse", "Endocardite infectieuse"],
  ["stenose-aortique", "Sténose aortique", ["rétrécissement aortique"]],
  ["syncope-vasovagale", "Syncope vasovagale", ["malaise vagal"]],
  ["hypotension-orthostatique", "Hypotension orthostatique"],
  ["crise-hypertensive", "Crise hypertensive", ["urgence hypertensive"]],
  ["tvp", "Thrombose veineuse profonde", ["TVP", "phlébite"]],
  ["embolie-pulmonaire", "Embolie pulmonaire", ["EP"]],
  ["ischemie-aigue-membre", "Ischémie aiguë de membre"],
  ["arteriopathie", "Artériopathie oblitérante des membres inférieurs", ["AOMI"]],
  // Poumons
  ["pneumonie-communautaire", "Pneumonie communautaire", ["pneumopathie", "infection pulmonaire"]],
  ["bronchite-aigue", "Bronchite aiguë"],
  ["exacerbation-bpco", "Exacerbation de BPCO", ["bronchopneumopathie chronique obstructive"]],
  ["exacerbation-asthme", "Exacerbation d’asthme", ["crise d’asthme", "asthme aigu grave"]],
  ["pneumothorax", "Pneumothorax"],
  ["epanchement-pleural", "Épanchement pleural", ["pleurésie"]],
  ["abces-pulmonaire", "Abcès pulmonaire"],
  ["tuberculose", "Tuberculose pulmonaire"],
  ["cancer-bronchique", "Cancer bronchique", ["carcinome pulmonaire", "tumeur pulmonaire"]],
  ["covid-19", "COVID-19"],
  ["grippe", "Grippe", ["influenza"]],
  ["anaphylaxie", "Anaphylaxie", ["choc anaphylactique"]],
  ["dysfonction-cordes-vocales", "Dysfonction des cordes vocales"],
  ["douleur-parietale", "Douleur pariétale thoracique", ["douleur musculosquelettique", "syndrome de Tietze", "costochondrite"]],
  // Neurologie
  ["avc-ischemique", "AVC ischémique", ["accident vasculaire cérébral ischémique", "infarctus cérébral"]],
  ["ait", "Accident ischémique transitoire", ["AIT"]],
  ["hemorragie-intracerebrale", "Hémorragie intracérébrale", ["AVC hémorragique", "hématome intracérébral"]],
  ["hemorragie-sous-arachnoidienne", "Hémorragie sous-arachnoïdienne", ["HSA", "rupture d’anévrisme cérébral"]],
  ["hematome-sous-dural", "Hématome sous-dural"],
  ["hematome-extra-dural", "Hématome extradural"],
  ["meningite-bacterienne", "Méningite bactérienne", ["méningite à méningocoque", "méningite à pneumocoque", "méningite purulente"]],
  ["purpura-fulminans", "Purpura fulminans", ["méningococcémie"]],
  ["meningite-virale", "Méningite virale", ["méningite lymphocytaire"]],
  ["encephalite-herpetique", "Encéphalite herpétique", ["encéphalite"]],
  ["migraine", "Migraine sans aura"],
  ["migraine-aura", "Migraine avec aura"],
  ["cephalee-tension", "Céphalée de tension"],
  ["arterite-temporale", "Artérite temporale", ["maladie de Horton", "artérite à cellules géantes"]],
  ["vasoconstriction-cerebrale", "Syndrome de vasoconstriction cérébrale réversible", ["SVCR"]],
  ["thrombose-veineuse-cerebrale", "Thrombose veineuse cérébrale"],
  ["dissection-arterielle-cervicale", "Dissection artérielle cervicale", ["dissection carotidienne", "dissection vertébrale"]],
  ["apoplexie-hypophysaire", "Apoplexie hypophysaire"],
  ["tumeur-cerebrale", "Tumeur cérébrale", ["processus expansif intracrânien"]],
  ["epilepsie", "Épilepsie", ["crise épileptique"]],
  ["paralysie-todd", "Déficit post-critique", ["paralysie de Todd"]],
  ["syncope-convulsivante", "Syncope convulsivante"],
  ["vppb", "Vertige paroxystique positionnel bénin", ["VPPB"]],
  ["nevrite-vestibulaire", "Névrite vestibulaire"],
  ["paralysie-faciale", "Paralysie faciale périphérique", ["paralysie de Bell"]],
  ["guillain-barre", "Syndrome de Guillain-Barré"],
  ["sclerose-en-plaques", "Sclérose en plaques", ["SEP"]],
  ["parkinson", "Maladie de Parkinson"],
  ["hernie-discale", "Hernie discale", ["sciatique", "lombosciatalgie"]],
  ["syndrome-queue-cheval", "Syndrome de la queue de cheval"],
  // Digestif
  ["appendicite", "Appendicite aiguë"],
  ["adenite-mesenterique", "Adénite mésentérique"],
  ["gastro-enterite", "Gastro-entérite aiguë"],
  ["cholecystite-aigue", "Cholécystite aiguë"],
  ["colique-hepatique", "Colique hépatique", ["colique biliaire", "lithiase vésiculaire symptomatique"]],
  ["angiocholite", "Angiocholite", ["cholangite"]],
  ["pancreatite-aigue", "Pancréatite aiguë"],
  ["ulcere-perfore", "Ulcère gastroduodénal perforé", ["perforation d’ulcère"]],
  ["ulcere-gastroduodenal", "Ulcère gastroduodénal"],
  ["reflux-gastro-oesophagien", "Reflux gastro-œsophagien", ["RGO"]],
  ["hemorragie-digestive-haute", "Hémorragie digestive haute"],
  ["occlusion-intestinale", "Occlusion intestinale", ["iléus"]],
  ["ischemie-mesenterique", "Ischémie mésentérique"],
  ["diverticulite", "Diverticulite", ["sigmoïdite"]],
  ["maladie-crohn", "Maladie de Crohn", ["iléite de Crohn"]],
  ["rectocolite", "Rectocolite hémorragique"],
  ["colon-irritable", "Syndrome de l’intestin irritable"],
  ["hepatite-aigue", "Hépatite aiguë"],
  ["cirrhose-decompensee", "Cirrhose décompensée"],
  ["hernie-etranglee", "Hernie étranglée", ["hernie inguinale"]],
  ["cancer-colorectal", "Cancer colorectal"],
  // Rein, urologie, gynécologie
  ["colique-nephretique", "Colique néphrétique", ["lithiase urétérale", "calcul rénal"]],
  ["pyelonephrite-aigue", "Pyélonéphrite aiguë"],
  ["cystite", "Cystite aiguë", ["infection urinaire basse"]],
  ["prostatite", "Prostatite aiguë"],
  ["insuffisance-renale-aigue", "Insuffisance rénale aiguë"],
  ["retention-urinaire", "Rétention aiguë d’urine"],
  ["torsion-testicule", "Torsion du testicule", ["torsion testiculaire"]],
  ["orchi-epididymite", "Orchi-épididymite"],
  ["grossesse-extra-uterine", "Grossesse extra-utérine", ["GEU"]],
  ["salpingite", "Salpingite", ["infection génitale haute", "maladie inflammatoire pelvienne"]],
  ["torsion-annexe", "Torsion d’annexe", ["torsion ovarienne"]],
  ["kyste-ovarien", "Kyste ovarien compliqué"],
  ["endometriose", "Endométriose"],
  ["fausse-couche", "Fausse couche spontanée"],
  ["pre-eclampsie", "Prééclampsie"],
  // Métabolisme, endocrinologie
  ["acidocetose-diabetique", "Acidocétose diabétique"],
  ["etat-hyperosmolaire", "État hyperglycémique hyperosmolaire"],
  ["hypoglycemie", "Hypoglycémie"],
  ["acidocetose-alcoolique", "Acidocétose alcoolique ou de jeûne"],
  ["hyperthyroidie", "Hyperthyroïdie", ["thyrotoxicose", "maladie de Basedow"]],
  ["hypothyroidie", "Hypothyroïdie"],
  ["insuffisance-surrenale", "Insuffisance surrénalienne aiguë"],
  ["hyponatremie", "Hyponatrémie"],
  ["hyperkaliemie", "Hyperkaliémie"],
  ["hypercalcemie", "Hypercalcémie"],
  ["trouble-electrolytique", "Trouble électrolytique"],
  ["anemie", "Anémie"],
  ["deshydratation", "Déshydratation"],
  // Infections, fièvre
  ["sepsis", "Sepsis", ["choc septique", "septicémie"]],
  ["primo-infection-vih", "Primo-infection VIH", ["infection aiguë par le VIH"]],
  ["mononucleose", "Mononucléose infectieuse"],
  ["paludisme", "Paludisme", ["malaria"]],
  ["abces-cutane", "Abcès cutané"],
  ["lymphome", "Lymphome"],
  ["leucemie-aigue", "Leucémie aiguë"],
  ["fievre-origine-inconnue", "Fièvre d’origine indéterminée"],
  ["angine", "Angine", ["pharyngite", "amygdalite"]],
  ["otite-moyenne", "Otite moyenne aiguë"],
  ["sinusite", "Sinusite aiguë"],
  ["bronchiolite", "Bronchiolite"],
  ["laryngite", "Laryngite aiguë", ["faux croup"]],
  // Pédiatrie
  ["convulsion-febrile", "Convulsion fébrile simple"],
  ["convulsion-febrile-complexe", "Convulsion fébrile complexe"],
  ["invagination", "Invagination intestinale aiguë"],
  ["stenose-pylore", "Sténose hypertrophique du pylore"],
  ["maltraitance", "Maltraitance de l’enfant", ["syndrome du bébé secoué"]],
  // Peau
  ["erysipele", "Érysipèle", ["dermohypodermite bactérienne", "cellulite infectieuse"]],
  ["fasciite-necrosante", "Fasciite nécrosante", ["dermohypodermite nécrosante"]],
  ["dermite-stase", "Dermite de stase"],
  ["eczema-contact", "Eczéma de contact"],
  ["zona", "Zona"],
  ["urticaire", "Urticaire aiguë"],
  ["psoriasis", "Psoriasis"],
  ["melanome", "Mélanome"],
  ["impetigo", "Impétigo"],
  ["gale", "Gale"],
  ["intertrigo", "Intertrigo"],
  ["lyme", "Maladie de Lyme", ["érythème migrant", "borréliose"]],
  // Appareil locomoteur
  ["rupture-lca", "Rupture du ligament croisé antérieur", ["LCA", "entorse grave du genou"]],
  ["lesion-lli", "Lésion du ligament collatéral médial du genou", ["ligament collatéral interne", "LLI"]],
  ["lesion-meniscale", "Lésion méniscale", ["déchirure du ménisque", "anse de seau"]],
  ["luxation-rotule", "Luxation de la rotule"],
  ["fracture-plateau-tibial", "Fracture du plateau tibial"],
  ["lesion-osteochondrale", "Lésion ostéochondrale"],
  ["fracture-col-femur", "Fracture du col du fémur", ["fracture du col fémoral"]],
  ["fracture-pertrochanterienne", "Fracture pertrochantérienne"],
  ["fracture-branches-pubiennes", "Fracture des branches pubiennes", ["fracture du cadre obturateur"]],
  ["luxation-hanche", "Luxation de la hanche", ["luxation de prothèse de hanche"]],
  ["coxarthrose", "Coxarthrose"],
  ["gonarthrose", "Gonarthrose"],
  ["fracture-malleole-laterale", "Fracture de la malléole latérale", ["fracture de la fibula distale", "Weber"]],
  ["fracture-bimalleolaire", "Fracture bimalléolaire", ["fracture trimalléolaire"]],
  ["fracture-maisonneuve", "Fracture de Maisonneuve"],
  ["entorse-cheville", "Entorse de la cheville", ["entorse du ligament talo-fibulaire antérieur", "LTFA"]],
  ["fracture-5e-metatarsien", "Fracture de la base du 5e métatarsien"],
  ["rupture-achille", "Rupture du tendon d’Achille"],
  ["fracture-poignet", "Fracture du radius distal", ["fracture de Pouteau-Colles", "fracture du poignet"]],
  ["fracture-scaphoide", "Fracture du scaphoïde"],
  ["luxation-epaule", "Luxation de l’épaule"],
  ["rupture-coiffe", "Rupture de la coiffe des rotateurs"],
  ["arthrite-septique", "Arthrite septique"],
  ["bursite", "Bursite"],
  ["goutte", "Crise de goutte", ["arthrite microcristalline", "chondrocalcinose"]],
  ["polyarthrite-rhumatoide", "Polyarthrite rhumatoïde"],
  ["lombalgie-commune", "Lombalgie commune", ["lumbago", "lombalgie mécanique"]],
  ["fracture-vertebrale", "Fracture vertébrale", ["tassement vertébral"]],
  ["spondylodiscite", "Spondylodiscite"],
  // Psychiatrie, toxicologie
  ["episode-depressif-majeur", "Épisode dépressif majeur", ["dépression", "trouble dépressif"]],
  ["trouble-adaptation", "Trouble de l’adaptation"],
  ["trouble-bipolaire", "Trouble bipolaire"],
  ["trouble-anxieux", "Trouble anxieux généralisé"],
  ["attaque-panique", "Attaque de panique", ["crise d’angoisse"]],
  ["trouble-usage-alcool", "Trouble lié à l’usage d’alcool", ["alcoolisme", "dépendance à l’alcool"]],
  ["sevrage-alcool", "Sevrage alcoolique", ["délirium tremens"]],
  ["intoxication", "Intoxication médicamenteuse ou toxique", ["intoxication volontaire", "surdosage"]],
  ["psychose", "Épisode psychotique aigu"],
  ["delirium", "État confusionnel aigu", ["délirium", "syndrome confusionnel"]],
  ["demence", "Trouble neurocognitif majeur", ["démence", "maladie d’Alzheimer"]],
  ["trouble-somatique", "Trouble à symptomatologie somatique"],
];

export const DIAGNOSIS_CATALOG: readonly DiagnosisEntry[] = ROWS.map(([id, label, aliases]) => (aliases ? { id, label, aliases } : { id, label }));

export const DIAGNOSIS_BY_ID: ReadonlyMap<string, DiagnosisEntry> = new Map(DIAGNOSIS_CATALOG.map((entry) => [entry.id, entry]));

/** Entrée correspondant à un libellé enregistré (transcript), sinon `null`. */
export function diagnosisByLabel(label: string): DiagnosisEntry | null {
  const wanted = normalizeEcosText(label);
  return DIAGNOSIS_CATALOG.find((entry) => normalizeEcosText(entry.label) === wanted) ?? null;
}

/** Nombre de lettres à taper avant que la liste s'ouvre : on cherche, on ne reconnaît pas. */
export const DIAGNOSIS_SEARCH_MIN_LETTERS = 3;

/** Diagnostics dont le libellé ou un synonyme contient chaque mot tapé (accents et casse ignorés). */
export function searchDiagnoses(query: string, limit = 8): DiagnosisEntry[] {
  const compact = normalizeEcosText(query).trim();
  if (compact.replace(/\s/g, "").length < DIAGNOSIS_SEARCH_MIN_LETTERS) return [];
  const words = compact.split(" ").filter(Boolean);
  const scored = DIAGNOSIS_CATALOG.flatMap((entry) => {
    const texts = [entry.label, ...(entry.aliases ?? [])].map(normalizeEcosText);
    const hit = texts.findIndex((text) => words.every((word) => text.includes(word)));
    if (hit < 0) return [];
    // Le libellé avant les synonymes, un début de mot avant le milieu.
    const startsWord = texts[hit].includes(` ${words[0]}`);
    return [{ entry, score: (hit === 0 ? 0 : 2) + (startsWord ? 0 : 1) }];
  });
  return scored.sort((left, right) => left.score - right.score || left.entry.label.localeCompare(right.entry.label, "fr")).slice(0, limit).map(({ entry }) => entry);
}
