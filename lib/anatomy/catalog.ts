import type { AnatomyModule } from "./types";

export const anatomyModules: AnatomyModule[] = [
  {
    "slug": "neuroanatomie",
    "title": "Encéphale & voies nerveuses",
    "region": "Tête & cou",
    "subtitle": "Localiser avant de nommer.",
    "minutes": 12,
    "objectives": [
      "Distinguer cortex, tronc cérébral et cervelet.",
      "Relier le croisement moteur au côté du déficit.",
      "Situer les espaces méningés."
    ],
    "structures": [
      {
        "id": "cortex",
        "name": "Cortex cérébral",
        "location": "Surface des hémisphères.",
        "function": "Intègre notamment les fonctions motrices, sensitives et cognitives.",
        "landmark": "Le sillon central sépare les gyri précentral et postcentral.",
        "clinical": "Une lésion corticale peut associer signes moteurs et troubles du langage."
      },
      {
        "id": "tronc",
        "name": "Tronc cérébral",
        "location": "Entre diencéphale et moelle, en avant du cervelet.",
        "function": "Fait passer des voies longues et contient des noyaux de nerfs crâniens.",
        "landmark": "Mésencéphale, pont, puis bulbe de haut en bas.",
        "clinical": "Des signes crâniens et corporels croisés orientent vers le tronc cérébral."
      },
      {
        "id": "meninges",
        "name": "Méninges",
        "location": "Autour du système nerveux central.",
        "function": "Enveloppent et protègent le cerveau et la moelle.",
        "landmark": "Dure-mère → arachnoïde → pie-mère ; LCR dans l’espace sous-arachnoïdien.",
        "clinical": "Sous-dural et sous-arachnoïdien désignent des espaces distincts."
      }
    ],
    "questions": [
      {
        "id": "n1",
        "prompt": "Quel gyrus contient le cortex moteur primaire ?",
        "options": [
          {
            "id": "a",
            "text": "Postcentral"
          },
          {
            "id": "b",
            "text": "Précentral"
          },
          {
            "id": "c",
            "text": "Cingulaire"
          }
        ],
        "correctId": "b",
        "explanation": "Le gyrus précentral est situé en avant du sillon central."
      },
      {
        "id": "n2",
        "prompt": "Où circule le LCR autour du cerveau ?",
        "options": [
          {
            "id": "a",
            "text": "Espace sous-arachnoïdien"
          },
          {
            "id": "b",
            "text": "Espace sous-dural"
          },
          {
            "id": "c",
            "text": "Entre os et dure-mère"
          }
        ],
        "correctId": "a",
        "explanation": "L’espace sous-arachnoïdien se situe entre arachnoïde et pie-mère."
      },
      {
        "id": "n3",
        "prompt": "Quelle structure est située en arrière du tronc cérébral ?",
        "options": [
          {
            "id": "a",
            "text": "Thalamus"
          },
          {
            "id": "b",
            "text": "Hypophyse"
          },
          {
            "id": "c",
            "text": "Cervelet"
          }
        ],
        "correctId": "c",
        "explanation": "Le cervelet occupe la fosse postérieure, dorsalement au tronc cérébral."
      }
    ],
    "case": {
      "title": "Un déficit d’un seul côté",
      "vignette": "Un patient présente une faiblesse brutale du bras et de la jambe droits. L’imagerie montre une lésion hémisphérique. Ce cas travaille la localisation ; un déficit brutal réel relève d’une évaluation urgente.",
      "questions": [
        {
          "id": "nc1",
          "prompt": "De quel côté se situe le plus probablement la lésion hémisphérique ?",
          "options": [
            {
              "id": "a",
              "text": "À droite"
            },
            {
              "id": "b",
              "text": "À gauche"
            },
            {
              "id": "c",
              "text": "Le côté est toujours indéterminable"
            }
          ],
          "correctId": "b",
          "explanation": "La majorité des fibres corticospinales croisent dans la partie caudale du bulbe : une lésion hémisphérique donne généralement un déficit controlatéral."
        },
        {
          "id": "nc2",
          "prompt": "Quelle information aide à préciser une atteinte corticale ?",
          "options": [
            {
              "id": "a",
              "text": "La couleur des yeux"
            },
            {
              "id": "b",
              "text": "La présence d’une aphasie"
            },
            {
              "id": "c",
              "text": "La taille du patient"
            }
          ],
          "correctId": "b",
          "explanation": "Une aphasie oriente vers les réseaux du langage de l’hémisphère dominant, habituellement gauche."
        }
      ]
    },
    "pathologySlugs": [
      "avc-ait",
      "hematome-sous-dural",
      "syndromes-medullaires"
    ],
    "sources": [
      {
        "title": "OpenStax · Système nerveux central",
        "url": "https://openstax.org/books/anatomy-and-physiology-2e/pages/13-2-the-central-nervous-system"
      },
      {
        "title": "NCBI Bookshelf · Voie corticospinale",
        "url": "https://www.ncbi.nlm.nih.gov/sites/books/NBK535423/"
      }
    ]
  },
  {
    "slug": "coeur-mediastin",
    "title": "Cœur & médiastin",
    "region": "Thorax",
    "subtitle": "Suivre le sang, comprendre les rapports.",
    "minutes": 10,
    "objectives": [
      "Suivre les deux circulations.",
      "Placer les valves sur le trajet du sang.",
      "Distinguer cavité péricardique et cavités cardiaques."
    ],
    "structures": [
      {
        "id": "ventricules",
        "name": "Ventricules",
        "location": "Cavités inférieures du cœur, dans le médiastin.",
        "function": "Le droit alimente la circulation pulmonaire ; le gauche la circulation systémique.",
        "landmark": "La paroi ventriculaire gauche est plus épaisse.",
        "clinical": "Le retentissement d’une défaillance dépend du circuit concerné."
      },
      {
        "id": "valves",
        "name": "Valves cardiaques",
        "location": "Entre oreillettes et ventricules, puis à la sortie des ventricules.",
        "function": "Maintiennent un flux orienté.",
        "landmark": "Tricuspide à droite ; mitrale à gauche.",
        "clinical": "Sténose et régurgitation perturbent le flux de façons différentes."
      },
      {
        "id": "pericarde",
        "name": "Péricarde",
        "location": "Enveloppe du cœur et de la racine des gros vaisseaux.",
        "function": "Limite les frottements grâce aux feuillets séreux.",
        "landmark": "La cavité péricardique est extérieure aux cavités cardiaques.",
        "clinical": "Un épanchement peut comprimer le cœur et gêner son remplissage."
      }
    ],
    "questions": [
      {
        "id": "h1",
        "prompt": "Après le ventricule droit, le sang rejoint…",
        "options": [
          {
            "id": "a",
            "text": "L’aorte"
          },
          {
            "id": "b",
            "text": "Les veines pulmonaires"
          },
          {
            "id": "c",
            "text": "Le tronc pulmonaire"
          }
        ],
        "correctId": "c",
        "explanation": "Le ventricule droit éjecte vers le tronc puis les artères pulmonaires."
      },
      {
        "id": "h2",
        "prompt": "Quelle valve sépare oreillette gauche et ventricule gauche ?",
        "options": [
          {
            "id": "a",
            "text": "Mitrale"
          },
          {
            "id": "b",
            "text": "Tricuspide"
          },
          {
            "id": "c",
            "text": "Pulmonaire"
          }
        ],
        "correctId": "a",
        "explanation": "La valve mitrale est la valve atrioventriculaire gauche."
      },
      {
        "id": "h3",
        "prompt": "Où se situe un épanchement péricardique ?",
        "options": [
          {
            "id": "a",
            "text": "Dans le ventricule"
          },
          {
            "id": "b",
            "text": "Entre les feuillets séreux péricardiques"
          },
          {
            "id": "c",
            "text": "Dans l’aorte"
          }
        ],
        "correctId": "b",
        "explanation": "Le liquide s’accumule dans la cavité péricardique, autour du cœur."
      }
    ],
    "case": {
      "title": "Un cœur comprimé",
      "vignette": "Une échographie montre une accumulation importante de liquide autour du cœur, avec une gêne au remplissage. On cherche le mécanisme anatomique de cette compression.",
      "questions": [
        {
          "id": "hc1",
          "prompt": "Quelle enveloppe contient le liquide décrit ?",
          "options": [
            {
              "id": "a",
              "text": "La plèvre"
            },
            {
              "id": "b",
              "text": "Le péricarde"
            },
            {
              "id": "c",
              "text": "Le péritoine"
            }
          ],
          "correctId": "b",
          "explanation": "Le péricarde entoure le cœur ; la plèvre entoure les poumons."
        },
        {
          "id": "hc2",
          "prompt": "Quelle phase est directement gênée par la compression ?",
          "options": [
            {
              "id": "a",
              "text": "Le remplissage diastolique"
            },
            {
              "id": "b",
              "text": "La filtration rénale uniquement"
            },
            {
              "id": "c",
              "text": "L’ouverture du pylore"
            }
          ],
          "correctId": "a",
          "explanation": "La compression externe limite l’expansion des cavités pendant le remplissage."
        }
      ]
    },
    "pathologySlugs": [
      "tamponnade-cardiaque",
      "infarctus-myocarde-sca",
      "stenose-aortique"
    ],
    "sources": [
      {
        "title": "OpenStax · Anatomie du cœur",
        "url": "https://openstax.org/books/anatomy-and-physiology-2e/pages/19-1-heart-anatomy"
      }
    ]
  },
  {
    "slug": "poumons-plevre",
    "title": "Poumons & plèvre",
    "region": "Thorax",
    "subtitle": "Des voies aériennes aux enveloppes.",
    "minutes": 10,
    "objectives": [
      "Distinguer arbre bronchique et cavité pleurale.",
      "Situer le diaphragme.",
      "Relier la plèvre à l’expansion pulmonaire."
    ],
    "structures": [
      {
        "id": "bronches",
        "name": "Bronches principales",
        "location": "À la division de la trachée, vers chaque poumon.",
        "function": "Conduisent l’air vers les voies aériennes distales.",
        "landmark": "La bronche droite est plus large, plus courte et plus verticale.",
        "clinical": "La géométrie favorise le passage de corps étrangers vers la droite."
      },
      {
        "id": "plevre",
        "name": "Plèvre",
        "location": "Feuillet viscéral sur le poumon ; pariétal sur la paroi thoracique.",
        "function": "Permet le glissement et le couplage mécanique poumon–thorax.",
        "landmark": "La cavité pleurale est un espace potentiel, hors du poumon.",
        "clinical": "De l’air dans cet espace définit un pneumothorax."
      },
      {
        "id": "diaphragme",
        "name": "Diaphragme",
        "location": "Cloison musculaire entre thorax et abdomen.",
        "function": "Principal muscle de l’inspiration au repos.",
        "landmark": "Sa contraction abaisse les coupoles.",
        "clinical": "Son mouvement modifie le volume thoracique."
      }
    ],
    "questions": [
      {
        "id": "p1",
        "prompt": "Un pneumothorax correspond à de l’air…",
        "options": [
          {
            "id": "a",
            "text": "Dans les alvéoles normalement aérées"
          },
          {
            "id": "b",
            "text": "Dans la cavité pleurale"
          },
          {
            "id": "c",
            "text": "Dans le péricarde"
          }
        ],
        "correctId": "b",
        "explanation": "La présence d’air pleural perturbe le couplage entre poumon et paroi."
      },
      {
        "id": "p2",
        "prompt": "Quelle bronche principale est habituellement la plus verticale ?",
        "options": [
          {
            "id": "a",
            "text": "Droite"
          },
          {
            "id": "b",
            "text": "Gauche"
          },
          {
            "id": "c",
            "text": "Elles sont identiques"
          }
        ],
        "correctId": "a",
        "explanation": "La bronche principale droite est plus verticale que la gauche."
      },
      {
        "id": "p3",
        "prompt": "Lors de l’inspiration calme, le diaphragme…",
        "options": [
          {
            "id": "a",
            "text": "Se relâche et monte"
          },
          {
            "id": "b",
            "text": "Reste immobile"
          },
          {
            "id": "c",
            "text": "Se contracte et descend"
          }
        ],
        "correctId": "c",
        "explanation": "La descente des coupoles augmente le volume du thorax."
      }
    ],
    "case": {
      "title": "Une séparation inhabituelle",
      "vignette": "Sur une image thoracique, on distingue un bord pulmonaire décollé de la paroi et de l’air en périphérie sans trame pulmonaire. L’exercice porte sur le compartiment anatomique.",
      "questions": [
        {
          "id": "pc1",
          "prompt": "Quel compartiment contient cet air ?",
          "options": [
            {
              "id": "a",
              "text": "La cavité pleurale"
            },
            {
              "id": "b",
              "text": "Le médiastin uniquement"
            },
            {
              "id": "c",
              "text": "L’intérieur des bronches"
            }
          ],
          "correctId": "a",
          "explanation": "Le décollement décrit sépare les feuillets pleuraux."
        },
        {
          "id": "pc2",
          "prompt": "Quel feuillet reste au contact du poumon ?",
          "options": [
            {
              "id": "a",
              "text": "Le pariétal"
            },
            {
              "id": "b",
              "text": "Le viscéral"
            },
            {
              "id": "c",
              "text": "La dure-mère"
            }
          ],
          "correctId": "b",
          "explanation": "Le feuillet viscéral adhère à la surface pulmonaire ; le pariétal tapisse la paroi."
        }
      ]
    },
    "pathologySlugs": [
      "pneumothorax",
      "epanchement-pleural",
      "pneumonie-aigue-communautaire"
    ],
    "sources": [
      {
        "title": "OpenStax · Voies respiratoires",
        "url": "https://openstax.org/books/anatomy-and-physiology-2e/pages/22-1-organs-and-structures-of-the-respiratory-system"
      },
      {
        "title": "OpenStax · Poumons",
        "url": "https://openstax.org/books/anatomy-and-physiology-2e/pages/22-2-the-lungs"
      },
      {
        "title": "OpenStax · Ventilation",
        "url": "https://openstax.org/books/anatomy-and-physiology-2e/pages/22-3-the-process-of-breathing"
      }
    ]
  },
  {
    "slug": "abdomen-digestif",
    "title": "Abdomen & tube digestif",
    "region": "Abdomen",
    "subtitle": "Reconstruire le trajet digestif.",
    "minutes": 12,
    "objectives": [
      "Ordonner les segments intestinaux.",
      "Repérer cæcum et appendice.",
      "Comprendre le rôle du mésentère."
    ],
    "structures": [
      {
        "id": "grele",
        "name": "Intestin grêle",
        "location": "Du pylore à la jonction iléocæcale.",
        "function": "Assure l’essentiel de la digestion et de l’absorption des nutriments.",
        "landmark": "Duodénum → jéjunum → iléon.",
        "clinical": "La localisation d’une lésion aide à comprendre les troubles d’absorption."
      },
      {
        "id": "caecum",
        "name": "Cæcum et appendice",
        "location": "Début du gros intestin, habituellement dans la fosse iliaque droite.",
        "function": "Le cæcum reçoit le contenu de l’iléon.",
        "landmark": "L’appendice naît du cæcum ; sa position est variable.",
        "clinical": "La variabilité de sa position peut modifier la présentation clinique."
      },
      {
        "id": "mesentere",
        "name": "Mésentère",
        "location": "Repli péritonéal reliant des anses digestives à la paroi postérieure.",
        "function": "Soutient les anses et véhicule vaisseaux, nerfs et lymphatiques.",
        "landmark": "Un repli de soutien, pas la lumière intestinale.",
        "clinical": "Une atteinte vasculaire mésentérique compromet la perfusion de l’intestin."
      }
    ],
    "questions": [
      {
        "id": "a1",
        "prompt": "Quel est l’ordre correct dans le grêle ?",
        "options": [
          {
            "id": "a",
            "text": "Iléon, duodénum, jéjunum"
          },
          {
            "id": "b",
            "text": "Duodénum, jéjunum, iléon"
          },
          {
            "id": "c",
            "text": "Jéjunum, iléon, duodénum"
          }
        ],
        "correctId": "b",
        "explanation": "Le duodénum suit l’estomac ; l’iléon se termine au cæcum."
      },
      {
        "id": "a2",
        "prompt": "L’appendice naît…",
        "options": [
          {
            "id": "a",
            "text": "Du cæcum"
          },
          {
            "id": "b",
            "text": "De l’estomac"
          },
          {
            "id": "c",
            "text": "Du rectum"
          }
        ],
        "correctId": "a",
        "explanation": "L’appendice est relié au cæcum."
      },
      {
        "id": "a3",
        "prompt": "Que véhicule notamment le mésentère ?",
        "options": [
          {
            "id": "a",
            "text": "De l’air bronchique"
          },
          {
            "id": "b",
            "text": "Le LCR"
          },
          {
            "id": "c",
            "text": "Des vaisseaux et des nerfs"
          }
        ],
        "correctId": "c",
        "explanation": "Le mésentère assure le passage des éléments vasculonerveux vers l’intestin."
      }
    ],
    "case": {
      "title": "Une douleur en fosse iliaque droite",
      "vignette": "Une douleur abdominale se localise en fosse iliaque droite. Une exploration identifie une inflammation d’un prolongement du cæcum. On te demande de décrire ses rapports digestifs.",
      "questions": [
        {
          "id": "ac1",
          "prompt": "Quelle structure est décrite ?",
          "options": [
            {
              "id": "a",
              "text": "Le pylore"
            },
            {
              "id": "b",
              "text": "L’appendice"
            },
            {
              "id": "c",
              "text": "L’œsophage"
            }
          ],
          "correctId": "b",
          "explanation": "L’appendice est un prolongement du cæcum."
        },
        {
          "id": "ac2",
          "prompt": "Quel segment du grêle se termine dans cette région ?",
          "options": [
            {
              "id": "a",
              "text": "Le duodénum"
            },
            {
              "id": "b",
              "text": "Le jéjunum proximal"
            },
            {
              "id": "c",
              "text": "L’iléon"
            }
          ],
          "correctId": "c",
          "explanation": "L’iléon rejoint le cæcum à la jonction iléocæcale ; ce rapport n’impose pas une position fixe de l’appendice."
        }
      ]
    },
    "pathologySlugs": [
      "appendicite-aigue",
      "occlusion-intestinale",
      "ischemie-mesenterique"
    ],
    "sources": [
      {
        "title": "OpenStax · Intestin grêle et côlon",
        "url": "https://openstax.org/books/anatomy-and-physiology-2e/pages/23-5-the-small-and-large-intestines"
      },
      {
        "title": "OpenStax · Organisation digestive",
        "url": "https://openstax.org/books/anatomy-and-physiology-2e/pages/23-1-overview-of-the-digestive-system"
      }
    ]
  },
  {
    "slug": "rein-voies-urinaires",
    "title": "Reins & voies urinaires",
    "region": "Abdomen & pelvis",
    "subtitle": "Du parenchyme à l’évacuation.",
    "minutes": 10,
    "objectives": [
      "Situer les reins dans le rétropéritoine.",
      "Suivre le trajet de l’urine.",
      "Distinguer uretère et urètre."
    ],
    "structures": [
      {
        "id": "rein",
        "name": "Reins",
        "location": "Dans le rétropéritoine, de part et d’autre du rachis.",
        "function": "Filtrent le plasma et contribuent à l’équilibre hydrique et électrolytique.",
        "landmark": "Le rein droit est habituellement plus bas que le gauche.",
        "clinical": "La situation postérieure explique l’intérêt de la région lombaire à l’examen."
      },
      {
        "id": "collecteur",
        "name": "Cavités collectrices",
        "location": "Au centre du rein.",
        "function": "Recueillent l’urine avant son passage dans l’uretère.",
        "landmark": "Papilles → calices → pelvis rénal.",
        "clinical": "Un obstacle en aval peut dilater les cavités en amont."
      },
      {
        "id": "uretere",
        "name": "Uretères",
        "location": "Du pelvis rénal à la vessie.",
        "function": "Transportent l’urine par péristaltisme.",
        "landmark": "L’uretère relie rein et vessie ; l’urètre conduit vers l’extérieur.",
        "clinical": "Un calcul urétéral peut gêner l’écoulement de l’urine."
      }
    ],
    "questions": [
      {
        "id": "r1",
        "prompt": "Les reins sont principalement…",
        "options": [
          {
            "id": "a",
            "text": "Intrapéritonéaux"
          },
          {
            "id": "b",
            "text": "Rétropéritonéaux"
          },
          {
            "id": "c",
            "text": "Intrathoraciques"
          }
        ],
        "correctId": "b",
        "explanation": "Ils sont en arrière du péritoine pariétal."
      },
      {
        "id": "r2",
        "prompt": "Quelle structure relie le rein à la vessie ?",
        "options": [
          {
            "id": "a",
            "text": "Urètre"
          },
          {
            "id": "b",
            "text": "Uretère"
          },
          {
            "id": "c",
            "text": "Veine rénale"
          }
        ],
        "correctId": "b",
        "explanation": "L’uretère transporte l’urine ; la veine rénale transporte du sang."
      },
      {
        "id": "r3",
        "prompt": "Après les calices, l’urine rejoint…",
        "options": [
          {
            "id": "a",
            "text": "Le pelvis rénal"
          },
          {
            "id": "b",
            "text": "L’artère rénale"
          },
          {
            "id": "c",
            "text": "Le cortex cérébral"
          }
        ],
        "correctId": "a",
        "explanation": "Les calices convergent vers le pelvis rénal, qui se poursuit par l’uretère."
      }
    ],
    "case": {
      "title": "Une dilatation en amont",
      "vignette": "L’imagerie montre un calcul dans l’uretère gauche, avec dilatation des cavités collectrices du même côté. Tu dois expliquer le trajet concerné.",
      "questions": [
        {
          "id": "rc1",
          "prompt": "Où se trouve l’obstacle ?",
          "options": [
            {
              "id": "a",
              "text": "Entre la vessie et l’extérieur"
            },
            {
              "id": "b",
              "text": "Dans une artère"
            },
            {
              "id": "c",
              "text": "Entre le rein et la vessie"
            }
          ],
          "correctId": "c",
          "explanation": "L’uretère conduit du pelvis rénal à la vessie."
        },
        {
          "id": "rc2",
          "prompt": "Quel compartiment peut se dilater en amont ?",
          "options": [
            {
              "id": "a",
              "text": "Les calices et le pelvis rénal"
            },
            {
              "id": "b",
              "text": "Le ventricule droit"
            },
            {
              "id": "c",
              "text": "Les bronches"
            }
          ],
          "correctId": "a",
          "explanation": "L’obstruction de l’écoulement urinaire peut distendre les cavités collectrices."
        }
      ]
    },
    "pathologySlugs": [
      "lithiase-colique-nephretique",
      "pyelonephrite-aigue",
      "insuffisance-renale-aigue"
    ],
    "sources": [
      {
        "title": "OpenStax · Anatomie du rein",
        "url": "https://openstax.org/books/anatomy-and-physiology-2e/pages/25-3-gross-anatomy-of-the-kidney"
      },
      {
        "title": "OpenStax · Transport urinaire",
        "url": "https://openstax.org/books/anatomy-and-physiology-2e/pages/25-2-gross-anatomy-of-urine-transport"
      }
    ]
  },
  {
    "slug": "nerfs-membres",
    "title": "Nerfs des membres",
    "region": "Membres",
    "subtitle": "Du mouvement au nerf périphérique.",
    "minutes": 12,
    "objectives": [
      "Associer les grands nerfs à des fonctions motrices.",
      "Distinguer nerf périphérique et racine.",
      "Raisonner sur un déficit focal."
    ],
    "structures": [
      {
        "id": "radial",
        "name": "Nerf radial",
        "location": "Issu du plexus brachial ; chemine dans le bras puis l’avant-bras.",
        "function": "Innerve notamment les muscles extenseurs du poignet et des doigts.",
        "landmark": "L’extension du poignet explore une fonction radiale.",
        "clinical": "Un déficit radial peut donner une chute du poignet."
      },
      {
        "id": "median",
        "name": "Nerf médian",
        "location": "Traverse l’avant-bras puis le canal carpien.",
        "function": "Participe notamment à l’opposition du pouce.",
        "landmark": "Le canal carpien est un passage au poignet.",
        "clinical": "Une compression peut associer troubles sensitifs et faiblesse thénarienne."
      },
      {
        "id": "fibulaire",
        "name": "Nerf fibulaire commun",
        "location": "Branche du sciatique, au voisinage du col de la fibula.",
        "function": "Ses branches contribuent à la dorsiflexion et à l’éversion du pied.",
        "landmark": "Le col de la fibula est une zone de vulnérabilité.",
        "clinical": "Une atteinte peut provoquer un pied tombant ; ce signe n’est pas spécifique."
      }
    ],
    "questions": [
      {
        "id": "m1",
        "prompt": "Quelle fonction explore surtout le nerf radial ?",
        "options": [
          {
            "id": "a",
            "text": "Extension du poignet"
          },
          {
            "id": "b",
            "text": "Flexion plantaire"
          },
          {
            "id": "c",
            "text": "Fermeture de la paupière"
          }
        ],
        "correctId": "a",
        "explanation": "Le radial innerve les extenseurs du poignet et des doigts."
      },
      {
        "id": "m2",
        "prompt": "Quel nerf traverse le canal carpien ?",
        "options": [
          {
            "id": "a",
            "text": "Ulnaire"
          },
          {
            "id": "b",
            "text": "Médian"
          },
          {
            "id": "c",
            "text": "Fibulaire"
          }
        ],
        "correctId": "b",
        "explanation": "Le médian traverse le canal carpien au poignet."
      },
      {
        "id": "m3",
        "prompt": "Quel nerf est vulnérable au col de la fibula ?",
        "options": [
          {
            "id": "a",
            "text": "Radial"
          },
          {
            "id": "b",
            "text": "Médian"
          },
          {
            "id": "c",
            "text": "Fibulaire commun"
          }
        ],
        "correctId": "c",
        "explanation": "Son trajet superficiel au voisinage du col fibulaire l’expose aux compressions."
      }
    ],
    "case": {
      "title": "Un poignet qui ne se relève plus",
      "vignette": "Après une compression prolongée du bras, un patient présente une difficulté à étendre le poignet. L’exercice demande une hypothèse de localisation, sans conclure à partir d’un seul signe.",
      "questions": [
        {
          "id": "mc1",
          "prompt": "Quel nerf faut-il explorer en priorité ?",
          "options": [
            {
              "id": "a",
              "text": "Le radial"
            },
            {
              "id": "b",
              "text": "Le médian"
            },
            {
              "id": "c",
              "text": "Le tibial"
            }
          ],
          "correctId": "a",
          "explanation": "La faiblesse des extenseurs du poignet oriente vers le radial."
        },
        {
          "id": "mc2",
          "prompt": "Quelle démarche affine la localisation ?",
          "options": [
            {
              "id": "a",
              "text": "Conclure sur le seul poignet"
            },
            {
              "id": "b",
              "text": "Comparer force, sensibilité et autres territoires"
            },
            {
              "id": "c",
              "text": "Ignorer les signes associés"
            }
          ],
          "correctId": "b",
          "explanation": "L’ensemble du bilan moteur et sensitif aide à distinguer nerf périphérique, racine et atteinte centrale."
        }
      ]
    },
    "pathologySlugs": [
      "syndrome-guillain-barre",
      "syndromes-medullaires"
    ],
    "sources": [
      {
        "title": "OpenStax · Système nerveux périphérique",
        "url": "https://openstax.org/books/anatomy-and-physiology-2e/pages/13-4-the-peripheral-nervous-system"
      },
      {
        "title": "NCBI Bookshelf · Nerf radial",
        "url": "https://www.ncbi.nlm.nih.gov/books/NBK534840/"
      },
      {
        "title": "NCBI Bookshelf · Nerf médian",
        "url": "https://www.ncbi.nlm.nih.gov/books/NBK448084/"
      },
      {
        "title": "NCBI Bookshelf · Nerf fibulaire commun",
        "url": "https://www.ncbi.nlm.nih.gov/books/NBK532968/"
      }
    ]
  }
];

export function getAnatomyModule(slug: string) { return anatomyModules.find((module) => module.slug === slug); }
