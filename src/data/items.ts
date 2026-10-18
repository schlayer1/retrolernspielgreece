export type GreekItemId =
  | 'oliven'
  | 'olivenoel'
  | 'gerste'
  | 'maza_brot'
  | 'fisch'
  | 'gebratener_fisch'
  | 'ziegenkaese'
  | 'blutsuppe'
  | 'wasser'
  | 'hacke'
  | 'sichel'
  | 'aspis_schild'
  | 'dory_speer'
  | 'sarissa_lanze'
  | 'rammsporn'
  | 'fackel'
  | 'holz'
  | 'kalkstein'
  | 'marmor'
  | 'ton'
  | 'eisenerz'
  | 'silbererz'
  | 'wolle'
  | 'segeltuch'
  | 'samen'
  | 'amphore'
  | 'drachme'
  | 'ostrakon'
  | 'lorbeerkranz'
  | 'weihrauch'
  | 'theatermaske'
  | 'schriftrolle'
  | 'diadochen_karte';

export type GreekItemCategory = 'tool' | 'food' | 'material' | 'culture';

export interface GreekItemDef {
  id: GreekItemId;
  name: string;
  category: GreekItemCategory;
  desc: string;
  foodValue?: number;
  lore?: string;
  icon?: string;
}

export interface GreekBuildingDef {
  id: string;
  name: string;
  helperName: string;
  x: number;
  y: number;
  cost: Partial<Record<GreekItemId, number>>;
  desc: string;
  unlockedInChapter: number;
}

export interface GreekRecipe {
  id: string;
  name: string;
  desc: string;
  cost: Partial<Record<GreekItemId, number>>;
  result?: { item: GreekItemId; count: number };
  requiresBuilding?: string;
}

export interface GreekTradeOffer {
  id: string;
  name: string;
  desc: string;
  give: Partial<Record<GreekItemId, number>>;
  receive: { item: GreekItemId; count: number };
}

