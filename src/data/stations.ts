export interface StationChoice {
  label: string;
  feedback: string;
  correct: boolean;
}

export interface InteractiveStation {
  id: string;
  chapterId: number;
  title: string;
  subtitle: string;
  icon: string;
  type: 'simulation' | 'decoder' | 'experiment' | 'comparison' | 'judgment';
  historicalNote: string;
  taskPrompt: string;
  steps: {
    stepTitle: string;
    instruction: string;
    visualHtml: string;
    choices: StationChoice[];
  }[];
  rewardLexiconId?: string;
  rewardItem?: { id: string; qty: number };
  merksatz: string;
}

export const STATIONS: InteractiveStation[] = [
  {
    id: 'station_olivenpresse',
    chapterId: 1,
    title: 'Mitmach-Station 1: Die Attische Hebel-Olivenpresse',
    subtitle: 'Hebelgesetz, Mittelmeer-Trias & das „flüssige Gold“ der Polis',
    icon: '🫒',
    type: 'simulation',
    historicalNote:
      'Auf dem kargen, steinigen Kalkboden Griechenlands wuchsen kaum große Weizenfelder wie am Nil. Stattdessen nutzten die Griechen die „Mittelmeer-Trias“: Gerste, Weinreben und den tief wurzelnden Olivenbaum. Mit schweren Hebelpressen gewannen sie Olivenöl für Nahrung, Öllampen, Körperpflege und den Seehandel.',
    taskPrompt:
      'Bediene die antike Balkenpresse in zwei Schritten, um reines attisches Olivenöl zu pressen!',
    steps: [
      {
        stepTitle: 'Schritt 1: Oliven im Kollergang vorquetschen',
        instruction:
          'Bevor die Oliven unter den Pressbalken kommen, müssen sie auf dem runden Mahlstein zerquetscht werden. Worauf achteten griechische Ölpresser besonders?',
        visualHtml: `
          <div style="display:flex;align-items:center;justify-content:space-around;padding:14px;background:rgba(40,30,18,0.85);border:2px solid #d4af37;border-radius:10px;margin:8px 0;">
            <div style="text-align:center">
              <div style="font-size:34px">🫒</div>
              <div style="font-size:12px;color:#fcd34d">Frische Oliven</div>
            </div>
            <div style="font-size:24px;color:#d4af37">➔ ⚙️ ➔</div>
            <div style="text-align:center">
              <div style="font-size:34px">🥣</div>
              <div style="font-size:12px;color:#86efac">Olivenbrei in Bastmatten</div>
            </div>
          </div>
        `,
        choices: [
          {
            label: 'Die Oliven schonend zu Brei mahlen und in flache Bastkörbe schichten, damit das bittere Kernwasser nicht den Geschmack verdirbt.',
            feedback: 'Richtig! Der Olivenbrei wurde in geflochtene Körbe (Fiscoli) geschichtet und unter den langen Pressbalken gelegt.',
            correct: true,
          },
          {
            label: 'Die Oliven mitsamt den Ästen im offenen Feuer verbrennen.',
            feedback: 'Nein – verbrannte Oliven geben kein genießbares Öl mehr ab!',
            correct: false,
          },
        ],
      },
      {
        stepTitle: 'Schritt 2: Den schweren Gewichtsstein am Hebelbalken absenken',
        instruction:
          'Ein langer Eichenbalken drückt auf die gestapelten Körbe. Wo muss der schwere Kalksteinblock aufgehängt werden, um die größte Presskraft zu erzeugen?',
        visualHtml: `
          <div style="padding:12px;background:rgba(30,41,59,0.85);border:2px solid #93c5fd;border-radius:10px;text-align:center;margin:8px 0;">
            <div style="font-size:15px;font-weight:bold;color:#fde68a">Hebelarm: Wandlager [Drehpunkt] ──🧺 Körbe──────────🪨 [Gewichtsstein am Ende]</div>
            <div style="font-size:12px;color:#cbd5e1;margin-top:4px">Je länger der Hebelarm zum Gewicht, desto größer der Druck auf die Olivenkörbe!</div>
          </div>
        `,
        choices: [
          {
            label: 'Ganz am äußeren Ende des langen Pressbalkens („Je länger der Hebelarm, desto größer die Kraft“).',
            feedback: 'Perfekt! Goldgelbes Olivenöl („flüssiges Gold“) fließt in die Tonamphore!',
            correct: true,
          },
          {
            label: 'Direkt auf die Mauer hinter dem Drehpunkt legen.',
            feedback: 'Dort übt der Stein überhaupt keinen Druck auf die Körbe aus.',
            correct: false,
          },
        ],
      },
    ],
    rewardLexiconId: 'olivenbaum',
    rewardItem: { id: 'olivenoel', qty: 2 },
    merksatz:
      'Merksatz: Olivenbaum, Weinrebe und Gerste bildeten die Ernährungsgrundlage der griechischen Polis; Olivenöl war das wichtigste Exportgut („flüssiges Gold“).',
  },
  {
    id: 'station_kerameikos',
    chapterId: 2,
    title: 'Mitmach-Station 2: Töpferofen im Kerameikos – Schwarzfigurige Vasen',
    subtitle: 'Dreistufiger Tonbrand & Export für die Große Kolonisation',
    icon: '🏺',
    type: 'experiment',
    historicalNote:
      'Im Athener Handwerkerviertel „Kerameikos“ (daher unser Wort „Keramik“!) schufen Töpfer und Vasenmaler berühmte Amphoren und Trinkschalen. Das Geheimnis der glänzend schwarzen Figuren auf rotem Grund war keine schwarze Farbe, sondern eisenhaltiger Tonschlicker und eine ausgeklügelte Steuerung der Luftzufuhr im Brennofen!',
    taskPrompt:
      'Steuere die Luftklappe des griechischen Töpferofens im 3-Phasen-Brand!',
    steps: [
      {
        stepTitle: 'Phase 1 & 2: Rauchbrand (Reduktion) bei geschlossener Luftklappe',
        instruction:
          'Die Amphore aus attischem Ton ist mit feinem Tonschlicker bemalt. Was musst du bei 900 °C tun, damit sich die bemalten Figuren tiefschwarz färben?',
        visualHtml: `
          <div style="display:flex;justify-content:space-around;align-items:center;padding:12px;background:rgba(45,25,15,0.9);border:2px solid #f97316;border-radius:10px;margin:8px 0;">
            <div>🔥 <strong>900 °C im Ofen</strong></div>
            <div>🏺 Figuren aus feinem Tonschlicker</div>
            <div>💨 Luftklappe: ???</div>
          </div>
        `,
        choices: [
          {
            label: 'Luftklappe schließen und feuchtes Holz nachlegen: Ohne Sauerstoff wandelt sich das rote Eisenoxid im Ton in schwarzes Eisenoxid um!',
            feedback: 'Genau richtig! In der sauerstoffarmen Rauchphase färbt sich die gesamte Vase samt Bemalung zunächst schwarz.',
            correct: true,
          },
          {
            label: 'Kaltes Meerwasser in den glühenden Ofen schütten.',
            feedback: 'Vorsicht! Durch den Temperaturschock würden alle Vasen sofort zerspringen.',
            correct: false,
          },
        ],
      },
      {
        stepTitle: 'Phase 3: Re-Oxidation durch Öffnen der Luftklappe',
        instruction:
          'Wie wird nun der unbemalte Hintergrund der Vase wieder warm-ziegelrot, während die Figuren glänzend schwarz bleiben?',
        visualHtml: `
          <div style="padding:12px;background:rgba(45,25,15,0.9);border:2px solid #fbbf24;border-radius:10px;text-align:center;margin:8px 0;">
            <div style="font-size:15px;color:#fde68a">🏺 Hintergrund porös (nimmt Sauerstoff auf) · Figuren dicht versintert (bleiben schwarz)</div>
          </div>
        `,
        choices: [
          {
            label: 'Die Luftklappe beim Abkühlen wieder öffnen: Frischer Sauerstoff färbt den porösen Tonhintergrund wieder rot, während die versinterten Figuren tiefschwarz glänzen!',
            feedback: 'Meisterhaft! Deine schwarzfigurige Amphore ist bereit für den Seehandel rund ums Mittelmeer.',
            correct: true,
          },
          {
            label: 'Die Figuren nachträglich mit Kohle anmalen.',
            feedback: 'Kohle würde beim ersten Kontakt mit Wasser oder Olivenöl sofort abfärben.',
            correct: false,
          },
        ],
      },
    ],
    rewardLexiconId: 'amphore',
    rewardItem: { id: 'amphore', qty: 1 },
    merksatz:
      'Merksatz: Im Athener Töpferviertel Kerameikos entstanden durch den dreistufigen Tonbrand kunstvolle Amphoren für den Mittelmeerhandel.',
  },
  {
    id: 'station_ostrakismos',
    chapterId: 4,
    title: 'Mitmach-Station 3: Scherbengericht (Ostrakismos) & Griechisches Alphabet',
    subtitle: '24 Buchstaben mit Vokalen & Schutz der Demokratie vor Tyrannis',
    icon: '🗳️',
    type: 'decoder',
    historicalNote:
      'Die Griechen übernahmen das phönizische Alphabet und fügten erstmals eigene Zeichen für Vokale (A, E, I, O, U) hinzu – eine leicht erlernbare Schrift für alle Bürger! Beim jährlichen Scherbengericht (Ostrakismos) ritzten die Athener den Namen eines Politikers in eine Tonscherbe (Ostrakon), wenn sie fürchteten, er wolle Alleinherrscher (Tyrann) werden.',
    taskPrompt:
      'Entziffere die eingeritzte griechische Inschrift auf der Tonscherbe und entscheide über das Verfahren der Ekklesia!',
    steps: [
      {
        stepTitle: 'Schritt 1: Griechische Buchstaben auf dem Ostrakon entziffern',
        instruction:
          'Lies die griechischen Großbuchstaben auf dieser originalen Tonscherbe von der Athener Agora:  Θ Ε Μ Ι Σ Τ Ο Κ Λ Η Σ  (Θ = Th, Σ = S, Η = langes E)',
        visualHtml: `
          <div style="padding:16px;background:#7c2d12;border:3px solid #fdba74;border-radius:12px;text-align:center;margin:8px 0;font-family:monospace;">
            <div style="font-size:24px;letter-spacing:4px;color:#fef3c7;font-weight:bold;">Θ Ε Μ Ι Σ Τ Ο Κ Λ Η Σ</div>
            <div style="font-size:12px;color:#fed7aa;margin-top:6px;">Tonscherbe (Ostrakon), eingeritzt mit spitzem Griffel</div>
          </div>
        `,
        choices: [
          {
            label: 'THEMISTOKLES – der berühmte Athener Flottenstratege!',
            feedback: 'Exakt gelesen! Dank des Vokal-Alphabets konnten tausende Bürger Athens selbstständig Namen lesen und in Tonscherben ritzen.',
            correct: true,
          },
          {
            label: 'ALEXANDER – König von Makedonien.',
            feedback: 'Schau dir die Anfangsbuchstaben Θ-Ε-Μ-Ι-Σ-Τ... noch einmal genau an.',
            correct: false,
          },
        ],
      },
      {
        stepTitle: 'Schritt 2: Rechtsfolgen des Scherbengerichts prüfen',
        instruction:
          'Mehr als 6.000 Bürger haben ihre Tonscherbe auf der Agora abgegeben. Welche Strafe trifft denjenigen, auf den die meisten Stimmen entfallen?',
        visualHtml: `
          <div style="padding:12px;background:rgba(30,41,59,0.9);border:2px solid #fde047;border-radius:10px;text-align:center;margin:8px 0;">
            <div style="font-size:14px;color:#fef08a">⚖️ Quorum erreicht: Mindestens 6.000 gültige Tonscherben (Ostraka) gezählt!</div>
          </div>
        `,
        choices: [
          {
            label: 'Er muss Athen für 10 Jahre verlassen (Ehrenverbannung), behält aber sein Bürgerrecht und sein gesamtes Eigentum.',
            feedback: 'Richtig! Der Ostrakismos war kein Strafgericht für Verbrecher, sondern eine politische Sicherheitsbremse gegen eine Tyrannis.',
            correct: true,
          },
          {
            label: 'Er wird zum lebenslangen Sklaven in Sparta gemacht.',
            feedback: 'Nein, Eigentum, Familie und Ehre des Verbannten blieben in Athen unangetastet.',
            correct: false,
          },
        ],
      },
    ],
    rewardLexiconId: 'ostrakismos',
    rewardItem: { id: 'ostrakon', qty: 1 },
    merksatz:
      'Merksatz: Mit dem Vokal-Alphabet und dem Scherbengericht (Ostrakismos) schützten die Bürger Athens ihre Demokratie vor einer Alleinherrschaft (Tyrannis).',
  },
  {
    id: 'station_saeulenordnung',
    chapterId: 5,
    title: 'Mitmach-Station 4: Die drei Griechischen Säulenordnungen am Tempel',
    subtitle: 'Dorisch, Ionisch & Korinthisch – Harmonie aus Marmor',
    icon: '🏛️',
    type: 'comparison',
    historicalNote:
      'Griechische Baumeister errichteten Tempel als „Wohnhaus der Gottheit“ nach strengen mathematischen Proportionen. An der Gestaltung des Säulenkopfes (Kapitell) erkennt man noch heute auf den ersten Blick die drei klassischen Baustile: Dorisch, Ionisch und Korinthisch.',
    taskPrompt:
      'Ordne die Säulenkapitelle und den Aufbau des Parthenon-Tempels richtig zu!',
    steps: [
      {
        stepTitle: 'Schritt 1: Das Kapitell bestimmen',
        instruction:
          'Vergleiche die drei Säulenköpfe (Kapitelle): Welcher Stil zeichnet sich durch zwei seitlich eingerollte Schnecken („Voluten“) aus?',
        visualHtml: `
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:8px 0;text-align:center;">
            <div style="background:rgba(255,255,255,0.08);padding:10px;border:1px solid #cbd5e1;border-radius:8px;">
              <div style="font-size:22px">🏛️</div>
              <div style="font-weight:bold;color:#fde68a">1. Schlichtes Polster</div>
              <div style="font-size:11px;color:#cbd5e1">Kräftig, ohne Basis direkt auf den Stufen</div>
            </div>
            <div style="background:rgba(255,255,255,0.14);padding:10px;border:2px solid #fbbf24;border-radius:8px;">
              <div style="font-size:22px">🌀🏛️🌀</div>
              <div style="font-weight:bold;color:#fde68a">2. Doppel-Schnecke (Volute)</div>
              <div style="font-size:11px;color:#cbd5e1">Schlank, elegant, auf profilierter Basis</div>
            </div>
            <div style="background:rgba(255,255,255,0.08);padding:10px;border:1px solid #cbd5e1;border-radius:8px;">
              <div style="font-size:22px">🌿🏛️🌿</div>
              <div style="font-weight:bold;color:#fde68a">3. Akanthus-Blätterkelch</div>
              <div style="font-size:11px;color:#cbd5e1">Prachtvoll verziert (Spätklassik & Hellenismus)</div>
            </div>
          </div>
        `,
        choices: [
          {
            label: 'Die Ionische Säulenordnung (Nr. 2) trägt die charakteristischen Schneckenrollen (Voluten), während Dorisch (Nr. 1) schlicht und Korinthisch (Nr. 3) mit Akanthusblättern geschmückt ist.',
            feedback: 'Ausgezeichnet! Damit kannst du jeden antiken und klassizistischen Tempel sofort bestimmen.',
            correct: true,
          },
          {
            label: 'Alle griechischen Säulen sahen vollkommen identisch aus.',
            feedback: 'Im Gegenteil: Die drei Säulenordnungen Dorisch, Ionisch und Korinthisch sind das Markenzeichen griechischer Architektur!',
            correct: false,
          },
        ],
      },
      {
        stepTitle: 'Schritt 2: Das Geheimnis der „Entasis“ und Farbigkeit',
        instruction:
          'Heute leuchtet der Marmor des Parthenon weiß. Wie sahen griechische Tempel und Statuen in der Antike ursprünglich aus?',
        visualHtml: `
          <div style="padding:12px;background:rgba(30,58,138,0.65);border:2px solid #facc15;border-radius:10px;text-align:center;margin:8px 0;">
            <div style="font-size:14px;color:#fef08a">🎨 Archäologische Farbrest-Analyse (Polychromie) an Giebelfiguren und Friesen</div>
          </div>
        `,
        choices: [
          {
            label: 'Sie waren leuchtend bunt bemalt (Polychromie) in kräftigem Rot, Blau und Gold!',
            feedback: 'Richtig! Erst über die Jahrtausende wuschen Regen und Sonne die leuchtenden Mineralfarben vom weißen Marmor ab.',
            correct: true,
          },
          {
            label: 'Es war bei Todesstrafe verboten, Farbe auf Marmor aufzutragen.',
            feedback: 'Nein, mikroskopische Farbspuren beweisen, dass Tempel und Statuen prachtvoll bemalt waren.',
            correct: false,
          },
        ],
      },
    ],
    rewardLexiconId: 'akropolis',
    rewardItem: { id: 'marmor', qty: 2 },
    merksatz:
      'Merksatz: Griechische Tempel folgten der dorischen, ionischen oder korinthischen Säulenordnung und waren in der Antike farbig bemalt.',
  },
  {
    id: 'station_salamis_triere',
    chapterId: 7,
    title: 'Mitmach-Station 5: Taktik-Tisch der Seeschlacht von Salamis (480 v. Chr.)',
    subtitle: 'Dreiruderer (Triere), Rammsporn & Ruderer-Demokratie',
    icon: '🚢',
    type: 'judgment',
    historicalNote:
      'Als Großkönig Xerxes I. 480 v. Chr. Athen niederbrannte, setzte Stratege Themistokles alles auf eine Karte: Er lockte die zahlenmäßig weit überlegene persische Flotte in den schmalen Meeresarm vor der Insel Salamis.',
    taskPrompt:
      'Analysiere den Querschnitt einer athenischen Triere und wähle die siegreiche Flottentaktik!',
    steps: [
      {
        stepTitle: 'Schritt 1: Antrieb und Besatzung der Triere',
        instruction:
          'Auf drei Ebenen übereinander (Thraniten, Zygiten, Thalamiten) sitzen 170 Ruderer. Wer saß auf den Ruderbänken der athenischen Kriegsschiffe?',
        visualHtml: `
          <div style="padding:12px;background:rgba(15,23,42,0.9);border:2px solid #38bdf8;border-radius:10px;text-align:center;margin:8px 0;">
            <div style="font-size:16px;color:#7dd3fc;font-weight:bold;">🚣‍♂️ 3 Ruderreihen · 170 Ruderer · Bronzener Rammsporn (Embolon) am Bug</div>
          </div>
        `,
        choices: [
          {
            label: 'Freie, ärmere Bürger Athens (Theten), die für ihren Dienst Sold erhielten und dadurch politisches Gewicht in der Demokratie gewannen!',
            feedback: 'Genau! Nicht angekettete Sklaven, sondern hochtrainierte freie Bürger ruderten die Triere im präzisen Takt des Flötenspielers.',
            correct: true,
          },
          {
            label: 'Ausschließlich spartanische Könige.',
            feedback: 'Sparta war eine Landmacht; Athen stellte das Rückgrat der griechischen Flotte.',
            correct: false,
          },
        ],
      },
      {
        stepTitle: 'Schritt 2: Die Falle in der Meerenge von Salamis',
        instruction:
          'Die persische Flotte hat viel mehr und größere Schiffe als die Griechen. Wo befiehlst du den Angriff der Trieren?',
        visualHtml: `
          <div style="padding:12px;background:rgba(15,23,42,0.9);border:2px solid #facc15;border-radius:10px;text-align:center;margin:8px 0;">
            <div style="font-size:14px;color:#fde68a">🌊 Offene Ägäis (viel Platz zum Umzingeln) vs. ⛰️ Enge Bucht von Salamis (schmaler Kanal & Seitenwind)</div>
          </div>
        `,
        choices: [
          {
            label: 'In der engen Bucht von Salamis: Dort verkeilen sich die großen Perserschiffe im morgendlichen Seewind, und unsere wendigen Trieren rammen sie von der Seite!',
            feedback: 'Historischer Triumph! Bei Salamis (480 v. Chr.) retteten die Trieren die Freiheit der griechischen Poleis.',
            correct: true,
          },
          {
            label: 'Auf dem offenen Meer, wo uns die persische Übermacht von allen Seiten einkreisen kann.',
            feedback: 'Auf offener See hätte die zahlenmäßige Übermacht der Perser die Griechen eingeschlossen.',
            correct: false,
          },
        ],
      },
    ],
    rewardLexiconId: 'trireme_salamis',
    rewardItem: { id: 'drachme', qty: 2 },
    merksatz:
      'Merksatz: In der engen Bucht von Salamis (480 v. Chr.) besiegten Athens wendige Trieren mit ihren Rammspornen die persische Großflotte.',
  },
];
