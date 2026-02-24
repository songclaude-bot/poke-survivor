import type { EvolutionStage, Achievement, GameStats, CompanionPoolEntry } from "./GameTypes";

// === Evolution Chains ===
export const EVOLUTION_CHAINS: Record<string, EvolutionStage[]> = {
  pikachu: [
    { name: "Pikachu", spriteKey: "pikachu", atkMult: 1, hpMult: 1, speedMult: 1, scale: 1.5 },
    { name: "Raichu ★", spriteKey: "raichu", atkMult: 1.5, hpMult: 1.3, speedMult: 1.15, scale: 1.5 },
    { name: "Raichu GX ★★", spriteKey: "raichu", atkMult: 2.2, hpMult: 1.8, speedMult: 1.3, scale: 1.7 },
  ],
  charmander: [
    { name: "Charmander", spriteKey: "charmander", atkMult: 1, hpMult: 1, speedMult: 1, scale: 1.2 },
    { name: "Charmeleon ★", spriteKey: "charmeleon", atkMult: 1.5, hpMult: 1.3, speedMult: 1.15, scale: 1.3 },
    { name: "Charizard ★★", spriteKey: "charizard", atkMult: 2.2, hpMult: 1.7, speedMult: 1.3, scale: 1.5 },
  ],
  squirtle: [
    { name: "Squirtle", spriteKey: "squirtle", atkMult: 1, hpMult: 1, speedMult: 1, scale: 1.2 },
    { name: "Wartortle ★", spriteKey: "wartortle", atkMult: 1.4, hpMult: 1.4, speedMult: 1.1, scale: 1.3 },
    { name: "Blastoise ★★", spriteKey: "blastoise", atkMult: 2.0, hpMult: 2.0, speedMult: 1.2, scale: 1.5 },
  ],
  bulbasaur: [
    { name: "Bulbasaur", spriteKey: "bulbasaur", atkMult: 1, hpMult: 1, speedMult: 1, scale: 1.2 },
    { name: "Ivysaur ★", spriteKey: "ivysaur", atkMult: 1.4, hpMult: 1.5, speedMult: 1.1, scale: 1.3 },
    { name: "Venusaur ★★", spriteKey: "venusaur", atkMult: 1.9, hpMult: 2.2, speedMult: 1.2, scale: 1.5 },
  ],
  gastly: [
    { name: "Gastly", spriteKey: "gastly", atkMult: 1, hpMult: 1, speedMult: 1, scale: 1.2 },
    { name: "Haunter ★", spriteKey: "haunter", atkMult: 1.7, hpMult: 1.2, speedMult: 1.2, scale: 1.3 },
    { name: "Gengar ★★", spriteKey: "gengar", atkMult: 2.5, hpMult: 1.5, speedMult: 1.4, scale: 1.5 },
  ],
  geodude: [
    { name: "Geodude", spriteKey: "geodude", atkMult: 1, hpMult: 1, speedMult: 1, scale: 1.2 },
    { name: "Graveler ★", spriteKey: "graveler", atkMult: 1.4, hpMult: 1.6, speedMult: 1.0, scale: 1.3 },
    { name: "Golem ★★", spriteKey: "golem", atkMult: 1.9, hpMult: 2.3, speedMult: 1.0, scale: 1.5 },
  ],
  eevee: [
    { name: "Eevee", spriteKey: "eevee", atkMult: 1, hpMult: 1, speedMult: 1, scale: 1.2 },
    { name: "Jolteon ★", spriteKey: "jolteon", atkMult: 1.6, hpMult: 1.1, speedMult: 1.4, scale: 1.3 },
    { name: "Flareon ★★", spriteKey: "flareon", atkMult: 2.3, hpMult: 1.4, speedMult: 1.2, scale: 1.4 },
  ],
  chikorita: [
    { name: "Chikorita", spriteKey: "chikorita", atkMult: 1, hpMult: 1, speedMult: 1, scale: 1.2 },
    { name: "Bayleef ★", spriteKey: "bayleef", atkMult: 1.3, hpMult: 1.5, speedMult: 1.1, scale: 1.3 },
    { name: "Meganium ★★", spriteKey: "meganium", atkMult: 1.7, hpMult: 2.3, speedMult: 1.2, scale: 1.5 },
  ],
  cyndaquil: [
    { name: "Cyndaquil", spriteKey: "cyndaquil", atkMult: 1, hpMult: 1, speedMult: 1, scale: 1.2 },
    { name: "Quilava ★", spriteKey: "quilava", atkMult: 1.6, hpMult: 1.2, speedMult: 1.2, scale: 1.3 },
    { name: "Typhlosion ★★", spriteKey: "typhlosion", atkMult: 2.4, hpMult: 1.6, speedMult: 1.3, scale: 1.5 },
  ],
  totodile: [
    { name: "Totodile", spriteKey: "totodile", atkMult: 1, hpMult: 1, speedMult: 1, scale: 1.2 },
    { name: "Croconaw ★", spriteKey: "croconaw", atkMult: 1.5, hpMult: 1.4, speedMult: 1.1, scale: 1.3 },
    { name: "Feraligatr ★★", spriteKey: "feraligatr", atkMult: 2.2, hpMult: 1.9, speedMult: 1.2, scale: 1.5 },
  ],
  treecko: [
    { name: "Treecko", spriteKey: "treecko", atkMult: 1, hpMult: 1, speedMult: 1, scale: 1.2 },
    { name: "Grovyle ★", spriteKey: "grovyle", atkMult: 1.5, hpMult: 1.2, speedMult: 1.3, scale: 1.3 },
    { name: "Sceptile ★★", spriteKey: "sceptile", atkMult: 2.2, hpMult: 1.5, speedMult: 1.5, scale: 1.5 },
  ],
  torchic: [
    { name: "Torchic", spriteKey: "torchic", atkMult: 1, hpMult: 1, speedMult: 1, scale: 1.2 },
    { name: "Combusken ★", spriteKey: "combusken", atkMult: 1.6, hpMult: 1.3, speedMult: 1.2, scale: 1.3 },
    { name: "Blaziken ★★", spriteKey: "blaziken", atkMult: 2.4, hpMult: 1.7, speedMult: 1.3, scale: 1.5 },
  ],
  mudkip: [
    { name: "Mudkip", spriteKey: "mudkip", atkMult: 1, hpMult: 1, speedMult: 1, scale: 1.2 },
    { name: "Marshtomp ★", spriteKey: "marshtomp", atkMult: 1.4, hpMult: 1.5, speedMult: 1.1, scale: 1.3 },
    { name: "Swampert ★★", spriteKey: "swampert", atkMult: 2.0, hpMult: 2.2, speedMult: 1.1, scale: 1.5 },
  ],
  riolu: [
    { name: "Riolu", spriteKey: "riolu", atkMult: 1, hpMult: 1, speedMult: 1, scale: 1.2 },
    { name: "Lucario ★", spriteKey: "lucario", atkMult: 1.8, hpMult: 1.4, speedMult: 1.3, scale: 1.4 },
  ],
  machop: [
    { name: "Machop", spriteKey: "machop", atkMult: 1, hpMult: 1, speedMult: 1, scale: 1.2 },
    { name: "Machoke ★", spriteKey: "machoke", atkMult: 1.6, hpMult: 1.5, speedMult: 1.1, scale: 1.4 },
    { name: "Machamp ★★", spriteKey: "machamp", atkMult: 2.5, hpMult: 2.0, speedMult: 1.2, scale: 1.6 },
  ],
};

