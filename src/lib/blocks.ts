// Minecraft block palette for pixel-art mapping.
// Hex colors are derived from the bundled 26.1 default texture pack at runtime.
import { BLOCK_TEXTURES } from "./block-textures";
import type { CSSProperties } from "react";

export type BlockDef = {
  id: string;
  name: string;
  category: string;
  hex: string;
  addedIn: string;
  removedIn?: string;
};

// Edition-aware version catalog. Block availability uses the numeric tail
// (after the edition prefix), compared component-wise via cmpVersion.
export type Edition = "java" | "bedrock";

export type VersionEntry = {
  /** Unique id used as the Select value, e.g. "java:1.21.4" or "bedrock:1.21.51". */
  id: string;
  /** Numeric version, e.g. "1.21.4". */
  version: string;
  edition: Edition;
  /** Human label, e.g. "Java 1.21.4". */
  label: string;
};

function expand(edition: Edition, versions: string[]): VersionEntry[] {
  const prefix = edition === "java" ? "Java" : "Bedrock";
  return versions.map((v) => ({
    id: `${edition}:${v}`,
    version: v,
    edition,
    label: `${prefix} ${v}`,
  }));
}

const JAVA_VERSIONS: string[] = [
  "1.7", "1.7.10",
  "1.8", "1.8.9",
  "1.9", "1.9.4",
  "1.10", "1.10.2",
  "1.11", "1.11.2",
  "1.12", "1.12.2",
  "1.13", "1.13.2",
  "1.14", "1.14.4",
  "1.15", "1.15.2",
  "1.16", "1.16.5",
  "1.17", "1.17.1",
  "1.18", "1.18.2",
  "1.19", "1.19.2", "1.19.3", "1.19.4",
  "1.20", "1.20.1", "1.20.2", "1.20.4", "1.20.6",
  "1.21", "1.21.1", "1.21.3", "1.21.4", "1.21.5", "1.21.6", "1.21.7", "1.21.8", "1.21.9", "1.21.10", "1.21.11",
];

const BEDROCK_VERSIONS: string[] = [
  "1.16.0", "1.16.40", "1.16.221",
  "1.17.0", "1.17.41",
  "1.18.0", "1.18.31",
  "1.19.0", "1.19.50", "1.19.83",
  "1.20.0", "1.20.15", "1.20.30", "1.20.50", "1.20.62", "1.20.81",
  "1.21.0", "1.21.20", "1.21.30", "1.21.40", "1.21.50", "1.21.51", "1.21.60", "1.21.70", "1.21.80", "1.21.90",
];

export const VERSION_ENTRIES: VersionEntry[] = [
  ...expand("java", JAVA_VERSIONS),
  ...expand("bedrock", BEDROCK_VERSIONS),
];

/** Backwards-compatible flat list of numeric versions (Java). */
export const VERSIONS: string[] = JAVA_VERSIONS;

export function parseVersionId(id: string): { edition: Edition; version: string } {
  const [edition, version] = id.split(":") as [Edition, string];
  return { edition: edition ?? "java", version: version ?? id };
}

export function cmpVersion(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const da = pa[i] ?? 0;
    const db = pb[i] ?? 0;
    if (da !== db) return da - db;
  }
  return 0;
}

export function isAvailableIn(block: BlockDef, version: string): boolean {
  if (cmpVersion(version, block.addedIn) < 0) return false;
  if (block.removedIn && cmpVersion(version, block.removedIn) >= 0) return false;
  return true;
}

