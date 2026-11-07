export interface RelicDef {
  id: string;
  title: string;
  name: string;
  epoch: string;
  dating: string;
  location: string;
  locationHint: string;
  icon: string;
  image: string;
  frontIcon: string;
  backIcon: string;
  lore: string;
  description: string;
  backInscription: string;
  scientificReport: string;
  merksatz: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export const GREEK_RELICS: Record<string, RelicDef> = {
  relic_amphore: {
    id: 'relic_amphore',
    title: 'Schwarzfigurige Panathenäische Preisamphore',
    name: 'Schwarzfigurige Panathenäische Preisamphore',
    epoch: 'Archaische & Klassische Zeit (~530 v. Chr.)',
    dating: 'ca. 530 v. Chr. (Archaische Zeit)',
    location: 'Kerameikos & Akropolis von Athen',
    locationHint: 'Nahe der Töpferwerkstatt und Olivenpresse im Attika-Tal (Kapitel 1–2)',
    icon: '🏺',
    image: 'assets/icons/relic_amphore.png',
    frontIcon: '🏺',
    backIcon: '🏃',
    lore: 'Aus eisenreichem attischen Ton geformt und im dreistufigen Brennverfahren kunstvoll veredelt. Auf der Vorderseite prangt die bewaffnete Stadtgöttin Athene, auf der Rückseite Wettläufer oder Wagenlenker. Gefüllt mit knapp 40 Litern heiligem Olivenöl war sie der begehrte Siegerpreis bei den Panathenäischen Spielen.',
    description:
      'Bauchige Preisamphore aus rotbraunem attischem Ton im schwarzfigurigen Stil. Gefüllt mit wertvollem Olivenöl aus den heiligen Hainen der Stadtgöttin Athene.',
    backInscription:
      'Altgriechische Inschrift am Säulenrand: „ΤΟΝ ΑΘΕΝΕΘΕΝ ΑΘΛΟΝ“ (Ton Athenethen Athlon) – „Einer der Wettkampfpreise aus Athen“. Rückseite: Vier Sprinter im Stadionlauf.',
    scientificReport:
      'Brennverfahren: Dreiphasiger Reduktions-Oxidationsbrand bei ca. 900 °C im Töpferviertel Kerameikos. Fassungsvermögen: ca. 38 Liter Olivenöl.',
    merksatz:
      'Merksatz: Schwarzfigurige Amphoren aus Athen transportierten Olivenöl durch das gesamte Mittelmeer und dienten bei Festspielen als begehrte Siegerpreise.',
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
    name: 'Silberne Eulen-Tetradrachme von Athen',
    epoch: 'Klassische Blütezeit Athens (~450 v. Chr.)',
    dating: 'ca. 450 v. Chr. (Klassische Blütezeit)',
    location: 'Silberbergwerke von Laureion / Agora von Athen',
    locationHint: 'Bei den Silberadern von Laureion nahe der Pnyx (Kapitel 4)',
    icon: '🦉',
    image: 'assets/icons/relic_eule.png',
    frontIcon: '🦉',
    backIcon: '🪖',
    lore: 'Geprägt aus fast reinem Silber (17 Gramm) aus den Bergwerken von Laureion. Die Vorderseite zeigt den behelmten Kopf der Stadtgöttin Athene, die Rückseite ihren heiligen Steinkauz (die Eule der Weisheit), einen Olivenzweig und die Buchstaben ΑΘΕ (für Athen). Sie galt im gesamten Mittelmeerraum als verlässlichste Leitwährung.',
    description:
      'Schwere Silbermünze zu vier Drachmen (ca. 17,2 Gramm Feinsilber) mit dem behelmten Profil der Göttin Athene und ihrer heiligen Eule.',
    backInscription:
      'Rückseiten-Prägung im Quadratum incusum: Steinkauz (Eule der Weisheit), links Olivenzweig und Mondsichel, rechts die drei Buchstaben ΑΘΕ („der Athener“).',
    scientificReport:
      'Metallurgische Analyse: 98,5 % reines Silber aus den Gruben von Laureion (Süd-Attika). Leitwährung des gesamten östlichen Mittelmeerraums im 5. Jh. v. Chr.',
    merksatz:
      'Merksatz: Die Silberdrachme mit der Eule der Athene machte Athen zur führenden Handels- und Seemacht und finanzierte Flotte sowie Demokratie.',
    question: 'Wofür steht die berühmte Eule auf den athenischen Silbermünzen (und heute noch auf dem griechischen 1-Euro-Stück)?',
    options: [
      'Für die Weisheit der Stadtgöttin Athene und die Wirtschaftskraft Athens',
      'Für die spartanische Nachtwache',
      'Für den persischen Großkönig Xerxes',
    ],
    correct: 0,
    explanation: 'Genau! Daher stammt auch das Sprichwort „Eulen nach Athen tragen“ (etwas Überflüssiges tun, weil es in Athen schon unzählige Silber-Eulen gab).',
  },
  relic_agamemnon: {
    id: 'relic_agamemnon',
    title: 'Goldmaske von Mykene („Maske des Agamemnon“)',
    name: 'Goldmaske von Mykene („Maske des Agamemnon“)',
    epoch: 'Mykenische Frühzeit (~1550 v. Chr.)',
    dating: 'ca. 1550 v. Chr. (Mykenische Bronzezeit)',
    location: 'Königliche Schachtgräber von Mykene (Peloponnes)',
    locationHint: 'Im spartanischen Bergland auf der Peloponnes (Kapitel 3)',
    icon: '🎭',
    image: 'assets/icons/relic_agamemnon.png',
    frontIcon: '🎭',
    backIcon: '👑',
    lore: 'Aus einem einzigen dicken Goldblech getriebene Totenmaske eines mykenischen Fürsten aus den Schachtgräbern von Mykene auf der Peloponnes. Als der Archäologe Heinrich Schliemann sie 1876 entdeckte, glaubte er, in das Antlitz des sagenhaften Königs Agamemnon aus Homers „Ilias“ zu blicken.',
    description:
      'Aus massivem Goldblech getriebene Totenmaske eines frühgriechischen Herrschers aus der Burg von Mykene.',
    backInscription:
      'Feine Treibspuren auf der Innenseite des Goldblechs sowie seitliche Ösen zur Befestigung auf dem Antlitz des bestatteten Fürsten.',
    scientificReport:
      'Archäometrische Datierung: Schachtgrab V von Mykene (ca. 1550 v. Chr.) – rund 300 Jahre älter als der sagenhafte Trojanische Krieg!',
    merksatz:
      'Merksatz: Die mykenische Kultur auf der Peloponnes bildete die bronzezeitliche Wurzel der griechischen Heldensagen Homers (Ilias & Odyssee).',
    question: 'Welche beiden weltberühmten Heldenepen des Dichters Homer bewahrten die Erinnerung an die Frühzeit der Griechen und den Kampf um Troja?',
    options: [
      'Ilias und Odyssee',
      'Gilgamesch und Totenbuch',
      'Max und Moritz',
    ],
    correct: 0,
    explanation: 'Richtig! Homers „Ilias“ (Kampf um Troja) und „Odyssee“ (Irrfahrten des Odysseus) kannte im antiken Griechenland jedes Schulkind!',
  },
  relic_antikythera: {
    id: 'relic_antikythera',
    title: 'Mechanismus von Antikythera (Antiker Zahnrad-Computer)',
    name: 'Mechanismus von Antikythera (Antiker Zahnrad-Computer)',
    epoch: 'Hellenistische Wissenschaft (~150 v. Chr.)',
    dating: 'ca. 150–100 v. Chr. (Hellenistische Epoche)',
    location: 'Antikes Schiffswrack vor der Insel Antikythera',
    locationHint: 'Nahe dem Pharos-Leuchtturm und Kriegshafen (Kapitel 7–9)',
    icon: '⚙️',
    image: 'assets/icons/relic_antikythera.png',
    frontIcon: '⚙️',
    backIcon: '🌙',
    lore: 'In einem antiken Schiffswrack vor der Insel Antikythera geborgen: Über 30 feinmechanische Bronze-Zahnräder mit tausenden eingravierten griechischen Buchstaben! Mit einer Kurbel an der Seite ließen sich Sonnen- und Mondfinsternisse, Planetenbahnen und sogar die Termine der Olympischen Spiele exakt vorausberechnen.',
    description:
      'Komplexes astronomisches Präzisionsinstrument aus ineinandergreifenden Dreieckszahn-Bronzerädern in einem Holz-Bronze-Gehäuse.',
    backInscription:
      'Feine astronomische Skalenringe auf der Rückseite: Metonischer 19-Jahres-Kalender, Saros-Finsternis-Zyklus und Panhellenische Spiele-Anzeige (Olympia, Delphi, Korinth, Nemea).',
    scientificReport:
      'Röntgen-Computertomographie (CT): Über 30 feinmechanische Zahnräder mit Differentialgetriebe – eine technische Meisterleistung des Hellenismus!',
    merksatz:
      'Merksatz: Im Hellenismus erreichten griechische Mathematik, Astronomie und Ingenieurskunst (Alexandria, Archimedes, Antikythera) einen wissenschaftlichen Höhepunkt.',
    question: 'Was war der berühmte „Mechanismus von Antikythera“ aus der Epoche des Hellenismus?',
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
    name: 'Königsbüste Alexanders des Großen',
    epoch: 'Hellenistisches Weltreich (~325 v. Chr.)',
    dating: 'ca. 325 v. Chr. (Beginn des Hellenismus)',
    location: 'Museion & Königsviertel von Alexandria',
    locationHint: 'Bei der Großen Bibliothek und dem Leuchtturm im Südosten (Kapitel 9–10)',
    icon: '👑',
    image: 'assets/icons/relic_alexander.png',
    frontIcon: '👑',
    backIcon: '🗺️',
    lore: 'Aus edlem Marmor von seinem Hofbildhauer Lysipp geschaffen: Charakteristisch sind die leicht zur Seite geneigte Kopfhaltung, der sehnsuchtsvolle Blick gen Himmel und die aufstrebende Haarmähne („Anastole“) über der Stirn. In nur 13 Jahren schuf der junge Makedonenkönig ein Weltreich von Griechenland über Ägypten bis an den Indus.',
    description:
      'Porträtbüste Alexanders des Großen aus weißem Marmor mit der charakteristischen Löwenmähne (Anastole).',
    backInscription:
      'Sockelinschrift in griechischer Koine-Schrift: „ΑΛΕΞΑΝΔΡΟΣ ΦΙΛΙΠΠΟΥ ΜΑΚΕΔΩΝ“ – „Alexander, Sohn des Philipp, Makedone“.',
    scientificReport:
      'Stilkritische Untersuchung: Kopie nach einem Bronzeoriginal des Hofbildhauers Lysipp; Vorbild für Herrscherporträts der gesamten Antike.',
    merksatz:
      'Merksatz: Durch Alexanders Weltreich verschmolzen griechische und orientalische Kultur zum Hellenismus; Griechisch (Koine) wurde zur Weltsprache.',
    question: 'Wie nennt man das historische Zeitalter ab Alexanders Feldzug, in dem sich griechische Sprache und Kultur mit der orientalischen Welt vermischten?',
    options: [
      'Hellenismus',
      'Steinzeit',
      'Mittelalter',
    ],
    correct: 0,
    explanation: 'Richtig! Im Hellenismus (abgeleitet von „Hellas“ = Griechenland) wurde Griechisch zur Weltsprache von Alexandria bis nach Vorderasien.',
  },
};

export const RELICS: RelicDef[] = Object.values(GREEK_RELICS);