export const ITEMS: Record<GreekItemId, GreekItemDef> = {
  oliven: {
    id: 'oliven',
    name: 'Attische Oliven',
    category: 'food',
    foodValue: 25,
    desc: 'Reife Früchte des heiligen Olivenbaums. Nahrhaft zum direkten Verzehr oder zum Pressen von goldenem Olivenöl.',
    lore: 'Nach dem Mythos schenkte die Göttin Athene der Stadt Athen den ersten Olivenbaum auf der Akropolis.',
  },
  olivenoel: {
    id: 'olivenoel',
    name: 'Goldenes Olivenöl',
    category: 'food',
    foodValue: 35,
    desc: 'Das „flüssige Gold“ Griechenlands: Genutzt als Speiseöl, Lampenbrennstoff, Hautpflege für Athleten und wertvollstes Exportgut.',
    lore: 'Sieger bei den Panathenäischen Spielen in Athen erhielten dutzende Amphoren feinstes Olivenöl als Preis.',
  },
  gerste: {
    id: 'gerste',
    name: 'Reife Gerste',
    category: 'material',
    desc: 'Auf kargen griechischen Böden angebautes Hauptgetreide. Grundlage für Fladenbrot (Maza).',
    lore: 'Da Weizen im trockenen Griechenland schwer gedieh, war robuste Gerste das wichtigste Grundnahrungsmittel.',
  },
  maza_brot: {
    id: 'maza_brot',
    name: 'Maza-Gerstenbrot',
    category: 'food',
    foodValue: 40,
    desc: 'Frisch gebackenes griechisches Gerstenfladenbrot, oft mit Olivenöl und Ziegenkäse serviert.',
  },
  fisch: {
    id: 'fisch',
    name: 'Ägäis-Meerbrasse',
    category: 'food',
    foodValue: 28,
    desc: 'Frisch aus den klaren Küstengewässern des Mittelmeers gefangener Speisefisch.',
  },
  gebratener_fisch: {
    id: 'gebratener_fisch',
    name: 'Gegrillter Mittelmeerfisch',
    category: 'food',
    foodValue: 45,
    desc: 'Über dem Olivenholzfeuer mit Kräutern knusprig gebratener Fisch.',
  },
  ziegenkaese: {
    id: 'ziegenkaese',
    name: 'Hirten-Ziegenkäse',
    category: 'food',
    foodValue: 35,
    desc: 'Würziger weißer Salzlakenkäse von den Ziegenherden der griechischen Berghänge (Urahn des heutigen Feta).',
  },
  blutsuppe: {
    id: 'blutsuppe',
    name: 'Spartanische Blutsuppe',
    category: 'food',
    foodValue: 50,
    desc: 'Melas Zomos: Die legendäre schwarze Suppe der Spartaner aus Schweinefleisch, Blut, Essig und Salz. Kräftigt für die Agoge!',
    lore: 'Ein Athener scherzte einst nach einem Löffel: „Jetzt verstehe ich, warum die Spartaner den Tod in der Schlacht nicht fürchten!“',
  },
  wasser: {
    id: 'wasser',
    name: 'Quellwasser-Hydria',
    category: 'material',
    desc: 'Kühles Quellwasser aus der steinernen Zisterne zum Bewässern der trockenen Ackerbeete.',
  },
  hacke: {
    id: 'hacke',
    name: 'Griechische Hacke',
    category: 'tool',
    desc: 'Werkzeug zum Auflockern der steinigen Erde in Attika.',
  },
  sichel: {
    id: 'sichel',
    name: 'Erntesichel (Drepanon)',
    category: 'tool',
    desc: 'Geschwungene Sichel zum Schneiden reifer Gerstenähren.',
  },
  aspis_schild: {
    id: 'aspis_schild',
    name: 'Hoplitenschild (Aspis)',
    category: 'tool',
    desc: 'Schwerer, mit Bronze beschlagener Rundschild mit dem roten spartanischen Lambda (Λ) für Lakedaimon.',
    lore: 'Spartanische Mütter überreichten ihren Söhnen den Schild mit den Worten: „Mit ihm oder auf ihm!“',
  },
  dory_speer: {
    id: 'dory_speer',
    name: 'Hoplitenspeer (Dory)',
    category: 'tool',
    desc: 'Über zwei Meter langer Stoßspeer aus Eschenholz mit eiserner Spitze für den Kampf in der geschlossenen Phalanx.',
  },
  sarissa_lanze: {
    id: 'sarissa_lanze',
    name: 'Makedonische Sarissa',
    category: 'tool',
    desc: 'Die bis zu 6 Meter lange Stoßlanze des Heeres von Philipp II. und Alexander dem Großen – unüberwindbar im Frontalangriff!',
  },
  rammsporn: {
    id: 'rammsporn',
    name: 'Bronzener Rammsporn (Embolon)',
    category: 'tool',
    desc: 'Am Bug der athenischen Trireme montierter massiver Bronzesporn zum Versenken feindlicher Perserschiffe bei Salamis.',
  },
  fackel: {
    id: 'fackel',
    name: 'Heilige Fackel',
    category: 'tool',
    desc: 'Trägt das heilige Herdfeuer (Hestia) der Mutterstadt in neue Kolonien oder entzündet die Signalfeuer an den Thermopylen.',
  },
  holz: {
    id: 'holz',
    name: 'Kiefern- & Olivenholz',
    category: 'material',
    desc: 'Wichtiges Bauholz für Triremen-Ruderbänke, Olivenpressen und Speerschäfte.',
  },
  kalkstein: {
    id: 'kalkstein',
    name: 'Heller Kalkstein',
    category: 'material',
    desc: 'Robuster Baustein für Grundmauern, Zisternen, Hafenmolen und Wehrmauern.',
  },
  marmor: {
    id: 'marmor',
    name: 'Parischer & Pentelischer Marmor',
    category: 'material',
    desc: 'Strahlend weißer Edelstein für den Parthenon-Tempel, Götterstatuen und die Bauten auf dem Olymp.',
  },
  ton: {
    id: 'ton',
    name: 'Attischer Töpferton',
    category: 'material',
    desc: 'Eisenreicher roter Ton aus dem Töpferviertel Kerameikos für schwarz- und rotfigurige Amphoren und Ostraka.',
  },
  eisenerz: {
    id: 'eisenerz',
    name: 'Taygetos-Eisenerz',
    category: 'material',
    desc: 'In den Bergen Lakoniens abgebautes Erz für spartanische Waffen und Werkzeuge.',
  },
  silbererz: {
    id: 'silbererz',
    name: 'Laureion-Silbererz',
    category: 'material',
    desc: 'Reiches Silbererz aus den Gruben von Laureion bei Athen. Finanzierte die Demokratie und die Flotte von Salamis!',
  },
  wolle: {
    id: 'wolle',
    name: 'Schaf- & Ziegenwolle',
    category: 'material',
    desc: 'Weiche Wolle von den griechischen Bergweiden zum Weben von Chiton-Gewändern und Schiffssegeln.',
  },
  segeltuch: {
    id: 'segeltuch',
    name: 'Gewebtes Segeltuch',
    category: 'material',
    desc: 'Reißfestes Tuch für die Rahsegel der Kolonistenschiffe und Kriegstriremen.',
  },
  samen: {
    id: 'samen',
    name: 'Gersten-Saatgut',
    category: 'material',
    desc: 'Körner für die Aussaat auf den gelockerten Ackerfeldern.',
  },
  amphore: {
    id: 'amphore',
    name: 'Bemalte Ton-Amphore',
    category: 'culture',
    desc: 'Zweihenkliges Vorrats- und Transportgefäß für Olivenöl, Wein und Getreide im gesamten Mittelmeerraum.',
    lore: 'Anhand von Millionen antiker Amphorenscherben können Archäologen heute die exakten Handelsrouten der Griechen rekonstruieren.',
  },
  drachme: {
    id: 'drachme',
    name: 'Athenische Eulen-Drachme',
    category: 'culture',
    desc: 'Geprägte Silbermünze mit dem Steinkauz der Göttin Athene und einem Olivenzweig – die härteste Währung der Antike!',
    lore: 'Daher stammt unser heutiges Sprichwort „Eulen nach Athen tragen“ (etwas Überflüssiges tun, weil es in Athen schon unzählige Silber-Eulen gab).',
  },
  ostrakon: {
    id: 'ostrakon',
    name: 'Ritz-Tonscherbe (Ostrakon)',
    category: 'culture',
    desc: 'Tonscherbe mit eingeritztem Namen für das athenische Scherbengericht (Ostrakismos) zum Schutz der Demokratie vor Tyrannen.',
  },
  lorbeerkranz: {
    id: 'lorbeerkranz',
    name: 'Olympischer Siegerkranz (Kotinos)',
    category: 'culture',
    desc: 'Aus Zweigen des heiligen wilden Ölbaums von Olympia geflochtener Ehrenkranz für die Sieger der Olympischen Spiele.',
  },
  weihrauch: {
    id: 'weihrauch',
    name: 'Duftender Opferweihrauch',
    category: 'culture',
    desc: 'Kostbares Harz für Trank- und Rauchopfer an den Altären von Zeus, Athene und Apollon.',
  },
  theatermaske: {
    id: 'theatermaske',
    name: 'Antike Theatermaske',
    category: 'culture',
    desc: 'Charaktervolle Maske für Tragödien und Komödien im Dionysos-Theater am Fuße der Akropolis.',
  },
  schriftrolle: {
    id: 'schriftrolle',
    name: 'Philosophische Schriftrolle',
    category: 'culture',
    desc: 'Mit dem griechischen Alphabet beschriebene Rolle über Philosophie (Sokrates, Platon, Aristoteles) und Naturwissenschaft.',
  },
  diadochen_karte: {
    id: 'diadochen_karte',
    name: 'Weltkarte des Hellenismus',
    category: 'culture',
    desc: 'Zeigt das gewaltige Reich Alexanders des Großen von Makedonien über Ägypten bis Indien und seine Teilung unter den Diadochen.',
  },
};

