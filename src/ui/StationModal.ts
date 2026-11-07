import { InteractiveStation } from '../data/stations';
import { state } from '../systems/GameState';
import { sfx } from '../audio/sound';
import { ITEMS, GreekItemId } from '../data/items';

export class StationModal {
  private currentStep = 0;

  public render(
    container: HTMLElement,
    station: InteractiveStation,
    onComplete: () => void,
    onClose: () => void,
  ): void {
    this.currentStep = 0;

    const renderStep = (feedbackHtml = '') => {
      const step = station.steps[this.currentStep];
      const isFinished = this.currentStep >= station.steps.length;

      if (isFinished) {
        if (station.rewardLexiconId) state.unlockLexicon(station.rewardLexiconId);
        if (station.rewardItem) {
          state.add(station.rewardItem.id as GreekItemId, station.rewardItem.qty);
        }
        state.counts[`station_${station.id}`] = 1;
        state.persist();
        sfx.fanfare();

        container.innerHTML = `
          <div class="modal-header" style="background:linear-gradient(90deg,#15803d,#1e3a8a);color:#fff">
            <h2 class="modal-title" style="color:#fde047">${station.icon} ${station.title} – Abgeschlossen!</h2>
            <button class="retro-btn" id="station-done-close">Weiter [ESC]</button>
          </div>
          <div class="modal-body" style="padding:18px">
            <div style="background:#dcfce7;border:2px solid #16a34a;border-radius:10px;padding:16px;margin-bottom:14px;color:#14532d">
              <div style="font-size:18px;font-weight:900;color:#15803d;margin-bottom:6px">✅ Historisches Experiment erfolgreich gemeistert!</div>
              <p style="font-size:14px;line-height:1.5;margin:0">${station.historicalNote}</p>
            </div>
            <div style="background:#fef3c7;border:2px solid #d97706;border-radius:10px;padding:14px;margin-bottom:14px;font-size:14px;color:#78350f;font-weight:800">
              📜 ${station.merksatz}
            </div>
            ${
              station.rewardItem
                ? `<div style="font-size:13.5px;color:#15803d;font-weight:bold;margin-bottom:12px">🎁 Belohnung erhalten: +${station.rewardItem.qty}× ${ITEMS[station.rewardItem.id as GreekItemId]?.name || station.rewardItem.id}</div>`
                : ''
            }
            <button class="retro-btn" id="station-finish-btn" style="background:#15803d;border-color:#86efac;color:#fff;width:100%;padding:10px;font-size:15px;justify-content:center">
              Erkenntnis im Geschichtshefter sichern & weiter
            </button>
          </div>
        `;

        const finish = () => {
          sfx.click();
          onComplete();
          onClose();
        };
        container.querySelector('#station-done-close')?.addEventListener('click', finish);
        container.querySelector('#station-finish-btn')?.addEventListener('click', finish);
        return;
      }

      container.innerHTML = `
        <div class="modal-header" style="background:linear-gradient(90deg,#1e3a8a,#4a2d15);color:#fff8e7">
          <h2 class="modal-title" style="color:#fde047">${station.icon} ${station.title}</h2>
          <button class="retro-btn" id="station-close">Schließen [ESC]</button>
        </div>
        <div class="modal-body" style="padding:16px">
          <div style="font-size:12.5px;color:#b45309;font-weight:800;margin-bottom:6px">${station.subtitle} · Schritt ${this.currentStep + 1} von ${station.steps.length}</div>
          <div style="background:#faf2e1;border:1.5px solid #c9ab78;border-radius:8px;padding:11px;font-size:13px;line-height:1.45;color:#3b2310;margin-bottom:10px">
            <strong>🏛️ Historischer Hintergrund:</strong> ${station.historicalNote}
          </div>

          <div style="background:#1e293b;border:2px solid #d4af37;border-radius:10px;padding:14px;margin-bottom:12px;color:#f8fafc">
            <div style="font-size:15px;font-weight:bold;color:#fde047;margin-bottom:6px">${step.stepTitle}</div>
            <div style="font-size:13.5px;color:#f1f5f9;margin-bottom:8px">${step.instruction}</div>
            ${step.visualHtml}
          </div>

          ${feedbackHtml}

          <div style="display:flex;flex-direction:column;gap:8px;margin-top:10px">
            ${step.choices
              .map(
                (c, idx) => `
              <button class="dialog-opt-btn station-choice-btn" data-idx="${idx}" style="text-align:left;padding:10px 14px;font-size:13.5px">
                <strong>Option ${idx + 1}:</strong> ${c.label}
              </button>
            `,
              )
              .join('')}
          </div>
        </div>
      `;

      container.querySelector('#station-close')?.addEventListener('click', () => {
        sfx.click();
        onClose();
      });

      container.querySelectorAll('.station-choice-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const idx = Number((btn as HTMLElement).dataset.idx);
          const choice = step.choices[idx];
          if (!choice) return;

          if (choice.correct) {
            sfx.quest();
            this.currentStep++;
            renderStep(`
              <div style="background:#dcfce7;border:1.5px solid #16a34a;border-radius:8px;padding:10px;color:#14532d;font-size:13px;font-weight:700;margin-bottom:8px">
                ✅ ${choice.feedback}
              </div>
            `);
          } else {
            sfx.tap();
            renderStep(`
              <div style="background:#fee2e2;border:1.5px solid #ef4444;border-radius:8px;padding:10px;color:#991b1b;font-size:13px;font-weight:700;margin-bottom:8px">
                ❌ ${choice.feedback} – Versuche es noch einmal!
              </div>
            `);
          }
        });
      });
    };

    renderStep();
  }
}
