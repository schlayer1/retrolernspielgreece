import { LEXICON, LEXICON_LIST, type LexiconEntry } from './lexicon';
export { LEXICON, LEXICON_LIST, type LexiconEntry };

export interface EpochComparisonRow {
  dimension: string;
  archaisch: string;
  klassisch: string;
  hellenismus: string;
}

export type GreekPhaseComparisonRow = EpochComparisonRow;

export interface ChapterMusicDef {
  trackId: string;
  title: string;
  mood: string;
  prompt: string;
}

export interface ChapterDef {
  id: number;
  title: string;
  epoch: string;
  period: string;
  mentor: string;
  mentorRole: string;
  targetInterior?: string;
  music?: ChapterMusicDef;
  quests: string[];
  hints: string[];
  intro: Array<{ text: string }>;
  quiz: Array<{ question: string; options: string[]; correct: number; explain: string }>;
  summary: string;
}

export const HIGHLIGHT_TERMS: string[] = [
  'Polis',
  'Poleis',
  'Akropolis',
  'Agora',
  'Hellas',
  'Hellenen',
  'Kolonisation',
  'Apoikie',
  'Metropolis',
  'Olivenbaum',
  'Amphore',
  'Sparta',
  'Spartiaten',
  'Periöken',
  'Heloten',
  'Agoge',
  'Hoplit',
  'Phalanx',
  'Athen',
  'Demokratie',
  'Ekklesia',
  'Ostrakismos',
  'Scherbengericht',
  'Drachme',
  'Polytheismus',
  'Olymp',
  'Zeus',
  'Athene',
  'Orakel von Delphi',
  'Olympische Spiele',
  'Ekecheiria',
  'Perserkriege',
  'Marathon',
  'Thermopylen',
  'Leonidas',
  'Trireme',
  'Salamis',
  'Themistokles',
  'Peloponnesischer Krieg',
  'Philosophie',
  'Sokrates',
  'Platon',
  'Aristoteles',
  'Alexander der Große',
  'Sarissa',
  'Gordischer Knoten',
  'Alexandria',
  'Hellenismus',
  'Diadochen',
];

export const EPOCH_COMPARISON: EpochComparisonRow[] = [
  {
    dimension: '1. Epoche, Phase & Zeitspanne',
    archaisch: 'Frühzeit & Archaische Epoche (~800–500 v. Chr.): Geburt der Polis, Aufbruch der Seefahrer und Große Kolonisation im Mittelmeer.',
    klassisch: 'Klassische Epoche & Blütezeit (~500–336 v. Chr.): Abwehr der Perserkriege, Attische Demokratie, Parthenon-Tempel, Theater & Philosophie.',
    hellenismus: 'Zeitalter des Hellenismus (~336–30 v. Chr.): Alexanders Weltreich, Großmetropole Alexandria und Aufteilung in Diadochen-Königreiche.',
  },
  {
    dimension: '2. Siedlung & Wohnform',
    archaisch: 'Dörfliche Burgsiedlungen mit ersten Bruchsteinhäusern rund um die Akropolis (Schutzburg) sowie überseeische Pflanzstädte (Apoikien).',
    klassisch: 'Monumentale Stadtstaaten (Poleis) aus weißem Marmor mit Agora (Marktplatz), Pnyx (Rednerbühne), Gymnasion und Dionysos-Theater.',
    hellenismus: 'Schachbrettartig geplante Weltmetropolen (wie Alexandria) mit breiten Prachtstraßen, Palastvierteln und dem 100 m hohen Pharos-Leuchtturm.',
  },
  {
    dimension: '3. Ernährung & Wirtschaft / Wasser',
    archaisch: 'Mittelmeer-Trias: Karge Gerste, Olivenhaine und Weinberge; Ziegenkäse; Zisternen-Wasser und Tauschhandel in Tonamphoren.',
    klassisch: 'Ausgedehnter Ägäis-Seehandel mit befestigtem Kriegshafen (Piräus); Silberbergbau von Laureion und geprägte Eulen-Drachmen.',
    hellenismus: 'Kontinentaler Welthandel über Karawanen und Großschiffe bis nach Babylon, Ägypten und Indien; Kornkammern und Nil-Handel.',
  },
  {
    dimension: '4. Werkzeuge, Technik & Monumente',
    archaisch: 'Eiserne Pflugscharen, handbetriebene Hebel-Olivenpressen, schwarzfigurige Vasen und frühe dorische Kalksteintempel.',
    klassisch: 'Dreirangige Kriegsschiffe (Triremen mit Rammsporn), Hopliten-Rüstung (Aspis, Dory), Parthenon-Tempelbau und vollendete Bildhauerei.',
    hellenismus: 'Wissenschaftliches Ingenieurwesen, 6-Meter-Sarissa-Lanzen, Katapulte, Große Bibliothek von Alexandria und Antikythera-Mechanismus.',
  },
  {
    dimension: '5. Gesellschaft, Schrift & Herrschaft',
    archaisch: 'Vorherrschaft adeliger Großgrundbesitzer (Aristokratie); frühe Gesetzgeber (Solon) und 24-Buchstaben-Alphabet mit Vokalen.',
    klassisch: 'Erste Demokratie der Bürger in Athen (Ekklesia, Scherbengericht/Ostrakismos) vs. strenger Kriegerstaat in Sparta (Agoge & Heloten).',
    hellenismus: 'Gottähnliche Diadochen-Monarchien (Ptolemäer, Seleukiden); Griechisch (Koine) wird internationale Weltsprache von Kultur & Handel.',
  },
];

