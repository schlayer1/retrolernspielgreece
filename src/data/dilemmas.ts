/**
 * Historische Dilemma- & Ratsentscheidungen für Antikes Griechenland
 */

export interface DilemmaOption {
  id: string;
  title: string;
  argumentText: string;
  rewards: Record<string, number>;
  storyFlag: string;
  feedbackText: string;
}

export interface DilemmaDef {
  id: string;
  chapter: number;
  councilTitle: string;
  mentorSpeaker: string;
  illustrationKey: string;
  conflictTitle: string;
  conflictText: string;
  options: DilemmaOption[];
}

export const GREEK_DILEMMAS: DilemmaDef[] = [
  {
    id: 'dilemma_ch3_brot_vs_flotte',
    chapter: 3,
    councilTitle: 'Die Volksversammlung auf der Pnyx (Athen)',
    mentorSpeaker: 'Archon Themistokles',
    illustrationKey: 'council_greek',
    conflictTitle: 'Silberschatz aus Laureion: Getreidegeld für alle Bürger oder Bau von 100 Triremen?',
    conflictText: 'In den Silberminen von Laureion wurde eine reiche Erzader entdeckt. Die Bürger wollen den Schatz als Geldgeschenk (je 10 Drachmen) unter dem Volk verteilen, um Oliven und Korn zu kaufen. Themistokles mahnt jedoch: Ohne eine starke Flotte von Triremen wird die persische Flotte Athen vernichten.',
    options: [
      {
        id: 'opt_fleet',
        title: 'Bau von 100 schnellen Kriegsschiffen (Triremen)',
        argumentText: 'Investiert das Silber in Schiffsbauholz, Pech und Ruderbänke! Nur eine Flotte garantiert Freiheit und Seehandel.',
        rewards: { holz: 15, bronze: 5 },
        storyFlag: 'dilemma_ch3_fleet_built',
        feedbackText: 'Eine historische Weitsicht! Die athenische Flotte sichert den Sieg von Salamis und schützt die Ägäis.'
      },
      {
        id: 'opt_citizens',
        title: 'Ausschüttung an Bürger & Getreidespeicher',
        argumentText: 'Das Silber gehört der Bürgerschaft! Füllt die städtischen Kornspeicher und verteilt Hilfen an bedürftige Familien.',
        rewards: { weizen: 20, oliven: 10 },
        storyFlag: 'dilemma_ch3_citizens_fed',
        feedbackText: 'Die Volksmenge jubelt! Die Bürgerschaft dankt dir mit reicher Ernte und sozialem Frieden in der Polis.'
      }
    ]
  }
];
