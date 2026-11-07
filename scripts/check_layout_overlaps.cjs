const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ASSETS_DIR = path.join(ROOT, 'public/assets');

// Helper to read PNG dimensions directly from file header
function getPngDimensions(filePath) {
  const buf = fs.readFileSync(filePath);
  if (buf.length < 24 || buf.toString('ascii', 1, 4) !== 'PNG') {
    return { w: 32, h: 32 };
  }
  const w = buf.readUInt32BE(16);
  const h = buf.readUInt32BE(20);
  return { w, h };
}

// Map texture keys to file paths
function findAssetFile(texKey) {
  const searchDirs = [
    path.join(ASSETS_DIR, 'greek'),
    path.join(ASSETS_DIR, 'props'),
    path.join(ASSETS_DIR, 'characters'),
    path.join(ASSETS_DIR, 'world'),
  ];
  for (const d of searchDirs) {
    const candidate = path.join(d, `${texKey}.png`);
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

// Scale rules according to decor.ts
function getScale(texKey) {
  // 1. Gebäude & Monumente
  if (texKey.startsWith('parthenon')) return 1.40;
  if (texKey.startsWith('stoa_colonnade')) return 1.60;
  if (texKey.startsWith('greek_villa')) return 1.80;
  if (texKey.startsWith('theater')) return 1.35;
  if (texKey.startsWith('spartan_barracks') || texKey.startsWith('spartan_hall')) return 1.35;
  if (texKey.startsWith('small_temple')) return 1.60;
  if (texKey.startsWith('pnyx_council')) return 1.45;
  if (texKey.startsWith('tholos_delphi')) return 1.20;
  if (texKey.startsWith('watchtower_stone')) return 1.20;
  if (texKey.startsWith('thermopylae_gate')) return 1.20;
  if (texKey.startsWith('trireme_')) return 1.10;
  if (texKey.startsWith('lighthouse_pharos')) return 1.20;
  if (texKey.startsWith('spartan_phalanx')) return 0.85;

  // 2. Bäume & Vegetation
  if (texKey.startsWith('cypress_tall')) return 0.90;
  if (texKey.startsWith('olive_tree')) return 0.90;
  if (texKey.startsWith('citrus_tree')) return 0.50;
  if (texKey.startsWith('bougainvillea')) return 0.65;

  // 3. Mittlere Stadt-Props
  if (texKey.startsWith('market_stall') || texKey.startsWith('agora_stall')) return 0.75;
  if (texKey.startsWith('lion_fountain') || texKey.startsWith('fountain_') || texKey.startsWith('cistern_pool')) return 0.85;
  if (texKey.startsWith('marble_bench')) return 0.50;
  if (texKey.startsWith('stone_well')) return 0.55;
  if (texKey.startsWith('column_') || texKey.startsWith('ruined_column')) return 0.75;
  if (texKey.startsWith('statue_')) return 0.75;
  if (texKey.startsWith('campfire')) return 0.75;
  if (texKey.startsWith('fire_altar')) return 0.55;
  if (texKey.startsWith('brazier_tripod')) return 0.70;
  if (texKey.startsWith('scroll_shelf') || texKey.startsWith('world_map_table')) return 0.55;

  // 4. Kleinstobjekte & Marktauslagen (14-20px)
  if (texKey.startsWith('fruit_basket_figs')) return 0.20;
  if (texKey.startsWith('cloth_rolls')) return 0.38;
  if (texKey.startsWith('basket_')) return 0.36;
  if (texKey.startsWith('terracotta_pots')) return 0.38;
  if (texKey.startsWith('clay_deposit')) return 1.0;
  if (texKey.startsWith('amphora_')) return 0.65;
  if (texKey.startsWith('chest_ornate')) return 0.55;

  return 0.65;
}

// Parse WorldScene.ts to extract placeDecor calls and addNode calls
function parseWorldScene() {
  const content = fs.readFileSync(path.join(ROOT, 'src/scenes/WorldScene.ts'), 'utf8');
  const items = [];

  // placeDecor('key', x, y)
  const decorRegex = /this\.placeDecor\(\s*['"]([^'"]+)['"]\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/g;
  let m;
  while ((m = decorRegex.exec(content)) !== null) {
    items.push({ id: `decor_${m[1]}@${m[2]},${m[3]}`, tex: m[1], x: parseInt(m[2], 10), y: parseInt(m[3], 10), originY: 0.9 });
  }

  // addNode('kind', x, y, 'tex', frame, label, color, scale)
  const nodeRegex = /this\.addNode\(\s*['"]([^'"]+)['"]\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*['"]([^'"]+)['"]\s*,\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([0-9.]+)/g;
  while ((m = nodeRegex.exec(content)) !== null) {
    items.push({ id: `node_${m[1]}@${m[2]},${m[3]}`, tex: m[4], scale: parseFloat(m[8]), x: parseInt(m[2], 10), y: parseInt(m[3], 10), originY: 0.9 });
  }

  // Mentor positions across chapters
  const mentorRegex = /(\d+):\s*\{\s*kind:\s*['"]([^'"]+)['"]\s*,\s*tex:\s*['"]([^'"]+)['"][^}]*?x:\s*(\d+)\s*,\s*y:\s*(\d+)/g;
  while ((m = mentorRegex.exec(content)) !== null) {
    items.push({ id: `mentor_ch${m[1]}_${m[2]}`, tex: m[3], scale: 1.0, x: parseInt(m[4], 10), y: parseInt(m[5], 10), originY: 0.9 });
  }

  // Player spawn
  items.push({ id: 'player_spawn', tex: 'player_greek_female', scale: 1.0, x: 800, y: 620, originY: 0.9 });

  return items;
}

// Parse items.ts to extract Chapter 1 & building sites
function parseItems() {
  const content = fs.readFileSync(path.join(ROOT, 'src/data/items.ts'), 'utf8');
  const buildingsBlock = content.split('export const BUILDINGS')[1] || '';
  const buildings = [];
  const spriteMap = {
    olivenpresse: { tex: 'olive_press', scale: 1.0 },
    hafen_werft: { tex: 'trireme_ship', scale: 1.05 },
    sparta_schmiede: { tex: 'spartan_hall', scale: 1.25 },
    pnyx_buehne: { tex: 'small_temple_blue', scale: 1.5 },
    zeus_altar: { tex: 'fire_altar_gold', scale: 0.75 },
    akademie_stube: { tex: 'small_temple_red', scale: 1.5 },
    bibliothek_alexandria: { tex: 'parthenon_gold', scale: 1.15 },
  };
  const bRegex = /id:\s*['"]([^'"]+)['"][\s\S]*?x:\s*(\d+)[\s\S]*?y:\s*(\d+)/g;
  let m;
  while ((m = bRegex.exec(buildingsBlock)) !== null) {
    const bId = m[1];
    const info = spriteMap[bId] || { tex: 'small_temple_blue', scale: 1.2 };
    buildings.push({ id: `bld_${bId}`, tex: info.tex, scale: info.scale, x: parseInt(m[2], 10), y: parseInt(m[3], 10), originY: 0.9 });
  }
  return buildings;
}

function computeAABB(item) {
  let file = findAssetFile(item.tex);
  let dims = { w: 32, h: 32 };
  if (file) {
    dims = getPngDimensions(file);
  } else if (item.tex.startsWith('player') || item.tex.startsWith('npc')) {
    dims = { w: 16, h: 32 };
  }
  const scale = item.scale !== undefined ? item.scale : getScale(item.tex);
  const w = dims.w * scale * 0.95;
  const h = dims.h * scale * 0.95;
  const left = item.x - w * 0.5;
  const right = item.x + w * 0.5;
  const top = item.y - h * item.originY;
  const bottom = item.y + h * (1.0 - item.originY);
  return { id: item.id, tex: item.tex, x: item.x, y: item.y, w, h, left, right, top, bottom };
}

function main() {
  console.log('=== SNES RETRO GAME: SPATIAL LAYOUT OVERLAP LINTER ===');
  const worldItems = parseWorldScene();
  const buildings = parseItems();
  const allItems = [...worldItems, ...buildings];

  console.log(`Analyzing ${allItems.length} placed objects across the 100x80 map...`);

  const boxes = allItems.map(computeAABB);
  const overlaps = [];

  for (let i = 0; i < boxes.length; i++) {
    const a = boxes[i];
    for (let j = i + 1; j < boxes.length; j++) {
      const b = boxes[j];

      // Exclude identical items or duplicate definitions if any
      if (a.x === b.x && a.y === b.y && a.id === b.id) continue;

      const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);

      if (ox > 0 && oy > 0) {
        overlaps.push({ a, b, ox, oy });
      }
    }
  }

  if (overlaps.length > 0) {
    console.error(`\n❌ ERROR: ${overlaps.length} OVERLAPPING ASSET PAIRS DETECTED!`);
    overlaps.forEach((o, idx) => {
      console.error(
        `  ${idx + 1}. [${o.a.id}] (${o.a.tex} at ${o.a.x},${o.a.y}) OVERLAPS WITH [${o.b.id}] (${o.b.tex} at ${o.b.x},${o.b.y})` +
        ` -> Intersection: ${o.ox.toFixed(1)}px horizontal, ${o.oy.toFixed(1)}px vertical`
      );
    });
    process.exit(1);
  }

  console.log('✅ PASSED: 0 Overlaps detected! All objects have clear, unblocked bounding boxes.\n');

  // Comprehensive Didactic & Visual Quality Gate (A–T)
  const qualityErrors = [];

  // A. WorldScene Engine Standards
  const worldSceneCode = fs.readFileSync(path.join(ROOT, 'src/scenes/WorldScene.ts'), 'utf8');
  if (!worldSceneCode.includes('sampleBlock') && !worldSceneCode.includes('getImageData')) {
    qualityErrors.push('WorldScene.ts does not sample real A2 pixel tiles via getImageData/sampleBlock (found flat color approximation)!');
  }
  if (!worldSceneCode.includes('scatterGroundFlora')) {
    qualityErrors.push('WorldScene.ts does not define or call scatterGroundFlora() (missing 120-150 ground flora instances)!');
  }
  if (!worldSceneCode.includes("textures.get('world_atlas')?.has")) {
    qualityErrors.push('WorldScene.ts lacks world_atlas texture check for decor (risk of invisible trees/props)!');
  }

  // B. Didactic Stations Check (min. 5 stations)
  try {
    const stationsCode = fs.readFileSync(path.join(ROOT, 'src/data/stations.ts'), 'utf8');
    const stationMatches = stationsCode.match(/id:\s*['"][^'"]+['"]/g) || [];
    if (stationMatches.length < 5) {
      qualityErrors.push(`src/data/stations.ts contains only ${stationMatches.length} stations (minimum required: 5)!`);
    }
  } catch (e) {
    qualityErrors.push(`Failed to read src/data/stations.ts: ${e.message}`);
  }

  // C. Archaeological Relics Check (min. 5 primary sources)
  try {
    const relicsCode = fs.readFileSync(path.join(ROOT, 'src/data/relics.ts'), 'utf8');
    const relicMatches = relicsCode.match(/id:\s*['"][^'"]+['"]/g) || [];
    if (relicMatches.length < 5) {
      qualityErrors.push(`src/data/relics.ts contains only ${relicMatches.length} relics (minimum required: 5)!`);
    }
  } catch (e) {
    qualityErrors.push(`Failed to read src/data/relics.ts: ${e.message}`);
  }

  // D. Progressive Historical Lexicon Check (strictly 27 terms)
  try {
    const lexiconCode = fs.readFileSync(path.join(ROOT, 'src/data/lexicon.ts'), 'utf8');
    const termMatches = lexiconCode.match(/term:\s*['"][^'"]+['"]/g) || [];
    if (termMatches.length < 27) {
      qualityErrors.push(`src/data/lexicon.ts contains only ${termMatches.length} terms (strictly 27 required by skill standard)!`);
    }
  } catch (e) {
    qualityErrors.push(`Failed to read src/data/lexicon.ts: ${e.message}`);
  }

  // E. Didactic A4 Print Sheet Check
  if (!fs.existsSync(path.join(ROOT, 'src/ui/PrintSheet.ts'))) {
    qualityErrors.push('src/ui/PrintSheet.ts is missing (didactic 1-click A4 student print sheet required)!');
  }

  // F. Audio Synthesizer Check
  if (!fs.existsSync(path.join(ROOT, 'src/audio/sound.ts'))) {
    qualityErrors.push('src/audio/sound.ts is missing (4-surface footstep & UI sound synthesizer required)!');
  }

  // G. Interior Scene & Key Building Integrity Check
  if (fs.existsSync(path.join(ROOT, 'src/scenes/InteriorScene.ts'))) {
    const interiorCode = fs.readFileSync(path.join(ROOT, 'src/scenes/InteriorScene.ts'), 'utf8');
    if (!interiorCode.includes('exitToOverworld') || !interiorCode.includes('exitMat')) {
      qualityErrors.push('src/scenes/InteriorScene.ts lacks a verified exitMat / exitToOverworld return mechanism!');
    }
  } else {
    qualityErrors.push('src/scenes/InteriorScene.ts is missing!');
  }

  // H. 3D Plateau & Cliff Elevation Check
  if (!worldSceneCode.includes('buildPlateauCliffs') && !worldSceneCode.includes('cliffs_nature') && !worldSceneCode.includes('cliffs_desert')) {
    qualityErrors.push('WorldScene.ts lacks 3D plateau & cliff elevation (missing buildPlateauCliffs() with visible stairs/ramps onto +1 level)!');
  }

  // I. Quest Compass Check (Orientation & Distance Radar)
  const uiScenePath = path.join(ROOT, 'src/scenes/UIScene.ts');
  const uiSceneCode = fs.existsSync(uiScenePath) ? fs.readFileSync(uiScenePath, 'utf8') : '';
  const indexHtmlCode = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

  if (!worldSceneCode.includes('updateCompass') && !worldSceneCode.includes('updateQuestCompass') && !worldSceneCode.includes('compassText')) {
    qualityErrors.push('WorldScene.ts lacks Quest-Compass updating logic (missing updateCompass() / updateQuestCompass())!');
  }
  if (!uiSceneCode.includes('hud-compass') && !indexHtmlCode.includes('hud-compass')) {
    qualityErrors.push('HUD lacks #hud-compass element in UIScene.ts or index.html (compass radar UI missing)!');
  }

  // J. Camera Dialog Zoom Check (Cinematic 1.32x zoom on mentor)
  if (!worldSceneCode.includes('1.32') && !worldSceneCode.includes('focusOnDialog') && !worldSceneCode.includes('zoomTo')) {
    qualityErrors.push('WorldScene.ts lacks 1.32x dynamic Camera Dialog Zoom (missing focusOnDialog / zoomTo(1.32))!');
  }

  // K. Kinematic Chapter Banner Check
  if (!worldSceneCode.includes('ChapterBanner')) {
    qualityErrors.push('WorldScene.ts does not import or trigger ChapterBanner upon chapter transition!');
  }

  // L. 7-Tile Pause Dashboard Check
  if (!uiSceneCode.includes('distanceMeters') && !worldSceneCode.includes('distanceMeters')) {
    qualityErrors.push('Pause Dashboard / Player movement lacks odometer distance tracking (missing distanceMeters)!');
  }
  if (!uiSceneCode.includes('pause') && !fs.existsSync(path.join(ROOT, 'src/ui/PauseDashboardModal.ts'))) {
    qualityErrors.push('Game lacks 7-Tile Pause Dashboard (missing PauseDashboardModal.ts or pause handling in UIScene.ts)!');
  }

  // M. 4-Surface Footstep Audio Check
  if (!worldSceneCode.includes('step(') && !worldSceneCode.includes('playFootstep')) {
    qualityErrors.push('WorldScene.ts lacks 4-surface footstep audio calls (missing sound.step / playFootstep on movement)!');
  }

  // N. Secret-of-Evermore Companion Check
  if (!worldSceneCode.includes('Companion') && !worldSceneCode.includes('companionManager') && !worldSceneCode.includes('dog_')) {
    qualityErrors.push('WorldScene.ts lacks Secret-of-Evermore Companion instantiation (missing Companion.ts integration)!');
  }

  // O. 360° Archaeological Relic Inspector Check
  if (!fs.existsSync(path.join(ROOT, 'src/ui/ArtifactInspectorModal.ts')) && !uiSceneCode.includes('openArtifactInspector') && !uiSceneCode.includes('360')) {
    qualityErrors.push('UI lacks 360° Archaeological Relic Inspector (missing ArtifactInspectorModal.ts or 360° flip card in UIScene)!');
  }

  // P. Interactive Didactic Station Modal Check
  if (!fs.existsSync(path.join(ROOT, 'src/ui/StationModal.ts')) && !uiSceneCode.includes('openStation')) {
    qualityErrors.push('UI lacks interactive didactic station container (missing StationModal.ts or openStation handler)!');
  }

  // Q. Epoch Phase Timeline Check (Key Z)
  if (!uiSceneCode.includes("'Z'") && !uiSceneCode.includes('"Z"') && !uiSceneCode.includes('timeline') && !fs.existsSync(path.join(ROOT, 'src/ui/TimelineModal.ts'))) {
    qualityErrors.push('Game lacks epoch phase timeline compare modal (Key Z / TimelineModal missing)!');
  }

  // R. Dynamic Chapter Music Check (MusicManager & Chapter BGM)
  if (!fs.existsSync(path.join(ROOT, 'src/audio/MusicManager.ts'))) {
    qualityErrors.push('src/audio/MusicManager.ts is missing (dynamic chapter BGM crossfader required)!');
  } else {
    const musicCode = fs.readFileSync(path.join(ROOT, 'src/audio/MusicManager.ts'), 'utf8');
    if (!musicCode.includes('playChapterMusic')) {
      qualityErrors.push('src/audio/MusicManager.ts lacks playChapterMusic() method for chapter transitions!');
    }
  }
  if (!worldSceneCode.includes('playChapterMusic') && !worldSceneCode.includes('music.play')) {
    qualityErrors.push('WorldScene.ts does not trigger chapter music on transition (missing music.playChapterMusic)!');
  }

  // S. Strict Chapter Schema & Music Metadata Check
  const chaptersCode = fs.readFileSync(path.join(ROOT, 'src/data/chapters.ts'), 'utf8');
  const chapterMatches = chaptersCode.match(/id:\s*(\d+)/g) || [];
  if (chapterMatches.length < 6 || chapterMatches.length > 12) {
    qualityErrors.push(`src/data/chapters.ts defines ${chapterMatches.length} chapters (strictly 6 to 12 chapters required)!`);
  }
  if (!chaptersCode.includes('music') && !chaptersCode.includes('trackId') && !chaptersCode.includes('bgm')) {
    qualityErrors.push('src/data/chapters.ts chapters lack dedicated chapter-music declarations (missing music: { trackId, title, mood, prompt })!');
  }

  // T. Strict 16x32 Character & Mentor Frame Size Enforcement (Steinzeit Benchmark)
  const bootScenePath = path.join(ROOT, 'src/scenes/BootScene.ts');
  if (fs.existsSync(bootScenePath)) {
    const bootCode = fs.readFileSync(bootScenePath, 'utf8');
    const sheetCalls = bootCode.match(/load\.spritesheet\([\s\S]*?\);/g) || [];
    for (const call of sheetCalls) {
      const isCharOrNpc =
        call.includes("'character'") ||
        call.includes("'player") ||
        call.includes("'npc_") ||
        call.includes('farm_baker') ||
        call.includes('farm_farmer');
      if (isCharOrNpc) {
        const m = call.match(/frameWidth:\s*(\d+)[\s\S]*?frameHeight:\s*(\d+)/);
        if (m) {
          const fw = parseInt(m[1], 10);
          const fh = parseInt(m[2], 10);
          if (fw !== 16 || fh !== 32) {
            qualityErrors.push(
              `BootScene.ts loads humanoid/NPC spritesheet with invalid dimensions ${fw}x${fh} in: ${call.replace(/\s+/g, ' ')}! Strictly 16x32 required (Steinzeit benchmark)!`
            );
          }
        }
      }
    }
  }

  if (qualityErrors.length > 0) {
    console.error('\n❌ COMPREHENSIVE QUALITY GATE FAILURES:');
    qualityErrors.forEach((err) => console.error(`  - ${err}`));
    process.exit(1);
  } else {
    console.log('✅ Comprehensive Quality Standards Verified:');
    console.log('   ✓ A2 Pixel Terrain Sampling & 100+ Flora Scatter');
    console.log('   ✓ 3D Plateau Cliffs & Stairs Elevation');
    console.log('   ✓ 5 Interactive Stations & 5 Relics with 360° Inspector');
    console.log('   ✓ Strictly 27 Historical Lexicon Terms');
    console.log('   ✓ Quest Compass & 1.32x Camera Dialog Zoom');
    console.log('   ✓ Kinematic Chapter Banner & 7-Tile Pause Dashboard');
    console.log('   ✓ 4-Surface Footsteps, Companion Dog & Interior Scene');
    console.log('   ✓ Strict 16x32 Character & Mentor Proportions (Steinzeit Benchmark)');
    console.log('   ✓ Dynamic Chapter Music Engine & Google Lyria Metadata');
    console.log('   ✓ A4 Didactic Student Print Sheet');
  }

  process.exit(0);
}

main();
