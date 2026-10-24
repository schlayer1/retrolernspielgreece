import Phaser from 'phaser';
import { state, GREEK_ROLES, DialogSpec } from '../systems/GameState';
import { CHAPTERS, LEXICON, EPOCH_COMPARISON, HIGHLIGHT_TERMS } from '../data/chapters';
import {
  ITEMS,
  BUILDINGS,
  RECIPES,
  TRADES,
  GreekItemId,
  GreekItemCategory,
} from '../data/items';
import { GREEK_RELICS } from '../data/relics';
import { PlayerRole } from '../systems/SaveManager';
import { sfx, bgm } from '../audio/sound';
import { TouchControls } from '../ui/TouchControls';
import { PrintSheetManager } from '../ui/PrintSheet';
import { DilemmaModal } from '../ui/DilemmaModal';
import { GREEK_DILEMMAS } from '../data/dilemmas';

const ITEM_ICON_FILES: Record<GreekItemId, string> = {
  oliven: 'oliven.png',
  olivenoel: 'olivenoel.png',
  gerste: 'gerste.png',
  maza_brot: 'maza_brot.png',
  fisch: 'fisch.png',
  gebratener_fisch: 'gebratener_fisch.png',
  ziegenkaese: 'ziegenkaese.png',
  blutsuppe: 'blutsuppe.png',
  wasser: 'wasser.png',
  hacke: 'hacke.png',
  sichel: 'sichel.png',
  aspis_schild: 'aspis_schild.png',
  dory_speer: 'dory_speer.png',
  sarissa_lanze: 'sarissa_lanze.png',
  rammsporn: 'rammsporn.png',
  fackel: 'fackel.png',
  holz: 'holz.png',
  kalkstein: 'kalkstein.png',
  marmor: 'marmor.png',
  ton: 'ton.png',
  eisenerz: 'eisenerz.png',
  silbererz: 'silbererz.png',
  wolle: 'wolle.png',
  segeltuch: 'segeltuch.png',
  samen: 'samen.png',
  amphore: 'amphore.png',
  drachme: 'drachme.png',
  ostrakon: 'ostrakon.png',
  lorbeerkranz: 'lorbeerkranz.png',
  weihrauch: 'weihrauch.png',
  theatermaske: 'theatermaske.png',
  schriftrolle: 'schriftrolle.png',
  diadochen_karte: 'diadochen_karte.png',
};

const RELIC_ICON_FILES: Record<string, string> = {
  relic_amphore: 'relic_amphore.png',
  relic_eule: 'relic_eule.png',
  relic_agamemnon: 'relic_agamemnon.png',
  relic_antikythera: 'relic_antikythera.png',
  relic_alexander: 'relic_alexander.png',
};

export function itemIconHtml(id: GreekItemId, size = 24): string {
  const file = ITEM_ICON_FILES[id];
  const def = ITEMS[id];
  if (!file) return `<span style="font-size:${size - 4}px">${def?.icon ?? '📦'}</span>`;
  return `<img src="assets/icons/${file}" alt="${def?.name ?? id}" class="pixel-icon" style="width:${size}px;height:${size}px;vertical-align:middle;" />`;
}

export function relicIconHtml(id: string, size = 34): string {
  const file = RELIC_ICON_FILES[id];
  const rel = GREEK_RELICS[id];
  if (!file) return `<span style="font-size:${size - 4}px">${rel?.icon ?? '🏺'}</span>`;
  return `<img src="assets/icons/${file}" alt="${rel?.title ?? id}" class="pixel-icon" style="width:${size}px;height:${size}px;vertical-align:middle;" />`;
}

const REGEX_CACHE: { re: RegExp }[] = HIGHLIGHT_TERMS.map((term) => ({
  re: new RegExp(
    `(?<![\\wÄÖÜäöüß])(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(?![\\wÄÖÜäöüß])`,
    'gi'
  ),
}));

export function highlightTerms(html: string): string {
  const parts = html.split(/(<[^>]+>)/g);
  for (let i = 0; i < parts.length; i += 2) {
    let text = parts[i];
    for (const { re } of REGEX_CACHE) {
      text = text.replace(re, '<span class="term-highlight">$1</span>');
    }
    parts[i] = text;
  }
  return parts.join('');
}

export class UIScene extends Phaser.Scene {
  private root!: HTMLElement;
  private questTitleEl!: HTMLElement;
  private questTextEl!: HTMLElement;
  private compassEl!: HTMLElement;
  private healthFill!: HTMLElement;
  private hungerFill!: HTMLElement;
  private healthVal!: HTMLElement;
  private hungerVal!: HTMLElement;
  private hotbarEl!: HTMLElement;
  private hintEl!: HTMLElement;
  private toastEl!: HTMLElement;
  private dialogDock!: HTMLElement;
  private modalBackdrop!: HTMLElement;
  private modalCard!: HTMLElement;

  private toastTimer?: number;
  private activeModal:
    | 'none'
    | 'start'
    | 'craft'
    | 'build'
    | 'lexicon'
    | 'timeline'
    | 'bag'
    | 'pause'
    | 'trade'
    | 'relic'
    | 'cert'
    | 'portal'
    | 'dilemma'
    | 'milestone' = 'none';

  private dilemmaModal = new DilemmaModal();

  private selectedLexId: string = Object.keys(LEXICON)[0];
  private selectedBagCategory: 'all' | GreekItemCategory = 'all';
  private selectedBagItem: GreekItemId | null = null;
  private buildContextSiteId?: string;
  private activeDialogSpec?: DialogSpec;
  private activeDialogIndex = 0;
  private startPortalShown = false;

  constructor() {
    super('UI');
  }

  create(): void {
    this.root = document.getElementById('ui-root')!;
    this.buildDOM();
    state.touch = new TouchControls(this) as unknown as typeof state.touch;
    state.touch?.setVisible?.(false);

    const dismissRotateBtn = document.getElementById('btn-dismiss-rotate');
    if (dismissRotateBtn) {
      dismissRotateBtn.onclick = () => {
        document.getElementById('rotate-prompt')?.classList.add('dismissed');
      };
    }

    // State Events
    state.on('inventory', () => this.refreshHUD());
    state.on('quest', () => this.refreshHUD());
    state.on('buildings', () => this.refreshHUD());
    state.on('chapterChanged', () => this.refreshHUD());
    state.on('profileChanged', () => this.refreshHUD());
    state.on('compass', (txt: string) => this.setCompassText(txt));
    state.on('toast', (msg: string) => this.showToast(msg));
    state.on('hint', (text: string | null) => this.setHint(text));
    state.on('dialog', (spec: DialogSpec) => this.openDialogSpec(spec));
    state.on('openBuildModal', (siteId?: string) => this.openBuild(siteId));
    state.on('openTradeModal', () => this.openTrade());
    state.on('openTrade', () => this.openTrade());
    state.on('openRelicModal', (relicId: string) => this.openRelicQuiz(relicId));
    state.on('openRelicQuiz', (relicId: string) => this.openRelicQuiz(relicId));
    state.on('openCertificate', () => this.openCertificate());
    state.on('chapterDone', (ch: number) => this.openChapterMilestone(ch));

    // Periodic HUD refresh for hunger/safety/compass
    this.time.addEvent({
      delay: 400,
      loop: true,
      callback: () => {
        this.refreshHUD();
        if (state.compassText) {
          this.setCompassText(state.compassText);
        }
        if (state.hint !== undefined) {
          this.setHint(state.hint || null);
        }
      },
    });

    // Hotkeys
    this.input.keyboard?.on('keydown', (ev: KeyboardEvent) => {
      if (
        document.activeElement &&
        (document.activeElement.tagName === 'INPUT' ||
          document.activeElement.tagName === 'TEXTAREA')
      ) {
        return;
      }

      if (ev.code === 'Escape' || ev.code === 'KeyP') {
        if (this.activeModal === 'start' || this.activeModal === 'portal') return;
        if (this.activeModal !== 'none') {
          this.closeModal();
        } else if (this.dialogDock.classList.contains('open')) {
          this.advanceDialog();
        } else {
          this.openPause();
        }
        return;
      }

      if (this.dialogDock.classList.contains('open')) {
        if (ev.code === 'Space' || ev.code === 'Enter') {
          ev.preventDefault();
          this.advanceDialog();
        }
        return;
      }

      if (this.activeModal === 'start' || this.activeModal === 'portal') return;

      if (ev.code === 'KeyC') {
        this.toggleModal('craft', () => this.openCraft());
      } else if (ev.code === 'KeyB' || ev.code === 'KeyI') {
        this.toggleModal('bag', () => this.openBag());
      } else if (ev.code === 'KeyV') {
        this.toggleModal('build', () => this.openBuild());
      } else if (ev.code === 'KeyH') {
        this.toggleModal('trade', () => this.openTrade());
      } else if (ev.code === 'KeyL') {
        this.toggleModal('lexicon', () => this.openLexicon());
      } else if (ev.code === 'KeyZ') {
        this.toggleModal('timeline', () => this.openTimeline());
      } else if (ev.code === 'KeyU') {
        this.toggleModal('cert', () => this.openCertificate());
      } else if (ev.code === 'KeyR') {
        this.toggleModal('dilemma', () => this.openDilemma());
      } else if (ev.code === 'KeyM') {
        const muted = bgm.toggleMute();
        this.updateMuteBtn();
        this.showToast(muted ? '🔇 Ton ausgeschaltet' : '🔊 Ton eingeschaltet');
      } else if (ev.code.startsWith('Digit')) {
        const digit = parseInt(ev.code.replace('Digit', ''), 10);
        if (digit >= 1 && digit <= 9) {
          this.useHotbarSlot(digit - 1);
        }
      }
    });

    this.refreshHUD();

    const params = new URLSearchParams(window.location.search);
    if (!this.startPortalShown && params.get('portal') === '1') {
      this.startPortalShown = true;
      this.openEpochPortal(true);
    } else if (!state.skipStartScreen) {
      this.openStartScreen();
    }
  }

