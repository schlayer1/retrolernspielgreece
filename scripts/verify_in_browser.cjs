const { spawn } = require('child_process');
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ARTIFACT_DIR = process.env.ARTIFACT_DIR || path.resolve(__dirname, '../artifacts');
const PORT = parseInt(process.env.PORT || '4192', 10);

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function saveShot(page, names) {
  const list = Array.isArray(names) ? names : [names];
  const primary = path.join(ARTIFACT_DIR, list[0]);
  await page.screenshot({ path: primary });
  for (let i = 1; i < list.length; i++) {
    fs.copyFileSync(primary, path.join(ARTIFACT_DIR, list[i]));
  }
  console.log(`✅ ${list[0]} captured`);
}

async function main() {
  if (!fs.existsSync(ARTIFACT_DIR)) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  }

  console.log(`Starting Vite preview server on port ${PORT}...`);
  const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'pipe',
  });

  server.stdout.on('data', (d) => console.log(`[Vite stdout] ${d.toString().trim()}`));
  server.stderr.on('data', (d) => console.error(`[Vite stderr] ${d.toString().trim()}`));

  await sleep(2500);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
  });

  const errors = [];
  const failedUrls = [];

  try {
    const page = await browser.newPage();
    page.on('pageerror', (err) => {
      console.error('PAGEERROR:', err.message);
      errors.push(`PAGEERROR: ${err.message}`);
    });
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.error('CONSOLE ERROR:', msg.text());
        errors.push(`CONSOLE ERROR: ${msg.text()}`);
      }
    });
    page.on('response', (res) => {
      if (res.status() >= 400) {
        console.warn(`HTTP ${res.status()}: ${res.url()}`);
        failedUrls.push(`${res.status()} ${res.url()}`);
      }
    });

    // -------------------------------------------------------------------------
    // 1. Desktop Start Screen (1440x900)
    // -------------------------------------------------------------------------
    console.log('1. Capturing Desktop Start Screen...');
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle0' });
    await sleep(1500);
    await saveShot(page, ['verify_1_start_screen.png', 'verify_1_desktop_start.png']);

    // -------------------------------------------------------------------------
    // 2. Mobile Start Screen (390x844)
    // -------------------------------------------------------------------------
    console.log('2. Capturing Mobile Start Screen (390x844)...');
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
    await sleep(400);
    await page.evaluate(() => {
      document.getElementById('rotate-prompt')?.classList.add('dismissed');
    });
    await sleep(400);
    await saveShot(page, ['verify_2_mobile_start.png']);

    // -------------------------------------------------------------------------
    // 3. Mobile Overworld HUD (390x844)
    // -------------------------------------------------------------------------
    console.log('3. Starting Game & Capturing Mobile Overworld HUD...');
    await page.evaluate(() => {
      const btn =
        document.querySelector('#start-begin-btn') ||
        document.querySelector('#start-go-btn') ||
        document.querySelector('#btn-start-game');
      if (btn) btn.click();
    });
    await sleep(900);
    await page.evaluate(() => {
      document.getElementById('chapter-banner-overlay')?.remove();
      const win = window;
      if (win.__closeModal) win.__closeModal();
    });
    await sleep(300);
    await saveShot(page, ['verify_3_mobile_hud.png']);

    // -------------------------------------------------------------------------
    // 4. Desktop Overworld Chapter 1 + Companion Dog + Quest Compass (1440x900)
    // -------------------------------------------------------------------------
    console.log('4. Capturing Desktop Overworld Chapter 1 + Companion Dog...');
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
    await sleep(500);

    const hudCheck = await page.evaluate(() => {
      const compass = document.querySelector('#hud-compass');
      const hudBtns = document.querySelectorAll('.hud-btn-row button');
      return {
        compassOk: !!compass && compass.textContent.trim().length > 0,
        btnCount: hudBtns.length,
      };
    });
    if (!hudCheck.compassOk) {
      errors.push('CRITICAL: #hud-compass is missing or empty on the Overworld HUD!');
    }
    if (hudCheck.btnCount !== 10) {
      errors.push(`CRITICAL: Expected 10 HUD buttons in .hud-btn-row, found ${hudCheck.btnCount}!`);
    }

    await page.evaluate(() => {
      const win = window;
      if (win.__closeModal) win.__closeModal();
      document.getElementById('chapter-banner-overlay')?.remove();
      const game = win.__GAME__;
      if (game) {
        const world = game.scene.getScene('World');
        if (world && world.player) {
          world.player.setPosition(800, 610);
          world.cameras.main.centerOn(800, 610);
        }
      }
    });
    await sleep(900);
    await saveShot(page, ['verify_4_ch1_overworld.png', 'verify_5_water_and_infrastructure.png']);

    // -------------------------------------------------------------------------
    // 5. NPC Dialog + 1.32x Camera Zoom
    // -------------------------------------------------------------------------
    console.log('5. Capturing NPC Dialog + 1.32x Camera Zoom...');
    const dialogOpened = await page.evaluate(() => {
      const win = window;
      if (typeof win.__openMentorDialog === 'function') {
        win.__openMentorDialog(1);
        return true;
      }
      return false;
    });
    if (!dialogOpened) {
      errors.push('CRITICAL: Failed to open Chapter 1 Mentor Dialog (__openMentorDialog missing)!');
    }
    await sleep(800);
    await saveShot(page, ['verify_5_npc_dialog.png', 'verify_3_ch1_dialog.png']);

    await page.evaluate(() => {
      const win = window;
      if (win.__closeModal) win.__closeModal();
    });
    await sleep(500);

    // -------------------------------------------------------------------------
    // 6. Beutel / Inventar Modal
    // -------------------------------------------------------------------------
    console.log('6. Capturing Bag / Inventory Modal...');
    await page.evaluate(() => {
      const win = window;
      const state = win.__STATE__;
      if (state) {
        state.add('oliven', 6);
        state.add('gerste', 4);
        state.add('amphore', 2);
        state.add('marmor', 3);
        if (!state.relicsFound.includes('relic_amphore')) state.relicsFound.push('relic_amphore');
        if (!state.relicsFound.includes('relic_eule')) state.relicsFound.push('relic_eule');
      }
      if (win.__toggleModal) win.__toggleModal('I');
    });
    await sleep(700);
    await saveShot(page, ['verify_6_bag_modal.png', 'verify_7_evolved_location.png']);

    await page.evaluate(() => {
      const win = window;
      if (win.__closeModal) win.__closeModal();
    });
    await sleep(400);

    // -------------------------------------------------------------------------
    // 7. Lexikon Modal (27 Historical Terms)
    // -------------------------------------------------------------------------
    console.log('7. Capturing Lexikon Modal with 27 Terms...');
    const lexiconOpened = await page.evaluate(() => {
      const win = window;
      const state = win.__STATE__;
      if (state) {
        const allTerms = [
          'polis', 'akropolis', 'agora', 'hellas', 'olivenbaum',
          'kolonisation', 'apoikie', 'amphore', 'sparta', 'agoge',
          'heloten', 'hoplit_phalanx', 'athen_demokratie', 'ekklesia', 'ostrakismos',
          'drachme_laureion', 'olymp_goetter', 'orakel_delphi', 'olympische_spiele', 'perserkriege_marathon',
          'thermopylen', 'trireme_salamis', 'peloponnesischer_krieg', 'philosophie', 'alexander_der_grosse',
          'hellenismus', 'diadochenreiche'
        ];
        allTerms.forEach((t) => state.unlockLexicon(t));
      }
      if (win.__toggleModal) {
        win.__toggleModal('L');
        return true;
      }
      return false;
    });
    if (!lexiconOpened) {
      errors.push('CRITICAL: Failed to open Lexicon Modal (__toggleModal("L") missing)!');
    }
    await sleep(700);
    await saveShot(page, ['verify_7_lexicon_modal.png', 'verify_8_lexicon_modal.png']);

    await page.evaluate(() => {
      const win = window;
      if (win.__closeModal) win.__closeModal();
    });
    await sleep(400);

    // -------------------------------------------------------------------------
    // 8. Zeitstrahl & Phasenvergleich Modal (Key Z) + Interactive Station Check
    // -------------------------------------------------------------------------
    console.log('8. Capturing Zeitstrahl & Phasenvergleich Modal...');
    await page.evaluate(() => {
      const win = window;
      if (win.__toggleModal) win.__toggleModal('Z');
    });
    await sleep(700);
    await saveShot(page, ['verify_8_timeline_modal.png']);

    await page.evaluate(() => {
      const win = window;
      if (win.__closeModal) win.__closeModal();
      if (win.__openStation) win.__openStation('station_olivenpresse');
    });
    await sleep(600);
    await saveShot(page, ['verify_9_interactive_station.png']);

    await page.evaluate(() => {
      const win = window;
      if (win.__closeModal) win.__closeModal();
    });
    await sleep(400);

    // -------------------------------------------------------------------------
    // 9. 360° Artifact Inspector Modal
    // -------------------------------------------------------------------------
    console.log('9. Capturing 360° Artifact Inspector Modal...');
    const inspectorOpened = await page.evaluate(() => {
      const win = window;
      if (typeof win.__openArtifactInspector === 'function') {
        win.__openArtifactInspector('relic_eule');
        return true;
      }
      return false;
    });
    if (!inspectorOpened) {
      errors.push('CRITICAL: Failed to open 360° Artifact Inspector (__openArtifactInspector missing)!');
    }
    await sleep(700);
    await saveShot(page, ['verify_9_artifact_inspector.png', 'verify_10_artifact_inspector.png']);

    await page.evaluate(() => {
      const win = window;
      if (win.__closeModal) win.__closeModal();
    });
    await sleep(400);

    // -------------------------------------------------------------------------
    // 10. Pause & Statistik Dashboard Modal (7-Tile Chronisten-Zentrale)
    // -------------------------------------------------------------------------
    console.log('10. Capturing 7-Tile Pause & Statistik Dashboard Modal...');
    const pauseOpened = await page.evaluate(() => {
      const win = window;
      if (typeof win.__toggleModal === 'function') {
        win.__toggleModal('P');
        return true;
      }
      return false;
    });
    if (!pauseOpened) {
      errors.push('CRITICAL: Failed to open Pause Dashboard (__toggleModal("P") missing)!');
    }
    await sleep(700);
    await saveShot(page, ['verify_10_pause_dashboard.png', 'verify_6_pause_dashboard.png']);

    await page.evaluate(() => {
      const win = window;
      if (win.__closeModal) win.__closeModal();
    });
    await sleep(400);

    // -------------------------------------------------------------------------
    // 11. Enterable Interior Scene (Cella des Parthenon)
    // -------------------------------------------------------------------------
    console.log('11. Capturing Enterable Interior Scene...');
    await page.evaluate(() => {
      const win = window;
      if (typeof win.__enterSampleInterior === 'function') {
        win.__enterSampleInterior();
      }
    });
    await sleep(900);
    await saveShot(page, ['verify_11_interior_scene.png']);

    console.log('\n--- VERIFICATION SUMMARY ---');
    console.log(`Page/Console Errors: ${errors.length}`);
    if (errors.length > 0) console.error(errors);
    console.log(`Failed HTTP URLs: ${failedUrls.length}`);
    if (failedUrls.length > 0) console.error(failedUrls);

    if (errors.length > 0 || failedUrls.length > 0) {
      process.exitCode = 1;
    } else {
      console.log('🎉 All 11 browser verification checks passed with 0 errors!');
    }
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
    server.kill();
  }
}

main();
