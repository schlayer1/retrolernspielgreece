/**
 * Darstellung & Kollision der Welt-Dekoration aus dem Atlas `world` sowie den kuratierten Griechenland-Sprites.
 * Die Pack-Sprites sind für 32/48-px-Charaktere gezeichnet, unsere Figuren sind 16×32 px groß.
 * Jede Sprite-Familie bekommt einen harmonischen Maßstab und eine eigene Fußkollisionsbox (in Welt-Pixeln).
 * Die Box sitzt immer am Fuß des Sprites (Stamm, Sockel, Wandunterkante) – Kronen und Dächer sind begehbar dahinter.
 */

export interface DecorSpec {
  /** Maßstab des Sprites in der Welt. */
  scale: number;
  /** Fußkollision in Welt-Pixeln (zentriert auf x, Unterkante `by` über dem Fußpunkt). `null` = keine Kollision. */
  hb: { w: number; h: number; by: number } | null;
}

interface Rule {
  test: (id: string) => boolean;
  scale: number;
  /** Box als Anteil der skalierten Spritegröße (fw/fh) oder feste Pixel. */
  box: (w: number, h: number) => { w: number; h: number; by: number } | null;
}

const starts = (...p: string[]) => (id: string) => p.some((x) => id.startsWith(x));

const RULES: Rule[] = [
  // 1. Große Bäume & Zypressen: nur der Stamm am Fuß blockiert, Baumkrone dahinter frei begehbar
  { test: starts('cypress_tall'), scale: 0.95, box: () => ({ w: 8, h: 5, by: 2 }) },
  { test: starts('citrus_tree'), scale: 0.85, box: () => ({ w: 9, h: 6, by: 2 }) },
  { test: starts('olive_tree'), scale: 0.9, box: () => ({ w: 10, h: 6, by: 2 }) },
  { test: starts('tree_pine_tall', 'tree_oak_tall', 'tree_pine_slim'), scale: 0.56, box: () => ({ w: 10, h: 6, by: 2 }) },
  { test: starts('tree_dead', 'tree_bare', 'tree_small'), scale: 0.72, box: () => ({ w: 7, h: 5, by: 2 }) },
  { test: starts('tree_'), scale: 0.72, box: (w) => ({ w: Math.max(8, Math.min(12, w * 0.16)), h: 6, by: 2 }) },

  // 2. Holz & Baumstümpfe
  { test: starts('stump_'), scale: 0.58, box: (w) => ({ w: Math.max(10, w * 0.68), h: 8, by: 2 }) },
  { test: starts('logs_'), scale: 0.56, box: (w) => ({ w: Math.max(12, w * 0.78), h: 9, by: 2 }) },
  { test: starts('log_tall'), scale: 0.48, box: () => ({ w: 8, h: 6, by: 1 }) },

  // 3. Felsen & Gebirgskamm
  { test: starts('rock_small', 'pebbles', 'rock_flat'), scale: 0.55, box: () => null },
  { test: starts('rock_tall'), scale: 0.58, box: (w) => ({ w: w * 0.7, h: 10, by: 3 }) },
  { test: starts('rock_'), scale: 0.58, box: (w) => ({ w: w * 0.76, h: 14, by: 3 }) },

  // 4. Büsche, Hecken & mediterrane Blumen
  { test: starts('bougainvillea'), scale: 0.85, box: () => null },
  { test: starts('bush_big', 'bush_huge'), scale: 0.52, box: (w) => ({ w: w * 0.6, h: 11, by: 3 }) },
  { test: starts('bush_tall'), scale: 0.58, box: (w) => ({ w: w * 0.65, h: 9, by: 2 }) },
  { test: starts('bush_'), scale: 0.68, box: (w) => ({ w: Math.max(10, w * 0.62), h: 8, by: 2 }) },
  { test: starts('hedge_'), scale: 0.62, box: (w) => ({ w: w * 0.88, h: 8, by: 2 }) },

  // 5. Bodenbewuchs (Gras, Farne, Blumen, Pilze) komplett ohne Kollision
  { test: starts('flower_bunch'), scale: 0.45, box: () => null },
  { test: starts('flower_'), scale: 0.36, box: () => null },
  { test: starts('grass_s'), scale: 0.55, box: () => null },
  { test: starts('grass_', 'fern_big'), scale: 0.45, box: () => null },
  { test: starts('fern_', 'mushroom_'), scale: 0.45, box: () => null },

  // 6. Zäune & Absperrungen
  { test: starts('fence_post'), scale: 0.58, box: () => ({ w: 5, h: 4, by: 1 }) },
  { test: starts('fence_'), scale: 0.58, box: (w) => ({ w: Math.max(12, w * 0.9), h: 5, by: 2 }) },

  // 7. Agora, Brunnen & Markt-Props
  { test: starts('market_stall'), scale: 0.92, box: (w) => ({ w: w * 0.78, h: 14, by: 3 }) },
  { test: starts('agora_stall'), scale: 0.92, box: (w) => ({ w: w * 0.78, h: 14, by: 3 }) },
  { test: starts('lion_fountain', 'fountain_'), scale: 0.9, box: (w) => ({ w: w * 0.75, h: 12, by: 2 }) },
  { test: starts('stone_well', 'well'), scale: 0.65, box: (w) => ({ w: w * 0.78, h: 12, by: 3 }) },
  { test: starts('marble_bench'), scale: 0.9, box: (w) => ({ w: w * 0.75, h: 8, by: 2 }) },
  { test: starts('fruit_basket', 'terracotta_pots', 'barrel', 'crate', 'sack', 'basket'), scale: 0.85, box: (w) => ({ w: w * 0.7, h: 8, by: 2 }) },
  { test: starts('scroll_shelf'), scale: 0.9, box: (w) => ({ w: w * 0.8, h: 12, by: 2 }) },
  { test: starts('world_map_table'), scale: 0.9, box: (w) => ({ w: w * 0.8, h: 12, by: 2 }) },
  { test: starts('torch', 'lantern', 'banner'), scale: 0.62, box: () => null },

  // 8. Statuen & Säulen
  { test: starts('statue_'), scale: 0.88, box: (w) => ({ w: Math.min(18, w * 0.6), h: 8, by: 2 }) },
  { test: starts('column_', 'ruined_column'), scale: 0.9, box: () => ({ w: 10, h: 7, by: 1 }) },

  // 9. Gebäude, Tempel, Hallen & Schiffe: nur der untere Sockel blockiert
  { test: starts('parthenon'), scale: 1.0, box: (w) => ({ w: w * 0.8, h: 22, by: 3 }) },
  { test: starts('theater'), scale: 0.88, box: (w) => ({ w: w * 0.78, h: 22, by: 3 }) },
  { test: starts('stoa_colonnade'), scale: 0.95, box: (w) => ({ w: w * 0.82, h: 14, by: 3 }) },
  { test: starts('greek_villa'), scale: 0.9, box: (w) => ({ w: w * 0.82, h: 16, by: 3 }) },
  { test: starts('spartan_barracks', 'spartan_hall'), scale: 0.95, box: (w) => ({ w: w * 0.8, h: 16, by: 3 }) },
  { test: starts('spartan_phalanx'), scale: 0.9, box: (w) => ({ w: w * 0.82, h: 14, by: 2 }) },
  { test: starts('spartan_spear_rack', 'spartan_helmet_rack'), scale: 0.85, box: (w) => ({ w: w * 0.75, h: 10, by: 2 }) },
  { test: starts('trireme_'), scale: 0.92, box: (w) => ({ w: w * 0.78, h: 16, by: 3 }) },
  { test: starts('lighthouse_pharos'), scale: 0.95, box: (w) => ({ w: 26, h: 18, by: 3 }) },
  { test: starts('tholos_delphi'), scale: 0.95, box: (w) => ({ w: w * 0.75, h: 16, by: 3 }) },
  { test: starts('watchtower_stone'), scale: 0.9, box: (w) => ({ w: 24, h: 14, by: 3 }) },
  { test: starts('thermopylae_gate'), scale: 0.95, box: (w) => ({ w: w * 0.82, h: 16, by: 3 }) },

  // 10. Lagerfeuer & Kult
  { test: starts('campfire', 'fire_altar'), scale: 0.9, box: () => null },
  { test: starts('brazier_tripod'), scale: 0.9, box: () => ({ w: 12, h: 8, by: 2 }) },
  { test: starts('bridge_', 'ladder'), scale: 0.62, box: () => null },
  { test: starts('owl_athena'), scale: 0.85, box: () => null },
  { test: starts('stag_deer'), scale: 0.85, box: () => ({ w: 16, h: 8, by: 2 }) },
];

const FALLBACK: Rule = { test: () => true, scale: 0.85, box: (w) => ({ w: w * 0.6, h: 9, by: 2 }) };

/** Liefert Maßstab und Kollisionsbox für ein Atlas-Sprite der Größe fw × fh. */
export function decorSpec(id: string, fw: number, fh: number): DecorSpec {
  const rule = RULES.find((r) => r.test(id)) ?? FALLBACK;
  const sw = fw * rule.scale;
  const b = rule.box(sw, fh * rule.scale);
  return { scale: rule.scale, hb: b ? { w: Math.round(b.w), h: Math.round(b.h), by: b.by } : null };
}