  private buildDOM(): void {
    this.root.innerHTML = `
      <!-- Top HUD -->
      <div class="hud-top">
        <div class="hud-quest-box" id="hud-quest-box" title="Antippen zum Auf-/Zuklappen">
          <div class="hud-chapter-title" id="hud-chapter-title"></div>
          <div class="hud-quest-text" id="hud-quest-text"></div>
          <div class="hud-compass" id="hud-compass">🧭 Ziel lädt…</div>
        </div>

        <div class="hud-right">
          <div style="display:flex;align-items:flex-start;gap:6px;" class="hud-top-right-group">
            <div class="hud-bars-card">
              <div class="hud-bar-row">
                <span>🛡️ Schutz</span>
                <div class="hud-bar-track">
                  <div class="hud-bar-fill" id="hud-health-fill" style="background:#ef4444;width:100%"></div>
                </div>
                <span id="hud-health-val" style="min-width:34px;text-align:right">100%</span>
              </div>
              <div class="hud-bar-row">
                <span>🫒 Sättigung</span>
                <div class="hud-bar-track">
                  <div class="hud-bar-fill" id="hud-hunger-fill" style="background:#f59e0b;width:100%"></div>
                </div>
                <span id="hud-hunger-val" style="min-width:34px;text-align:right">100%</span>
              </div>
              <div class="hud-bar-subinfo" style="display:flex;justify-content:space-between;font-size:11px;color:#fde68a;border-top:1px solid rgba(232,193,112,0.25);padding-top:3px;">
                <span id="hud-role-label">⛵ Seefahrer</span>
                <span id="hud-relic-label">🏺 Relikte: 0 / 5</span>
              </div>
            </div>
            <!-- Kompakter einzelner Menü-Button für den mobilen Handymodus -->
            <button class="retro-btn hud-mobile-menu-btn" id="btn-mobile-menu" style="display:none;" title="Spielmenü & Werkzeuge öffnen">
              ⏸ Menü
            </button>
          </div>

          <div class="hud-btn-row">
            <button class="retro-btn" id="btn-bag" title="Rucksack & Vorräte (I / B)">
              🎒 Rucksack <span class="key-badge">I</span>
            </button>
            <button class="retro-btn" id="btn-craft" title="Werkstatt & Handwerk (C)">
              ⚒️ Handwerk <span class="key-badge">C</span>
            </button>
            <button class="retro-btn" id="btn-build" title="Polis-Bauwerke errichten (V)">
              🏛️ Bauen <span class="key-badge">V</span>
            </button>
            <button class="retro-btn" id="btn-trade" title="Agora-Seehandel (H)">
              ⚖️ Handel <span class="key-badge">H</span>
            </button>
            <button class="retro-btn" id="btn-lex" title="Hellas-Lexikon & Wissen (L)">
              📖 Lexikon <span class="key-badge">L</span>
            </button>
            <button class="retro-btn" id="btn-time" title="Epochen-Vergleich & Kapitelwahl (Z)">
              ⏳ Epochen <span class="key-badge">Z</span>
            </button>
            <button class="retro-btn" id="btn-cert" title="Hefter-Urkunde drucken (U)">
              🎓 Urkunde <span class="key-badge">U</span>
            </button>
            <button class="retro-btn" id="btn-dilemma" title="Volksversammlung & Rat (R)" style="border-color:#ca8a04;">
              ⚖️ Rat <span class="key-badge">R</span>
            </button>
            <button class="retro-btn" id="btn-mute" title="Ton an/aus (M)">
              🔊 <span class="key-badge">M</span>
            </button>
            <button class="retro-btn" id="btn-pause" title="Pause, Statistik & Hefter-Code (P / ESC)">
              ⏸️ Pause <span class="key-badge">P</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Toast -->
      <div class="hud-toast" id="hud-toast"></div>

      <!-- Bottom Hint & Hotbar -->
      <div class="hud-bottom">
        <div class="hud-hint-pill" id="hud-hint" style="display:none"></div>
        <div class="hud-bottom-row">
          <div class="hud-hotbar" id="hud-hotbar"></div>
          <button class="hotbar-bag-btn" id="btn-hotbar-bag" title="Rucksack öffnen (I)">
            🎒 Rucksack <span class="key-badge" style="background:#ffd86b;color:#1a1208;padding:1px 5px;border-radius:3px;font-size:10.5px;">I</span>
          </button>
        </div>
      </div>

      <!-- Dialog Dock -->
      <div class="dialog-dock" id="dialog-dock"></div>

      <!-- Modal Backdrop -->
      <div class="modal-backdrop" id="modal-backdrop">
        <div class="modal-card" id="modal-card"></div>
      </div>
    `;

    this.questTitleEl = document.getElementById('hud-chapter-title')!;
    this.questTextEl = document.getElementById('hud-quest-text')!;
    this.compassEl = document.getElementById('hud-compass')!;
    this.healthFill = document.getElementById('hud-health-fill')!;
    this.hungerFill = document.getElementById('hud-hunger-fill')!;
    this.healthVal = document.getElementById('hud-health-val')!;
    this.hungerVal = document.getElementById('hud-hunger-val')!;
    this.hotbarEl = document.getElementById('hud-hotbar')!;
    this.hintEl = document.getElementById('hud-hint')!;
    this.toastEl = document.getElementById('hud-toast')!;
    this.dialogDock = document.getElementById('dialog-dock')!;
    this.modalBackdrop = document.getElementById('modal-backdrop')!;
    this.modalCard = document.getElementById('modal-card')!;

    document.getElementById('btn-bag')!.onclick = () => this.openBag();
    document.getElementById('btn-hotbar-bag')!.onclick = () => this.openBag();
    document.getElementById('btn-craft')!.onclick = () => this.openCraft();
    document.getElementById('btn-build')!.onclick = () => this.openBuild();
    document.getElementById('btn-trade')!.onclick = () => this.openTrade();
    document.getElementById('btn-lex')!.onclick = () => this.openLexicon();
    document.getElementById('btn-time')!.onclick = () => this.openTimeline();
    document.getElementById('btn-cert')!.onclick = () => this.openCertificate();
    document.getElementById('btn-dilemma')!.onclick = () => this.openDilemma();
    document.getElementById('btn-pause')!.onclick = () => this.openPause();
    document.getElementById('btn-mobile-menu')!.onclick = () => this.openPause();

    const questBox = document.getElementById('hud-quest-box');
    if (questBox) {
      questBox.onclick = () => {
        questBox.classList.toggle('expanded');
      };
    }

    document.getElementById('btn-mute')!.onclick = () => {
      bgm.toggleMute();
      this.updateMuteBtn();
    };

    this.modalBackdrop.addEventListener('click', (e) => {
      if (
        e.target === this.modalBackdrop &&
        this.activeModal !== 'start' &&
        this.activeModal !== 'portal'
      ) {
        this.closeModal();
      }
    });
  }

  private updateMuteBtn(): void {
    const btn = document.getElementById('btn-mute');
    if (btn) {
      btn.innerHTML = `${bgm.isMutedState() ? '🔇' : '🔊'} <span class="key-badge">M</span>`;
    }
  }

  public setCompassText(html: string): void {
    if (this.compassEl) this.compassEl.innerHTML = html;
  }

  private cleanTitle(t: string): string {
    return t.replace(/^Kapitel\s+\d+\s*:\s*/i, '');
  }