// === Enemy Pools by Tier ===
export const ENEMY_POOL: string[][] = [
  // Tier 0
  ["rattata", "caterpie", "weedle", "pidgey", "paras", "oddish", "meowth", "sentret", "hoothoot",
   "ledyba", "spinarak", "wurmple", "zigzagoon", "poochyena", "starly", "bidoof", "lillipup",
   "pidove", "sewaddle", "venipede", "cottonee"],
  // Tier 1
  ["zubat", "sandshrew", "ekans", "psyduck", "growlithe", "cubone", "drowzee", "machop",
   "slowpoke", "magnemite", "koffing", "grimer", "poliwag", "bellsprout", "tentacool", "ponyta",
   "seel", "voltorb", "horsea", "goldeen", "wooper", "swinub", "hoppip", "slugma", "phanpy",
   "lotad", "seedot", "taillow", "shroomish", "makuhita", "electrike", "gulpin", "numel",
   "spoink", "shinx", "buizel", "shellos", "buneary", "stunky", "drilbur", "sandile", "dwebble",
   "joltik", "woobat"],
  // Tier 2
  ["raticate", "golbat", "parasect", "geodude", "gastly", "machoke", "kadabra", "gloom",
   "poliwhirl", "magneton", "graveler", "haunter", "seadra", "nidorina", "nidorino", "weepinbell",
   "marowak", "weezing", "rhyhorn", "arbok", "flaaffy", "croagunk", "piloswine", "ursaring",
   "houndour", "sneasel", "aron", "meditite", "trapinch", "sableye", "carvanha", "cacnea",
   "barboach", "shuppet", "duskull", "bagon", "deino", "darumaka", "scraggy", "roggenrola",
   "pawniard", "axew", "litwick", "ferroseed", "zorua", "gible"],
  // Tier 3
  ["pinsir", "scyther", "mankey", "vulpix", "clefairy", "dratini", "arcanine", "primeape",
   "ninetales", "golduck", "tentacruel", "rapidash", "hypno", "kingler", "electabuzz", "magmar",
   "tauros", "heracross", "scizor", "houndoom", "donphan", "breloom", "hariyama", "aggron",
   "manectric", "flygon", "absol", "zangoose", "seviper", "mawile", "altaria", "glalie",
   "luxray", "staraptor", "floatzel", "lopunny", "weavile", "excadrill", "zoroark", "darmanitan",
   "haxorus", "chandelure", "mienfoo"],
  // Tier 4
  ["snorlax", "onix", "lapras", "aerodactyl", "dragonite", "tyranitar", "salamence",
   "metagross", "garchomp", "hydreigon", "volcarona", "gyarados", "nidoking", "nidoqueen",
   "machamp", "alakazam", "gengar", "blastoise", "charizard", "venusaur", "rhydon",
   "druddigon", "milotic", "togekiss", "gallade", "mamoswine", "steelix"],
];