export const BLOCKS: BlockDef[] = [
  { id: "oak_log", name: "Oak Log", category: "Wood", hex: "#6b4f2a", addedIn: "1.0" },
  { id: "oak_wood", name: "Oak Wood", category: "Wood", hex: "#6b4f2a", addedIn: "1.0" },
  { id: "oak_stripped_log", name: "Oak Stripped Log", category: "Wood", hex: "#b89260", addedIn: "1.13" },
  { id: "oak_stripped_wood", name: "Oak Stripped Wood", category: "Wood", hex: "#b89260", addedIn: "1.13" },
  { id: "oak_planks", name: "Oak Planks", category: "Wood", hex: "#888888", addedIn: "1.0" },
  { id: "oak_leaves", name: "Oak Leaves", category: "Wood", hex: "#3a6b1f", addedIn: "1.0" },
  { id: "birch_log", name: "Birch Log", category: "Wood", hex: "#cfcabe", addedIn: "1.0" },
  { id: "birch_wood", name: "Birch Wood", category: "Wood", hex: "#cfcabe", addedIn: "1.0" },
  { id: "birch_stripped_log", name: "Birch Stripped Log", category: "Wood", hex: "#dccc88", addedIn: "1.13" },
  { id: "birch_stripped_wood", name: "Birch Stripped Wood", category: "Wood", hex: "#dccc88", addedIn: "1.13" },
  { id: "birch_planks", name: "Birch Planks", category: "Wood", hex: "#888888", addedIn: "1.0" },
  { id: "birch_leaves", name: "Birch Leaves", category: "Wood", hex: "#80a755", addedIn: "1.0" },
  { id: "spruce_log", name: "Spruce Log", category: "Wood", hex: "#3b2611", addedIn: "1.0" },
  { id: "spruce_wood", name: "Spruce Wood", category: "Wood", hex: "#3b2611", addedIn: "1.0" },
  { id: "spruce_stripped_log", name: "Spruce Stripped Log", category: "Wood", hex: "#6c4e2a", addedIn: "1.13" },
  { id: "spruce_stripped_wood", name: "Spruce Stripped Wood", category: "Wood", hex: "#6c4e2a", addedIn: "1.13" },
  { id: "spruce_planks", name: "Spruce Planks", category: "Wood", hex: "#888888", addedIn: "1.0" },
  { id: "spruce_leaves", name: "Spruce Leaves", category: "Wood", hex: "#3d5e2a", addedIn: "1.0" },
  { id: "jungle_log", name: "Jungle Log", category: "Wood", hex: "#3e2e16", addedIn: "1.0" },
  { id: "jungle_wood", name: "Jungle Wood", category: "Wood", hex: "#3e2e16", addedIn: "1.0" },
  { id: "jungle_stripped_log", name: "Jungle Stripped Log", category: "Wood", hex: "#9d7847", addedIn: "1.13" },
  { id: "jungle_stripped_wood", name: "Jungle Stripped Wood", category: "Wood", hex: "#9d7847", addedIn: "1.13" },
  { id: "jungle_planks", name: "Jungle Planks", category: "Wood", hex: "#888888", addedIn: "1.0" },
  { id: "jungle_leaves", name: "Jungle Leaves", category: "Wood", hex: "#36a318", addedIn: "1.0" },
  { id: "dark_oak_log", name: "Dark Oak Log", category: "Wood", hex: "#2a1c0e", addedIn: "1.7" },
  { id: "dark_oak_wood", name: "Dark Oak Wood", category: "Wood", hex: "#2a1c0e", addedIn: "1.7" },
  { id: "dark_oak_stripped_log", name: "Dark Oak Stripped Log", category: "Wood", hex: "#4a3219", addedIn: "1.7" },
  { id: "dark_oak_stripped_wood", name: "Dark Oak Stripped Wood", category: "Wood", hex: "#4a3219", addedIn: "1.7" },
  { id: "dark_oak_planks", name: "Dark Oak Planks", category: "Wood", hex: "#888888", addedIn: "1.7" },
  { id: "dark_oak_leaves", name: "Dark Oak Leaves", category: "Wood", hex: "#2c4d18", addedIn: "1.7" },
  { id: "acacia_log", name: "Acacia Log", category: "Wood", hex: "#5a5141", addedIn: "1.7" },
  { id: "acacia_wood", name: "Acacia Wood", category: "Wood", hex: "#5a5141", addedIn: "1.7" },
  { id: "acacia_stripped_log", name: "Acacia Stripped Log", category: "Wood", hex: "#a45a2a", addedIn: "1.13" },
  { id: "acacia_stripped_wood", name: "Acacia Stripped Wood", category: "Wood", hex: "#a45a2a", addedIn: "1.13" },
  { id: "acacia_planks", name: "Acacia Planks", category: "Wood", hex: "#888888", addedIn: "1.7" },
  { id: "acacia_leaves", name: "Acacia Leaves", category: "Wood", hex: "#5a8c2a", addedIn: "1.7" },
  { id: "mangrove_log", name: "Mangrove Log", category: "Wood", hex: "#4d2c2c", addedIn: "1.19" },
  { id: "mangrove_wood", name: "Mangrove Wood", category: "Wood", hex: "#4d2c2c", addedIn: "1.19" },
  { id: "mangrove_stripped_log", name: "Mangrove Stripped Log", category: "Wood", hex: "#793c3c", addedIn: "1.19" },
  { id: "mangrove_stripped_wood", name: "Mangrove Stripped Wood", category: "Wood", hex: "#793c3c", addedIn: "1.19" },
  { id: "mangrove_planks", name: "Mangrove Planks", category: "Wood", hex: "#888888", addedIn: "1.19" },
  { id: "mangrove_leaves", name: "Mangrove Leaves", category: "Wood", hex: "#5a8c2a", addedIn: "1.19" },
  { id: "mangrove_roots", name: "Mangrove Roots", category: "Wood", hex: "#5b3a2b", addedIn: "1.19" },
  { id: "muddy_mangrove_roots", name: "Muddy Mangrove Roots", category: "Wood", hex: "#3a2a22", addedIn: "1.19" },
  { id: "cherry_log", name: "Cherry Log", category: "Wood", hex: "#3a2730", addedIn: "1.20" },
  { id: "cherry_wood", name: "Cherry Wood", category: "Wood", hex: "#3a2730", addedIn: "1.20" },
  { id: "cherry_stripped_log", name: "Cherry Stripped Log", category: "Wood", hex: "#e2b6b1", addedIn: "1.13" },
  { id: "cherry_stripped_wood", name: "Cherry Stripped Wood", category: "Wood", hex: "#e2b6b1", addedIn: "1.13" },
  { id: "cherry_planks", name: "Cherry Planks", category: "Wood", hex: "#888888", addedIn: "1.20" },
  { id: "cherry_leaves", name: "Cherry Leaves", category: "Wood", hex: "#f8b3c0", addedIn: "1.20" },
  { id: "bamboo_block", name: "Bamboo Block", category: "Wood", hex: "#9c8a4f", addedIn: "1.20" },
  { id: "stripped_bamboo_block", name: "Stripped Bamboo Block", category: "Wood", hex: "#c8a951", addedIn: "1.20" },
  { id: "bamboo_planks", name: "Bamboo Planks", category: "Wood", hex: "#888888", addedIn: "1.20" },
  { id: "bamboo_mosaic", name: "Bamboo Mosaic", category: "Wood", hex: "#c8a951", addedIn: "1.20" },
  { id: "pale_oak_log", name: "Pale Oak Log", category: "Wood", hex: "#bfb5a3", addedIn: "1.21" },
  { id: "pale_oak_wood", name: "Pale Oak Wood", category: "Wood", hex: "#bfb5a3", addedIn: "1.21" },
  { id: "pale_oak_stripped_log", name: "Pale Oak Stripped Log", category: "Wood", hex: "#d6cdba", addedIn: "1.21" },
  { id: "pale_oak_stripped_wood", name: "Pale Oak Stripped Wood", category: "Wood", hex: "#d6cdba", addedIn: "1.21" },
  { id: "pale_oak_planks", name: "Pale Oak Planks", category: "Wood", hex: "#888888", addedIn: "1.21" },
  { id: "pale_oak_leaves", name: "Pale Oak Leaves", category: "Wood", hex: "#cdd0c8", addedIn: "1.21" },
  { id: "crimson_stem", name: "Crimson Stem", category: "Wood", hex: "#5b1f24", addedIn: "1.16" },
  { id: "crimson_hyphae", name: "Crimson Hyphae", category: "Wood", hex: "#5b1f24", addedIn: "1.16" },
  { id: "crimson_stripped_stem", name: "Crimson Stripped Stem", category: "Wood", hex: "#823b3c", addedIn: "1.13" },
  { id: "crimson_stripped_hyphae", name: "Crimson Stripped Hyphae", category: "Wood", hex: "#823b3c", addedIn: "1.13" },
  { id: "crimson_planks", name: "Crimson Planks", category: "Wood", hex: "#888888", addedIn: "1.16" },
  { id: "nether_wart_block", name: "Nether Wart Block", category: "Wood", hex: "#7a0e0e", addedIn: "1.10" },
  { id: "warped_stem", name: "Warped Stem", category: "Wood", hex: "#3a3a4d", addedIn: "1.16" },
  { id: "warped_hyphae", name: "Warped Hyphae", category: "Wood", hex: "#3a3a4d", addedIn: "1.16" },
  { id: "warped_stripped_stem", name: "Warped Stripped Stem", category: "Wood", hex: "#398d8b", addedIn: "1.13" },
  { id: "warped_stripped_hyphae", name: "Warped Stripped Hyphae", category: "Wood", hex: "#398d8b", addedIn: "1.13" },
  { id: "warped_planks", name: "Warped Planks", category: "Wood", hex: "#888888", addedIn: "1.16" },
  { id: "warped_wart_block", name: "Warped Wart Block", category: "Wood", hex: "#168485", addedIn: "1.16" },
  { id: "grass_block", name: "Grass Block", category: "Natural", hex: "#5b8a3a", addedIn: "1.0" },
  { id: "dirt", name: "Dirt", category: "Natural", hex: "#866043", addedIn: "1.0" },
  { id: "course_dirt", name: "Course Dirt", category: "Natural", hex: "#7a5536", addedIn: "1.7" },
  { id: "rooted_dirt", name: "Rooted Dirt", category: "Natural", hex: "#956c4f", addedIn: "1.17" },
  { id: "podzol", name: "Podzol", category: "Natural", hex: "#624022", addedIn: "1.7" },
  { id: "mycelium", name: "Mycelium", category: "Natural", hex: "#6f6566", addedIn: "1.0" },
  { id: "gravel", name: "Gravel", category: "Natural", hex: "#857b7b", addedIn: "1.0" },
  { id: "sand", name: "Sand", category: "Sand", hex: "#dbd3a0", addedIn: "1.0" },
  { id: "sandstone", name: "Sandstone", category: "Sand", hex: "#dccd8a", addedIn: "1.0" },
  { id: "smooth_sandstone", name: "Smooth Sandstone", category: "Sand", hex: "#e0d292", addedIn: "1.0" },
  { id: "cut_sandstone", name: "Cut Sandstone", category: "Sand", hex: "#dccc88", addedIn: "1.0" },
  { id: "chisled_sandstone", name: "Chisled Sandstone", category: "Sand", hex: "#dccc88", addedIn: "1.0" },
  { id: "red_sand", name: "Red Sand", category: "Sand", hex: "#bf6e2f", addedIn: "1.7" },
  { id: "red_sandstone", name: "Red Sandstone", category: "Sand", hex: "#a4571f", addedIn: "1.8" },
  { id: "red_smooth_sandstone", name: "Red Smooth Sandstone", category: "Sand", hex: "#aa5e25", addedIn: "1.8" },
  { id: "red_cut_sandstone", name: "Red Cut Sandstone", category: "Sand", hex: "#a4571f", addedIn: "1.8" },
  { id: "red_chisled_sandstone", name: "Red Chisled Sandstone", category: "Sand", hex: "#a4571f", addedIn: "1.8" },
  { id: "snow", name: "Snow", category: "Snow", hex: "#f9fdfd", addedIn: "1.0" },
  { id: "ice", name: "Ice", category: "Snow", hex: "#74a4f5", addedIn: "1.0" },
  { id: "packed_ice", name: "Packed Ice", category: "Snow", hex: "#7faff5", addedIn: "1.7" },
  { id: "blue_ice", name: "Blue Ice", category: "Snow", hex: "#76c4f0", addedIn: "1.13" },
  { id: "clay", name: "Clay", category: "Clay", hex: "#9ea4b1", addedIn: "1.0" },
  { id: "bricks", name: "Bricks", category: "Clay", hex: "#965a4a", addedIn: "1.0" },
  { id: "mud", name: "Mud", category: "Mud", hex: "#3a3329", addedIn: "1.19" },
  { id: "packed_mud", name: "Packed Mud", category: "Mud", hex: "#8a6647", addedIn: "1.19" },
  { id: "packed_mud_brick", name: "Packed Mud Brick", category: "Mud", hex: "#8a6647", addedIn: "1.19" },
  { id: "stone", name: "Stone", category: "Stone", hex: "#7a7a7a", addedIn: "1.0" },
  { id: "smooth_stone", name: "Smooth Stone", category: "Stone", hex: "#8c8c8c", addedIn: "1.0" },
  { id: "cobblestone", name: "Cobblestone", category: "Stone", hex: "#828282", addedIn: "1.0" },
  { id: "mossy_cobblestone", name: "Mossy Cobblestone", category: "Stone", hex: "#6f7c5b", addedIn: "1.0" },
  { id: "stone_bricks", name: "Stone Bricks", category: "Stone", hex: "#7d7d7d", addedIn: "1.0" },
  { id: "cracked_stone_bricks", name: "Cracked Stone Bricks", category: "Stone", hex: "#777570", addedIn: "1.0" },
  { id: "chisled_stone_bricks", name: "Chisled Stone Bricks", category: "Stone", hex: "#7d7d7d", addedIn: "1.9" },
  { id: "mossy_stone_bricks", name: "Mossy Stone Bricks", category: "Stone", hex: "#6f7c5b", addedIn: "1.0" },
  { id: "granite", name: "Granite", category: "Cave", hex: "#9b6b56", addedIn: "1.8" },
  { id: "polished_granite", name: "Polished Granite", category: "Cave", hex: "#a47863", addedIn: "1.8" },
  { id: "diorite", name: "Diorite", category: "Cave", hex: "#cdcdcf", addedIn: "1.8" },
  { id: "polished_diorite", name: "Polished Diorite", category: "Cave", hex: "#dcdce0", addedIn: "1.8" },
  { id: "andesite", name: "Andesite", category: "Cave", hex: "#888889", addedIn: "1.8" },
  { id: "polished_andesite", name: "Polished Andesite", category: "Cave", hex: "#a2a2a2", addedIn: "1.8" },
  { id: "dripstone_block", name: "Dripstone Block", category: "Cave", hex: "#866054", addedIn: "1.17" },
  { id: "calcite", name: "Calcite", category: "Cave", hex: "#dededb", addedIn: "1.17" },
  { id: "tuff", name: "Tuff", category: "Cave", hex: "#6c6c66", addedIn: "1.17" },
  { id: "polished_tuff", name: "Polished Tuff", category: "Cave", hex: "#76766f", addedIn: "1.21" },
  { id: "tuff_bricks", name: "Tuff Bricks", category: "Cave", hex: "#76766f", addedIn: "1.21" },
  { id: "chisled_tuff", name: "Chisled Tuff", category: "Cave", hex: "#76766f", addedIn: "1.21" },
  { id: "chisiled_tuff_bricks", name: "Chisiled Tuff Bricks", category: "Cave", hex: "#76766f", addedIn: "1.21" },
  { id: "deepslate", name: "Deepslate", category: "Cave", hex: "#4d4d52", addedIn: "1.17" },
  { id: "cobbled_deepslate", name: "Cobbled Deepslate", category: "Cave", hex: "#555560", addedIn: "1.17" },
  { id: "chiseled_deepslate", name: "Chiseled Deepslate", category: "Cave", hex: "#4d4d52", addedIn: "1.17" },
  { id: "polished_deepslate", name: "Polished Deepslate", category: "Cave", hex: "#525258", addedIn: "1.17" },
  { id: "deepslate_bricks", name: "Deepslate Bricks", category: "Cave", hex: "#4f4f55", addedIn: "1.17" },
  { id: "cracked_deepslate_bricks", name: "Cracked Deepslate Bricks", category: "Cave", hex: "#4f4f55", addedIn: "1.17" },
  { id: "deepslate_tiles", name: "Deepslate Tiles", category: "Cave", hex: "#3d3d44", addedIn: "1.17" },
  { id: "cracked_deepslate_tiles", name: "Cracked Deepslate Tiles", category: "Cave", hex: "#3d3d44", addedIn: "1.17" },
  { id: "coal_ore", name: "Coal Ore", category: "Ores", hex: "#535353", addedIn: "1.0" },
  { id: "deepslate_coal_ore", name: "Deepslate Coal Ore", category: "Ores", hex: "#3d3d44", addedIn: "1.17" },
  { id: "coal_block", name: "Coal Block", category: "Ores", hex: "#100f0f", addedIn: "1.0" },
  { id: "copper_ore", name: "Copper Ore", category: "Ores", hex: "#8a7a6a", addedIn: "1.17" },
  { id: "deepslate_copper_ore", name: "Deepslate Copper Ore", category: "Ores", hex: "#5a5a5e", addedIn: "1.17" },
  { id: "raw_copper_block", name: "Raw Copper Block", category: "Ores", hex: "#9c5e3c", addedIn: "1.17" },
  { id: "iron_ore", name: "Iron Ore", category: "Ores", hex: "#a48972", addedIn: "1.0" },
  { id: "deepslate_iron_ore", name: "Deepslate Iron Ore", category: "Ores", hex: "#605853", addedIn: "1.17" },
  { id: "raw_iron_block", name: "Raw Iron Block", category: "Ores", hex: "#a8825c", addedIn: "1.17" },
  { id: "iron_block", name: "Iron Block", category: "Ores", hex: "#e7e7e7", addedIn: "1.0" },
  { id: "gold_ore", name: "Gold Ore", category: "Ores", hex: "#bda05a", addedIn: "1.0" },
  { id: "deepslate_gold_ore", name: "Deepslate Gold Ore", category: "Ores", hex: "#5e5946", addedIn: "1.17" },
  { id: "nether_gold_ore", name: "Nether Gold Ore", category: "Ores", hex: "#7a3f30", addedIn: "1.16" },
  { id: "raw_gold_block", name: "Raw Gold Block", category: "Ores", hex: "#dda221", addedIn: "1.17" },
  { id: "gold_block", name: "Gold Block", category: "Ores", hex: "#fbeb52", addedIn: "1.0" },
  { id: "nether_quartz_ore", name: "Nether Quartz Ore", category: "Ores", hex: "#7e4e44", addedIn: "1.0" },
  { id: "redstone_ore", name: "Redstone Ore", category: "Ores", hex: "#8a4040", addedIn: "1.0" },
  { id: "deepslate_redstone_ore", name: "Deepslate Redstone Ore", category: "Ores", hex: "#4f3f44", addedIn: "1.17" },
  { id: "redstone_block", name: "Redstone Block", category: "Ores", hex: "#a51209", addedIn: "1.0" },
  { id: "emerald_ore", name: "Emerald Ore", category: "Ores", hex: "#6e8a72", addedIn: "1.0" },
  { id: "deepslate_emerald_ore", name: "Deepslate Emerald Ore", category: "Ores", hex: "#4a5e54", addedIn: "1.17" },
  { id: "emerald_block", name: "Emerald Block", category: "Ores", hex: "#2ec466", addedIn: "1.0" },
  { id: "lapis_ore", name: "Lapis Ore", category: "Ores", hex: "#536d8c", addedIn: "1.0" },
  { id: "deepslate_lapis_ore", name: "Deepslate Lapis Ore", category: "Ores", hex: "#3d4754", addedIn: "1.17" },
  { id: "diamond_ore", name: "Diamond Ore", category: "Ores", hex: "#7c9a93", addedIn: "1.0" },
  { id: "deepslate_diamond_ore", name: "Deepslate Diamond Ore", category: "Ores", hex: "#4a5e60", addedIn: "1.17" },
  { id: "diamond_block", name: "Diamond Block", category: "Ores", hex: "#5cd9d3", addedIn: "1.0" },
  { id: "ancient_debris", name: "Ancient Debris", category: "Ores", hex: "#54322a", addedIn: "1.16" },
  { id: "netherite_block", name: "Netherite Block", category: "Ores", hex: "#3d3636", addedIn: "1.16" },
  { id: "slime_block", name: "Slime Block", category: "Redstone", hex: "#7bbf3a", addedIn: "1.8" },
  { id: "honey_block", name: "Honey Block", category: "Redstone", hex: "#fcc450", addedIn: "1.15" },
  { id: "observer", name: "Observer", category: "Redstone", hex: "#5e5e5e", addedIn: "1.11" },
  { id: "dispenser", name: "Dispenser", category: "Redstone", hex: "#6f6f6f", addedIn: "1.0" },
  { id: "dropper", name: "Dropper", category: "Redstone", hex: "#6f6f6f", addedIn: "1.0" },
  { id: "hopper", name: "Hopper", category: "Redstone", hex: "#3a3a3a", addedIn: "1.0" },
  { id: "crafter", name: "Crafter", category: "Redstone", hex: "#6f6053", addedIn: "1.21" },
  { id: "chest", name: "Chest", category: "Redstone", hex: "#a0824e", addedIn: "1.0" },
  { id: "trapped_chest", name: "Trapped Chest", category: "Redstone", hex: "#a0824e", addedIn: "1.0" },
  { id: "copper_chest", name: "Copper Chest", category: "Redstone", hex: "#c66e52", addedIn: "1.21" },
  { id: "barrel", name: "Barrel", category: "Redstone", hex: "#735131", addedIn: "1.14" },
  { id: "note_block", name: "Note Block", category: "Redstone", hex: "#7a4f2c", addedIn: "1.0" },
  { id: "daylight_detector", name: "Daylight Detector", category: "Redstone", hex: "#9c805a", addedIn: "1.0" },
  { id: "tnt", name: "TNT", category: "Redstone", hex: "#a52a1f", addedIn: "1.0" },
  { id: "redstone_lamp", name: "Redstone Lamp", category: "Redstone", hex: "#876a3f", addedIn: "1.0" },
  { id: "sculk", name: "Sculk", category: "Deep Dark", hex: "#0c1f25", addedIn: "1.19" },
  { id: "sculk_catalyst", name: "Sculk Catalyst", category: "Deep Dark", hex: "#0e242a", addedIn: "1.19" },
  { id: "copper_block", name: "Copper Block", category: "Copper", hex: "#c66e52", addedIn: "1.17" },
  { id: "cut_copper_block", name: "Cut Copper Block", category: "Copper", hex: "#c66e52", addedIn: "1.21" },
  { id: "chiseled_copper", name: "Chiseled Copper", category: "Copper", hex: "#c66e52", addedIn: "1.21" },
  { id: "copper_grate", name: "Copper Grate", category: "Copper", hex: "#a85a40", addedIn: "1.21" },
  { id: "copper_bulb", name: "Copper Bulb", category: "Copper", hex: "#d68360", addedIn: "1.21" },
  { id: "prismarine", name: "Prismarine", category: "Ocean", hex: "#5fa295", addedIn: "1.8" },
  { id: "prismarine_bricks", name: "Prismarine Bricks", category: "Ocean", hex: "#5fa295", addedIn: "1.8" },
  { id: "dark_prismarine", name: "Dark Prismarine", category: "Ocean", hex: "#33574c", addedIn: "1.8" },
  { id: "spongeall_varients", name: "Sponge(All varients)", category: "Ocean", hex: "#cdc757", addedIn: "1.0" },
  { id: "sea_lanterns", name: "Sea Lanterns", category: "Ocean", hex: "#b3c9c4", addedIn: "1.8" },
  { id: "ochre_froglight", name: "Ochre Froglight", category: "Frog", hex: "#fbf6c1", addedIn: "1.19" },
  { id: "pearlecent_froglight", name: "Pearlecent Froglight", category: "Frog", hex: "#fbe1ee", addedIn: "1.19" },
  { id: "verdant_froglight", name: "Verdant Froglight", category: "Frog", hex: "#dafabf", addedIn: "1.19" },
  { id: "resin_block", name: "Resin Block", category: "Resin", hex: "#e08a2f", addedIn: "1.21" },
  { id: "resin_bricks", name: "Resin Bricks", category: "Resin", hex: "#c97525", addedIn: "1.21" },
  { id: "chiseled_resin_bricks", name: "Chiseled Resin Bricks", category: "Resin", hex: "#c97525", addedIn: "1.21" },
  { id: "creaking_heart", name: "Creaking Heart", category: "Resin", hex: "#774a36", addedIn: "1.21" },
  { id: "terracota", name: "Terracota", category: "Terracota", hex: "#9c6650", addedIn: "1.0" },
  { id: "white_terracota", name: "White Terracota", category: "Terracota", hex: "#bfa69d", addedIn: "1.0" },
  { id: "light_gray_terracota", name: "Light Gray Terracota", category: "Terracota", hex: "#91796c", addedIn: "1.0" },
  { id: "gray_terracota", name: "Gray Terracota", category: "Terracota", hex: "#674f45", addedIn: "1.0" },
  { id: "black_terracota", name: "Black Terracota", category: "Terracota", hex: "#533b31", addedIn: "1.0" },
  { id: "brown_terracota", name: "Brown Terracota", category: "Terracota", hex: "#825033", addedIn: "1.0" },
  { id: "red_terracota", name: "Red Terracota", category: "Terracota", hex: "#9c4533", addedIn: "1.0" },
  { id: "orange_terracota", name: "Orange Terracota", category: "Terracota", hex: "#bd682e", addedIn: "1.0" },
  { id: "yellow_terracota", name: "Yellow Terracota", category: "Terracota", hex: "#c49936", addedIn: "1.0" },
  { id: "lime_terracota", name: "Lime Terracota", category: "Terracota", hex: "#869332", addedIn: "1.0" },
  { id: "green_terracota", name: "Green Terracota", category: "Terracota", hex: "#736832", addedIn: "1.0" },
  { id: "cyan_terracota", name: "Cyan Terracota", category: "Terracota", hex: "#51706e", addedIn: "1.0" },
  { id: "light_blue_terracota", name: "Light Blue Terracota", category: "Terracota", hex: "#668f9b", addedIn: "1.0" },
  { id: "blue_terracota", name: "Blue Terracota", category: "Terracota", hex: "#5d4a74", addedIn: "1.0" },
  { id: "purple_terracota", name: "Purple Terracota", category: "Terracota", hex: "#894779", addedIn: "1.0" },
  { id: "magenta_terracota", name: "Magenta Terracota", category: "Terracota", hex: "#a34a81", addedIn: "1.0" },
  { id: "pink_terracota", name: "Pink Terracota", category: "Terracota", hex: "#c5737c", addedIn: "1.0" },
  { id: "white_glazed_terracota", name: "White Glazed Terracota", category: "Glazed Terracota", hex: "#bfa69d", addedIn: "1.12" },
  { id: "light_gray_glazed_terracota", name: "Light Gray Glazed Terracota", category: "Glazed Terracota", hex: "#91796c", addedIn: "1.12" },
  { id: "gray_glazed_terracota", name: "Gray Glazed Terracota", category: "Glazed Terracota", hex: "#674f45", addedIn: "1.12" },
  { id: "black_glazed_terracota", name: "Black Glazed Terracota", category: "Glazed Terracota", hex: "#533b31", addedIn: "1.12" },
  { id: "brown_glazed_terracota", name: "Brown Glazed Terracota", category: "Glazed Terracota", hex: "#825033", addedIn: "1.12" },
  { id: "red_glazed_terracota", name: "Red Glazed Terracota", category: "Glazed Terracota", hex: "#9c4533", addedIn: "1.12" },
  { id: "orange_glazed_terracota", name: "Orange Glazed Terracota", category: "Glazed Terracota", hex: "#bd682e", addedIn: "1.12" },
  { id: "yellow_glazed_terracota", name: "Yellow Glazed Terracota", category: "Glazed Terracota", hex: "#c49936", addedIn: "1.12" },
  { id: "lime_glazed_terracota", name: "Lime Glazed Terracota", category: "Glazed Terracota", hex: "#869332", addedIn: "1.12" },
  { id: "green_glazed_terracota", name: "Green Glazed Terracota", category: "Glazed Terracota", hex: "#736832", addedIn: "1.12" },
  { id: "cyan_glazed_terracota", name: "Cyan Glazed Terracota", category: "Glazed Terracota", hex: "#51706e", addedIn: "1.12" },
  { id: "light_blue_glazed_terracota", name: "Light Blue Glazed Terracota", category: "Glazed Terracota", hex: "#668f9b", addedIn: "1.12" },
  { id: "blue_glazed_terracota", name: "Blue Glazed Terracota", category: "Glazed Terracota", hex: "#5d4a74", addedIn: "1.12" },
  { id: "purple_glazed_terracota", name: "Purple Glazed Terracota", category: "Glazed Terracota", hex: "#894779", addedIn: "1.12" },
  { id: "magenta_glazed_terracota", name: "Magenta Glazed Terracota", category: "Glazed Terracota", hex: "#a34a81", addedIn: "1.12" },
  { id: "pink_glazed_terracota", name: "Pink Glazed Terracota", category: "Glazed Terracota", hex: "#c5737c", addedIn: "1.12" },
  { id: "white_concrete", name: "White Concrete", category: "Concrete", hex: "#dcdcdc", addedIn: "1.12" },
  { id: "light_gray_concrete", name: "Light Gray Concrete", category: "Concrete", hex: "#888a83", addedIn: "1.12" },
  { id: "gray_concrete", name: "Gray Concrete", category: "Concrete", hex: "#3d3d3d", addedIn: "1.12" },
  { id: "black_concrete", name: "Black Concrete", category: "Concrete", hex: "#181818", addedIn: "1.12" },
  { id: "brown_concrete", name: "Brown Concrete", category: "Concrete", hex: "#6e3f1c", addedIn: "1.12" },
  { id: "red_concrete", name: "Red Concrete", category: "Concrete", hex: "#9d2b1d", addedIn: "1.12" },
  { id: "orange_concrete", name: "Orange Concrete", category: "Concrete", hex: "#d96a13", addedIn: "1.12" },
  { id: "yellow_concrete", name: "Yellow Concrete", category: "Concrete", hex: "#e5c421", addedIn: "1.12" },
  { id: "lime_concrete", name: "Lime Concrete", category: "Concrete", hex: "#75b81a", addedIn: "1.12" },
  { id: "green_concrete", name: "Green Concrete", category: "Concrete", hex: "#536b1a", addedIn: "1.12" },
  { id: "cyan_concrete", name: "Cyan Concrete", category: "Concrete", hex: "#157988", addedIn: "1.12" },
  { id: "light_blue_concrete", name: "Light Blue Concrete", category: "Concrete", hex: "#3ab2da", addedIn: "1.12" },
  { id: "blue_concrete", name: "Blue Concrete", category: "Concrete", hex: "#2a3493", addedIn: "1.12" },
  { id: "purple_concrete", name: "Purple Concrete", category: "Concrete", hex: "#7a2f9b", addedIn: "1.12" },
  { id: "magenta_concrete", name: "Magenta Concrete", category: "Concrete", hex: "#a934aa", addedIn: "1.12" },
  { id: "pink_concrete", name: "Pink Concrete", category: "Concrete", hex: "#e87fa1", addedIn: "1.12" },
  { id: "white_concrete_powder", name: "White Concrete Powder", category: "Concrete Powder", hex: "#e1e1e1", addedIn: "1.12" },
  { id: "light_gray_concrete_powder", name: "Light Gray Concrete Powder", category: "Concrete Powder", hex: "#999b95", addedIn: "1.12" },
  { id: "gray_concrete_powder", name: "Gray Concrete Powder", category: "Concrete Powder", hex: "#5a5a5a", addedIn: "1.12" },
  { id: "black_concrete_powder", name: "Black Concrete Powder", category: "Concrete Powder", hex: "#3a3a3a", addedIn: "1.12" },
  { id: "brown_concrete_powder", name: "Brown Concrete Powder", category: "Concrete Powder", hex: "#835b3e", addedIn: "1.12" },
  { id: "red_concrete_powder", name: "Red Concrete Powder", category: "Concrete Powder", hex: "#ab4a3e", addedIn: "1.12" },
  { id: "orange_concrete_powder", name: "Orange Concrete Powder", category: "Concrete Powder", hex: "#de8036", addedIn: "1.12" },
  { id: "yellow_concrete_powder", name: "Yellow Concrete Powder", category: "Concrete Powder", hex: "#e8cc42", addedIn: "1.12" },
  { id: "lime_concrete_powder", name: "Lime Concrete Powder", category: "Concrete Powder", hex: "#89c23c", addedIn: "1.12" },
  { id: "green_concrete_powder", name: "Green Concrete Powder", category: "Concrete Powder", hex: "#6c813c", addedIn: "1.12" },
  { id: "cyan_concrete_powder", name: "Cyan Concrete Powder", category: "Concrete Powder", hex: "#388d99", addedIn: "1.12" },
  { id: "light_blue_concrete_powder", name: "Light Blue Concrete Powder", category: "Concrete Powder", hex: "#57bddf", addedIn: "1.12" },
  { id: "blue_concrete_powder", name: "Blue Concrete Powder", category: "Concrete Powder", hex: "#4952a3", addedIn: "1.12" },
  { id: "purple_concrete_powder", name: "Purple Concrete Powder", category: "Concrete Powder", hex: "#8d4eaa", addedIn: "1.12" },
  { id: "magenta_concrete_powder", name: "Magenta Concrete Powder", category: "Concrete Powder", hex: "#b552b6", addedIn: "1.12" },
  { id: "pink_concrete_powder", name: "Pink Concrete Powder", category: "Concrete Powder", hex: "#eb92af", addedIn: "1.12" },
  { id: "white_wool", name: "White Wool", category: "Wool", hex: "#dcdcdc", addedIn: "1.0" },
  { id: "light_gray_wool", name: "Light Gray Wool", category: "Wool", hex: "#888a83", addedIn: "1.0" },
  { id: "gray_wool", name: "Gray Wool", category: "Wool", hex: "#3d3d3d", addedIn: "1.0" },
  { id: "black_wool", name: "Black Wool", category: "Wool", hex: "#181818", addedIn: "1.0" },
  { id: "brown_wool", name: "Brown Wool", category: "Wool", hex: "#6e3f1c", addedIn: "1.0" },
  { id: "red_wool", name: "Red Wool", category: "Wool", hex: "#9d2b1d", addedIn: "1.0" },
  { id: "orange_wool", name: "Orange Wool", category: "Wool", hex: "#d96a13", addedIn: "1.0" },
  { id: "yellow_wool", name: "Yellow Wool", category: "Wool", hex: "#e5c421", addedIn: "1.0" },
  { id: "lime_wool", name: "Lime Wool", category: "Wool", hex: "#75b81a", addedIn: "1.0" },
  { id: "green_wool", name: "Green Wool", category: "Wool", hex: "#536b1a", addedIn: "1.0" },
  { id: "cyan_wool", name: "Cyan Wool", category: "Wool", hex: "#157988", addedIn: "1.0" },
  { id: "light_blue_wool", name: "Light Blue Wool", category: "Wool", hex: "#3ab2da", addedIn: "1.0" },
  { id: "blue_wool", name: "Blue Wool", category: "Wool", hex: "#2a3493", addedIn: "1.0" },
  { id: "purple_wool", name: "Purple Wool", category: "Wool", hex: "#7a2f9b", addedIn: "1.0" },
  { id: "magenta_wool", name: "Magenta Wool", category: "Wool", hex: "#a934aa", addedIn: "1.0" },
  { id: "pink_wool", name: "Pink Wool", category: "Wool", hex: "#e87fa1", addedIn: "1.0" },
  { id: "tinted_glass", name: "Tinted Glass", category: "Glass", hex: "#252127", addedIn: "1.17" },
  { id: "glass", name: "Glass", category: "Glass", hex: "#dff3ff", addedIn: "1.0" },
  { id: "white_stained_glass", name: "White Stained Glass", category: "Glass", hex: "#f0f0f0", addedIn: "1.0" },
  { id: "light_gray_stained_glass", name: "Light Gray Stained Glass", category: "Glass", hex: "#a0a0a0", addedIn: "1.0" },
  { id: "gray_stained_glass", name: "Gray Stained Glass", category: "Glass", hex: "#5a5a5a", addedIn: "1.0" },
  { id: "black_stained_glass", name: "Black Stained Glass", category: "Glass", hex: "#1a1a1a", addedIn: "1.0" },
  { id: "brown_stained_glass", name: "Brown Stained Glass", category: "Glass", hex: "#7a4a26", addedIn: "1.0" },
  { id: "red_stained_glass", name: "Red Stained Glass", category: "Glass", hex: "#a82e22", addedIn: "1.0" },
  { id: "orange_stained_glass", name: "Orange Stained Glass", category: "Glass", hex: "#d8731a", addedIn: "1.0" },
  { id: "lime_stained_glass", name: "Lime Stained Glass", category: "Glass", hex: "#75b81a", addedIn: "1.0" },
  { id: "green_stained_glass", name: "Green Stained Glass", category: "Glass", hex: "#536b1a", addedIn: "1.0" },
  { id: "cyan_stained_glass", name: "Cyan Stained Glass", category: "Glass", hex: "#1a8a91", addedIn: "1.0" },
  { id: "light_blue_stained_glass", name: "Light Blue Stained Glass", category: "Glass", hex: "#3ab2da", addedIn: "1.0" },
  { id: "blue_stained_glass", name: "Blue Stained Glass", category: "Glass", hex: "#3a40a2", addedIn: "1.0" },
  { id: "purple_stained_glass", name: "Purple Stained Glass", category: "Glass", hex: "#7a2f9b", addedIn: "1.0" },
  { id: "magenta_stained_glass", name: "Magenta Stained Glass", category: "Glass", hex: "#aa44a4", addedIn: "1.0" },
  { id: "pink_stained_glass", name: "Pink Stained Glass", category: "Glass", hex: "#e89aab", addedIn: "1.0" },
  { id: "netherrack", name: "Netherrack", category: "Nether", hex: "#6f2a26", addedIn: "1.0" },
  { id: "crimson_nylium", name: "Crimson Nylium", category: "Nether", hex: "#7a1d24", addedIn: "1.16" },
  { id: "warped_nylium", name: "Warped Nylium", category: "Nether", hex: "#287973", addedIn: "1.16" },
  { id: "soul_sand", name: "Soul Sand", category: "Nether", hex: "#503a30", addedIn: "1.0" },
  { id: "soul_soil", name: "Soul Soil", category: "Nether", hex: "#4b3528", addedIn: "1.16" },
  { id: "magma_block", name: "Magma Block", category: "Nether", hex: "#9c2d12", addedIn: "1.10" },
  { id: "glowstone", name: "Glowstone", category: "Nether", hex: "#feca5a", addedIn: "1.0" },
  { id: "shroomlight", name: "Shroomlight", category: "Nether", hex: "#fcb854", addedIn: "1.16" },
  { id: "basalt", name: "Basalt", category: "Nether", hex: "#4d4853", addedIn: "1.16" },
  { id: "polished_basalt", name: "Polished Basalt", category: "Nether", hex: "#5b5660", addedIn: "1.16" },
  { id: "smooth_basalt", name: "Smooth Basalt", category: "Nether", hex: "#3d3a40", addedIn: "1.17" },
  { id: "blackstone", name: "Blackstone", category: "Nether", hex: "#2c252a", addedIn: "1.16" },
  { id: "gilded_blackstone", name: "Gilded Blackstone", category: "Nether", hex: "#3a3132", addedIn: "1.16" },
  { id: "chisled_blackstone", name: "Chisled Blackstone", category: "Nether", hex: "#2c252a", addedIn: "1.16" },
  { id: "polished_blackstone", name: "Polished Blackstone", category: "Nether", hex: "#332e35", addedIn: "1.16" },
  { id: "blackstone_bricks", name: "Blackstone Bricks", category: "Nether", hex: "#332e35", addedIn: "1.16" },
  { id: "cracked_blackstone_bricks", name: "Cracked Blackstone Bricks", category: "Nether", hex: "#332e35", addedIn: "1.16" },
  { id: "nether_bricks", name: "Nether Bricks", category: "Nether", hex: "#33191c", addedIn: "1.0" },
  { id: "cracked_nether_bricks", name: "Cracked Nether Bricks", category: "Nether", hex: "#33191c", addedIn: "1.16" },
  { id: "chisled_nether_bricks", name: "Chisled Nether Bricks", category: "Nether", hex: "#33191c", addedIn: "1.16" },
  { id: "red_nether_bricks", name: "Red Nether Bricks", category: "Nether", hex: "#491012", addedIn: "1.0" },
  { id: "obsidian", name: "Obsidian", category: "Nether", hex: "#0f0a18", addedIn: "1.0" },
  { id: "crying_obsidian", name: "Crying Obsidian", category: "Nether", hex: "#22154e", addedIn: "1.16" },
  { id: "quartz_block", name: "Quartz Block", category: "Quartz", hex: "#ebe4d8", addedIn: "1.0" },
  { id: "chisiled_quartz", name: "Chisiled Quartz", category: "Quartz", hex: "#ebe4d8", addedIn: "1.0" },
  { id: "quartz_pillar", name: "Quartz Pillar", category: "Quartz", hex: "#ebe4d8", addedIn: "1.0" },
  { id: "quartz_bricks", name: "Quartz Bricks", category: "Quartz", hex: "#ebe4d8", addedIn: "1.16" },
  { id: "smooth_quartz", name: "Smooth Quartz", category: "Quartz", hex: "#efe9dd", addedIn: "1.0" },
  { id: "endstone", name: "Endstone", category: "End", hex: "#dbdaa0", addedIn: "1.0" },
  { id: "endstone_bricks", name: "Endstone Bricks", category: "End", hex: "#dbdaa0", addedIn: "1.9" },
  { id: "purpur_bricks", name: "Purpur Bricks", category: "End", hex: "#a479a4", addedIn: "1.9" },
  { id: "chisiled_purpur", name: "Chisiled Purpur", category: "End", hex: "#a479a4", addedIn: "1.9" },
  { id: "moss_block", name: "Moss Block", category: "Plants", hex: "#5b6e2c", addedIn: "1.17" },
  { id: "pale_moss_block", name: "Pale Moss Block", category: "Plants", hex: "#a7a89a", addedIn: "1.21" },
  { id: "azalea", name: "Azalea", category: "Plants", hex: "#5b8a3a", addedIn: "1.17" },
  { id: "flowering_azalea", name: "Flowering Azalea", category: "Plants", hex: "#a06fa6", addedIn: "1.17" },
  { id: "azalea_leaves", name: "Azalea Leaves", category: "Plants", hex: "#4f7c40", addedIn: "1.17" },
  { id: "flowering_azalea_leaves", name: "Flowering Azalea Leaves", category: "Plants", hex: "#7d8e58", addedIn: "1.17" },
  { id: "tube_coral_block", name: "Tube Coral Block", category: "Ocean Plant Life", hex: "#3157d6", addedIn: "1.13" },
  { id: "brain_coral_block", name: "Brain Coral Block", category: "Ocean Plant Life", hex: "#cc55a3", addedIn: "1.13" },
  { id: "bubble_coral_block", name: "Bubble Coral Block", category: "Ocean Plant Life", hex: "#a92ec1", addedIn: "1.13" },
  { id: "fire_coral_block", name: "Fire Coral Block", category: "Ocean Plant Life", hex: "#a52d2e", addedIn: "1.13" },
  { id: "horn_coral_block", name: "Horn Coral Block", category: "Ocean Plant Life", hex: "#d6c149", addedIn: "1.13" },
  { id: "dried_kelp_block", name: "Dried Kelp Block", category: "Ocean Plant Life", hex: "#3a4424", addedIn: "1.13" },
  { id: "pumpkin", name: "Pumpkin", category: "Farming", hex: "#c97419", addedIn: "1.0" },
  { id: "carved_pumpkin", name: "Carved Pumpkin", category: "Farming", hex: "#c97419", addedIn: "1.0" },
  { id: "jack_o_lantern", name: "Jack o' Lantern", category: "Farming", hex: "#e69722", addedIn: "1.0" },
  { id: "melon", name: "Melon", category: "Farming", hex: "#b1a233", addedIn: "1.0" },
  { id: "hay_bale", name: "Hay Bale", category: "Farming", hex: "#bb9c2e", addedIn: "1.0" },
  { id: "brown_mushroom_block", name: "Brown Mushroom Block", category: "Farming", hex: "#a17654", addedIn: "1.0" },
  { id: "red_mushroom_block", name: "Red Mushroom Block", category: "Farming", hex: "#c52f2a", addedIn: "1.0" },
  { id: "mushroom_stem", name: "Mushroom Stem", category: "Farming", hex: "#cdc6b4", addedIn: "1.0" },
  { id: "honey_comb_block", name: "Honey Comb Block", category: "Farming", hex: "#e69722", addedIn: "1.15" },
  { id: "bone_block", name: "Bone Block", category: "Foods and Mob Drops", hex: "#d6d2b3", addedIn: "1.10" },
  { id: "beacon", name: "Beacon", category: "Interractables", hex: "#79e7df", addedIn: "1.0" },
  
  { id: "crafting_table", name: "Crafting Table", category: "Interractables", hex: "#9e7141", addedIn: "1.0" },
  { id: "furnace", name: "Furnace", category: "Interractables", hex: "#7e7e7e", addedIn: "1.0" },
  { id: "blast_furnace", name: "Blast Furnace", category: "Interractables", hex: "#5e5e5e", addedIn: "1.14" },
  { id: "smoker", name: "Smoker", category: "Interractables", hex: "#3e3531", addedIn: "1.14" },
  { id: "bookshelf", name: "Bookshelf", category: "Utilities", hex: "#a07d4d", addedIn: "1.0" },
  { id: "chisled_bookshelf", name: "Chisled Bookshelf", category: "Utilities", hex: "#a07d4d", addedIn: "1.20" },
  { id: "lectern", name: "Lectern", category: "Interractables", hex: "#7e5a36", addedIn: "1.14" },
  { id: "cartography_table", name: "Cartography Table", category: "Interractables", hex: "#765239", addedIn: "1.14" },
  { id: "fletching_table", name: "Fletching Table", category: "Interractables", hex: "#d4ca8b", addedIn: "1.14" },
  { id: "smithing_table", name: "Smithing Table", category: "Interractables", hex: "#383a3a", addedIn: "1.14" },
  { id: "loom", name: "Loom", category: "Interractables", hex: "#9b7a4d", addedIn: "1.14" },
  { id: "composter", name: "Composter", category: "Interractables", hex: "#7a4f2c", addedIn: "1.14" },
  { id: "juke_box", name: "Juke Box", category: "Interractables", hex: "#7e5837", addedIn: "1.0" },
  { id: "lodestone", name: "Lodestone", category: "Interractables", hex: "#9aa19f", addedIn: "1.16" },
  { id: "respawn_anchor", name: "Respawn Anchor", category: "Interractables", hex: "#3a2456", addedIn: "1.16" },
  { id: "shulker_box", name: "Shulker Box", category: "Interractables", hex: "#956d96", addedIn: "1.11" },
  { id: "target", name: "Target", category: "Redstone", hex: "#cdcdcd", addedIn: "1.16" },
  { id: "piston", name: "Piston", category: "Redstone", hex: "#9c8662", addedIn: "1.0" },
  { id: "sticky_piston", name: "Sticky Piston", category: "Redstone", hex: "#7a8b3c", addedIn: "1.0" },
];

