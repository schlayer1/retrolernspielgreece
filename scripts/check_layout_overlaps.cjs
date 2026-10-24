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
  process.exit(0);
}

main();