// === Behavior Sets ===
export const SWARM_POKEMON = new Set([
  "rattata", "caterpie", "weedle", "paras", "oddish", "meowth", "sentret", "ledyba",
  "spinarak", "wurmple", "zigzagoon", "poochyena", "starly", "bidoof", "lillipup",
  "pidove", "sewaddle", "venipede", "cottonee", "lotad", "seedot", "hoppip", "sunkern",
  "wooper", "gulpin", "spoink", "shellos", "dwebble", "roggenrola", "minccino",
  "pichu", "togepi", "skitty", "budew", "pachirisu", "plusle", "minun",
]);
export const CIRCLE_POKEMON = new Set([
  "zubat", "pidgey", "spearow", "magnemite", "koffing", "golbat", "crobat",
  "taillow", "swellow", "wingull", "noctowl", "fearow", "pidgeotto", "pidgeot",
  "staravia", "staraptor", "aerodactyl", "murkrow", "doduo", "dodrio",
  "emolga", "drifloon", "swablu", "altaria", "butterfree", "venomoth",
  "voltorb", "electrode", "lunatone", "solrock", "bronzor", "rotom", "ducklett",
]);
export const RANGED_POKEMON = new Set([
  "gastly", "psyduck", "drowzee", "grimer", "slowpoke", "abra", "kadabra", "alakazam",
  "exeggcute", "exeggutor", "starmie", "mrmime", "jynx", "haunter", "gengar",
  "misdreavus", "natu", "xatu", "girafarig", "espeon", "hypno",
  "ralts", "kirlia", "gardevoir", "sableye", "shuppet", "banette", "duskull", "dusclops",
  "glameow", "finneon", "chandelure", "litwick", "lampent", "gothita", "solosis",
  "magneton", "porygon", "staryu", "chinchou", "lanturn", "slugma", "magcargo",
  "barboach", "feebas", "spheal", "clamperl", "shellder", "cloyster", "tentacool",
]);
export const CHARGE_POKEMON = new Set([
  "geodude", "machop", "mankey", "pinsir", "charmander", "scyther", "onix", "snorlax",
  "machoke", "machamp", "primeape", "rhyhorn", "rhydon", "tauros", "hitmonlee",
  "hitmonchan", "hitmontop", "tyrogue", "kangaskhan", "heracross", "ursaring",
  "donphan", "makuhita", "hariyama", "aggron", "lairon", "aron", "breloom",
  "cranidos", "hippopotas", "garchomp", "gabite", "gible", "excadrill", "drilbur",
  "darmanitan", "darumaka", "haxorus", "axew", "fraxure", "timburr", "mienfoo",
  "druddigon", "mamoswine", "gallade", "lucario", "riolu", "croagunk",
]);