export const BUILDINGS: GreekBuildingDef[] = [
  {
    id: 'olivenpresse',
    name: 'Attische Olivenpresse',
    helperName: 'Ölpresserin Chloe',
    x: 230,
    y: 365,
    cost: { holz: 2, kalkstein: 2 },
    desc: 'Schwere Balkenpresse zum Gewinnen von goldenem Olivenöl aus geernteten Oliven (Kapitel 1).',
    unlockedInChapter: 1,
  },
  {
    id: 'hafen_werft',
    name: 'Schiffswerft von Piräus',
    helperName: 'Schiffbauer Glaukos',
    x: 680,
    y: 410,
    cost: { holz: 3, segeltuch: 1 },
    desc: 'Helling und Ausrüstungskai für Kolonistenschiffe und wendige Kriegstriremen (Kapitel 2 & 7).',
    unlockedInChapter: 2,
  },
  {
    id: 'sparta_schmiede',
    name: 'Lakonische Waffenschmiede',
    helperName: 'Schmied Brasidas',
    x: 140,
    y: 160,
    cost: { kalkstein: 2, eisenerz: 2 },
    desc: 'Glühende Esse im spartanischen Lager für Hoplitenschilde (Aspis), Speere und Rammsporne (Kapitel 3).',
    unlockedInChapter: 3,
  },
  {
    id: 'pnyx_buehne',
    name: 'Rednerbühne der Pnyx (Bema)',
    helperName: 'Herold Kalliades',
    x: 410,
    y: 260,
    cost: { kalkstein: 3, drachme: 1 },
    desc: 'Steinerne Tribüne für die Volksversammlung (Ekklesia) und das Scherbengericht in Athen (Kapitel 4).',
    unlockedInChapter: 4,
  },
  {
    id: 'zeus_altar',
    name: 'Heiliger Altar von Olympia',
    helperName: 'Tempeldiener Philon',
    x: 610,
    y: 145,
    cost: { marmor: 2, olivenoel: 1 },
    desc: 'Marmoraltar zu Ehren des Göttervaters Zeus für den Olympischen Frieden (Kapitel 5).',
    unlockedInChapter: 5,
  },
  {
    id: 'akademie_stube',
    name: 'Schreibstube der Akademie',
    helperName: 'Gelehrte Hypatia',
    x: 300,
    y: 220,
    cost: { marmor: 2, ton: 2 },
    desc: 'Ort der Philosophie, Theaterdichtung und Geschichtsschreibung in Athen (Kapitel 8).',
    unlockedInChapter: 8,
  },
  {
    id: 'bibliothek_alexandria',
    name: 'Museion & Große Bibliothek',
    helperName: 'Bibliothekar Zenodotos',
    x: 575,
    y: 350,
    cost: { marmor: 3, schriftrolle: 1 },
    desc: 'Das Wissenszentrum der hellenistischen Welt mit tausenden Schriftrollen (Kapitel 9 & 10).',
    unlockedInChapter: 9,
  },
];

