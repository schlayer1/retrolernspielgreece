export interface RelicDef {
  id: string;
  title: string;
  epoch: string;
  icon: string;
  image: string;
  locationHint: string;
  lore: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export const GREEK_RELICS: Record<string, RelicDef> = {
  relic_amphore: {
    id: 'relic_amphore',
    title: 'Schwarzfigurige Panathenäische Preisamphore',
    epoch: 'Archaische & Klassische Zeit (~530 v. Chr.)',
    icon: '🏺',
    image: 'assets/icons/relic_amphore.png',
    locationHint: 'Nahe der Töpferwerkstatt und Olivenpresse im Attika-Tal (Kapitel 1–2)',
    lore: 'Aus eisenreichem attischen Ton geformt und im dreistufigen Brennverfahren kunstvoll veredelt. Auf der Vorderseite prangt die bewaffnete Stadtgöttin Athene, auf der Rückseite Wettläufer oder Wagenlenker. Gefüllt mit knapp 40 Litern heiligem Olivenöl war sie der begehrte Siegerpreis bei den Panathenäischen Spielen.',
    question: 'Was wurde in antiken griechischen Amphoren auf Handelsschiffen vor allem rund um das Mittelmeer transportiert?',
    options: [
      'Olivenöl, Wein und Getreide',
      'Flüssiges Eisen und Schießpulver',
      'Gefrorenes Gletschereis vom Olymp',
    ],
    correct: 0,
    explanation: 'Richtig! Amphoren waren die „Einweg-Container“ der Antike: Darin verschifften die Griechen ihr berühmtes Olivenöl und ihren Wein in alle Kolonien.',
  },
  relic_eule: {
    id: 'relic_eule',
    title: 'Silberne Eulen-Tetradrachme von Athen',
    epoch: 'Klassische Blütezeit Athens (~450 v. Chr.)',
    icon: '🦉',
    image: 'assets/icons/relic_eule.png',
    locationHint: 'Bei den Silberadern von Laureion nahe der Pnyx (Kapitel 4)',
    lore: 'Geprägt aus fast reinem Silber (17 Gramm) aus den Bergwerken von Laureion. Die Vorderseite zeigt den behelmten Kopf der Stadtgöttin Athene, die Rückseite ihren heiligen Steinkauz (die Eule der Weisheit), einen Olivenzweig und die Buchstaben ΑΘΕ (für Athen). Sie galt im gesamten Mittelmeerraum als verlässlichste Leitwährung.',
    question: 'Wofür steht die berühmte Eule auf den athenischen Silbermünzen (und heute noch auf der griechischen 1-Euro-Münze)?',
    options: [
      'Für die Nachtjagd der Spartaner',
      'Als heiliges Begleittier der Göttin Athene für Weisheit und die Stadt Athen',
      'Als Warnung vor Waldeulen im Gebirge',
    ],
    correct: 1,
    explanation: 'Genau! Die Eule war das Symboltier der Weisheitsgöttin Pallas Athene. Daher stammt auch das Sprichwort „Eulen nach Athen tragen“!',
  },
  relic_agamemnon: {
    id: 'relic_agamemnon',
    title: 'Goldmaske von Mykene („Maske des Agamemnon“)',
    epoch: 'Mykenische Frühzeit / Heroenzeit (~1550 v. Chr.)',
    icon: '🎭',
    image: 'assets/icons/relic_agamemnon.png',
    locationHint: 'Am alten Heroen-Steingrab nahe dem spartanischen Gebirgslager (Kapitel 3 & 6)',
    lore: 'Aus dünnem Goldblech getriebene Totenmaske eines frühgriechischen Fürsten. Als der deutsche Archäologe Heinrich Schliemann sie 1876 in einem Schachtgrab von Mykene entdeckte, telegraphierte er begeistert an den König von Griechenland: „Ich habe in das Antlitz des Agamemnon geblickt!“ – des sagenhaften Heerführers aus Homers Ilias.',
    question: 'Welcher berühmte Dichter verfasste die beiden großen Epen „Ilias“ (Kampf um Troja) und „Odyssee“, die alle Griechen verbanden?',
    options: [
      'Homer',
      'Julius Cäsar',
      'Kaiser Nero',
    ],
    correct: 0,
    explanation: 'Richtig! Homers Epen über den Trojanischen Krieg und die Irrfahrten des Odysseus waren das gemeinsame Kulturgut aller griechischen Stadtstaaten.',
  },
  relic_antikythera: {
    id: 'relic_antikythera',
    title: 'Der Mechanismus von Antikythera',
    epoch: 'Hellenismus (~150–100 v. Chr.)',
    icon: '⚙️',
    image: 'assets/icons/relic_antikythera.png',
    locationHint: 'Am Hafen-Kai von Piräus nahe den Schiffen (Kapitel 7–10)',
    lore: 'Ein technisches Wunderwerk der Antike, geborgen aus einem antiken Schiffswrack vor der Insel Antikythera: Über 30 fein verzahnte Bronze-Zahnräder in einem Gehäuse berechneten präzise die Bahnen von Sonne, Mond, Mondfinsternissen und sogar den Vierjahres-Zyklus der Olympischen Spiele! Er gilt als der älteste bekannte analoge Computer der Menschheitsgeschichte.',
    question: 'Was war der „Mechanismus von Antikythera“, den griechische Gelehrte im Hellenismus konstruierten?',
    options: [
      'Eine mechanische Kaffeemühle für den Königshof',
      'Ein hochkomplexes Zahnrad-Rechengerät zur Berechnung von Sonne, Mond und Olympischen Spielen',
      'Ein Ruderantrieb mit Dampfmaschine',
    ],
    correct: 1,
    explanation: 'Exakt! Erst über 1.400 Jahre später erreichte die Menschheit beim Bau mittelalterlicher Räderuhren wieder eine vergleichbare Feinmechanik!',
  },
  relic_alexander: {
    id: 'relic_alexander',
    title: 'Königsbüste Alexanders des Großen',
    epoch: 'Hellenistisches Weltreich (~325 v. Chr.)',
    icon: '👑',
    image: 'assets/icons/relic_alexander.png',
    locationHint: 'Bei der Großen Bibliothek und dem Leuchtturm im Südosten (Kapitel 9–10)',
    lore: 'Aus edlem Marmor von seinem Hofbildhauer Lysipp geschaffen: Charakteristisch sind die leicht zur Seite geneigte Kopfhaltung, der sehnsuchtsvolle Blick gen Himmel und die aufstrebende Haarmähne („Anastole“) über der Stirn. In nur 13 Jahren schuf der junge Makedonenkönig ein Weltreich von Griechenland über Ägypten bis an den Indus.',
    question: 'Wie nennt man das historische Zeitalter ab Alexanders Feldzug, in dem sich griechische Sprache und Kultur mit der orientalischen Welt vermischten?',
    options: [
      'Hellenismus',
      'Steinzeit',
      'Mittelalter',
    ],
    correct: 0,
    explanation: 'Richtig! Im Hellenismus (abgeleitete von „Hellas“ = Griechenland) wurde Griechisch zur Weltsprache von Alexandria bis nach Vorderasien.',
  },
};