// === Pure functions ===
import type { EnemyBehavior } from "./GameTypes";

export function getBehavior(key: string): EnemyBehavior {
  if (SWARM_POKEMON.has(key)) return "swarm";
  if (CIRCLE_POKEMON.has(key)) return "circle";
  if (RANGED_POKEMON.has(key)) return "ranged";
  if (CHARGE_POKEMON.has(key)) return "charge";
  return "chase";
}

export function getTierFromElapsed(elapsed: number): number {
  if (elapsed < 45) return 0;
  if (elapsed < 90) return 1;
  if (elapsed < 150) return 2;
  if (elapsed < 220) return 3;
  return 4;
}

// === Boss Pool ===
export const BOSS_POOL = [
  "snorlax", "lapras", "aerodactyl", "gyarados", "dragonite",
  "articuno", "zapdos", "moltres", "mewtwo",
  "tyranitar", "raikou", "entei", "suicune", "lugia", "hooh",
  "salamence", "metagross", "groudon", "kyogre", "rayquaza",
  "garchomp", "togekiss", "mamoswine", "dialga", "palkia", "giratina", "darkrai",
  "hydreigon", "volcarona", "reshiram", "zekrom", "kyurem", "genesect",
];

// === Companion Pool ===
export const COMPANION_POOL: CompanionPoolEntry[] = [
  { key: "squirtle", type: "projectile" },
  { key: "gastly", type: "orbital" },
  { key: "geodude", type: "area" },
  { key: "charmander", type: "projectile" },
  { key: "bulbasaur", type: "area" },
];

// === Achievements ===
export const ACHIEVEMENTS: Achievement[] = [
  { id: "first_kill", name: "First Blood", desc: "Defeat your first enemy", check: s => s.kills >= 1 },
  { id: "kill_50", name: "Hunter", desc: "Defeat 50 enemies", check: s => s.kills >= 50 },
  { id: "kill_200", name: "Slayer", desc: "Defeat 200 enemies", check: s => s.kills >= 200 },
  { id: "kill_500", name: "Exterminator", desc: "Defeat 500 enemies", check: s => s.kills >= 500 },
  { id: "wave_5", name: "Survivor", desc: "Reach Wave 5", check: s => s.waveNumber >= 5 },
  { id: "wave_10", name: "Veteran", desc: "Reach Wave 10", check: s => s.waveNumber >= 10 },
  { id: "wave_20", name: "Elite", desc: "Reach Wave 20", check: s => s.waveNumber >= 20 },
  { id: "level_5", name: "Growing", desc: "Reach Level 5", check: s => s.level >= 5 },
  { id: "level_10", name: "Experienced", desc: "Reach Level 10", check: s => s.level >= 10 },
  { id: "evolve", name: "Evolution!", desc: "Evolve your ace Pokemon", check: s => s.aceEvoStage >= 1 },
  { id: "full_party", name: "Squad Goals", desc: "Have 5 companions", check: s => s.partySize >= 6 },
  { id: "cycle_2", name: "New Game+", desc: "Reach Cycle 2", check: s => s.cycleNumber >= 2 },
  { id: "streak_15", name: "Combo Master", desc: "Get a 15 kill streak", check: s => s.killStreak >= 15 },
];

// === Dungeon Names & Tiles ===
export const DUNGEON_NAMES = [
  "Tiny Woods", "Mt. Steel", "Crystal Cave",
  "Mystic Forest", "Frosty Forest", "Dark Crater",
];

export const CYCLE_TILES = [
  "dungeon-tiny", "dungeon-steel", "dungeon-crystal",
  "dungeon-forest", "dungeon-frost", "dungeon-floor",
];

export function getDungeonName(cycle: number): string {
  return DUNGEON_NAMES[Math.min(cycle - 1, DUNGEON_NAMES.length - 1)];
}

export function getDifficultyLabel(cycle: number): string {
  if (cycle >= 7) return "INFERNO";
  if (cycle >= 5) return "NIGHTMARE";
  if (cycle >= 3) return "HARD";
  if (cycle >= 2) return "NORMAL+";
  return "";
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