export const RECIPES: GreekRecipe[] = [
  {
    id: 'olivenoel',
    name: 'Goldenes Olivenöl pressen',
    desc: 'Presst frische Oliven in der Balkenpresse zu wertvollem Olivenöl.',
    cost: { oliven: 2 },
    result: { item: 'olivenoel', count: 1 },
    requiresBuilding: 'olivenpresse',
  },
  {
    id: 'maza_brot',
    name: 'Maza-Gerstenbrot backen',
    desc: 'Backt nahrhaftes griechisches Fladenbrot aus geernteter Gerste.',
    cost: { gerste: 2 },
    result: { item: 'maza_brot', count: 2 },
  },
  {
    id: 'amphore',
    name: 'Schwarzfigurige Amphore töpfern',
    desc: 'Formt und brennt ein zweihenkliges Transportgefäß aus attischem Ton.',
    cost: { ton: 2 },
    result: { item: 'amphore', count: 1 },
  },
  {
    id: 'segeltuch',
    name: 'Reißfestes Segeltuch weben',
    desc: 'Webt aus Schafwolle und Pflanzenfasern ein starkes Rahsegel für das Mittelmeer.',
    cost: { wolle: 2 },
    result: { item: 'segeltuch', count: 1 },
  },
  {
    id: 'fackel',
    name: 'Heilige Kolonisten-Fackel binden',
    desc: 'Tränkt Kiefernholz mit Olivenöl für das ewige Feuer der Mutterstadt und die Thermopylen.',
    cost: { holz: 1, olivenoel: 1 },
    result: { item: 'fackel', count: 1 },
  },
  {
    id: 'aspis_schild',
    name: 'Hoplitenschild (Aspis) schmieden',
    desc: 'Beschlägt einen Holzkern mit Metall und malt das rote spartanische Lambda (Λ) auf.',
    cost: { holz: 2, eisenerz: 2 },
    result: { item: 'aspis_schild', count: 1 },
    requiresBuilding: 'sparta_schmiede',
  },
  {
    id: 'dory_speer',
    name: 'Hoplitenspeer (Dory) schmieden',
    desc: 'Schmiedet den zwei Meter langen Stoßspeer für die geschlossene Phalanx.',
    cost: { holz: 1, eisenerz: 1 },
    result: { item: 'dory_speer', count: 1 },
    requiresBuilding: 'sparta_schmiede',
  },
  {
    id: 'drachme',
    name: 'Athenische Eulen-Drachme prägen',
    desc: 'Prägt reines Silber aus Laureion mit dem Wappenkauz der Göttin Athene.',
    cost: { silbererz: 2 },
    result: { item: 'drachme', count: 2 },
  },
  {
    id: 'ostrakon',
    name: 'Ostrakon-Stimmstein ritzen',
    desc: 'Ritzt den Namen eines ehrgeizigen Politikers für das Scherbengericht in eine Tonscherbe.',
    cost: { ton: 1 },
    result: { item: 'ostrakon', count: 1 },
  },
  {
    id: 'lorbeerkranz',
    name: 'Olympischen Siegerkranz flechten',
    desc: 'Windet Zweige des heiligen Ölbaums zum Kotinos-Ehrenkranz für Olympiasieger.',
    cost: { oliven: 2 },
    result: { item: 'lorbeerkranz', count: 1 },
  },
  {
    id: 'rammsporn',
    name: 'Bronzenen Rammsporn (Embolon) gießen',
    desc: 'Gießt den dreizackigen Bug-Rammsporn für die athenischen Triremen bei Salamis.',
    cost: { eisenerz: 2, holz: 1 },
    result: { item: 'rammsporn', count: 1 },
    requiresBuilding: 'hafen_werft',
  },
  {
    id: 'theatermaske',
    name: 'Antike Theatermaske formen',
    desc: 'Modelliert eine ausdrucksstarke Tragödienmaske für das Dionysos-Theater.',
    cost: { ton: 2 },
    result: { item: 'theatermaske', count: 1 },
  },
  {
    id: 'schriftrolle',
    name: 'Philosophische Schriftrolle verfassen',
    desc: 'Hält die Dialoge von Sokrates, Platon und Aristoteles für die Akademie fest.',
    cost: { olivenoel: 1, drachme: 1 },
    result: { item: 'schriftrolle', count: 1 },
  },
  {
    id: 'sarissa_lanze',
    name: 'Makedonische Sarissa-Lanze fertigen',
    desc: 'Koppelt langes Kiefernholz mit einer schweren Eisenspitze zur 6 Meter langen Phalanx-Pike.',
    cost: { holz: 2, eisenerz: 1 },
    result: { item: 'sarissa_lanze', count: 1 },
  },
  {
    id: 'diadochen_karte',
    name: 'Weltkarte des Hellenismus zeichnen',
    desc: 'Kartiert die drei großen Diadochenreiche (Makedonien, Seleukiden, Ptolemäer) nach Alexanders Tod.',
    cost: { schriftrolle: 1, drachme: 1 },
    result: { item: 'diadochen_karte', count: 1 },
  },
];

