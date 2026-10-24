const { spawn } = require('child_process');
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ARTIFACT_DIR = '/Users/nicolekeller/.gemini/antigravity/brain/6b5a94b7-9895-4c94-9a66-ef3ecb56f051';

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log('Starting Vite preview server on port 4189...');
  const server = spawn('npx', ['vite', 'preview', '--port', '4189', '--strictPort'], {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'pipe',
  });

  server.stdout.on('data', (d) => console.log(`[Vite] ${d.toString().trim()}`));
  server.stderr.on('data', (d) => console.error(`[Vite Err] ${d.toString().trim()}`));

  await sleep(2500);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const errors = [];
  try {
    const page = await browser.newPage();
    page.on('pageerror', (err) => {
      console.error('PAGE ERROR:', err.message);
      errors.push(`PAGEERROR: ${err.message}`);
    });
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.error('CONSOLE ERROR:', msg.text());
        errors.push(`CONSOLE: ${msg.text()}`);
      }
    });

    console.log('Navigating to http://localhost:4189/ ...');
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
    await page.goto('http://localhost:4189/', { waitUntil: 'networkidle0' });
    await sleep(2000);

    // 1. Screenshot Start Screen
    const startShot = path.join(ARTIFACT_DIR, 'greek_01_start_screen.png');
    await page.screenshot({ path: startShot });
    console.log(`Saved start screen: ${startShot}`);

    // Click Start Game button
    console.log('Clicking #start-begin-btn...');
    await page.waitForSelector('#start-begin-btn', { timeout: 5000 });
    await page.click('#start-begin-btn');
    await sleep(2000);

    // Dismiss mentor dialog if open (click "Weiter" or press Space)
    console.log('Dismissing mentor dialog...');
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('Space');
      await sleep(400);
    }
    await sleep(1500);

    // 2. Screenshot Agora & Player Spawn
    const spawnShot = path.join(ARTIFACT_DIR, 'greek_02_agora_spawn_verified.png');
    await page.screenshot({ path: spawnShot });
    console.log(`Saved Agora & Player Spawn screenshot: ${spawnShot}`);

    // 3. Move player towards Nikolaos (North: press KeyW)
    console.log('Moving player North towards Nikolaos...');
    await page.keyboard.down('KeyW');
    await sleep(700);
    await page.keyboard.up('KeyW');
    await sleep(800);

    const nikolaosShot = path.join(ARTIFACT_DIR, 'greek_03_nikolaos_proximity.png');
    await page.screenshot({ path: nikolaosShot });
    console.log(`Saved Nikolaos proximity screenshot: ${nikolaosShot}`);

    // 4. Move player East towards Agora market stalls (KeyD)
    console.log('Moving player East towards Market Stalls...');
    await page.keyboard.down('KeyD');
    await sleep(1100);
    await page.keyboard.up('KeyD');
    await sleep(800);

    const stallsShot = path.join(ARTIFACT_DIR, 'greek_04_market_stalls_verified.png');
    await page.screenshot({ path: stallsShot });
    console.log(`Saved Market Stalls screenshot: ${stallsShot}`);

    // 5. Move player West across the Agora towards Fountain & Civic Terrace (KeyA)
    console.log('Moving player West towards Fountain & Civic Terrace...');
    await page.keyboard.down('KeyA');
    await sleep(2400);
    await page.keyboard.up('KeyA');
    await sleep(800);

    const westShot = path.join(ARTIFACT_DIR, 'greek_05_west_fountain_terrace.png');
    await page.screenshot({ path: westShot });
    console.log(`Saved West Fountain Terrace screenshot: ${westShot}`);

    console.log('\n--- VERIFICATION COMPLETED ---');
    console.log(`Total Errors: ${errors.length}`);
  } catch (err) {
    console.error('Test execution failed:', err);
  } finally {
    await browser.close();
    server.kill();
    console.log('Server and browser closed.');
  }
}

main();