  private speakText(text: string): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      this.showToast('Sprachausgabe wird von diesem Browser nicht unterstützt.');
      return;
    }
    window.speechSynthesis.cancel();
    const clean = text.replace(/<[^>]+>/g, '').trim();
    const utter = new SpeechSynthesisUtterance(clean);
    utter.lang = 'de-DE';
    utter.rate = 0.95;
    window.speechSynthesis.speak(utter);
    this.showToast('🔊 Liest Merksatz vor…');
  }

  public refreshHUD(): void {
    const ch = CHAPTERS[state.chapter] ?? CHAPTERS[1];
    this.questTitleEl.innerHTML = `Kapitel ${ch.id}/10: ${this.cleanTitle(ch.title)} <span style="font-weight:600;color:#d6c39c;font-size:0.88em">(${ch.epoch} · ${ch.period})</span>`;

    const done = state.isChapterComplete();
    const curQuestText =
      ch.quests[Math.min(state.quest, ch.quests.length - 1)] ?? ch.quests[0] ?? '';
    const curHintText =
      ch.hints[Math.min(state.quest, ch.hints.length - 1)] ?? '';
    this.questTextEl.innerHTML = `${done ? '✅ ' : '🎯 '}${highlightTerms(curQuestText)}${
      curHintText ? `<div style="font-size:0.88em;color:#fde68a;margin-top:2px;">💡 ${highlightTerms(curHintText)}</div>` : ''
    }`;

    const hp = Math.round(state.safety);
    const hg = Math.round(state.food);
    this.healthFill.style.width = `${hp}%`;
    this.hungerFill.style.width = `${hg}%`;
    this.healthVal.textContent = `${hp}%`;
    this.hungerVal.textContent = `${hg}%`;

    const roleDef = GREEK_ROLES[state.playerRole] ?? GREEK_ROLES.sailor;
    const roleEl = document.getElementById('hud-role-label');
    if (roleEl) roleEl.textContent = `${roleDef.icon} ${roleDef.name}`;

    const relicEl = document.getElementById('hud-relic-label');
    if (relicEl) {
      relicEl.textContent = `🏺 Relikte: ${state.relicsFound.length} / 5`;
    }

    // Hotbar
    const entries = (Object.keys(ITEMS) as GreekItemId[]).filter(
      (k) => state.count(k) > 0
    );

    if (entries.length === 0) {
      this.hotbarEl.innerHTML = `<div style="padding:6px 12px;font-size:12px;color:#cbd5e1">Vorräte leer – sammle Oliven, Holz, Kalkstein oder Gerste mit [E]</div>`;
    } else {
      this.hotbarEl.innerHTML = entries
        .map((id, idx) => {
          const def = ITEMS[id];
          const count = state.count(id);
          const foodHint = def.category === 'food' ? ' (Klicken zum Essen)' : '';
          return `
            <div class="hotbar-icon-slot" data-item="${id}" title="${def.name} (${count}×)${foodHint}${idx < 9 ? ` [Taste ${idx + 1}]` : ''}">
              ${itemIconHtml(id, 22)}
              <span class="hotbar-slot-qty">${count}</span>
            </div>
          `;
        })
        .join('');

      this.hotbarEl.querySelectorAll('.hotbar-icon-slot').forEach((el) => {
        el.addEventListener('click', () => {
          const id = (el as HTMLElement).dataset.item as GreekItemId;
          const def = ITEMS[id];
          if (def.category === 'food') {
            this.eatItem(id);
          } else {
            this.selectedBagItem = id;
            this.openBag();
          }
        });
      });
    }
  }

  private eatItem(id: GreekItemId): void {
    const def = ITEMS[id];
    if (!def || def.category !== 'food' || state.count(id) <= 0) return;
    state.inventory[id] = Math.max(0, state.count(id) - 1);
    const val = def.foodValue ?? 25;
    state.food = Math.min(100, state.food + val);
    state.safety = Math.min(100, state.safety + 8);
    sfx.eat();
    state.persist();
    this.refreshHUD();
    this.showToast(`🫒 Verzehrt: 1× ${def.name} (+${val}% Sättigung)`);
  }

  private useHotbarSlot(index: number): void {
    const entries = (Object.keys(ITEMS) as GreekItemId[]).filter(
      (k) => state.count(k) > 0
    );
    const id = entries[index];
    if (!id) return;
    const def = ITEMS[id];
    if (def.category === 'food') {
      this.eatItem(id);
    } else {
      this.showToast(`${def.name}: ${def.desc}`);
    }
  }

  private setHint(text: string | null): void {
    if (!text) {
      this.hintEl.style.display = 'none';
    } else {
      this.hintEl.style.display = 'block';
      this.hintEl.textContent = text;
    }
  }

  private showToast(msg: string): void {
    this.toastEl.textContent = msg;
    this.toastEl.classList.add('visible');
    if (this.toastTimer) window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => {
      this.toastEl.classList.remove('visible');
    }, 2900);
  }

  // ---------------- Dialog System (Nodes & Quiz Support) ----------------
  private openDialogSpec(spec: DialogSpec): void {
    sfx.click();
    this.activeDialogSpec = spec;
    this.activeDialogIndex = 0;
    state.modal = true;
    state.touch?.setVisible?.(false);
    this.renderCurrentDialogNode();
  }

  private renderCurrentDialogNode(): void {
    if (!this.activeDialogSpec) return;
    const nodes = this.activeDialogSpec.nodes;
    if (this.activeDialogIndex >= nodes.length) {
      this.dialogDock.classList.remove('open');
      state.modal = this.activeModal !== 'none';
      state.touch?.setVisible?.(!state.modal);
      const done = this.activeDialogSpec.onDone;
      this.activeDialogSpec = undefined;
      if (done) done();
      return;
    }

    const node = nodes[this.activeDialogIndex];
    const speaker = node.speaker || this.activeDialogSpec.speaker;

    if (node.question && node.options) {
      this.dialogDock.innerHTML = `
        <div class="dialog-speaker-row">
          <span class="dialog-speaker">🗣️ ${speaker}</span>
          <span style="font-size:12px;color:#786655">Frage ${this.activeDialogIndex + 1} / ${nodes.length}</span>
        </div>
        <div class="dialog-text"><strong>${highlightTerms(node.question)}</strong></div>
        <div class="dialog-options">
          ${node.options
            .map(
              (opt, idx) =>
                `<button class="dialog-opt-btn" data-idx="${idx}">${idx + 1}. ${highlightTerms(opt)}</button>`
            )
            .join('')}
        </div>
        <div id="dialog-quiz-feedback" style="margin-top:8px;font-weight:800;font-size:13.5px;"></div>
      `;

      this.dialogDock.classList.add('open');

      this.dialogDock.querySelectorAll('.dialog-opt-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const idx = parseInt((btn as HTMLElement).dataset.idx!, 10);
          const fb = document.getElementById('dialog-quiz-feedback')!;
          state.quizAttempts++;
          if (idx === node.correct) {
            sfx.quest();
            fb.style.color = '#15803d';
            fb.innerHTML = `✅ ${highlightTerms(node.explain || 'Richtig!')}`;
            setTimeout(() => {
              this.activeDialogIndex++;
              this.renderCurrentDialogNode();
            }, 1150);
          } else {
            sfx.tap();
            fb.style.color = '#b91c1c';
            fb.innerHTML = `❌ Noch nicht ganz – überlege noch einmal und wähle eine andere Antwort!`;
          }
        });
      });
    } else {
      const formatted = highlightTerms((node.text || '').replace(/\n/g, '<br/>'));
      this.dialogDock.innerHTML = `
        <div class="dialog-speaker-row">
          <span class="dialog-speaker">🗣️ ${speaker}</span>
          <span style="font-size:12px;color:#786655">${this.activeDialogIndex + 1} / ${nodes.length}</span>
        </div>
        <div class="dialog-text">${formatted}</div>
        <div style="display:flex;justify-content:flex-end;margin-top:8px;">
          <button class="retro-btn" id="dialog-next-btn">
            ${this.activeDialogIndex < nodes.length - 1 ? 'Weiter ▸' : 'Verstanden ✓'} <span class="key-badge">Leertaste</span>
          </button>
        </div>
      `;

      this.dialogDock.classList.add('open');
      const nextBtn = document.getElementById('dialog-next-btn');
      if (nextBtn) {
        nextBtn.onclick = () => this.advanceDialog();
      }
    }
  }

  private advanceDialog(): void {
    if (!this.dialogDock.classList.contains('open')) return;
    if (!this.activeDialogSpec) {
      this.dialogDock.classList.remove('open');
      state.modal = this.activeModal !== 'none';
      return;
    }
    const node = this.activeDialogSpec.nodes[this.activeDialogIndex];
    if (node && node.options && node.options.length > 0) return;
    this.activeDialogIndex++;
    this.renderCurrentDialogNode();
  }

  // ---------------- Modal Helpers ----------------
  private toggleModal(type: typeof this.activeModal, opener: () => void): void {
    if (this.activeModal === type) {
      this.closeModal();
    } else {
      opener();
    }
  }

  public closeModal(): void {
    this.activeModal = 'none';
    state.modal = this.dialogDock.classList.contains('open');
    state.lastModalClose = Date.now();
    this.modalBackdrop.classList.remove('open');
    this.modalCard.classList.remove('dark');
    state.touch?.setVisible?.(!state.modal);
    sfx.click();
  }

  private openModalCard(): void {
    state.modal = true;
    this.modalBackdrop.classList.add('open');
    state.touch?.setVisible?.(false);
  }

  // ---------------- Epochen-Portal ----------------
  public openEpochPortal(fromIntro: boolean): void {
    this.activeModal = 'portal';
    state.modal = true;
    this.modalCard.classList.remove('dark');

    this.modalCard.innerHTML = `
      <div class="modal-header" style="background:linear-gradient(90deg,#1e3a8a,#3b2310);color:#ffe9b0">
        <h2 class="modal-title" style="color:#fde047">🏛️ Zeitreise-Portal – Wähle deine Geschichtsepoche</h2>
        <button class="retro-btn" id="portal-close-btn">Zurück zu Hellas ✕</button>
      </div>
      <div class="modal-body" style="background:#1c1610;color:#fff8e7">
        <p style="margin-top:0;color:#fde68a;font-size:14px">
          Vergleiche die großen Kulturen der Menschheitsgeschichte im 16-Bit-Abenteuer:
        </p>
        <div class="portal-grid">
          <div class="portal-card">
            <span class="portal-badge badge-preview">Epoche I · Steinzeit</span>
            <h3 class="portal-name">🪨 Steinzeit – Jäger, Sammler & Bauern</h3>
            <p class="portal-desc">
              Von der Altsteinzeit über die Neolithische Revolution bis zur Bronzezeit: Faustkeil, Feuerstein, Langhaus und Himmelsscheibe von Nebra.
            </p>
            <div class="portal-features">
              <span>🔥 Feuer & Jagd</span>
              <span>🌾 Erster Ackerbau</span>
              <span>⚒️ Bronzezeit</span>
            </div>
          </div>

          <div class="portal-card">
            <span class="portal-badge badge-preview">Epoche II · Altes Ägypten</span>
            <h3 class="portal-name">🏺 Kemet – Das Geschenk des Nils</h3>
            <p class="portal-desc">
              Bewässerung mit dem Schaduf, Hieroglyphen auf Papyrus, Pyramidenbau in Gizeh und das Totengericht des Osiris (3000–1070 v. Chr.).
            </p>
            <div class="portal-features">
              <span>🌊 Nil-Flut & Schaduf</span>
              <span>📜 Hieroglyphen</span>
              <span>🔺 Pyramidenbau</span>
            </div>
          </div>

          <div class="portal-card" style="border-color:#fde047;background:#2d2212">
            <span class="portal-badge badge-active">Aktiv · Epoche III · Antikes Griechenland</span>
            <h3 class="portal-name">🏛️ Hellas – Von der Polis zum Weltreich</h3>
            <p class="portal-desc">
              10 Kapitel: Polis & Kolonisation, Sparta & Athen (Demokratie & Scherbengericht), der Olymp, die Perserkriege, Sokrates und Alexander der Große!
            </p>
            <div class="portal-features">
              <span>🗳️ Athener Demokratie</span>
              <span>🛡️ Sparta & Perserkriege</span>
              <span>⚡ Olymp & Alexander</span>
            </div>
            <button class="retro-btn btn-egypt portal-btn" id="portal-play-greek">
              ▶ Jetzt im Antiken Griechenland spielen
            </button>
          </div>
        </div>
      </div>
    `;

    this.openModalCard();

    const closeBtn = document.getElementById('portal-close-btn')!;
    const playBtn = document.getElementById('portal-play-greek')!;
    const goBack = () => {
      if (fromIntro) {
        this.openStartScreen();
      } else {
        this.closeModal();
      }
    };
    closeBtn.onclick = goBack;
    playBtn.onclick = goBack;
  }

  // ---------------- Start Screen (10 Kapitel + Charakter + Rolle + Hefter-Code) ----------------
  public openStartScreen(): void {
    this.activeModal = 'start';
    state.modal = true;
    this.modalCard.classList.remove('dark');

    let chosenGender: 'male' | 'female' = state.playerGender || 'female';
    let chosenRole: PlayerRole = state.playerRole || 'sailor';
    let chosenChapter: number = state.chapter || 1;
    let chosenName: string = state.playerName || 'Helena';

    const shortChapters: { ch: number; icon: string; name: string; sub: string }[] = [
      { ch: 1, icon: '🫒', name: 'K1: Geburt der Polis', sub: '800 v. Chr.' },
      { ch: 2, icon: '⛵', name: 'K2: Kolonisation', sub: '750–550 v. Chr.' },
      { ch: 3, icon: '🛡️', name: 'K3: Sparta & Agoge', sub: '650–500 v. Chr.' },
      { ch: 4, icon: '🗳️', name: 'K4: Athen & Demokratie', sub: '508–430 v. Chr.' },
      { ch: 5, icon: '⚡', name: 'K5: Olymp & Götter', sub: '776–400 v. Chr.' },
      { ch: 6, icon: '⚔️', name: 'K6: Marathon & Thermopylen', sub: '490–480 v. Chr.' },
      { ch: 7, icon: '🚢', name: 'K7: Seeschlacht Salamis', sub: '480 v. Chr.' },
      { ch: 8, icon: '🦉', name: 'K8: Sokrates & Krieg', sub: '431–399 v. Chr.' },
      { ch: 9, icon: '👑', name: 'K9: Alexander der Große', sub: '336–323 v. Chr.' },
      { ch: 10, icon: '🗼', name: 'K10: Diadochen & Hellenismus', sub: '323–30 v. Chr.' },
    ];

    const render = () => {
      this.modalCard.innerHTML = `
        <div class="modal-header" style="background:linear-gradient(90deg,#1e3a8a,#4a2d15);color:#fff8e7">
          <h2 class="modal-title" style="color:#fde047">🏛️ Hellas – Von der Polis zum Weltreich (16-Bit-Lernabenteuer)</h2>
          <span style="font-size:12px;font-weight:700;color:#fde68a">Klasse 5/6 · Antikes Griechenland</span>
        </div>
        <div class="modal-body" style="padding:12px 16px;">
          <div class="start-hero" style="background:linear-gradient(135deg,#172554 0%,#3b2310 55%,#0f172a 100%)">
            <div class="start-hero-title">✨ 10 Kapitel von den Stadtstaaten (Poleis) bis zu Alexander dem Großen</div>
            <div class="start-hero-sub">
              Erkunde Athen, Sparta, die Meerenge der Thermopylen, den Hafen Piräus, das verschneite Gipfelportal auf den <strong>Olymp</strong> und Alexandria!
            </div>
            <div class="showcase-strip">
              <div class="showcase-card">
                <img src="assets/greek/parthenon.png" alt="Parthenon" />
                <div class="showcase-era">K1 & K4 · Polis</div>
                <div class="showcase-caption">Akropolis & Demokratie</div>
              </div>
              <div class="showcase-card">
                <img src="assets/greek/trireme_ship.png" alt="Triere" />
                <div class="showcase-era">K2 & K7 · Ägäis</div>
                <div class="showcase-caption">Kolonisation & Salamis</div>
              </div>
              <div class="showcase-card">
                <img src="assets/greek/spartan_phalanx.png" alt="Sparta" />
                <div class="showcase-era">K3 & K6 · Sparta</div>
                <div class="showcase-caption">Hopliten & Thermopylen</div>
              </div>
              <div class="showcase-card">
                <img src="assets/greek/statue_zeus_throne.png" alt="Olymp" />
                <div class="showcase-era">K5 · Götterberg</div>
                <div class="showcase-caption">Olymp & Olympische Spiele</div>
              </div>
              <div class="showcase-card">
                <img src="assets/greek/theater.png" alt="Theater" />
                <div class="showcase-era">K8 · Philosophie</div>
                <div class="showcase-caption">Sokrates & Theater</div>
              </div>
              <div class="showcase-card">
                <img src="assets/greek/lighthouse_pharos.png" alt="Alexandria" />
                <div class="showcase-era">K9 & K10 · Weltreich</div>
                <div class="showcase-caption">Alexander & Hellenismus</div>
              </div>
            </div>
          </div>

          <!-- 1. Name & Geschlecht -->
          <div style="display:grid;grid-template-columns:1fr 1.3fr;gap:12px;align-items:start;margin-bottom:10px;">
            <div>
              <label style="font-size:12.5px;font-weight:800;color:#5a2d0c;display:block;margin-bottom:4px;">
                1. Dein griechischer Name:
              </label>
              <input id="start-name-input" type="text" maxlength="18" value="${chosenName}"
                style="width:100%;padding:7px 10px;border-radius:7px;border:2px solid #8b5a2b;font-size:14px;font-weight:800;background:#fffdf7;color:#2a1d10;" />
              <div style="font-size:11px;color:#6b533b;margin-top:4px;">
                Wird auf deiner druckbaren Hellas-Urkunde und im Hefter-Code gespeichert.
              </div>
            </div>

            <div>
              <label style="font-size:12.5px;font-weight:800;color:#5a2d0c;display:block;margin-bottom:4px;">
                2. Charakter-Figur wählen:
              </label>
              <div class="gender-grid" style="margin-top:0;">
                <div class="gender-card ${chosenGender === 'male' ? 'active' : ''}" data-gender="male">
                  <div class="gender-avatar-box">
                    <img src="${state.malePreviewUrl || 'assets/gfx/player_greek_male.png'}" alt="Alexios" style="width:24px;height:36px;object-fit:contain;image-rendering:pixelated;" />
                  </div>
                  <div>
                    <div style="font-weight:900;font-size:13px;color:#2a1d10">Alexios (m)</div>
                    <div style="font-size:11px;color:#6b533b">Tunika (Chiton) & Mantel</div>
                  </div>
                </div>
                <div class="gender-card ${chosenGender === 'female' ? 'active' : ''}" data-gender="female">
                  <div class="gender-avatar-box">
                    <img src="${state.femalePreviewUrl || 'assets/gfx/player_greek_female.png'}" alt="Helena" style="width:24px;height:36px;object-fit:contain;image-rendering:pixelated;" />
                  </div>
                  <div>
                    <div style="font-weight:900;font-size:13px;color:#2a1d10">Helena (w)</div>
                    <div style="font-size:11px;color:#6b533b">Peplos & Lorbeerband</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 3. Historische Rolle -->
          <div style="margin-bottom:10px;">
            <label style="font-size:12.5px;font-weight:800;color:#5a2d0c;display:block;margin-bottom:4px;">
              3. Deine historische Herkunft & Begabung in der Polis:
            </label>
            <div class="role-grid">
              ${(Object.keys(GREEK_ROLES) as PlayerRole[])
                .map((rKey) => {
                  const r = GREEK_ROLES[rKey];
                  return `
                    <div class="role-card ${chosenRole === rKey ? 'active' : ''}" data-role="${rKey}">
                      <div style="display:flex;justify-content:space-between;align-items:center;">
                        <span style="font-weight:900;font-size:13.5px;color:#2a1d10">${r.icon} ${r.name}</span>
                        <span class="role-badge">${r.title}</span>
                      </div>
                      <div class="role-perk">✨ ${r.perk}</div>
                    </div>
                  `;
                })
                .join('')}
            </div>
          </div>

          <!-- 4. Kapitel-Direktwahl (1 bis 10) -->
          <div style="margin-bottom:10px;">
            <label style="font-size:12.5px;font-weight:800;color:#5a2d0c;display:block;margin-bottom:4px;">
              4. Start-Kapitel wählen (Direkteinstieg für den Unterricht – alle 10 Kapitel wählbar):
            </label>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(165px,1fr));gap:6px;">
              ${shortChapters
                .map(
                  (c) => `
                  <button type="button" class="role-card ${chosenChapter === c.ch ? 'active' : ''}" data-ch="${c.ch}" style="padding:6px 8px;">
                    <div style="font-weight:900;font-size:12px;color:#2a1d10">${c.icon} ${c.name}</div>
                    <div style="font-size:10.5px;color:#6b533b">${c.sub}</div>
                  </button>
                `
                )
                .join('')}
            </div>
          </div>

          <!-- 5. Hefter-Code Import -->
          <div style="background:#faf2e1;border:1.5px solid #c9ab78;border-radius:8px;padding:8px 12px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;">
            <div style="font-size:12px;color:#3b2310;">
              <strong>📝 Hefter-Kurzcode vorhanden?</strong> Trage deinen Code aus der letzten Stunde ein (z. B. <code>GRC-HELENA-W-S-K4-Q1-R2-10M</code>):
            </div>
            <div style="display:flex;gap:6px;align-items:center;">
              <input id="start-code-input" type="text" placeholder="GRC-..." style="padding:5px 8px;border:1.5px solid #8b5a2b;border-radius:5px;font-family:monospace;font-weight:800;width:185px;text-transform:uppercase;" />
              <button class="retro-btn" id="start-code-btn">Code laden</button>
            </div>
          </div>
        </div>

        <div class="modal-footer" style="justify-content:space-between;">
          <div style="font-size:12px;color:#5a3818;font-weight:700;">
            🎮 Steuerung: <strong>WASD / Pfeiltasten</strong> (oder Touch-Joystick) · <strong>[E]</strong> Interagieren · <strong>[I]</strong> Rucksack
          </div>
          <button class="retro-btn" id="start-begin-btn" style="background:#15803d;border-color:#86efac;color:#fff;font-size:14.5px;padding:8px 18px;">
            ⛵ Abenteuer in Hellas starten!
          </button>
        </div>
      `;

      const nameInput = document.getElementById('start-name-input') as HTMLInputElement;
      nameInput.oninput = () => {
        chosenName = nameInput.value;
      };

      this.modalCard.querySelectorAll('[data-gender]').forEach((el) => {
        el.addEventListener('click', () => {
          chosenGender = (el as HTMLElement).dataset.gender as 'male' | 'female';
          if (chosenGender === 'female' && chosenName === 'Alexios') chosenName = 'Helena';
          if (chosenGender === 'male' && chosenName === 'Helena') chosenName = 'Alexios';
          sfx.click();
          render();
        });
      });

      this.modalCard.querySelectorAll('[data-role]').forEach((el) => {
        el.addEventListener('click', () => {
          chosenRole = (el as HTMLElement).dataset.role as PlayerRole;
          sfx.click();
          render();
        });
      });

      this.modalCard.querySelectorAll('[data-ch]').forEach((el) => {
        el.addEventListener('click', () => {
          chosenChapter = parseInt((el as HTMLElement).dataset.ch!, 10);
          sfx.click();
          render();
        });
      });

      document.getElementById('start-code-btn')!.onclick = () => {
        const codeInput = document.getElementById('start-code-input') as HTMLInputElement;
        const res = state.importCode(codeInput.value);
        if (res.ok) {
          sfx.quest();
          bgm.playChapter(state.chapter);
          this.closeModal();
          this.showToast(`✅ ${res.msg}`);
        } else {
          sfx.tap();
          this.showToast(`❌ ${res.msg}`);
        }
      };

      document.getElementById('start-begin-btn')!.onclick = () => {
        state.setProfile(chosenName.trim() || 'Helena', chosenGender, chosenRole);
        state.startChapter(chosenChapter);
        bgm.playChapter(chosenChapter);
        this.closeModal();

        const chDef = CHAPTERS[chosenChapter];
        this.openDialogSpec({
          speaker: `Kapitel ${chDef.id}: ${this.cleanTitle(chDef.title)}`,
          nodes: [
            ...chDef.intro,
            {
              text: `🎯 <strong>Deine erste Aufgabe:</strong>\n${chDef.quests[0]}`,
            },
          ],
        });
      };
    };

    render();
    this.openModalCard();
  }

  // ---------------- Kapitel-Meilenstein-Feier ----------------
  private openChapterMilestone(completedCh: number): void {
    const ch = CHAPTERS[completedCh];
    if (!ch) return;

    this.activeModal = 'milestone';
    state.modal = true;
    this.modalCard.classList.remove('dark');

    const nextCh = completedCh < 10 ? CHAPTERS[completedCh + 1] : null;

    this.modalCard.innerHTML = `
      <div class="modal-header" style="background:linear-gradient(90deg,#15803d,#1e3a8a);color:#fff">
        <h2 class="modal-title" style="color:#fde047">🏆 Meilenstein erreicht: Kapitel ${ch.id} gemeistert!</h2>
      </div>
      <div class="modal-body">
        <div style="font-size:16px;font-weight:800;color:#5a2d0c;margin-bottom:6px;">
          ${ch.title} (${ch.epoch} · ${ch.period})
        </div>
        <div class="merksatz-box">
          <strong>📜 Historischer Merksatz für deinen Hefter:</strong><br/>
          ${highlightTerms(ch.summary)}
        </div>
        ${
          nextCh
            ? `<div style="margin-top:14px;padding:10px 14px;background:#faf2e1;border:2px solid #c9ab78;border-radius:8px;">
                <strong>⏭️ Nächstes Kapitel (${nextCh.id}/10): ${nextCh.title}</strong><br/>
                <span style="font-size:13.5px;color:#5a3818">${nextCh.epoch} (${nextCh.period}) · Mentor: ${nextCh.mentor}</span>
               </div>`
            : `<div style="margin-top:14px;padding:12px 14px;background:#dcfce7;border:2px solid #16a34a;border-radius:8px;color:#14532d;font-weight:800;">
                🎉 Du hast alle 10 Kapitel des Antiken Griechenlands erfolgreich abgeschlossen! Du kannst dir jetzt deine offizielle Hellas-Urkunde ausstellen lassen.
               </div>`
        }
      </div>
      <div class="modal-footer">
        ${
          nextCh
            ? `<button class="retro-btn" id="milestone-next-btn" style="background:#15803d;border-color:#86efac;color:#fff;font-size:14px;padding:8px 16px;">
                 Weiter zu Kapitel ${nextCh.id}: ${this.cleanTitle(nextCh.title)} ▸
               </button>`
            : `<button class="retro-btn" id="milestone-cert-btn" style="background:#b45309;border-color:#fde047;color:#fff;font-size:14px;padding:8px 16px;">
                 🎓 Offizielle Hellas-Urkunde öffnen
               </button>`
        }
      </div>
    `;

    this.openModalCard();

    const nextBtn = document.getElementById('milestone-next-btn');
    if (nextBtn && nextCh) {
      nextBtn.onclick = () => {
        state.startChapter(nextCh.id);
        bgm.playChapter(nextCh.id);
        this.closeModal();
        this.openDialogSpec({
          speaker: `Kapitel ${nextCh.id}: ${this.cleanTitle(nextCh.title)}`,
          nodes: [
            ...nextCh.intro,
            {
              text: `🎯 <strong>Deine Aufgabe:</strong>\n${nextCh.quests[0]}`,
            },
          ],
        });
      };
    }

    const certBtn = document.getElementById('milestone-cert-btn');
    if (certBtn) {
      certBtn.onclick = () => {
        this.openCertificate();
      };
    }
  }

  // ---------------- 2-Stufen Rucksack Modal (4 Kategorien + Detailkarte) ----------------
  public openBag(): void {
    this.activeModal = 'bag';
    state.modal = true;
    this.modalCard.classList.remove('dark');
    sfx.click();

    const categoryLabels: Record<'all' | GreekItemCategory, string> = {
      all: '📦 Alle Vorräte',
      food: '🫒 Nahrung',
      tool: '⚔️ Werkzeuge & Waffen',
      material: '🪨 Rohstoffe',
      culture: '🏛️ Kult & Politik',
    };

    const render = () => {
      const ownedIds = (Object.keys(ITEMS) as GreekItemId[]).filter(
        (id) => state.count(id) > 0
      );

      const filteredIds = ownedIds.filter(
        (id) =>
          this.selectedBagCategory === 'all' ||
          ITEMS[id].category === this.selectedBagCategory
      );

      if (!this.selectedBagItem || state.count(this.selectedBagItem) <= 0) {
        this.selectedBagItem = filteredIds[0] ?? ownedIds[0] ?? null;
      }

      const selDef = this.selectedBagItem ? ITEMS[this.selectedBagItem] : null;
      const selCount = this.selectedBagItem ? state.count(this.selectedBagItem) : 0;

      this.modalCard.innerHTML = `
        <div class="modal-header">
          <h2 class="modal-title">🎒 Griechischer Rucksack & Vorratskammer</h2>
          <button class="retro-btn" id="bag-close-btn">Schließen ✕</button>
        </div>
        <div class="modal-body">
          <div class="bag-tabs">
            ${(['all', 'food', 'tool', 'material', 'culture'] as const)
              .map(
                (cat) => `
                <button class="bag-tab-btn ${this.selectedBagCategory === cat ? 'active' : ''}" data-cat="${cat}">
                  ${categoryLabels[cat]}
                </button>
              `
              )
              .join('')}
          </div>

          <div class="bag-layout">
            <div class="bag-items-grid">
              ${
                filteredIds.length === 0
                  ? `<div style="grid-column:1/-1;padding:24px;text-align:center;color:#6b533b;font-weight:700;">
                       Keine Gegenstände in dieser Kategorie vorhanden.
                     </div>`
                  : filteredIds
                      .map((id) => {
                        const def = ITEMS[id];
                        const cnt = state.count(id);
                        return `
                          <div class="bag-item-card ${this.selectedBagItem === id ? 'active' : ''}" data-item="${id}">
                            <span class="bag-item-count-badge">${cnt}×</span>
                            ${itemIconHtml(id, 32)}
                            <div class="bag-item-title">${def.name}</div>
                          </div>
                        `;
                      })
                      .join('')
              }
            </div>

            <div class="bag-detail-card">
              ${
                selDef && this.selectedBagItem
                  ? `
                  <div class="bag-detail-header">
                    ${itemIconHtml(this.selectedBagItem, 44)}
                    <div>
                      <span class="bag-category-tag tag-${selDef.category}">${categoryLabels[selDef.category]}</span>
                      <div style="font-size:16px;font-weight:900;color:#2a1d10">${selDef.name}</div>
                      <div style="font-size:12px;color:#6b533b;font-weight:700">Im Rucksack: ${selCount}×</div>
                    </div>
                  </div>
                  <div style="font-size:13.5px;color:#2a1d10;line-height:1.5;">
                    <strong>📜 Funktion & Bedeutung:</strong><br/>
                    ${highlightTerms(selDef.desc)}
                  </div>
                  ${
                    selDef.lore
                      ? `<div style="font-size:12.5px;color:#5a3818;background:#fef3c7;padding:8px 10px;border-left:3.5px solid #d97706;border-radius:5px;">
                           <strong>🏛️ Historisches Wissen:</strong> ${highlightTerms(selDef.lore)}
                         </div>`
                      : ''
                  }
                  ${
                    selDef.category === 'food'
                      ? `<div style="background:#dcfce7;border:1.5px solid #22c55e;border-radius:7px;padding:8px 10px;font-size:12.5px;color:#14532d;font-weight:700;">
                           🥗 Stärkung: +${selDef.foodValue ?? 25}% Sättigung
                         </div>
                         <button class="retro-btn" id="bag-eat-btn" style="background:#15803d;border-color:#86efac;color:#fff;justify-content:center;padding:8px;">
                           🫒 Jetzt verzehren (1× essen)
                         </button>`
                      : ''
                  }
                `
                  : `<div style="color:#6b533b;font-size:13.5px;text-align:center;padding:24px 8px;">
                       Wähle links einen Gegenstand aus, um seinen historischen Hintergrund zu erfahren.
                     </div>`
              }
            </div>
          </div>
        </div>
      `;

      document.getElementById('bag-close-btn')!.onclick = () => this.closeModal();

      this.modalCard.querySelectorAll('[data-cat]').forEach((btn) => {
        this.addEventListener(btn, () => {
          this.selectedBagCategory = (btn as HTMLElement).dataset.cat as 'all' | GreekItemCategory;
          sfx.click();
          render();
        });
      });

      this.modalCard.querySelectorAll('[data-item]').forEach((card) => {
        this.addEventListener(card, () => {
          this.selectedBagItem = (card as HTMLElement).dataset.item as GreekItemId;
          sfx.click();
          render();
        });
      });

      const eatBtn = document.getElementById('bag-eat-btn');
      if (eatBtn && this.selectedBagItem) {
        eatBtn.onclick = () => {
          if (this.selectedBagItem) {
            this.eatItem(this.selectedBagItem);
            render();
          }
        };
      }
    };

    render();
    this.openModalCard();
  }

  private addEventListener(el: Element, fn: () => void): void {
    el.addEventListener('click', fn);
  }

  // ---------------- Handwerk / Werkstatt Modal (C) ----------------
  public openCraft(): void {
    this.activeModal = 'craft';
    state.modal = true;
    this.modalCard.classList.add('dark');
    sfx.click();

    const render = () => {
      this.modalCard.innerHTML = `
        <div class="modal-header">
          <h2 class="modal-title">⚒️ Griechische Werkstatt & Handwerk</h2>
          <button class="retro-btn" id="craft-close-btn">Schließen ✕</button>
        </div>
        <div class="modal-body">
          <p style="margin-top:0;font-size:13.5px;color:#fde68a">
            Klicke auf ein Rezept, um Werkzeuge, Hopliten-Waffen, Keramik, Schiffsteile oder Speisen herzustellen:
          </p>
          <div class="grid-2col">
            ${RECIPES.map((r) => {
              const outItem = (r.result ? r.result.item : r.id) as GreekItemId;
              const outCount = r.result ? r.result.count : 1;
              const hasBld = !r.requiresBuilding || state.hasBuilding(r.requiresBuilding);
              const bldDef = r.requiresBuilding
                ? BUILDINGS.find((b) => b.id === r.requiresBuilding)
                : undefined;
              const canMake = state.canCraft(r);

              const inputsHtml = Object.entries(r.cost)
                .map(([k, v]) => {
                  const id = k as GreekItemId;
                  const have = state.count(id);
                  const req = Number(v ?? 0);
                  const ok = have >= req;
                  return `<span style="color:${ok ? '#86efac' : '#fca5a5'}">${ITEMS[id]?.name ?? id}: ${have}/${req}</span>`;
                })
                .join(' · ');

              return `
                <div class="recipe-card ${canMake ? 'affordable' : ''} ${!hasBld ? 'missing-bld' : ''}" data-recipe="${r.id}">
                  ${itemIconHtml(outItem, 34)}
                  <div style="flex:1">
                    <div style="font-weight:800;font-size:14.5px;color:#ffe9b0">
                      ${r.name} ${outCount > 1 ? `(${outCount}×)` : ''}
                    </div>
                    <div style="font-size:12px;color:#cbd5e1;margin:2px 0;">${highlightTerms(r.desc)}</div>
                    <div style="font-size:12px;font-weight:700;margin-top:4px;">Benötigt: ${inputsHtml}</div>
                    ${
                      !hasBld
                        ? `<div style="font-size:11.5px;color:#fbbf24;font-weight:800;margin-top:3px;">⚠️ Erfordert Bauwerk: ${bldDef?.name ?? r.requiresBuilding}</div>`
                        : ''
                    }
                    <div style="font-size:11px;color:#93c5fd;margin-top:2px;">Im Rucksack: ${state.count(outItem)}×</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;

      document.getElementById('craft-close-btn')!.onclick = () => this.closeModal();
      this.modalCard.querySelectorAll('[data-recipe]').forEach((el) => {
        el.addEventListener('click', () => {
          const rId = (el as HTMLElement).dataset.recipe!;
          const rec = RECIPES.find((item) => item.id === rId);
          if (rec && state.craft(rec)) {
            this.showToast(`⚒️ Hergestellt: ${rec.name}!`);
            render();
          } else {
            sfx.tap();
            this.showToast('⚠️ Noch nicht genügend Rohstoffe oder benötigtes Bauwerk fehlt!');
          }
        });
      });
    };

    render();
    this.openModalCard();
  }

  // ---------------- Polis-Bauwerke Modal (V) ----------------
  public openBuild(siteId?: string): void {
    this.activeModal = 'build';
    state.modal = true;
    this.buildContextSiteId = siteId;
    this.modalCard.classList.add('dark');
    sfx.click();

    const render = () => {
      const list = BUILDINGS.filter(
        (b) => !this.buildContextSiteId || b.id === this.buildContextSiteId
      );

      this.modalCard.innerHTML = `
        <div class="modal-header">
          <h2 class="modal-title">🏛️ Architektur der Polis – Bauwerke errichten</h2>
          <button class="retro-btn" id="build-close-btn">Schließen ✕</button>
        </div>
        <div class="modal-body">
          <p style="margin-top:0;font-size:13.5px;color:#fde68a">
            Errichte Olivenpresse, Hafen-Werft, Lakonische Schmiede, Rednerbühne (Pnyx), Zeus-Altar, Akademie und die Große Bibliothek von Alexandria:
          </p>
          <div class="grid-2col">
            ${list
              .map((b) => {
                const built = state.hasBuilding(b.id);
                const discounted = state.getBuildingCost(b);
                const costHtml = Object.entries(discounted)
                  .map(([k, req]) => {
                    const id = k as GreekItemId;
                    const have = state.count(id);
                    const ok = have >= req;
                    return `<span style="color:${ok ? '#86efac' : '#fca5a5'}">${ITEMS[id]?.name ?? id}: ${have}/${req}</span>`;
                  })
                  .join(' · ');

                return `
                  <div class="recipe-card ${built ? 'affordable' : ''}" data-bld="${b.id}">
                    <div style="font-size:28px">🏛️</div>
                    <div style="flex:1">
                      <div style="font-weight:800;font-size:14.5px;color:#ffe9b0">
                        ${b.name} ${built ? '✅ (Errichtet)' : `(ab Kapitel ${b.unlockedInChapter})`}
                      </div>
                      <div style="font-size:11.5px;color:#fde68a;margin-top:1px;">Baumeister: ${b.helperName}</div>
                      <div style="font-size:12px;color:#cbd5e1;margin:3px 0;">${highlightTerms(b.desc)}</div>
                      <div style="font-size:12px;font-weight:700;">Baukosten: ${costHtml}</div>
                    </div>
                  </div>
                `;
              })
              .join('')}
          </div>
        </div>
      `;

      document.getElementById('build-close-btn')!.onclick = () => this.closeModal();
      this.modalCard.querySelectorAll('[data-bld]').forEach((el) => {
        el.addEventListener('click', () => {
          const bId = (el as HTMLElement).dataset.bld!;
          const bDef = BUILDINGS.find((item) => item.id === bId);
          if (bDef && state.build(bDef)) {
            this.showToast(`🏛️ Bauwerk errichtet: ${bDef.name}!`);
            render();
          } else if (bDef && state.hasBuilding(bDef.id)) {
            this.showToast(`✅ ${bDef.name} steht bereits!`);
          } else {
            sfx.tap();
            this.showToast('⚠️ Noch nicht genügend Baustoffe im Rucksack!');
          }
        });
      });
    };

    render();
    this.openModalCard();
  }

  // ---------------- Agora & Seehandel Modal (H) ----------------
  public openTrade(): void {
    this.activeModal = 'trade';
    state.modal = true;
    this.modalCard.classList.add('dark');
    sfx.click();

    const render = () => {
      this.modalCard.innerHTML = `
        <div class="modal-header">
          <h2 class="modal-title">⚖️ Agora & Mittelmeer-Seehandel (Piräus)</h2>
          <button class="retro-btn" id="trade-close-btn">Schließen ✕</button>
        </div>
        <div class="modal-body">
          <p style="margin-top:0;font-size:13.5px;color:#fde68a">
            Tausche griechische Exportgüter (Olivenöl, Amphoren, Silberdrachmen) auf der Agora und im Hafen Piräus:
          </p>
          <div class="grid-2col">
            ${TRADES.map((t) => {
              const canTrade = state.canAffordTrade(t);
              const giveStr = Object.entries(t.give)
                .map(([k, n]) => {
                  const id = k as GreekItemId;
                  return `${n}× ${ITEMS[id]?.name ?? id} (Du hast: ${state.count(id)})`;
                })
                .join(' + ');
              const recItem = ITEMS[t.receive.item];
              return `
                <div class="recipe-card ${canTrade ? 'affordable' : ''}" data-trade="${t.id}">
                  ${itemIconHtml(t.receive.item, 34)}
                  <div style="flex:1">
                    <div style="font-weight:800;font-size:14.5px;color:#ffe9b0">
                      🚢 ${t.name}
                    </div>
                    <div style="font-size:12px;color:#cbd5e1;margin:3px 0;">${highlightTerms(t.desc)}</div>
                    <div style="font-size:12.5px;font-weight:800;color:#fde047;margin-top:4px;">
                      Gib: ${giveStr} → Erhalte: ${t.receive.count}× ${recItem?.name ?? t.receive.item}
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;

      document.getElementById('trade-close-btn')!.onclick = () => this.closeModal();
      this.modalCard.querySelectorAll('[data-trade]').forEach((el) => {
        el.addEventListener('click', () => {
          const tId = (el as HTMLElement).dataset.trade!;
          const offer = TRADES.find((item) => item.id === tId);
          if (offer && state.trade(offer)) {
            this.showToast(`⚖️ Handel abgeschlossen: ${offer.name}!`);
            render();
          } else {
            sfx.tap();
            this.showToast('⚠️ Dir fehlen noch die Tauschwaren für dieses Handelsangebot!');
          }
        });
      });
    };

    render();
    this.openModalCard();
  }

  // ---------------- Archäologie-Relikt Quiz Modal ----------------
  public openRelicQuiz(relicId: string): void {
    const rel = GREEK_RELICS[relicId];
    if (!rel) return;

    this.activeModal = 'relic';
    state.modal = true;
    this.modalCard.classList.remove('dark');
    sfx.click();

    const already = state.relicQuizAnswered.includes(relicId);

    this.modalCard.innerHTML = `
      <div class="modal-header" style="background:linear-gradient(90deg,#78350f,#b45309);color:#fff">
        <h2 class="modal-title" style="color:#fde047">🏺 Archäologischer Sensationsfund: ${rel.title}</h2>
        <button class="retro-btn" id="relic-close-btn">Schließen ✕</button>
      </div>
      <div class="modal-body">
        <div style="display:flex;gap:14px;align-items:center;margin-bottom:12px;background:#fffdf7;padding:12px;border:2px solid #c9ab78;border-radius:10px;">
          ${relicIconHtml(relicId, 52)}
          <div>
            <div style="font-size:12px;font-weight:800;color:#b45309;text-transform:uppercase">${rel.epoch}</div>
            <div style="font-size:17px;font-weight:900;color:#2a1d10">${rel.title}</div>
            <div style="font-size:13.5px;color:#3b2310;margin-top:4px;">${highlightTerms(rel.lore)}</div>
          </div>
        </div>

        ${
          already
            ? `<div style="padding:12px;background:#dcfce7;border:2px solid #16a34a;border-radius:8px;color:#14532d;font-weight:800;">
                 ✅ Dieses Relikt befindet sich bereits in deiner archäologischen Sammlung (${state.relicsFound.length}/5)!
               </div>`
            : `
              <div style="font-weight:800;font-size:14.5px;color:#5a2d0c;margin-bottom:8px;">
                🧠 Archäologie-Rätsel: ${highlightTerms(rel.question)}
              </div>
              <div class="dialog-options">
                ${rel.options
                  .map(
                    (opt, idx) =>
                      `<button class="dialog-opt-btn relic-opt-btn" data-idx="${idx}">${idx + 1}. ${highlightTerms(opt)}</button>`
                  )
                  .join('')}
              </div>
              <div id="relic-feedback" style="margin-top:10px;font-weight:800;"></div>
            `
        }
      </div>
    `;

    document.getElementById('relic-close-btn')!.onclick = () => this.closeModal();

    this.modalCard.querySelectorAll('.relic-opt-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt((btn as HTMLElement).dataset.idx!, 10);
        const fb = document.getElementById('relic-feedback')!;
        if (idx === rel.correct) {
          if (!state.relicsFound.includes(relicId)) state.relicsFound.push(relicId);
          if (!state.relicQuizAnswered.includes(relicId)) state.relicQuizAnswered.push(relicId);
          state.persist();
          sfx.fanfare();
          fb.style.color = '#15803d';
          fb.innerHTML = `✅ ${highlightTerms(rel.explanation)} (${state.relicsFound.length}/5 Relikte gesichert!)`;
          this.refreshHUD();
          setTimeout(() => this.closeModal(), 1600);
        } else {
          sfx.tap();
          fb.style.color = '#b91c1c';
          fb.innerHTML = `❌ Noch nicht ganz! Lies den historischen Fundbericht oben noch einmal genau durch.`;
        }
      });
    });

    this.openModalCard();
  }

  // ---------------- Hellas-Lexikon Modal (L) ----------------
  public openLexicon(): void {
    this.activeModal = 'lexicon';
    state.modal = true;
    this.modalCard.classList.remove('dark');
    sfx.click();

    const lexKeys = Object.keys(LEXICON);

    const render = () => {
      const entryKey = LEXICON[this.selectedLexId] ? this.selectedLexId : lexKeys[0];
      const entry = LEXICON[entryKey];
      const unlocked = state.hasLexicon(entryKey) || state.playerRole === 'philosopher';

      this.modalCard.innerHTML = `
        <div class="modal-header">
          <h2 class="modal-title">📖 Großes Hellas-Lexikon (${lexKeys.length} Fachbegriffe für den Geschichtshefter)</h2>
          <button class="retro-btn" id="lex-close-btn">Schließen ✕</button>
        </div>
        <div class="modal-body">
          <div class="lex-layout">
            <div class="lex-list">
              ${lexKeys
                .map((key) => {
                  const item = LEXICON[key];
                  const isUnl = state.hasLexicon(key) || state.playerRole === 'philosopher';
                  return `
                    <button class="lex-item-btn ${key === entryKey ? 'active' : ''} ${!isUnl ? 'locked' : ''}" data-lex="${key}">
                      <span>${item.icon}</span>
                      <span style="flex:1">${item.title}</span>
                      <span style="font-size:10.5px;color:#786655">${isUnl ? '✓' : '🔒'}</span>
                    </button>
                  `;
                })
                .join('')}
            </div>

            <div class="lex-detail-card">
              <div style="display:flex;align-items:center;gap:10px;border-bottom:2px solid #e6d5b8;padding-bottom:8px;">
                <span style="font-size:32px">${entry.icon}</span>
                <div>
                  <div style="font-size:11.5px;font-weight:800;color:#b45309;text-transform:uppercase">
                    ${entry.era}
                  </div>
                  <h3 style="margin:0;font-size:18px;color:#2a1d10">${entry.title}</h3>
                </div>
              </div>
              <div style="font-size:14.5px;line-height:1.6;color:#2a1d10;">
                ${highlightTerms(entry.text)}
              </div>
              <div class="merksatz-box">
                <strong>📌 Freischalt-Hinweis & Merksatz:</strong><br/>
                ${unlocked ? '✅ Bereits im Spiel entdeckt!' : `💡 Tipp: ${entry.unlockHint}`}
              </div>
            </div>
          </div>
        </div>
      `;

      document.getElementById('lex-close-btn')!.onclick = () => this.closeModal();
      this.modalCard.querySelectorAll('[data-lex]').forEach((btn) => {
        btn.addEventListener('click', () => {
          this.selectedLexId = (btn as HTMLElement).dataset.lex!;
          sfx.click();
          render();
        });
      });
    };

    render();
    this.openModalCard();
  }

  // ---------------- Epochen- & Phasen-Vergleichstabelle (Taste Z) ----------------
  public openTimeline(): void {
    this.activeModal = 'timeline';
    state.modal = true;
    this.modalCard.classList.remove('dark');
    sfx.click();

    // Ermitteln der aktiven Entwicklungsphase für visuelle Hervorhebung
    const isArchaisch = state.chapter <= 3;
    const isKlassisch = state.chapter >= 4 && state.chapter <= 8;
    const isHellenismus = state.chapter >= 9;

    this.modalCard.innerHTML = `
      <div class="modal-header">
        <h2 class="modal-title">⏳ Griechischer Phasen-Vergleich & 10-Kapitel-Zeitleiste</h2>
        <button class="retro-btn" id="time-close-btn">Schließen ✕</button>
      </div>
      <div class="modal-body">
        <div style="margin-bottom:14px;">
          <div style="font-weight:800;font-size:14px;color:#5a2d0c;margin-bottom:6px;">
            🧭 Direkt zu einem der 10 Griechenland-Kapitel springen (Unterrichts-Direkteinstieg):
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:6px;">
            ${Object.values(CHAPTERS)
              .map(
                (c) => `
                <button class="role-card ${state.chapter === c.id ? 'active' : ''}" data-jump-ch="${c.id}" style="padding:6px 8px;">
                  <div style="font-weight:900;font-size:12px;color:#2a1d10">K${c.id}: ${this.cleanTitle(c.title)}</div>
                  <div style="font-size:10.5px;color:#6b533b">${c.epoch} (${c.period})</div>
                </button>
              `
              )
              .join('')}
          </div>
        </div>

        <div style="margin-bottom:8px;font-weight:800;font-size:13.5px;color:#5a2d0c;">
          📊 Phasen-Vergleich nach den 5 didaktischen Dimensionen:
        </div>
        <table class="epoch-table">
          <thead>
            <tr>
              <th style="width:20%">Dimension</th>
              <th style="width:26%" class="${isArchaisch ? 'current-era' : ''}">🏛️ Frühzeit & Archaisch (~800–500 v. Chr.) ${isArchaisch ? '★ (Aktiv)' : ''}</th>
              <th style="width:27%" class="${isKlassisch ? 'current-era' : ''}">🦉 Klassische Epoche (~500–336 v. Chr.) ${isKlassisch ? '★ (Aktiv)' : ''}</th>
              <th style="width:27%" class="${isHellenismus ? 'current-era' : ''}">👑 Hellenismus & Diadochen (~336–30 v. Chr.) ${isHellenismus ? '★ (Aktiv)' : ''}</th>
            </tr>
          </thead>
          <tbody>
            ${EPOCH_COMPARISON.map(
              (row) => `
              <tr>
                <td><strong>${highlightTerms(row.dimension)}</strong></td>
                <td class="${isArchaisch ? 'current-era' : ''}">${highlightTerms(row.archaisch)}</td>
                <td class="${isKlassisch ? 'current-era' : ''}">${highlightTerms(row.klassisch)}</td>
                <td class="${isHellenismus ? 'current-era' : ''}">${highlightTerms(row.hellenismus)}</td>
              </tr>
            `
            ).join('')}
          </tbody>
        </table>

        <!-- Didaktische Hefter-Kernaussagen der 10 Kapitel mit Kopieren & Vorlesen -->
        <div style="margin-top:18px;">
          <div style="font-weight:800;font-size:14px;color:#5a2d0c;margin-bottom:8px;">
            📜 Die 10 didaktischen Kernaussagen für deinen Geschichtshefter (mit 1-Klick-Kopieren & Vorlesefunktion):
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:8px;">
            ${Object.values(CHAPTERS).map((ch) => `
              <div style="background:#fffdf7;border:2px solid #c9ab78;border-radius:8px;padding:9px 11px;display:flex;flex-direction:column;justify-content:space-between;gap:6px;">
                <div>
                  <div style="font-size:11.5px;font-weight:800;color:#b45309;">
                    Kapitel ${ch.id}: ${this.cleanTitle(ch.title)} (${ch.period})
                  </div>
                  <div style="font-size:12.5px;color:#2a1d10;line-height:1.45;margin-top:3px;">
                    ${highlightTerms(ch.summary)}
                  </div>
                </div>
                <div style="display:flex;justify-content:flex-end;gap:6px;margin-top:4px;border-top:1px solid #ebd9b8;padding-top:6px;">
                  <button class="retro-btn btn-copy-summary" data-text="${encodeURIComponent(ch.summary)}" style="padding:3px 8px;font-size:11px;">
                    📋 Kopieren
                  </button>
                  <button class="retro-btn btn-speak-summary" data-text="${encodeURIComponent(ch.summary)}" style="padding:3px 8px;font-size:11px;">
                    🔊 Vorlesen
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    document.getElementById('time-close-btn')!.onclick = () => this.closeModal();

    this.modalCard.querySelectorAll('[data-jump-ch]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetCh = parseInt((btn as HTMLElement).dataset.jumpCh!, 10);
        state.startChapter(targetCh);
        bgm.playChapter(targetCh);
        this.closeModal();
        const chDef = CHAPTERS[targetCh];
        this.showToast(`⏳ Gewechselt zu Kapitel ${chDef.id}: ${this.cleanTitle(chDef.title)}`);
      });
    });

    this.modalCard.querySelectorAll('.btn-copy-summary').forEach((btn) => {
      btn.addEventListener('click', () => {
        const txt = decodeURIComponent((btn as HTMLElement).dataset.text || '');
        navigator.clipboard?.writeText(txt);
        this.showToast('📋 Merksatz in die Zwischenablage kopiert!');
      });
    });

    this.modalCard.querySelectorAll('.btn-speak-summary').forEach((btn) => {
      btn.addEventListener('click', () => {
        const txt = decodeURIComponent((btn as HTMLElement).dataset.text || '');
        this.speakText(txt);
      });
    });

    this.openModalCard();
  }

  // ---------------- Standardisierter 7-Kachel-Referenz-Pausebildschirm (Skill 5.4, Taste P) ----------------
  public openPause(): void {
    this.activeModal = 'pause';
    state.modal = true;
    this.modalCard.classList.remove('dark');
    sfx.click();

    const roleDef = GREEK_ROLES[state.playerRole] ?? GREEK_ROLES.sailor;
    const code = state.exportCode();
    const lexCount = Object.keys(LEXICON).length;
    const curCh = CHAPTERS[state.chapter] ?? CHAPTERS[1];
    const curQuest =
      curCh.quests[Math.min(state.quest, curCh.quests.length - 1)] ?? curCh.quests[0] ?? '';

    // Tagesphase gemäß state.dayTime
    const phaseName =
      state.dayTime < 0.2
        ? '🌅 Morgengrauen'
        : state.dayTime < 0.7
        ? '☀️ Tag'
        : state.dayTime < 0.85
        ? '🌆 Abendrot'
        : '🌙 Nacht';

    const bgmInfo = bgm.getCurrentTrackInfo(state.chapter);

    this.modalCard.innerHTML = `
      <div class="modal-header">
        <h2 class="modal-title">⏸️ Spielpause, Statistik & Klassenzimmer-Speichercode</h2>
        <button class="retro-btn" id="pause-resume-btn" style="background:#15803d;border-color:#86efac;color:#fff;">▶ Weiterspielen</button>
      </div>
      <div class="modal-body">
        <!-- 1. Charakter-Header gemäß Skill 5.4 Punkt 1 -->
        <div style="background:#fffdf7;border:2px solid #c9ab78;border-radius:10px;padding:10px 14px;margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="font-size:32px;background:#fef3c7;border:2px solid #d97706;border-radius:50%;width:50px;height:50px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              ${state.playerGender === 'female' ? '👩🏻' : '🧔‍♂️'}
            </div>
            <div>
              <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:17px;font-weight:900;color:#2a1d10;">${state.playerName}</span>
                <span class="role-badge" style="font-size:11px;">${roleDef.icon} ${roleDef.name}</span>
              </div>
              <div style="font-size:12.5px;color:#5a2d0c;font-weight:800;margin-top:2px;">
                ${state.epochRankTitle()}
              </div>
              <div style="font-size:12px;color:#475569;margin-top:1px;">
                <strong>Aktuelle Mission:</strong> Kapitel ${state.chapter}/10 (${this.cleanTitle(curCh.title)}) – <em>${curQuest}</em>
              </div>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">
            <span style="background:#15803d;color:#ffffff;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:800;display:inline-flex;align-items:center;gap:4px;">
              💾 Automatisch gesichert
            </span>
            <span style="background:#2a1d10;color:#fde68a;border:1px solid #e8c170;padding:3px 8px;border-radius:6px;font-size:11px;font-weight:700;">
              ⏸️ Zeit, Hunger & Schutz sind angehalten
            </span>
          </div>
        </div>

        <!-- 2. Die exakt 7 Kern-Statistiken gemäß Skill 5.4 Punkt 2 -->
        <div class="stats-grid">
          <!-- Kachel 1: Rolle & Spezialboni -->
          <div class="stat-tile">
            <div class="stat-icon">${roleDef.icon}</div>
            <div>
              <div class="stat-val">${roleDef.name}</div>
              <div class="stat-lbl">${roleDef.perk}</div>
            </div>
          </div>

          <!-- Kachel 2: Gespielte Abenteuerzeit -->
          <div class="stat-tile">
            <div class="stat-icon">⏱️</div>
            <div>
              <div class="stat-val">${state.formatPlayTime()}</div>
              <div class="stat-lbl">Gespielte Netto-Abenteuerzeit</div>
            </div>
          </div>

          <!-- Kachel 3: Überlebte Tage & Tagesphase -->
          <div class="stat-tile">
            <div class="stat-icon">🌅</div>
            <div>
              <div class="stat-val">Tag ${state.daysSurvived} · ${phaseName}</div>
              <div class="stat-lbl">Überlebte Tage & Tageszeit</div>
            </div>
          </div>

          <!-- Kachel 4: Zu Fuß zurückgelegte Strecke -->
          <div class="stat-tile">
            <div class="stat-icon">🧭</div>
            <div>
              <div class="stat-val">${Math.round(state.distanceMeters)} Meter</div>
              <div class="stat-lbl">Zu Fuß in Hellas zurückgelegt</div>
            </div>
          </div>

          <!-- Kachel 5: Gegenstände & Ernten gesamt -->
          <div class="stat-tile">
            <div class="stat-icon">📦</div>
            <div>
              <div class="stat-val">${state.totalItemsCollected()} Güter & Ernten</div>
              <div class="stat-lbl">Gesammelte & gefertigte Ressourcen</div>
            </div>
          </div>

          <!-- Kachel 6: Errichtete Siedlungsbauwerke -->
          <div class="stat-tile">
            <div class="stat-icon">🏛️</div>
            <div>
              <div class="stat-val">${state.buildings.length} / ${BUILDINGS.length} Bauwerke</div>
              <div class="stat-lbl">Polis-Architektur vollendet</div>
            </div>
          </div>

          <!-- Kachel 7: Entdecktes Geschichtswissen -->
          <div class="stat-tile">
            <div class="stat-icon">🧠</div>
            <div>
              <div class="stat-val">${state.lexicon.length} / ${lexCount} (${state.knowledge}%)</div>
              <div class="stat-lbl">Freigeschaltete Lexikon-Begriffe</div>
            </div>
          </div>
        </div>

        <!-- 3. Archäologie- & Relikte-Leiste (5 Funde) gemäß Skill 5.4 Punkt 3 -->
        <div style="margin-top:12px;">
          <div style="font-size:13px;font-weight:800;color:#5a2d0c;margin-bottom:4px;">
            🏺 Archäologie-Sammlung: Die 5 Leit-Relikte des Antiken Griechenlands
          </div>
          <div class="relic-grid">
            ${Object.values(GREEK_RELICS)
              .map((r) => {
                const isAnswered = state.relicQuizAnswered.includes(r.id);
                const isFound = state.relicsFound.includes(r.id);
                return `
                  <div class="relic-card ${isFound ? 'found' : 'locked'}">
                    ${relicIconHtml(r.id, 30)}
                    <div class="relic-name">${r.title}</div>
                    <div style="font-size:10px;font-weight:800;color:${isAnswered ? '#15803d' : isFound ? '#b45309' : '#6b533b'};">
                      ${isAnswered ? '✅ Erforscht (Quiz gelöst)' : isFound ? '⏳ Geborgen (Quiz offen)' : '🔒 Noch verborgen'}
                    </div>
                  </div>
                `;
              })
              .join('')}
          </div>
        </div>

        <!-- 4. Mnemotechnik-Hefter-Code gemäß Skill 5.4 Punkt 4 -->
        <div style="margin-top:12px;background:#faf2e1;border:2px solid #c9ab78;border-radius:10px;padding:10px 14px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;">
          <div>
            <div style="font-size:12.5px;font-weight:800;color:#5a2d0c">📝 Dein Hefter-Kurzcode (zum Abschreiben ins Geschichtsheft):</div>
            <div style="margin-top:4px;display:flex;align-items:center;gap:8px;">
              <span class="shortcode-pill" id="pause-shortcode">${code}</span>
              <button class="retro-btn" id="pause-copy-code">📋 Kopieren</button>
            </div>
          </div>

          <div>
            <div style="font-size:12px;font-weight:800;color:#5a2d0c;margin-bottom:4px;">Code wiederherstellen:</div>
            <div style="display:flex;gap:6px;">
              <input id="pause-import-input" type="text" placeholder="GRC-..." style="padding:5px 8px;border:1.5px solid #8b5a2b;border-radius:5px;font-family:monospace;font-weight:800;width:165px;text-transform:uppercase;" />
              <button class="retro-btn" id="pause-import-btn">Laden</button>
            </div>
          </div>
        </div>

        <!-- 5. Soundtrack- & Audiosteuerung gemäß Skill 5.4 Punkt 5 -->
        <div style="margin-top:12px;background:#2a1d10;color:#fff8e7;border:2px solid #e8c170;border-radius:10px;padding:9px 14px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-size:22px;">🎵</span>
            <div>
              <div style="font-size:11px;color:#fde68a;font-weight:800;text-transform:uppercase;">Aktueller Soundtrack</div>
              <div style="font-size:13.5px;font-weight:800;color:#ffffff;">${bgmInfo.title} <span style="font-size:11.5px;color:#93c5fd;">(${bgmInfo.epoch})</span></div>
            </div>
          </div>

          <div style="display:flex;align-items:center;gap:12px;">
            <button class="retro-btn" id="pause-mute-btn" style="padding:5px 10px;">
              ${bgm.isMutedState() ? '🔇 Ton stumm' : '🔊 Ton an'}
            </button>
            <div style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:700;">
              <span>Lautstärke:</span>
              <input type="range" id="pause-volume-slider" min="0" max="100" value="${Math.round(bgm.getVolume() * 100)}" style="width:110px;vertical-align:middle;cursor:pointer;" />
              <span id="pause-volume-label" style="min-width:32px;">${Math.round(bgm.getVolume() * 100)}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 6. Aktionsleiste gemäß Skill 5.4 Punkt 6 -->
      <div class="modal-footer" style="justify-content:space-between;">
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="retro-btn" id="pause-startscreen-btn">🏠 Zum Startbildschirm</button>
          <button class="retro-btn" id="pause-epoch-btn" style="background:#5a3818;border-color:#ffd86b;">🗺️ Kapitel & Epochen wechseln (Z)</button>
          <button class="retro-btn" id="pause-print-btn" style="background:#047857;border-color:#065f46;color:#fff;font-weight:800;">🖨️ Hefterblatt drucken (A4)</button>
          <button class="retro-btn" id="pause-reset-btn" style="background:#7f1d1d;border-color:#fca5a5;">🔄 Spielstand zurücksetzen</button>
        </div>
        <button class="retro-btn" id="pause-close-btn" style="background:#15803d;border-color:#86efac;color:#fff;font-weight:800;padding:7px 16px;">
          ▶ Weiter spielen (P)
        </button>
      </div>
    `;

    document.getElementById('pause-print-btn')!.onclick = () => this.triggerHefterPrint();
    document.getElementById('pause-resume-btn')!.onclick = () => this.closeModal();
    document.getElementById('pause-close-btn')!.onclick = () => this.closeModal();
    document.getElementById('pause-epoch-btn')!.onclick = () => this.openTimeline();

    document.getElementById('pause-mute-btn')!.onclick = () => {
      bgm.toggleMute();
      this.updateMuteBtn();
      const muteBtn = document.getElementById('pause-mute-btn');
      if (muteBtn) muteBtn.textContent = bgm.isMutedState() ? '🔇 Ton stumm' : '🔊 Ton an';
    };

    const volSlider = document.getElementById('pause-volume-slider') as HTMLInputElement;
    const volLabel = document.getElementById('pause-volume-label');
    if (volSlider) {
      volSlider.oninput = () => {
        const val = parseInt(volSlider.value, 10);
        bgm.setVolume(val / 100);
        if (volLabel) volLabel.textContent = `${val}%`;
      };
    }

    document.getElementById('pause-copy-code')!.onclick = () => {
      navigator.clipboard?.writeText(code);
      this.showToast(`📋 Hefter-Code ${code} in die Zwischenablage kopiert!`);
    };

    document.getElementById('pause-import-btn')!.onclick = () => {
      const inp = document.getElementById('pause-import-input') as HTMLInputElement;
      const res = state.importCode(inp.value);
      if (res.ok) {
        bgm.playChapter(state.chapter);
        this.closeModal();
        this.showToast(`✅ ${res.msg}`);
      } else {
        this.showToast(`❌ ${res.msg}`);
      }
    };

    document.getElementById('pause-startscreen-btn')!.onclick = () => {
      this.openStartScreen();
    };

    document.getElementById('pause-reset-btn')!.onclick = () => {
      state.resetNewGame(1);
      this.openStartScreen();
    };

    this.openModalCard();
  }

  // ---------------- Druckbare A4 Hellas-Urkunde (U) ----------------
  public openCertificate(): void {
    this.activeModal = 'cert';
    state.modal = true;
    this.modalCard.classList.remove('dark');
    sfx.click();

    const c = (k: string) => state.counts[k] ?? 0;
    const roleDef = GREEK_ROLES[state.playerRole] ?? GREEK_ROLES.sailor;
    const isSRank = state.relicsFound.length >= 5;
    const code = state.exportCode();
    const dateStr = new Date().toLocaleDateString('de-DE');

    this.modalCard.innerHTML = `
      <div class="modal-header no-print">
        <h2 class="modal-title">🎓 Offizielle Hellas-Urkunde & Hefter-Zusammenfassung (A4-Druck)</h2>
        <div style="display:flex;gap:8px;">
          <button class="retro-btn" id="cert-print-btn" style="background:#15803d;border-color:#86efac;color:#fff;">🖨️ Jetzt drucken / Als PDF speichern</button>
          <button class="retro-btn" id="cert-close-btn">Schließen ✕</button>
        </div>
      </div>
      <div class="modal-body" style="background:#fffdf7;color:#1c1917;">
        <div style="border:3px double #854d0e;padding:18px;border-radius:10px;background:#fffef9;">
          <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #c9ab78;padding-bottom:10px;margin-bottom:12px;">
            <div>
              <div style="font-size:12px;font-weight:800;color:#854d0e;text-transform:uppercase;">Geschichtsunterricht · Antikes Griechenland (800–30 v. Chr.)</div>
              <h1 style="margin:2px 0;font-size:22px;color:#2a1d10;">🏛️ Urkunde der Griechischen Antike – Hellas</h1>
              <div style="font-size:13.5px;color:#57534e;">
                Ausgestellt für <strong>${state.playerName}</strong> (${roleDef.icon} ${roleDef.name}) am ${dateStr} · Hefter-Code: <code>${code}</code>
              </div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:14px;font-weight:900;color:#b45309;">
                Aktuelles Kapitel: ${state.chapter} / 10 (${state.epochRankTitle()})
              </div>
              <div style="font-size:12.5px;font-weight:800;color:${isSRank ? '#15803d' : '#78350f'};">
                ${isSRank ? '🏅 S-RANG: MEISTER-ARCHÄOLOGE (5/5 Relikte)' : `🏺 Archäologie-Relikte: ${state.relicsFound.length} / 5`}
              </div>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px;font-size:12px;">
            <div style="background:#faf2e1;padding:6px 8px;border-radius:6px;border:1px solid #d6c39c;">
              <strong>🫒 Landwirtschaft:</strong><br/>${c('oliven_picked')} Oliven · ${c('harvested_gerste')} Gerste
            </div>
            <div style="background:#faf2e1;padding:6px 8px;border-radius:6px;border:1px solid #d6c39c;">
              <strong>🏛️ Polis-Architektur:</strong><br/>${state.buildings.length}/${BUILDINGS.length} Bauwerke
            </div>
            <div style="background:#faf2e1;padding:6px 8px;border-radius:6px;border:1px solid #d6c39c;">
              <strong>⏱️ Spielzeit & Wissen:</strong><br/>${state.formatPlayTime()} · ${state.knowledge}% Wissen
            </div>
            <div style="background:#faf2e1;padding:6px 8px;border-radius:6px;border:1px solid #d6c39c;">
              <strong>📖 Lexikon:</strong><br/>${state.lexicon.length}/${Object.keys(LEXICON).length} Fachbegriffe
            </div>
          </div>

          <h3 style="margin:8px 0 6px 0;font-size:14.5px;color:#5a2d0c;">📜 Die 10 Epochen-Merksätze für deinen Geschichtshefter:</h3>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11.5px;line-height:1.4;">
            ${Object.values(CHAPTERS)
              .map(
                (ch) => `
                <div style="background:#fffbeb;border-left:3.5px solid #d97706;padding:5px 8px;border-radius:4px;">
                  <strong>K${ch.id}: ${ch.title} (${ch.period})</strong><br/>
                  ${ch.summary}
                </div>
              `
              )
              .join('')}
          </div>
        </div>
      </div>
    `;

    document.getElementById('cert-print-btn')!.onclick = () => this.triggerHefterPrint();
    document.getElementById('cert-close-btn')!.onclick = () => this.closeModal();

    this.openModalCard();
  }

  public triggerHefterPrint(): void {
    const relicsData = Object.values(GREEK_RELICS).map((r) => ({
      title: r.title,
      note: r.explanation || r.lore || 'Bedeutendes archäologisches Relikt der griechischen Antike.'
    }));
    const keyTerms = Object.entries(LEXICON).slice(0, 3).map(([_, v]) => ({
      term: v.title,
      definition: v.text.slice(0, 160) + '...'
    }));
    PrintSheetManager.triggerPrint({
      schoolName: 'Staatliche Regelschule Heimbürgeschule Kahla',
      epochTitle: 'Antikes Griechenland: Die Wiege der Demokratie & Philosophie',
      playerName: state.playerName,
      hefterCode: state.exportCode(),
      rankTitle: `${state.roleSpecialistTitle()} (${state.relicsFound.length}/5 Relikte geborgen)`,
      relics: relicsData,
      dilemmaSummary: state.dilemmaSummary || undefined,
      keyTerms
    });
  }

  public openDilemma(): void {
    const d = GREEK_DILEMMAS[0];
    if (!d) return;
    this.activeModal = 'dilemma';
    this.dilemmaModal.open(d, (opt) => {
      state.storyFlags[opt.storyFlag] = true;
      state.dilemmaSummary = `${d.conflictTitle}: ${opt.title} – ${opt.argumentText}`;
      for (const [k, v] of Object.entries(opt.rewards)) {
        state.add(k, v);
      }
      this.showToast(`⚖️ Beschluss der Volksversammlung ratifiziert: ${opt.title}`);
      this.closeModal();
    });
  }
}