export const TRADES: GreekTradeOffer[] = [
  {
    id: 'trade_weihrauch',
    name: 'Opferweihrauch aus dem Orient',
    desc: 'Tausche eine bemalte Ton-Amphore gegen duftenden Weihrauch für die Tempel der Götter.',
    give: { amphore: 1 },
    receive: { item: 'weihrauch', count: 2 },
  },
  {
    id: 'trade_marmor',
    name: 'Parischer Marmor von den Kykladen',
    desc: 'Kaufe mit einer silbernen Eulen-Drachme feinsten weißen Marmor für Tempel und Statuen.',
    give: { drachme: 1 },
    receive: { item: 'marmor', count: 2 },
  },
  {
    id: 'trade_getreide_kolonie',
    name: 'Kornlieferung aus den Kolonien',
    desc: 'Exportiere goldenes Olivenöl in die Pflanzstädte am Schwarzen Meer und erhalte reife Gerste.',
    give: { olivenoel: 1 },
    receive: { item: 'gerste', count: 3 },
  },
  {
    id: 'trade_silber',
    name: 'Silberhandel auf der Agora',
    desc: 'Tausche 2 bemalte Amphoren gegen Silbererz aus den attischen Minen.',
    give: { amphore: 2 },
    receive: { item: 'silbererz', count: 2 },
  },
  {
    id: 'trade_kaese',
    name: 'Berg-Ziegenkäse der Hirten',
    desc: 'Tausche 2× Oliven gegen würzigen Hirten-Ziegenkäse zur Stärkung.',
    give: { oliven: 2 },
    receive: { item: 'ziegenkaese', count: 2 },
  },
];
