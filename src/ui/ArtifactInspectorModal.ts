import { RelicDef } from '../data/relics';
import { sfx } from '../audio/sound';

export class ArtifactInspectorModal {
  private flipped = false;
  private zoomLevel = 1.0;

  public render(container: HTMLElement, relic: RelicDef, onClose: () => void): void {
    this.flipped = false;
    this.zoomLevel = 1.0;

    const updateView = () => {
      const iconToShow = this.flipped ? relic.backIcon : relic.frontIcon;
      const sideLabel = this.flipped
        ? '🔄 Rückseite (Griechische Weiheinschrift & Rückseiten-Relief)'
        : '🔍 Vorderseite (Archäologische Schauseite)';
      const detailText = this.flipped ? relic.backInscription : relic.description;

      container.innerHTML = `
        <div class="modal-header" style="background:linear-gradient(90deg,#1e3a8a,#4a2d15);color:#fff8e7">
          <h2 class="modal-title" style="color:#fde047">🏺 360°-Quelleninspektor: ${relic.name}</h2>
          <button class="retro-btn" id="inspector-close">Schließen [ESC]</button>
        </div>
        <div class="modal-body" style="padding:16px">
          <div style="display:grid;grid-template-columns:1fr 1.25fr;gap:16px;align-items:stretch">
            <!-- 360° Lupen-Bühne -->
            <div style="background:radial-gradient(circle,#2e2112 0%,#140e07 100%);border:2px solid #d4af37;border-radius:12px;padding:18px;display:flex;flex-direction:column;align-items:center;justify-content:space-between;min-height:250px">
              <div style="font-size:12px;color:#fcd34d;font-weight:bold;text-align:center">${sideLabel}</div>
              <div id="artifact-stage" style="font-size:${Math.round(68 * this.zoomLevel)}px;transition:transform 0.35s ease, font-size 0.2s ease;transform:rotateY(${this.flipped ? 180 : 0}deg);filter:drop-shadow(0 0 18px rgba(251,191,36,0.5));user-select:none;margin:16px 0">
                ${iconToShow}
              </div>
              <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center">
                <button class="retro-btn" id="btn-flip-artifact" style="background:#b45309;color:#fff">🔄 180° Wenden (Vorder-/Rückseite)</button>
                <button class="retro-btn" id="btn-zoom-in">🔎 Lupe +</button>
                <button class="retro-btn" id="btn-zoom-out">🔎 Lupe −</button>
              </div>
            </div>

            <!-- Archäologischer Befundbericht -->
            <div style="display:flex;flex-direction:column;gap:10px;justify-content:space-between">
              <div style="background:#fffdf7;border:1.5px solid #c9ab78;border-radius:8px;padding:12px;color:#2a1d10">
                <div style="font-size:12px;color:#b45309;font-weight:800">Funddaten & Datierung</div>
                <div style="font-size:13.5px;margin-top:4px"><strong>Zeitstellung:</strong> ${relic.dating}</div>
                <div style="font-size:13.5px"><strong>Fundort:</strong> ${relic.location}</div>
              </div>

              <div style="background:#faf2e1;border:1.5px solid #8b5a2b;border-radius:8px;padding:12px;color:#2a1d10">
                <div style="font-size:12px;color:#5a2d0c;font-weight:800">${this.flipped ? '📜 Inschrift & Rückseiten-Analyse' : '👁️ Beschreibung der Vorderseite'}</div>
                <p style="font-size:13.5px;line-height:1.5;margin:6px 0 0">${detailText}</p>
              </div>

              <div style="background:#f0fdf4;border:1.5px solid #16a34a;border-radius:8px;padding:12px;color:#14532d">
                <div style="font-size:12px;color:#15803d;font-weight:800">🔬 Naturwissenschaftlicher Laborbericht</div>
                <p style="font-size:13px;line-height:1.45;margin:4px 0 0">${relic.scientificReport}</p>
              </div>

              <div style="background:#fef3c7;border:2px solid #d97706;border-radius:8px;padding:10px;font-size:13px;color:#78350f;font-weight:700">
                📌 ${relic.merksatz}
              </div>
            </div>
          </div>
        </div>
      `;

      container.querySelector('#inspector-close')?.addEventListener('click', () => {
        sfx.click();
        onClose();
      });

      container.querySelector('#btn-flip-artifact')?.addEventListener('click', () => {
        sfx.click();
        this.flipped = !this.flipped;
        updateView();
      });

      container.querySelector('#btn-zoom-in')?.addEventListener('click', () => {
        sfx.click();
        this.zoomLevel = Math.min(1.6, this.zoomLevel + 0.2);
        updateView();
      });

      container.querySelector('#btn-zoom-out')?.addEventListener('click', () => {
        sfx.click();
        this.zoomLevel = Math.max(0.8, this.zoomLevel - 0.2);
        updateView();
      });
    };

    updateView();
  }
}