// Override hex/texture from the bundled texture pack so swatches match in-game.
for (const b of BLOCKS) {
  const t = BLOCK_TEXTURES[b.id];
  if (t) b.hex = t.hex;
}

// Biome tints — Minecraft tints these textures at runtime (grayscale source).
// Apply a representative tint so swatches and color matching look correct.
const BLOCK_TINTS: Record<string, string> = {
  grass_block: "#79c05a",
  oak_leaves: "#48b518",
  birch_leaves: "#80a755",
  spruce_leaves: "#619961",
  jungle_leaves: "#48b518",
  acacia_leaves: "#48b518",
  dark_oak_leaves: "#48b518",
  mangrove_leaves: "#48b518",
  azalea_leaves: "#48b518",
  flowering_azalea_leaves: "#48b518",
  vine: "#48b518",
};

// Apply tints: combine grayscale luminance with tint color so the stored hex
// (used for nearest-color matching) matches the in-game appearance.
for (const b of BLOCKS) {
  const tint = BLOCK_TINTS[b.id];
  if (!tint) continue;
  const [tr, tg, tb] = hexToRgb(tint);
  const [r, g, bl] = hexToRgb(b.hex);
  // luminance of grayscale base
  const l = (0.2126 * r + 0.7152 * g + 0.0722 * bl) / 255;
  const mr = Math.round(tr * l);
  const mg = Math.round(tg * l);
  const mb = Math.round(tb * l);
  b.hex = "#" + [mr, mg, mb].map((v) => v.toString(16).padStart(2, "0")).join("");
}

export function blockTint(id: string): string | undefined {
  return BLOCK_TINTS[id];
}

export function blockTexture(id: string): string | undefined {
  return BLOCK_TEXTURES[id]?.texture;
}

/** CSS style props for rendering a block swatch with proper biome tint. */
export function blockSwatchStyle(id: string, hex: string): CSSProperties {
  const tex = blockTexture(id);
  const tint = blockTint(id);
  const base: CSSProperties = {
    backgroundColor: tint ?? hex,
    backgroundImage: tex ? `url(${tex})` : undefined,
    backgroundSize: "100% 100%",
    imageRendering: "pixelated",
  };
  if (tint && tex) base.backgroundBlendMode = "multiply";
  return base;
}

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

export function nearestBlock(
  r: number,
  g: number,
  b: number,
  palette: { block: BlockDef; rgb: [number, number, number] }[],
): BlockDef | null {
  if (!palette.length) return null;
  let best = palette[0];
  let bestD = Infinity;
  for (const p of palette) {
    const dr = p.rgb[0] - r;
    const dg = p.rgb[1] - g;
    const db = p.rgb[2] - b;
    const d = dr * dr + dg * dg + db * db;
    if (d < bestD) {
      bestD = d;
      best = p;
    }
  }
  return best.block;
}