export const CHAPTERS: Record<number, ChapterDef> = {
  1: {
    id: 1,
    title: 'Kapitel 1: Die Geburt der Polis – Berge, Buchten & Olivenhaine',
    epoch: 'Frühe Archaische Zeit',
    period: 'ca. 800 v. Chr.',
    mentor: 'Dorfältester Nikolaos',
    mentorRole: 'Gründervater der Polis auf der Agora',
    targetInterior: 'kerameikos_werkstatt',
    music: {
      trackId: 'ch1_polis',
      title: 'Olivenhaine & Geburt der Polis',
      mood: 'Warm, mediterran, Lyra & Aulos',
      prompt: '16-bit SNES RPG soundtrack, ancient Greek olive grove and village agora, warm kithara lyre, gentle aulos flute, Mediterranean breeze, 92 BPM',
    },
    quests: [
      'Sprich mit Dorfältestem Nikolaos auf der Agora (E)',
      'Sammle 2× Olivenholz und 2× hellen Kalkstein im Tal (E)',
      'Schöpfe frisches Quellwasser an der steinernen Zisterne (E)',
      'Lockere ein Ackerbeet auf, säe Gerste und bewässere es (E)',
      'Ernte die reife Gerste mit der Sichel und pflücke 2× Oliven (E)',
      'Errichte die Attische Olivenpresse am Hain (E)',
      'Presse 1× goldenes Olivenöl im Handwerksmenü (Taste C)',
      'Kehre zu Nikolaos zurück und lege die Polis-Prüfung ab!',
    ],
    hints: [
      'Dorfältester Nikolaos erwartet dich auf dem gepflasterten Agora-Platz im Zentrum.',
      'Olivenholz und Kalksteinblöcke liegen rund um den Olivenhain im Südwesten.',
      'Tritt an das blaue Wasserbecken (Zisterne) nördlich der Felder und drücke E.',
      'Gehe zu einem der 6 Ackerbeete im Südwesten und drücke mehrmals E (Hacken ➔ Säen ➔ Gießen).',
      'Sobald die Gerste golden leuchtet, ernte sie mit E und pflücke Oliven von den Bäumen.',
      'Gehe zum Bauplatz der Olivenpresse westlich der Beete und drücke E.',
      'Öffne das Handwerk mit Taste C und presse goldenes Olivenöl.',
      'Sprich erneut mit Nikolaos auf der Agora!',
    ],
    intro: [
      {
        text: 'Chaire, junger Hellene! Schau dich um in unserem Land Hellas: Hohe Kalksteingebirge und tiefblaue Meeresbuchten trennen unsere Täler voneinander.',
      },
      {
        text: 'Anders als am Nil gibt es bei uns keinen einzelnen Pharao! Jedes Tal bildet einen eigenen freien Stadtstaat – eine Polis – mit dem Burgberg (Akropolis) oben und unserem Marktplatz (Agora) hier unten. Hilf uns, unsere Polis mit Gerste und dem goldenen Öl des Olivenbaums zu ernähren!',
      },
    ],
    quiz: [
      {
        question: 'Warum entstand im antiken Griechenland kein einheitlicher Zentralstaat wie in Ägypten, sondern hunderte unabhängige Stadtstaaten (Poleis)?',
        options: [
          'Weil hohe Gebirge, enge Täler und hunderte Inseln das Land natürlich voneinander trennten',
          'Weil die Griechen keine Häuser bauen konnten',
          'Weil ein Gesetz verbot, Straßen zu bauen',
          'Weil ganz Griechenland aus einer flachen Sandwüste bestand',
        ],
        correct: 0,
        explain: 'Richtig! Durch die zerklüftete Gebirgs- und Inselwelt entwickelte sich in fast jedem Tal und auf jeder Insel eine eigene, selbstständige Polis.',
      },
      {
        question: 'Welche beiden zentralen Orte gehörten zum Aufbau fast jeder griechischen Polis?',
        options: [
          'Pyramide und Nilometer',
          'Akropolis (geschützter Burg- & Tempelberg) und Agora (Markt- & Versammlungsplatz)',
          'Ritterburg und Turnierplatz',
          'Einkaufszentrum und Bahnhof',
        ],
        correct: 1,
        explain: 'Exakt! Die Akropolis bot Schutz und beherbergte das Hauptheiligtum, während auf der Agora gehandelt und über Politik beraten wurde.',
      },
    ],
    summary: 'Du hast die Grundlagen der griechischen Polis gemeistert: Trotz Gebirgen und kargen Böden legten Gerstenanbau und die Kunst der Olivenölgewinnung das Fundament der griechischen Kultur!',
  },

  2: {
    id: 2,
    title: 'Kapitel 2: Aufbruch übers Meer – Die Große Kolonisation',
    epoch: 'Archaische Zeit',
    period: 'ca. 750–550 v. Chr.',
    mentor: 'Kapitän & Oikist Telesikles',
    mentorRole: 'Gründer neuer Pflanzstädte (Apoikien) am Hafen',
    targetInterior: 'kerameikos_werkstatt',
    music: {
      trackId: 'ch2_kolonisation',
      title: 'Aufbruch über die Ägäis',
      mood: 'Abenteuerlich, maritimer 6/8-Takt, Lyra & Flöte',
      prompt: '16-bit SNES RPG sailing theme, ancient Greek colonization across the Aegean sea, adventurous lyre and pan flute, rolling waves rhythm, 108 BPM',
    },
    quests: [
      'Sprich mit Kapitän Telesikles am Hafen von Piräus (E)',
      'Schere oder sammle 2× weiße Wolle an der Ziegenkoppel (E)',
      'Webe 1× reißfestes Segeltuch im Handwerksmenü (Taste C)',
      'Errichte die Schiffswerft von Piräus am Hafen-Kai (E)',
      'Grabe 2× roten Töpferton am Ufer und töpfere 1× Amphore (Taste C)',
      'Binde 1× Heilige Fackel mit dem Herdfeuer der Mutterstadt (Taste C)',
      'Rüste das Kolonistenschiff am Hafenanleger für die Überfahrt aus (E)',
      'Bestehe bei Kapitän Telesikles die Seefahrer-Prüfung!',
    ],
    hints: [
      'Kapitän Telesikles steht am Hafen-Kai im Südosten am blauen Ägäischen Meer.',
      'Wolle findest du bei den Ziegen und Weiden im Südwesten.',
      'Öffne das Handwerk (Taste C) und webe Segeltuch aus 2× Wolle.',
      'Tritt an den Bauplatz der Schiffswerft am Hafen (E) – du brauchst Holz und Segeltuch.',
      'Roter Töpferton liegt direkt am sandigen Meeresufer nördlich des Hafens. Forme daraus im Handwerk (C) eine bemalte Amphore.',
      'Kombiniere im Handwerk (C) 1× Holz und 1× Olivenöl zu einer Heiligen Fackel.',
      'Gehe zum vor Anker liegenden Schiff am Hafen-Steg und drücke E.',
      'Sprich mit Telesikles über die Ursachen und Folgen der Großen Kolonisation.',
    ],
    intro: [
      {
        text: 'Höre das Rauschen der Ägäis! Unsere Polis wächst, doch zwischen den steilen Bergen gibt es kaum noch Ackerland. Viele Kleinbauern hungern und geraten in Schuldknechtschaft.',
      },
      {
        text: 'Deshalb wagen wir den Aufbruch übers Meer! Als „Oikist“ (Siedlungsleiter) führe ich Auswanderer nach Süditalien, Sizilien, Marseille und ans Schwarze Meer. Wir nehmen das heilige Feuer unserer Mutterstadt (Metropolis) mit und gründen neue Tochterstädte (Apoikien)!',
      },
    ],
    quiz: [
      {
        question: 'Was waren die Hauptgründe für die „Große Griechische Kolonisation“ (750–550 v. Chr.) rund um das Mittelmeer?',
        options: [
          'Landknappheit durch Gebirge, starkes Bevölkerungswachstum, Verschuldung von Bauern und Suche nach Handelswegen',
          'Die Griechen wollten vor einer Eiszeit fliehen',
          'Der ägyptische Pharao hatte ihnen das befohlen',
          'Sie suchten nach Amerika und Australien',
        ],
        correct: 0,
        explain: 'Richtig! Der Mangel an fruchtbarem Ackerland und soziale Spannungen trieben die Griechen an die Küsten des Mittelmeers und Schwarzen Meeres.',
      },
      {
        question: 'Was meinte der Philosoph Platon mit dem berühmten Satz, die Griechen säßen rund um das Mittelmeer „wie Frösche um einen Teich“?',
        options: [
          'Dass die Griechen gerne quakten',
          'Dass fast alle griechischen Mutter- und Tochterstädte direkt an den Küsten des Mittelmeers und Schwarzen Meeres lagen',
          'Dass es im Mittelmeer nur Frösche statt Fische gab',
          'Dass Griechen nicht schwimmen konnten',
        ],
        correct: 1,
        explain: 'Genau! Das Meer trennte die Griechen nicht, sondern war ihre wichtigste Verbindungsstraße für Handel, Olivenöl-Amphoren und Kultur.',
      },
    ],
    summary: 'Über hunderte Küstenstädte von Spanien (Emporion) und Frankreich (Massalia/Marseille) über Süditalien (Neapel, Syrakus) bis ans Schwarze Meer verbreiteten die Griechen ihre Schrift, Münzen und Baukunst!',
  },

  3: {
    id: 3,
    title: 'Kapitel 3: Sparta – Der Kriegerstaat am Eurotas',
    epoch: 'Archaische & Klassische Zeit',
    period: 'ca. 600 v. Chr.',
    mentor: 'Ephor Kleomenes',
    mentorRole: 'Aufseher der Agoge & Hüter der spartanischen Ordnung',
    targetInterior: 'parthenon_cella',
    music: {
      trackId: 'ch3_sparta',
      title: 'Spartas Schilde & die Agoge',
      mood: 'Entschlossen, dorischer Marsch, Trommeln & Aulos',
      prompt: '16-bit SNES RPG Dorian mode march, ancient Sparta military camp, deep frame drums, bronze shield rhythm, resolute aulos melody, 100 BPM',
    },
    quests: [
      'Sprich mit Ephor Kleomenes im spartanischen Feldlager im Nordwesten (E)',
      'Baue 3× Taygetos-Eisenerz an den dunklen Gebirgsfelsen ab (E)',
      'Errichte die Lakonische Waffenschmiede im Feldlager (E)',
      'Schmiede 1× Hoplitenschild (Aspis) mit dem roten Lambda Λ (Taste C)',
      'Schmiede 1× Hoplitenspeer (Dory) im Handwerksmenü (Taste C)',
      'Koche eine Schale spartanische Blutsuppe am Lagerfeuer (E)',
      'Absolviere das Phalanx-Training an der Übungspuppe im Lager (E)',
      'Tritt vor Ephor Kleomenes zur Prüfung über den Staat Sparta!',
    ],
    hints: [
      'Das befestigte spartanische Feldlager liegt im felsigen Nordwesten der Karte.',
      'Dunkle Eisenerz-Adern findest du direkt an den Gebirgshängen rund um Sparta.',
      'Baue die Lakonische Waffenschmiede mit 2× Kalkstein und 2× Eisenerz (E).',
      'Öffne das Handwerk (Taste C) und schmiede den Rundschild (Aspis) aus Holz und Eisenerz.',
      'Schmiede im Handwerk (Taste C) zusätzlich den Stoßspeer (Dory).',
      'Gehe zum lodernden spartanischen Lagerfeuer und drücke E, um schwarze Blutsuppe zu kochen.',
      'Drücke E an der hölzernen Trainingspuppe / Phalanx im spartanischen Lager.',
      'Kehre zu Ephor Kleomenes zurück und beantworte seine Fragen.',
    ],
    intro: [
      {
        text: 'Steh gerade, Fremder! Du befindest dich in Lakedaimon – in Sparta! Hier suchst du vergeblich nach goldenen Prunkbauten oder weichen Betten. Unsere Stadtmauer besteht nicht aus Steinen, sondern aus den Schilden unserer Hopliten!',
      },
      {
        text: 'Weil unsere Vollbürger, die Spartiaten, eine gewaltige Überzahl unterworfener Heloten kontrollieren müssen, dient unser ganzes Leben dem Kampf: Ab dem 7. Lebensjahr härtet die staatliche Erziehung (Agoge) jeden Jungen für die unbesiegbare Phalanx ab!',
      },
    ],
    quiz: [
      {
        question: 'Wie hieß die harte staatliche Erziehung in Sparta, in der Jungen ab dem 7. Lebensjahr in Kasernen zu disziplinierten Hopliten ausgebildet wurden?',
        options: ['Agoge', 'Gymnasium', 'Ekklesia', 'Olympiade'],
        correct: 0,
        explain: 'Richtig! In der Agoge lernten die jungen Spartaner Abhärtung, Kampfkunst und bedingungslosen Zusammenhalt in der Phalanx.',
      },
      {
        question: 'Wer musste in Sparta die gesamte Feldarbeit verrichten, damit sich die Vollbürger (Spartiaten) ausschließlich dem Kriegsdienst widmen konnten?',
        options: [
          'Ägyptische Pyramidenbauer',
          'Die unterworfenen und rechtlosen Staatssklaven, die „Heloten“ genannt wurden',
          'Freiwillige Urlauber aus Athen',
          'Die beiden spartanischen Könige persönlich',
        ],
        correct: 1,
        explain: 'Exakt! Die unterdrückten Heloten stellten die große Bevölkerungsmehrheit. Aus ständiger Furcht vor Helotenaufständen blieb Sparta ein strenger Militärstaat.',
      },
    ],
    summary: 'Du hast das Gesellschaftssystem Spartas kennengelernt: Doppelkönigtum, Ältestenrat (Gerusia), 5 Ephoren, die Erziehung der Agoge und die Kampfkraft der Hopliten-Phalanx machten Sparta zur stärksten Landmacht Griechenlands!',
  },

  4: {
    id: 4,
    title: 'Kapitel 4: Athen – Wiege der Demokratie & das Scherbengericht',
    epoch: 'Klassische Blütezeit',
    period: 'ca. 508–450 v. Chr.',
    mentor: 'Staatsmann Perikles',
    mentorRole: 'Gewählter Stratege & Redner der Athenischen Demokratie',
    targetInterior: 'bouleuterion_schule',
    music: {
      trackId: 'ch4_demokratie',
      title: 'Stimmen der Ekklesia auf der Pnyx',
      mood: 'Feierlich, würdevoll, klassisches Athen',
      prompt: '16-bit SNES RPG noble city theme, classical Athens Agora and Pnyx assembly, bright kithara harp, stately brass and woodwinds, 96 BPM',
    },
    quests: [
      'Sprich mit Staatsmann Perikles an der Ratsversammlung (Pnyx) (E)',
      'Baue 2× Laureion-Silbererz an den glitzernden Silberadern ab (E)',
      'Präge 2× Athenische Eulen-Drachmen im Handwerksmenü (Taste C)',
      'Errichte die steinerne Rednerbühne (Bema) auf der Pnyx (E)',
      'Ritze 1× Ostrakon (Tonscherbe) für das Scherbengericht (Taste C)',
      'Gib deine Stimme bei der Volksversammlung (Ekklesia) an der Bühne ab (E)',
      'Lege bei Staatsmann Perikles die Prüfung über die Demokratie ab!',
    ],
    hints: [
      'Staatsmann Perikles steht vor dem halbrunden Ratssitz (Pnyx) nahe der Agora.',
      'Silberadern glitzern östlich der Felder und am Gebirgsfuß.',
      'Öffne das Handwerk (Taste C) und präge aus 2× Silbererz die Eulen-Drachmen.',
      'Errichte die Rednerbühne (Bema) neben der Pnyx mit 3× Kalkstein und 1× Drachme (E).',
      'Forme im Handwerksmenü (Taste C) aus 1× Ton ein Ostrakon (Ritz-Tonscherbe).',
      'Tritt an die errichtete Rednerbühne / Pnyx und drücke E zur Abstimmung.',
      'Sprich erneut mit Perikles über Chancen und Grenzen der attischen Demokratie.',
    ],
    intro: [
      {
        text: 'Willkommen in Athen! Während Sparta auf Befehl und Gehorsam schwört, haben wir Athener einen völlig neuen Weg gewagt: die „Demokratie“ – die Herrschaft des Volkes!',
      },
      {
        text: 'Auf dem Hügel der Pnyx versammelt sich unsere Volksversammlung (Ekklesia). Hier hat jeder freie männliche Bürger – ob reicher Kaufmann oder einfacher Ruderer – gleiches Rederecht und gleiches Stimmrecht. Und wer zu mächtig wird und als Tyrann droht, den schicken wir per Scherbengericht (Ostrakismos) für 10 Jahre in die Verbannung!',
      },
    ],
    quiz: [
      {
        question: 'Wer durfte in der Athenischen Demokratie an der Volksversammlung (Ekklesia) teilnehmen und abstimmen?',
        options: [
          'Wirklich alle Einwohner, auch Frauen, Kinder und Sklaven',
          'Alle volljährigen männlichen Bürger mit athenischem Bürgerrecht (Frauen, Zugewanderte/Metöken und Sklaven waren ausgeschlossen)',
          'Nur der König und drei Priester',
          'Nur Bürger, die mindestens zehn Schiffe besaßen',
        ],
        correct: 1,
        explain: 'Richtig! Für die Antike war die Gleichberechtigung armer und reicher männlicher Bürger revolutionär – doch Frauen, Metöken (Ausländer) und Sklaven besaßen noch keine politischen Rechte.',
      },
      {
        question: 'Wozu diente das berühmte „Scherbengericht“ (Ostrakismos) in Athen?',
        options: [
          'Zum Aufräumen zerbrochener Kochtöpfe auf dem Marktplatz',
          'Um allzu ehrgeizige Politiker, die eine Alleinherrschaft (Tyrannis) errichten könnten, per Abstimmung auf Tonscherben für 10 Jahre zu verbannen',
          'Um Töpfer für schlechte Vasen zu bestrafen',
          'Als Eintrittskarte für das Theater',
        ],
        correct: 1,
        explain: 'Genau! Auf Tonscherben (Ostraka) ritzten die Bürger den Namen des gefährlichen Politikers – ein kluger Schutzmechanismus der jungen Demokratie gegen Diktatoren.',
      },
    ],
    summary: 'Du hast das Herz der Athenischen Demokratie erlebt: Volksversammlung (Ekklesia), Losverfahren im Rat der 500, Tagegelder aus den Silberminen von Laureion und das Scherbengericht legten den Grundstein unserer heutigen Demokratie!',
  },

  5: {
    id: 5,
    title: 'Kapitel 5: Der Olymp mit seinen Göttern & die Olympischen Spiele',
    epoch: 'Panhellenische Blütezeit',
    period: 'ca. 480 v. Chr.',
    mentor: 'Orakelpriesterin Pythia',
    mentorRole: 'Seherin von Delphi & Hüterin des Olymp-Portals',
    targetInterior: 'parthenon_cella',
    music: {
      trackId: 'ch5_olymp',
      title: 'Hymne an den Götterberg Olymp',
      mood: 'Mystisch, erhaben, himmlische Harfen & Chöre',
      prompt: '16-bit SNES RPG celestial temple theme, Mount Olympus clouds and Oracle of Delphi, shimmering golden lyre, choir pads, mystical bells, 88 BPM',
    },
    quests: [
      'Sprich mit Priesterin Pythia am Rundtempel (Tholos) im Nordosten (E)',
      'Tausche auf der Agora (Taste H) weißen Marmor und Opferweihrauch ein',
      'Errichte den Heiligen Altar von Olympia im Nordosten (E)',
      'Durchschreite das leuchtende Wolkentor hinauf auf den Berg Olymp (E)',
      'Entzünde auf dem Olymp die Opferschale vor dem Thron des Göttervaters Zeus (E)',
      'Flechte 1× Olympischen Siegerkranz (Kotinos) aus Olivenzweigen (Taste C)',
      'Kehre vom Olymp zurück und lege bei Pythia die Götter- & Olympia-Prüfung ab!',
    ],
    hints: [
      'Priesterin Pythia steht vor dem runden Orakel-Tempel im Nordosten.',
      'Öffne den Agora-Handel mit Taste H und tausche Drachmen/Amphoren gegen Marmor und Weihrauch.',
      'Errichte den Heiligen Altar neben dem Tempelbezirk mit 2× Marmor und 1× Olivenöl (E).',
      'Tritt an das blau leuchtende Wolken-Portal im Nordosten und drücke E zum Aufstieg auf den Olymp!',
      'Wandere über die Wolkenbrücken des Olymp zum Thron des Zeus und opfere Weihrauch (E).',
      'Flechte im Handwerksmenü (Taste C) aus 2× Oliven den Olympischen Siegerkranz.',
      'Reise durch das Portal auf dem Olymp zurück nach Hellas und sprich mit Pythia!',
    ],
    intro: [
      {
        text: 'Tritt näher an den heiligen Dreifuß von Delphi! Erkenne dich selbst! Mag Hellas auch in hunderte Poleis geteilt sein – vor dem Angesicht der zwölf Götter auf dem wolkigen Gipfel des Olymp sind wir alle geeint!',
      },
      {
        text: 'Alle vier Jahre ruhen in ganz Griechenland die Waffen für den heiligen Gottesfrieden (Ekecheiria), wenn die besten Athleten bei den Olympischen Spielen zu Ehren des Göttervaters Zeus um den Kranz des wilden Ölbaums wetteifern. Steige hinauf zum Olymp und ehre die Unsterblichen!',
      },
    ],
    quiz: [
      {
        question: 'Was geschah in ganz Griechenland, wenn alle vier Jahre die Olympischen Spiele zu Ehren des Göttervaters Zeus ausgerufen wurden?',
        options: [
          'Alle Steuern wurden verdoppelt',
          'Es galt der heilige Olympische Gottesfrieden (Ekecheiria): Alle Kriege zwischen den Stadtstaaten mussten ruhen, damit Athleten und Zuschauer sicher reisen konnten',
          'Frauen und Männer traten gemeinsam im Fußball an',
          'Die Sieger erhielten drei Goldmedaillen und ein Schloss',
        ],
        correct: 1,
        explain: 'Richtig! Der heilige Frieden (Ekecheiria) machte Olympia zum wichtigsten Symbol der Einheit aller Griechen (Panhellenismus).',
      },
      {
        question: 'Wie stellten sich die alten Griechen ihre zwölf Hauptgötter auf dem Berg Olymp (z. B. Zeus, Hera, Athene, Poseidon, Apollon) vor?',
        options: [
          'Mit Schakals- und Krokodilköpfen wie in Ägypten',
          'Unsterblich und mächtig, aber in menschlicher Gestalt und mit sehr menschlichen Gefühlen wie Streit, Liebe, Eifersucht und Humor',
          'Als unsichtbare Zahlen und Sterne',
          'Als friedliche Pflanzengeister im Untergrund',
        ],
        correct: 1,
        explain: 'Genau! Die olympischen Götter glichen einer großen, temperamentvollen Herrscherfamilie auf dem höchsten Berg Griechenlands.',
      },
    ],
    summary: 'Du bist bis auf die Wolkeninseln des Olymp emporgestiegen! Der gemeinsame Glaube an die 12 olympischen Götter, das Orakel von Delphi und der Gottesfrieden der Olympischen Spiele schufen das geistige Band aller Hellenen.',
  },

  6: {
    id: 6,
    title: 'Kapitel 6: Angriff der Perser I – Marathon & die Thermopylen',
    epoch: 'Die Perserkriege',
    period: '490–480 v. Chr.',
    mentor: 'König Leonidas von Sparta',
    mentorRole: 'Anführer des Hellenenbundes am Engpass der Thermopylen',
    targetInterior: 'parthenon_cella',
    music: {
      trackId: 'ch6_thermopylen',
      title: 'Phalanx an den Heißen Toren (Thermopylen)',
      mood: 'Heroisch, dramatisch, phrygischer Modus & Kriegshörner',
      prompt: '16-bit SNES RPG heroic defense theme, Battle of Marathon and Thermopylae pass, driving percussion, bronze horns, tense Phrygian melody, 118 BPM',
    },
    quests: [
      'Sprich mit König Leonidas am Gebirgspass der Thermopylen (E)',
      'Sammle 2× Kalkstein und verstärke die Verteidigungsmauer am Engpass (E)',
      'Stelle sicher, dass du Hoplitenschild (Aspis) und Speer (Dory) im Beutel trägst (C)',
      'Entzünde das Signalfeuer mit einer Fackel auf dem Wachturm am Pass (E)',
      'Absolviere den Eilboten-Lauf von den Thermopylen zur Akropolis von Athen (E)',
      'Bestehe bei König Leonidas die Prüfung über Marathon & die Thermopylen!',
    ],
    hints: [
      'König Leonidas bewacht das steinerne Pass-Tor der Thermopylen im hohen Norden.',
      'Tritt mit 2× Kalkstein direkt an das Pass-Tor der Thermopylen und drücke E zum Verstärken.',
      'Prüfe im Beutel (I) oder Handwerk (C), ob du Aspis-Schild und Dory-Speer geschmiedet hast.',
      'Gehe zum steinernen Wachturm neben dem Pass und entzünde mit einer Fackel das Warnfeuer (E).',
      'Laufe hinunter zum großen Parthenon-Tempel auf der Akropolis und überbringe die Warnung (E).',
      'Kehre zu König Leonidas am Pass zurück!',
    ],
    intro: [
      {
        text: 'Waffenbruder! Aus dem Osten zieht ein Sturm herauf, wie ihn die Welt noch nicht gesehen hat: Das gigantische Persische Weltreich will das freie Hellas unterwerfen!',
      },
      {
        text: 'Vor zehn Jahren (490 v. Chr.) haben die tapferen Hopliten Athens das Heer des Großkönigs Dareios in der Ebene von Marathon zurück ins Meer getrieben. Doch nun marschiert sein Sohn Xerxes I. mit Hunderttausenden heran! Hier am schmalen Felsentor der Thermopylen stellen wir uns ihm mit 300 Spartiaten und unseren Verbündeten in den Weg, damit Athen Zeit gewinnt!',
      },
    ],
    quiz: [
      {
        question: 'Warum wählten König Leonidas und die Griechen im Jahr 480 v. Chr. ausgerechnet den Pass der Thermopylen zur Verteidigung gegen das riesige Perserheer?',
        options: [
          'Weil dort das beste Urlaubswetter herrschte',
          'Weil an diesem schmalen Engpass zwischen steilem Gebirge und Meer die gewaltige zahlenmäßige Übermacht der Perser ihre Breite nicht entfalten konnte',
          'Weil dort eine goldene Brücke nach Persien führte',
          'Weil die Perser Angst vor warmem Quellwasser hatten',
        ],
        correct: 1,
        explain: 'Richtig! Im engen Pass zählte nicht die Masse des persischen Heeres, sondern die geschlossene Schildmauer und Disziplin der griechischen Phalanx.',
      },
      {
        question: 'Welches berühmte sportliche Ereignis erinnert noch heute an den legendären Botenlauf nach dem Überraschungssieg der Athener über die Perser im Jahr 490 v. Chr.?',
        options: [
          'Die Tour de France',
          'Der Marathonlauf über 42,195 Kilometer (von der Ebene von Marathon nach Athen)',
          'Der 100-Meter-Sprint von Sparta',
          'Das Schwimmen durch den Nil',
        ],
        correct: 1,
        explain: 'Exakt! Der Lauf des Boten vom Schlachtfeld bei Marathon nach Athen, um den Bürgern die Siegesbotschaft zu bringen, wurde bei den ersten modernen Olympischen Spielen 1896 zum Vorbild des Marathonlaufs.',
      },
    ],
    summary: 'Von der Ebene von Marathon bis zum Engpass der Thermopylen: Als das persische Weltreich angriff, schlossen sich Athen und Sparta im Hellenenbund zusammen, um ihre Freiheit zu verteidigen!',
  },

  7: {
    id: 7,
    title: 'Kapitel 7: Angriff der Perser II – Die Seeschlacht von Salamis',
    epoch: 'Wende der Perserkriege',
    period: 'September 480 v. Chr.',
    mentor: 'Flottenstratege Themistokles',
    mentorRole: 'Vater der athenischen Flotte & Sieger von Salamis',
    targetInterior: 'kerameikos_werkstatt',
    music: {
      trackId: 'ch7_salamis',
      title: 'Hölzerne Mauern bei Salamis',
      mood: 'Treibender Rudertakt, maritimes Finale',
      prompt: '16-bit SNES RPG naval battle soundtrack, Trireme fleet at Salamis strait, rhythmic rowing drumbeat, heroic brass fanfare, 122 BPM',
    },
    quests: [
      'Sprich mit Stratege Themistokles am Kriegshafen von Piräus (E)',
      'Gieße 1× bronzenen Rammsporn (Embolon) im Handwerksmenü (Taste C)',
      'Sammle 2× Kiefernholz für die Ruderbänke der Ruderer (E)',
      'Montiere den Rammsporn an der athenischen Trireme im Hafen (E)',
      'Führe das taktische Ramm-Manöver in der Meerenge am Leuchtturm aus (E)',
      'Lege bei Stratege Themistokles die Prüfung über die Schlacht von Salamis ab!',
    ],
    hints: [
      'Stratege Themistokles steht am Hafen-Kai bei den großen Kriegstriremen.',
      'Öffne das Handwerk (Taste C) und gieße den Rammsporn aus 2× Eisenerz und 1× Holz (Werft nötig).',
      'Schlage 2× Holz von den Bäumen im Tal.',
      'Tritt an die große Kriegstrireme am Hafen-Kai und drücke E zum Aufrüsten.',
      'Gehe zum steinernen Leuchtturm an der Hafeneinfahrt und drücke E, um die persische Flotte in die Enge zu locken!',
      'Sprich erneut mit Themistokles am Kai.',
    ],
    intro: [
      {
        text: 'Höre gut zu! Als das Orakel von Delphi weissagte, nur „hölzerne Mauern“ könnten Athen vor den Persern retten, wollten manche einen Holzzaun um die Akropolis bauen. Doch ich wusste: Unsere „hölzernen Mauern“ sind unsere 200 schnellen Kriegsschiffe – die Triremen!',
      },
      {
        text: 'Wir haben die Bewohner Athens auf die Insel Salamis evakuiert. Wenn wir die riesige, schwerfällige Flotte des Großkönigs Xerxes in den schmalen Meereskanal von Salamis locken, werden unsere wendigen Dreiruderer sie mit ihren bronzenen Rammspornen versenken!',
      },
    ],
    quiz: [
      {
        question: 'Was war die entscheidende Waffe der griechischen „Trireme“ (Dreiruderer) in der Seeschlacht von Salamis (480 v. Chr.)?',
        options: [
          'Schwere Kanonen mit Schwarzpulver',
          'Ein mit Bronze beschlagener Rammsporn (Embolon) am Bug auf Wasserhöhe, der mit der Kraft von 170 Ruderern in die Flanke feindlicher Schiffe gerammt wurde',
          'Griechisches Eis, das das Meer einfror',
          'Große Katapulte mit Felsblöcken',
        ],
        correct: 1,
        explain: 'Richtig! Durch die drei übereinander liegenden Ruderreihen war die Trireme extrem schnell und wendig und rammte die dicht gedrängten Perserschiffe in der Enge von Salamis.',
      },
      {
        question: 'Warum stärkte der Sieg bei Salamis auch die Demokratie der einfachen Bürger in Athen?',
        options: [
          'Weil der persische König jedem Athener Gold schenkte',
          'Weil auf den Ruderbänken der Triremen keine Sklaven saßen, sondern tausende ärmere, freie Bürger Athens (Theten): Wer die Stadt mit dem Ruder rettete, forderte zu Recht auch volles politisches Mitspracherecht!',
          'Weil nach der Schlacht alle Schiffe verkauft wurden',
          'Weil Sparta fortan Athen regierte',
        ],
        correct: 1,
        explain: 'Exakt! Anders als in modernen Filmen oft falsch gezeigt, ruderten auf athenischen Triremen freie Bürger gegen Sold. Ihr Beitrag zum Sieg machte sie zum Rückgrat der Demokratie!',
      },
    ],
    summary: 'In der Meerenge von Salamis triumphierte kluge Taktik über bloße Masse! Der Abwehrsieg der Griechen sicherte das Überleben der Demokratie und leitete das goldene Zeitalter Athens ein.',
  },

  8: {
    id: 8,
    title: 'Kapitel 8: Bruderkrieg & Geisteskraft – Peloponnesischer Krieg & Philosophie',
    epoch: 'Spätklassische Zeit',
    period: '431–399 v. Chr.',
    mentor: 'Philosoph Sokrates',
    mentorRole: 'Weiser Fragesteller auf der Agora & Lehrer Platons',
    targetInterior: 'bouleuterion_schule',
    music: {
      trackId: 'ch8_philosophie',
      title: 'Eule der Athene & Dialog in der Akademie',
      mood: 'Nachdenklich, kontemplativ, Lyra & Holzbläser',
      prompt: '16-bit SNES RPG contemplative scholar theme, Socrates and Plato Academy in Athens, solo kithara and soft flute, reflective minor harmony, 84 BPM',
    },
    quests: [
      'Sprich mit dem Philosophen Sokrates am großen Theater / Akademie-Garten (E)',
      'Errichte die Schreibstube der Akademie nahe dem Theater (E)',
      'Forme 1× Antike Theatermaske aus Ton im Handwerksmenü (Taste C)',
      'Führe eine Tragödie über Krieg und Frieden im großen Theater auf (E)',
      'Verfasse 1× Philosophische Schriftrolle im Handwerksmenü (Taste C)',
      'Stelle dich dem berühmten philosophischen Dialog mit Sokrates (E)!',
    ],
    hints: [
      'Philosoph Sokrates wartet zwischen dem großen halbrunden Theater und dem Akademie-Garten.',
      'Errichte die Schreibstube der Akademie mit 2× Marmor und 2× Ton (E).',
      'Öffne das Handwerk (Taste C) und forme aus 2× Ton eine Antike Theatermaske.',
      'Tritt an das große steinerne Amphitheater und drücke E zur Aufführung.',
      'Stelle im Handwerk (Taste C) aus 1× Olivenöl und 1× Drachme eine Philosophische Schriftrolle her.',
      'Sprich erneut mit Sokrates für das große Prüfungsgespräch!',
    ],
    intro: [
      {
        text: 'Komm herüber, mein junger Freund, und lass uns nachdenken! Kaum war die persische Gefahr gebannt, zerfleischten sich Athen (mit seinem Attischen Seebund) und Sparta (mit seinem Peloponnesischen Bund) in einem fast dreißigjährigen Bruderkrieg!',
      },
      {
        text: 'Machthunger hat unsere Städte geschwächt. Doch gerade in Zeiten der Krise fragen wir Philosophen – ich, mein Schüler Platon und später Aristoteles – nach dem wahren Guten, der Gerechtigkeit und den Gesetzen der Natur. Denn wie ich stets sage: „Ich weiß, dass ich nichts weiß!“',
      },
    ],
    quiz: [
      {
        question: 'Wer kämpfte im fast 30-jährigen „Peloponnesischen Krieg“ (431–404 v. Chr.) um die Vorherrschaft in Griechenland gegeneinander, bis beide Seiten erschöpft waren?',
        options: [
          'Ägypten gegen Babylon',
          'Die Seemacht Athen (Attischer Seebund) gegen die Landmacht Sparta (Peloponnesischer Bund)',
          'Rom gegen Karthago',
          'Troja gegen Kreta',
        ],
        correct: 1,
        explain: 'Richtig! Der erbitterte Bruderkrieg endete zwar 404 v. Chr. mit der Niederlage Athens, hinterließ aber ganz Griechenland geschwächt – was später den Aufstieg Makedoniens ermöglichte.',
      },
      {
        question: 'Welche drei berühmten Denker begründeten in Athen die abendländische Philosophie und Wissenschaft (wobei jeweils einer der Schüler des anderen war)?',
        options: [
          'Sokrates ➔ Platon ➔ Aristoteles',
          'Cheops ➔ Chephren ➔ Mykerinos',
          'Cäsar ➔ Augustus ➔ Nero',
          'Zeus ➔ Poseidon ➔ Hades',
        ],
        correct: 0,
        explain: 'Genau! Sokrates lehrte durch geschicktes Fragen auf dem Marktplatz, sein Schüler Platon gründete die „Akademie“, und dessen Schüler Aristoteles erforschte alle Naturwissenschaften und unterrichtete den jungen Alexander den Großen!',
      },
    ],
    summary: 'Du hast erkannt, wie tragisch der Peloponnesische Bruderkrieg die Poleis schwächte – und wie gleichzeitig Theater, Geschichtsschreibung und die Philosophie von Sokrates, Platon und Aristoteles das Denken der Welt veränderten!',
  },

  9: {
    id: 9,
    title: 'Kapitel 9: Alexander der Große – Vom Königreich Makedonien bis nach Indien',
    epoch: 'Beginn des Hellenismus',
    period: '336–324 v. Chr.',
    mentor: 'König Alexander der Große',
    mentorRole: 'König von Makedonien, Hegemon der Griechen & Herrscher Asiens',
    targetInterior: 'parthenon_cella',
    music: {
      trackId: 'ch9_alexander',
      title: 'Zug ans Ende der Welt',
      mood: 'Episch, griechisch-orientalische Verschmelzung',
      prompt: '16-bit SNES RPG epic world map march, Alexander the Great campaign from Macedonia to Babylon and India, grand brass, oud and kithara fusion, 114 BPM',
    },
    quests: [
      'Sprich mit König Alexander dem Großen am östlichen Triumphbogen (E)',
      'Fertige 1× Makedonische Sarissa-Lanze im Handwerksmenü (Taste C)',
      'Durchtrenne den legendären Gordischen Knoten am Streitwagen-Schrein (E)',
      'Errichte das Museion & die Große Bibliothek von Alexandria (E)',
      'Entzünde das Leuchtfeuer auf dem Pharos-Leuchtturm am Hafen (E)',
      'Bestehe bei Alexander dem Großen die Prüfung über seinen Weltfeldzug!',
    ],
    hints: [
      'König Alexander der Große erwartet dich am prachtvollen Marmorbogen im Südosten.',
      'Öffne das Handwerk (Taste C) und fertige aus 2× Holz und 1× Eisenerz die 6 Meter lange Sarissa-Lanze.',
      'Tritt an den geschmückten Knoten-Schrein neben Alexander und drücke E, um den Gordischen Knoten zu lösen!',
      'Baue das Museion & die Große Bibliothek im Südosten mit 3× Marmor und 1× Schriftrolle (E).',
      'Gehe zum hohen Leuchtturm (Pharos) an der Küste und drücke E.',
      'Sprich mit König Alexander über seinen Zug bis ans Ende der bekannten Welt!',
    ],
    intro: [
      {
        text: 'Vorwärts, Gefährte! Mein Vater Philipp II. von Makedonien hat die zerstrittenen griechischen Stadtstaaten geeint, und mein Lehrer Aristoteles hat meinen Geist für Homer und die Wissenschaften geweckt. Doch mir ist Griechenland zu klein!',
      },
      {
        text: 'Mit unseren 6 Meter langen Sarissa-Lanzen und der Reiterei habe ich das gigantische Perserreich des Großkönigs Dareios III. bei Issos und Gaugamela geschlagen, Ägypten befreit, die Weltstadt Alexandria gegründet und unser Heer über Babylon bis an den Indus nach Indien geführt!',
      },
    ],
    quiz: [
      {
        question: 'Wie weit reichte das gewaltige Weltreich, das Alexander der Große in nur 13 Jahren (336–323 v. Chr.) auf seinem Feldzug eroberte?',
        options: [
          'Nur von Athen bis Sparta',
          'Von Makedonien und Griechenland über Kleinasien, Ägypten, Babylonien und Persien bis zum Fluss Indus im heutigen Indien/Pakistan',
          'Von Griechenland bis nach Großbritannien',
          'Nur rund um die Insel Kreta',
        ],
        correct: 1,
        explain: 'Richtig! Auf einem Marsch von über 30.000 Kilometern schuf der junge Makedonenkönig das bis dahin größte zusammenhängende Reich der Antike.',
      },
      {
        question: 'Was bezweckte Alexander der Große mit der Gründung von Städten wie Alexandria und der berühmten „Massenhochzeit von Susa“ (324 v. Chr.)?',
        options: [
          'Er wollte alle Städte zerstören',
          'Er wollte Griechen, Makedonen und Perser zu einer gemeinsamen Kultur und Oberschicht verschmelzen (Beginn des Hellenismus)',
          'Er wollte zurück in die Steinzeit',
          'Er verbot die griechische Sprache',
        ],
        correct: 1,
        explain: 'Exakt! Alexander sah in den Besiegten keine Sklaven, sondern wollte Orient und Okzident (Abendland und Morgenland) miteinander verbinden.',
      },
    ],
    summary: 'Mit Alexander dem Großen hast du die Grenzen der alten Polis-Welt gesprengt: Sein Feldzug trug griechische Sprache, Stadtplanung und Wissenschaft von Ägypten bis an die Grenzen Indiens!',
  },

  10: {
    id: 10,
    title: 'Kapitel 10: Der Untergang des Alexanderreichs – Diadochen & Hellenismus',
    epoch: 'Zeitalter des Hellenismus',
    period: '323–30 v. Chr.',
    mentor: 'Chronist & König Ptolemaios',
    mentorRole: 'Weggefährte Alexanders, Diadochenherrscher & Chronist',
    targetInterior: 'bouleuterion_schule',
    music: {
      trackId: 'ch10_hellenismus',
      title: 'Das Leuchtfeuer von Alexandria (Hellenismus)',
      mood: 'Majestätisch, wehmütig-erhaben, großes Finale',
      prompt: '16-bit SNES RPG grand finale soundtrack, Great Library and Pharos Lighthouse of Alexandria, majestic strings, golden harp and woodwinds, 96 BPM',
    },
    quests: [
      'Sprich mit Chronist Ptolemaios an der Großen Bibliothek (E)',
      'Untersuche das Goldene Vermächtnis Alexanders aus Babylon (E)',
      'Zeichne die Weltkarte des Hellenismus (Diadochen-Karte) im Handwerk (Taste C)',
      'Archiviere die Reichskarte und das Wissen in der Großen Bibliothek (E)',
      'Bestehe das große Abschluss-Examen über den Zerfall des Alexanderreichs (E)!',
    ],
    hints: [
      'Chronist Ptolemaios steht vor der Großen Bibliothek im Südosten.',
      'Tritt an die goldene Gedächtnistruhe / Statue Alexanders und drücke E.',
      'Öffne das Handwerk (Taste C) und zeichne aus 1× Schriftrolle und 1× Drachme die Weltkarte der Diadochen.',
      'Gehe an die Große Bibliothek und drücke E, um die Karte für die Nachwelt zu sichern.',
      'Sprich mit Ptolemaios für das große Finale aller 10 Kapitel und deine Ehren-Urkunde (Taste U)!',
    ],
    intro: [
      {
        text: 'Welch ein Schicksalsschlag! Im Juni 323 v. Chr. ist König Alexander im Palast von Babylon mit nur 32 Jahren an einem glühenden Fieber gestorben. Als wir Generäle ihn am Sterbebett fragten, wem er sein Weltreich hinterlasse, flüsterte er nur: „Dem Stärksten!“',
      },
      {
        text: 'Ohne einen starken Erben brachen sofort blutige Kriege unter uns Generälen – den „Diadochen“ (Nachfolgern) – aus! Alexanders Reich zerbrach für immer in drei große Reiche: Makedonien, das Seleukidenreich in Asien und mein Ptolemäerreich in Ägypten. Doch das kulturelle Erbe – der Hellenismus – überdauert die Jahrhunderte!',
      },
    ],
    quiz: [
      {
        question: 'Warum zerbrach das riesige Weltreich Alexanders des Großen unmittelbar nach seinem frühen Tod in Babylon (323 v. Chr.)?',
        options: [
          'Weil ein Vulkanausbruch Babylon verschüttete',
          'Weil Alexander mit 32 Jahren ohne regierungsfähigen Erben starb und seine ehrgeizigen Generäle („Diadochen“) in jahrzehntelangen Kriegen das Reich unter sich aufteilten',
          'Weil Alexander das Reich testamentarisch an Sparta verschenkte',
          'Weil alle Soldaten freiwillig nach Hause segelten',
        ],
        correct: 1,
        explain: 'Richtig! In den Diadochenkriegen zerfiel die politische Einheit in drei rivalisierende Großreiche: die Antigoniden (Makedonien), die Seleukiden (Vorderasien) und die Ptolemäer (Ägypten).',
      },
      {
        question: 'Was blieb trotz des politischen Untergangs von Alexanders Einheitsreich als bleibendes Erbe des „Hellenismus“ erhalten?',
        options: [
          'Gar nichts, alles geriet sofort in Vergessenheit',
          'Die Verbreitung der griechischen Weltsprache (Koine), Wissenschaft (Bibliothek von Alexandria, Mechanismus von Antikythera) und Kunst im gesamten östlichen Mittelmeerraum – worauf später auch das Römische Reich aufbaute!',
          'Die Pflicht, überall spartanische Blutsuppe zu essen',
          'Die Abschaffung aller Bücher',
        ],
        correct: 1,
        explain: 'Meisterhaft! Politisch zerfiel Alexanders Reich in die Diadochenstaaten und wurde schließlich von Rom erobert – doch kulturell prägte das antike Griechenland ganz Europa und die moderne Welt!',
      },
    ],
    summary: 'Herzlichen Glückwunsch! Du hast alle 10 Kapitel des Antiken Griechenlands gemeistert: Von den ersten Poleis und der Kolonisation über Sparta, die Athenische Demokratie, den Olymp und die Perserkriege bis zum Weltreich Alexanders des Großen und den Diadochenreichen! Öffne jetzt mit Taste U deine druckbare Hellenische Meister-Urkunde!',
  },
};
