import Phaser from "phaser";

/**
 * Pokemon Sprite Loader — Loads atlas sprites from Pokemon Auto Chess repository.
 *
 * Source: github.com/keldaanCommunity/pokemonAutoChess (GPL-3.0)
 * Atlas format: TexturePacker multiatlas (JSON + PNG)
 * Frame naming: "{Normal|Shiny}/{Action}/Anim/{Direction 0-7}/{FrameIndex}"
 * Directions: 0=Down, 1=DownRight, 2=Right, 3=UpRight, 4=Up, 5=UpLeft, 6=Left, 7=DownLeft
 */

const PAC_SPRITE_BASE =
  "https://raw.githubusercontent.com/keldaanCommunity/pokemonAutoChess/master/app/public/src/assets/pokemons";
const PAC_PORTRAIT_BASE =
  "https://raw.githubusercontent.com/keldaanCommunity/pokemonAutoChess/master/app/public/src/assets/portraits";

/** Direction row mapping — matches PAC atlas direction numbering */
export const PMD_DIRECTIONS = [
  "down",       // 0
  "down-right", // 1
  "right",      // 2
  "up-right",   // 3
  "up",         // 4
  "up-left",    // 5
  "left",       // 6
  "down-left",  // 7
] as const;

export type PmdDirection = (typeof PMD_DIRECTIONS)[number];

/** Pokemon ID → sprite config mapping */
export interface PmdSpriteConfig {
  /** National Dex ID (4-digit padded: "0025" for Pikachu) */
  id: string;
  /** Display name */
  name: string;
  /** Whether this pokemon has attack animation in the atlas */
  hasAttack?: boolean;
}

/**
 * All pokemon used in the game — 200+ species from Gen 1~5.
 * No frameWidth/frameHeight needed — the atlas handles it!
 */
export const POKEMON_SPRITES: Record<string, PmdSpriteConfig> = {
  // ================================================================
  // GEN 1 — Kanto (001~151)
  // ================================================================
  // Starters & Evolutions
  bulbasaur:   { id: "0001", name: "Bulbasaur",   hasAttack: true },
  ivysaur:     { id: "0002", name: "Ivysaur",     hasAttack: true },
  venusaur:    { id: "0003", name: "Venusaur",     hasAttack: true },
  charmander:  { id: "0004", name: "Charmander",  hasAttack: true },
  charmeleon:  { id: "0005", name: "Charmeleon",  hasAttack: true },
  charizard:   { id: "0006", name: "Charizard",   hasAttack: true },
  squirtle:    { id: "0007", name: "Squirtle",    hasAttack: true },
  wartortle:   { id: "0008", name: "Wartortle",   hasAttack: true },
  blastoise:   { id: "0009", name: "Blastoise",   hasAttack: true },

  // Bug line
  caterpie:    { id: "0010", name: "Caterpie" },
  metapod:     { id: "0011", name: "Metapod" },
  butterfree:  { id: "0012", name: "Butterfree" },
  weedle:      { id: "0013", name: "Weedle" },
  kakuna:      { id: "0014", name: "Kakuna" },
  beedrill:    { id: "0015", name: "Beedrill" },

  // Birds
  pidgey:      { id: "0016", name: "Pidgey" },
  pidgeotto:   { id: "0017", name: "Pidgeotto" },
  pidgeot:     { id: "0018", name: "Pidgeot" },

  // Common
  rattata:     { id: "0019", name: "Rattata" },
  raticate:    { id: "0020", name: "Raticate" },
  spearow:     { id: "0021", name: "Spearow" },
  fearow:      { id: "0022", name: "Fearow" },
  ekans:       { id: "0023", name: "Ekans" },
  arbok:       { id: "0024", name: "Arbok" },
  pikachu:     { id: "0025", name: "Pikachu",     hasAttack: true },
  raichu:      { id: "0026", name: "Raichu",      hasAttack: true },
  sandshrew:   { id: "0027", name: "Sandshrew" },
  sandslash:   { id: "0028", name: "Sandslash" },

  // Nido line
  nidoranf:    { id: "0029", name: "Nidoran♀" },
  nidorina:    { id: "0030", name: "Nidorina" },
  nidoqueen:   { id: "0031", name: "Nidoqueen" },
  nidoranm:    { id: "0032", name: "Nidoran♂" },
  nidorino:    { id: "0033", name: "Nidorino" },
  nidoking:    { id: "0034", name: "Nidoking" },

  // Fairy/Normal
  clefairy:    { id: "0035", name: "Clefairy" },
  clefable:    { id: "0036", name: "Clefable" },
  vulpix:      { id: "0037", name: "Vulpix" },
  ninetales:   { id: "0038", name: "Ninetales" },
  jigglypuff:  { id: "0039", name: "Jigglypuff" },
  wigglytuff:  { id: "0040", name: "Wigglytuff" },
  zubat:       { id: "0041", name: "Zubat" },
  golbat:      { id: "0042", name: "Golbat" },
  oddish:      { id: "0043", name: "Oddish" },
  gloom:       { id: "0044", name: "Gloom" },
  vileplume:   { id: "0045", name: "Vileplume" },
  paras:       { id: "0046", name: "Paras" },
  parasect:    { id: "0047", name: "Parasect" },
  venonat:     { id: "0048", name: "Venonat" },
  venomoth:    { id: "0049", name: "Venomoth" },
  diglett:     { id: "0050", name: "Diglett" },
  dugtrio:     { id: "0051", name: "Dugtrio" },
  meowth:      { id: "0052", name: "Meowth" },
  persian:     { id: "0053", name: "Persian" },
  psyduck:     { id: "0054", name: "Psyduck" },
  golduck:     { id: "0055", name: "Golduck" },
  mankey:      { id: "0056", name: "Mankey" },
  primeape:    { id: "0057", name: "Primeape" },
  growlithe:   { id: "0058", name: "Growlithe" },
  arcanine:    { id: "0059", name: "Arcanine" },
  poliwag:     { id: "0060", name: "Poliwag" },
  poliwhirl:   { id: "0061", name: "Poliwhirl" },
  poliwrath:   { id: "0062", name: "Poliwrath" },
  abra:        { id: "0063", name: "Abra" },
  kadabra:     { id: "0064", name: "Kadabra" },
  alakazam:    { id: "0065", name: "Alakazam" },
  machop:      { id: "0066", name: "Machop" },
  machoke:     { id: "0067", name: "Machoke" },
  machamp:     { id: "0068", name: "Machamp" },
  bellsprout:  { id: "0069", name: "Bellsprout" },
  weepinbell:  { id: "0070", name: "Weepinbell" },
  victreebel:  { id: "0071", name: "Victreebel" },
  tentacool:   { id: "0072", name: "Tentacool" },
  tentacruel:  { id: "0073", name: "Tentacruel" },
  geodude:     { id: "0074", name: "Geodude",     hasAttack: true },
  graveler:    { id: "0075", name: "Graveler",    hasAttack: true },
  golem:       { id: "0076", name: "Golem",       hasAttack: true },
  ponyta:      { id: "0077", name: "Ponyta" },
  rapidash:    { id: "0078", name: "Rapidash" },
  slowpoke:    { id: "0079", name: "Slowpoke" },
  slowbro:     { id: "0080", name: "Slowbro" },
  magnemite:   { id: "0081", name: "Magnemite" },
  magneton:    { id: "0082", name: "Magneton" },
  farfetchd:   { id: "0083", name: "Farfetch'd" },
  doduo:       { id: "0084", name: "Doduo" },
  dodrio:      { id: "0085", name: "Dodrio" },
  seel:        { id: "0086", name: "Seel" },
  dewgong:     { id: "0087", name: "Dewgong" },
  grimer:      { id: "0088", name: "Grimer" },
  muk:         { id: "0089", name: "Muk" },
  shellder:    { id: "0090", name: "Shellder" },
  cloyster:    { id: "0091", name: "Cloyster" },
  gastly:      { id: "0092", name: "Gastly",      hasAttack: true },
  haunter:     { id: "0093", name: "Haunter",     hasAttack: true },
  gengar:      { id: "0094", name: "Gengar",      hasAttack: true },
  onix:        { id: "0095", name: "Onix" },
  steelix:     { id: "0208", name: "Steelix" },
  drowzee:     { id: "0096", name: "Drowzee" },
  hypno:       { id: "0097", name: "Hypno" },
  krabby:      { id: "0098", name: "Krabby" },
  kingler:     { id: "0099", name: "Kingler" },
  voltorb:     { id: "0100", name: "Voltorb" },
  electrode:   { id: "0101", name: "Electrode" },
  exeggcute:   { id: "0102", name: "Exeggcute" },
  exeggutor:   { id: "0103", name: "Exeggutor" },
  cubone:      { id: "0104", name: "Cubone" },
  marowak:     { id: "0105", name: "Marowak" },
  hitmonlee:   { id: "0106", name: "Hitmonlee" },
  hitmonchan:  { id: "0107", name: "Hitmonchan" },
  lickitung:   { id: "0108", name: "Lickitung" },
  koffing:     { id: "0109", name: "Koffing" },
  weezing:     { id: "0110", name: "Weezing" },
  rhyhorn:     { id: "0111", name: "Rhyhorn" },
  rhydon:      { id: "0112", name: "Rhydon" },
  chansey:     { id: "0113", name: "Chansey" },
  tangela:     { id: "0114", name: "Tangela" },
  kangaskhan:  { id: "0115", name: "Kangaskhan" },
  horsea:      { id: "0116", name: "Horsea" },
  seadra:      { id: "0117", name: "Seadra" },
  goldeen:     { id: "0118", name: "Goldeen" },
  seaking:     { id: "0119", name: "Seaking" },
  staryu:      { id: "0120", name: "Staryu" },
  starmie:     { id: "0121", name: "Starmie" },
  mrmime:      { id: "0122", name: "Mr. Mime" },
  scyther:     { id: "0123", name: "Scyther" },
  jynx:        { id: "0124", name: "Jynx" },
  electabuzz:  { id: "0125", name: "Electabuzz" },
  magmar:      { id: "0126", name: "Magmar" },
  pinsir:      { id: "0127", name: "Pinsir" },
  tauros:      { id: "0128", name: "Tauros" },
  magikarp:    { id: "0129", name: "Magikarp" },
  gyarados:    { id: "0130", name: "Gyarados" },
  lapras:      { id: "0131", name: "Lapras" },
  ditto:       { id: "0132", name: "Ditto" },
  eevee:       { id: "0133", name: "Eevee",       hasAttack: true },
  vaporeon:    { id: "0134", name: "Vaporeon" },
  jolteon:     { id: "0135", name: "Jolteon" },
  flareon:     { id: "0136", name: "Flareon" },
  porygon:     { id: "0137", name: "Porygon" },
  omanyte:     { id: "0138", name: "Omanyte" },
  omastar:     { id: "0139", name: "Omastar" },
  kabuto:      { id: "0140", name: "Kabuto" },
  kabutops:    { id: "0141", name: "Kabutops" },
  aerodactyl:  { id: "0142", name: "Aerodactyl" },
  snorlax:     { id: "0143", name: "Snorlax" },
  // Legendary birds
  articuno:    { id: "0144", name: "Articuno" },
  zapdos:      { id: "0145", name: "Zapdos" },
  moltres:     { id: "0146", name: "Moltres" },
  dratini:     { id: "0147", name: "Dratini" },
  dragonair:   { id: "0148", name: "Dragonair" },
  dragonite:   { id: "0149", name: "Dragonite" },
  mewtwo:      { id: "0150", name: "Mewtwo" },
  mew:         { id: "0151", name: "Mew" },

  // ================================================================
  // GEN 2 — Johto (152~251)
  // ================================================================
  chikorita:   { id: "0152", name: "Chikorita",   hasAttack: true },
  bayleef:     { id: "0153", name: "Bayleef",     hasAttack: true },
  meganium:    { id: "0154", name: "Meganium",    hasAttack: true },
  cyndaquil:   { id: "0155", name: "Cyndaquil",   hasAttack: true },
  quilava:     { id: "0156", name: "Quilava",     hasAttack: true },
  typhlosion:  { id: "0157", name: "Typhlosion",  hasAttack: true },
  totodile:    { id: "0158", name: "Totodile",    hasAttack: true },
  croconaw:    { id: "0159", name: "Croconaw",    hasAttack: true },
  feraligatr:  { id: "0160", name: "Feraligatr",  hasAttack: true },
  sentret:     { id: "0161", name: "Sentret" },
  furret:      { id: "0162", name: "Furret" },
  hoothoot:    { id: "0163", name: "Hoothoot" },
  noctowl:     { id: "0164", name: "Noctowl" },
  ledyba:      { id: "0165", name: "Ledyba" },
  ledian:      { id: "0166", name: "Ledian" },
  spinarak:    { id: "0167", name: "Spinarak" },
  ariados:     { id: "0168", name: "Ariados" },
  crobat:      { id: "0169", name: "Crobat" },
  chinchou:    { id: "0170", name: "Chinchou" },
  lanturn:     { id: "0171", name: "Lanturn" },
  pichu:       { id: "0172", name: "Pichu" },
  togepi:      { id: "0175", name: "Togepi" },
  togetic:     { id: "0176", name: "Togetic" },
  natu:        { id: "0177", name: "Natu" },
  xatu:        { id: "0178", name: "Xatu" },
  mareep:      { id: "0179", name: "Mareep" },
  flaaffy:     { id: "0180", name: "Flaaffy" },
  ampharos:    { id: "0181", name: "Ampharos" },
  marill:      { id: "0183", name: "Marill" },
  azumarill:   { id: "0184", name: "Azumarill" },
  sudowoodo:   { id: "0185", name: "Sudowoodo" },
  hoppip:      { id: "0187", name: "Hoppip" },
  aipom:       { id: "0190", name: "Aipom" },
  sunkern:     { id: "0191", name: "Sunkern" },
  sunflora:    { id: "0192", name: "Sunflora" },
  wooper:      { id: "0194", name: "Wooper" },
  quagsire:    { id: "0195", name: "Quagsire" },
  espeon:      { id: "0196", name: "Espeon" },
  umbreon:     { id: "0197", name: "Umbreon" },
  murkrow:     { id: "0198", name: "Murkrow" },
  misdreavus:  { id: "0200", name: "Misdreavus" },
  girafarig:   { id: "0203", name: "Girafarig" },
  pineco:      { id: "0204", name: "Pineco" },
  dunsparce:   { id: "0206", name: "Dunsparce" },
  snubbull:    { id: "0209", name: "Snubbull" },
  granbull:    { id: "0210", name: "Granbull" },
  scizor:      { id: "0212", name: "Scizor" },
  shuckle:     { id: "0213", name: "Shuckle" },
  heracross:   { id: "0214", name: "Heracross" },
  sneasel:     { id: "0215", name: "Sneasel" },
  teddiursa:   { id: "0216", name: "Teddiursa" },
  ursaring:    { id: "0217", name: "Ursaring" },
  slugma:      { id: "0218", name: "Slugma" },
  magcargo:    { id: "0219", name: "Magcargo" },
  swinub:      { id: "0220", name: "Swinub" },
  piloswine:   { id: "0221", name: "Piloswine" },
  houndour:    { id: "0228", name: "Houndour" },
  houndoom:    { id: "0229", name: "Houndoom" },
  phanpy:      { id: "0231", name: "Phanpy" },
  donphan:     { id: "0232", name: "Donphan" },
  stantler:    { id: "0234", name: "Stantler" },
  tyrogue:     { id: "0236", name: "Tyrogue" },
  hitmontop:   { id: "0237", name: "Hitmontop" },
  elekid:      { id: "0239", name: "Elekid" },
  magby:       { id: "0240", name: "Magby" },
  miltank:     { id: "0241", name: "Miltank" },
  blissey:     { id: "0242", name: "Blissey" },
  raikou:      { id: "0243", name: "Raikou" },
  entei:       { id: "0244", name: "Entei" },
  suicune:     { id: "0245", name: "Suicune" },
  larvitar:    { id: "0246", name: "Larvitar" },
  pupitar:     { id: "0247", name: "Pupitar" },
  tyranitar:   { id: "0248", name: "Tyranitar" },
  lugia:       { id: "0249", name: "Lugia" },
  hooh:        { id: "0250", name: "Ho-Oh" },
  celebi:      { id: "0251", name: "Celebi" },

  // ================================================================
  // GEN 3 — Hoenn (252~386)
  // ================================================================
  treecko:     { id: "0252", name: "Treecko",     hasAttack: true },
  grovyle:     { id: "0253", name: "Grovyle",     hasAttack: true },
  sceptile:    { id: "0254", name: "Sceptile",    hasAttack: true },
  torchic:     { id: "0255", name: "Torchic",     hasAttack: true },
  combusken:   { id: "0256", name: "Combusken",   hasAttack: true },
  blaziken:    { id: "0257", name: "Blaziken",    hasAttack: true },
  mudkip:      { id: "0258", name: "Mudkip",      hasAttack: true },
  marshtomp:   { id: "0259", name: "Marshtomp",   hasAttack: true },
  swampert:    { id: "0260", name: "Swampert",    hasAttack: true },
  poochyena:   { id: "0261", name: "Poochyena" },
  mightyena:   { id: "0262", name: "Mightyena" },
  zigzagoon:   { id: "0263", name: "Zigzagoon" },
  linoone:     { id: "0264", name: "Linoone" },
  wurmple:     { id: "0265", name: "Wurmple" },
  lotad:       { id: "0270", name: "Lotad" },
  seedot:      { id: "0273", name: "Seedot" },
  taillow:     { id: "0276", name: "Taillow" },
  swellow:     { id: "0277", name: "Swellow" },
  wingull:     { id: "0278", name: "Wingull" },
  ralts:       { id: "0280", name: "Ralts" },
  kirlia:      { id: "0281", name: "Kirlia" },
  gardevoir:   { id: "0282", name: "Gardevoir" },
  shroomish:   { id: "0285", name: "Shroomish" },
  breloom:     { id: "0286", name: "Breloom" },
  slakoth:     { id: "0287", name: "Slakoth" },
  nincada:     { id: "0290", name: "Nincada" },
  whismur:     { id: "0293", name: "Whismur" },
  makuhita:    { id: "0296", name: "Makuhita" },
  hariyama:    { id: "0297", name: "Hariyama" },
  skitty:      { id: "0300", name: "Skitty" },
  sableye:     { id: "0302", name: "Sableye" },
  mawile:      { id: "0303", name: "Mawile" },
  aron:        { id: "0304", name: "Aron" },
  lairon:      { id: "0305", name: "Lairon" },
  aggron:      { id: "0306", name: "Aggron" },
  meditite:    { id: "0307", name: "Meditite" },
  electrike:   { id: "0309", name: "Electrike" },
  manectric:   { id: "0310", name: "Manectric" },
  plusle:       { id: "0311", name: "Plusle" },
  minun:       { id: "0312", name: "Minun" },
  gulpin:      { id: "0316", name: "Gulpin" },
  carvanha:    { id: "0318", name: "Carvanha" },
  sharpedo:    { id: "0319", name: "Sharpedo" },
  numel:       { id: "0322", name: "Numel" },
  camerupt:    { id: "0323", name: "Camerupt" },
  torkoal:     { id: "0324", name: "Torkoal" },
  spoink:      { id: "0325", name: "Spoink" },
  trapinch:    { id: "0328", name: "Trapinch" },
  vibrava:     { id: "0329", name: "Vibrava" },
  flygon:      { id: "0330", name: "Flygon" },
  cacnea:      { id: "0331", name: "Cacnea" },
  swablu:      { id: "0333", name: "Swablu" },
  altaria:     { id: "0334", name: "Altaria" },
  zangoose:    { id: "0335", name: "Zangoose" },
  seviper:     { id: "0336", name: "Seviper" },
  lunatone:    { id: "0337", name: "Lunatone" },
  solrock:     { id: "0338", name: "Solrock" },
  barboach:    { id: "0339", name: "Barboach" },
  baltoy:      { id: "0343", name: "Baltoy" },
  feebas:      { id: "0349", name: "Feebas" },
  milotic:     { id: "0350", name: "Milotic" },
  shuppet:     { id: "0353", name: "Shuppet" },
  banette:     { id: "0354", name: "Banette" },
  duskull:     { id: "0355", name: "Duskull" },
  dusclops:    { id: "0356", name: "Dusclops" },
  tropius:     { id: "0357", name: "Tropius" },
  absol:       { id: "0359", name: "Absol" },
  snorunt:     { id: "0361", name: "Snorunt" },
  glalie:      { id: "0362", name: "Glalie" },
  spheal:      { id: "0363", name: "Spheal" },
  clamperl:    { id: "0366", name: "Clamperl" },
  relicanth:   { id: "0369", name: "Relicanth" },
  bagon:       { id: "0371", name: "Bagon" },
  shelgon:     { id: "0372", name: "Shelgon" },
  salamence:   { id: "0373", name: "Salamence" },
  beldum:      { id: "0374", name: "Beldum" },
  metang:      { id: "0375", name: "Metang" },
  metagross:   { id: "0376", name: "Metagross" },
  // Legendaries
  regirock:    { id: "0377", name: "Regirock" },
  regice:      { id: "0378", name: "Regice" },
  registeel:   { id: "0379", name: "Registeel" },
  latias:      { id: "0380", name: "Latias" },
  latios:      { id: "0381", name: "Latios" },
  kyogre:      { id: "0382", name: "Kyogre" },
  groudon:     { id: "0383", name: "Groudon" },
  rayquaza:    { id: "0384", name: "Rayquaza" },
  jirachi:     { id: "0385", name: "Jirachi" },
  deoxys:      { id: "0386", name: "Deoxys" },

  // ================================================================
  // GEN 4 — Sinnoh (387~493)
  // ================================================================
  turtwig:     { id: "0387", name: "Turtwig",     hasAttack: true },
  grotle:      { id: "0388", name: "Grotle",      hasAttack: true },
  torterra:    { id: "0389", name: "Torterra",    hasAttack: true },
  chimchar:    { id: "0390", name: "Chimchar",    hasAttack: true },
  monferno:    { id: "0391", name: "Monferno",    hasAttack: true },
  infernape:   { id: "0392", name: "Infernape",   hasAttack: true },
  piplup:      { id: "0393", name: "Piplup",      hasAttack: true },
  prinplup:    { id: "0394", name: "Prinplup",    hasAttack: true },
  empoleon:    { id: "0395", name: "Empoleon",    hasAttack: true },
  starly:      { id: "0396", name: "Starly" },
  staravia:    { id: "0397", name: "Staravia" },
  staraptor:   { id: "0398", name: "Staraptor" },
  bidoof:      { id: "0399", name: "Bidoof" },
  shinx:       { id: "0403", name: "Shinx" },
  luxio:       { id: "0404", name: "Luxio" },
  luxray:      { id: "0405", name: "Luxray" },
  budew:       { id: "0406", name: "Budew" },
  cranidos:    { id: "0408", name: "Cranidos" },
  pachirisu:   { id: "0417", name: "Pachirisu" },
  buizel:      { id: "0418", name: "Buizel" },
  floatzel:    { id: "0419", name: "Floatzel" },
  shellos:     { id: "0422", name: "Shellos" },
  drifloon:    { id: "0425", name: "Drifloon" },
  buneary:     { id: "0427", name: "Buneary" },
  lopunny:     { id: "0428", name: "Lopunny" },
  glameow:     { id: "0431", name: "Glameow" },
  stunky:      { id: "0434", name: "Stunky" },
  bronzor:     { id: "0436", name: "Bronzor" },
  gible:       { id: "0443", name: "Gible" },
  gabite:      { id: "0444", name: "Gabite" },
  garchomp:    { id: "0445", name: "Garchomp" },
  riolu:       { id: "0447", name: "Riolu",       hasAttack: true },
  lucario:     { id: "0448", name: "Lucario",     hasAttack: true },
  hippopotas:  { id: "0449", name: "Hippopotas" },
  skorupi:     { id: "0451", name: "Skorupi" },
  croagunk:    { id: "0453", name: "Croagunk" },
  finneon:     { id: "0456", name: "Finneon" },
  snover:      { id: "0459", name: "Snover" },
  abomasnow:   { id: "0460", name: "Abomasnow" },
  weavile:     { id: "0461", name: "Weavile" },
  togekiss:    { id: "0468", name: "Togekiss" },
  leafeon:     { id: "0470", name: "Leafeon" },
  glaceon:     { id: "0471", name: "Glaceon" },
  mamoswine:   { id: "0473", name: "Mamoswine" },
  gallade:     { id: "0475", name: "Gallade" },
  dusknoir:    { id: "0477", name: "Dusknoir" },
  froslass:    { id: "0478", name: "Froslass" },
  rotom:       { id: "0479", name: "Rotom" },
  // Legendaries
  dialga:      { id: "0483", name: "Dialga" },
  palkia:      { id: "0484", name: "Palkia" },
  giratina:    { id: "0487", name: "Giratina" },
  darkrai:     { id: "0491", name: "Darkrai" },
  arceus:      { id: "0493", name: "Arceus" },

  // ================================================================
  // GEN 5 — Unova (494~649)
  // ================================================================
  snivy:       { id: "0495", name: "Snivy",       hasAttack: true },
  servine:     { id: "0496", name: "Servine",     hasAttack: true },
  serperior:   { id: "0497", name: "Serperior",   hasAttack: true },
  tepig:       { id: "0498", name: "Tepig",       hasAttack: true },
  pignite:     { id: "0499", name: "Pignite",     hasAttack: true },
  emboar:      { id: "0500", name: "Emboar",      hasAttack: true },
  oshawott:    { id: "0501", name: "Oshawott",    hasAttack: true },
  dewott:      { id: "0502", name: "Dewott",      hasAttack: true },
  samurott:    { id: "0503", name: "Samurott",    hasAttack: true },
  lillipup:    { id: "0506", name: "Lillipup" },
  purrloin:    { id: "0509", name: "Purrloin" },
  pidove:      { id: "0519", name: "Pidove" },
  roggenrola:  { id: "0524", name: "Roggenrola" },
  woobat:      { id: "0527", name: "Woobat" },
  drilbur:     { id: "0529", name: "Drilbur" },
  excadrill:   { id: "0530", name: "Excadrill" },
  timburr:     { id: "0532", name: "Timburr" },
  sewaddle:    { id: "0540", name: "Sewaddle" },
  venipede:    { id: "0543", name: "Venipede" },
  cottonee:    { id: "0546", name: "Cottonee" },
  sandile:     { id: "0551", name: "Sandile" },
  darumaka:    { id: "0554", name: "Darumaka" },
  darmanitan:  { id: "0555", name: "Darmanitan" },
  dwebble:     { id: "0557", name: "Dwebble" },
  scraggy:     { id: "0559", name: "Scraggy" },
  zorua:       { id: "0570", name: "Zorua" },
  zoroark:     { id: "0571", name: "Zoroark" },
  minccino:    { id: "0572", name: "Minccino" },
  gothita:     { id: "0574", name: "Gothita" },
  solosis:     { id: "0577", name: "Solosis" },
  ducklett:    { id: "0580", name: "Ducklett" },
  vanillite:   { id: "0582", name: "Vanillite" },
  emolga:      { id: "0587", name: "Emolga" },
  joltik:      { id: "0595", name: "Joltik" },
  ferroseed:   { id: "0597", name: "Ferroseed" },
  litwick:     { id: "0607", name: "Litwick" },
  lampent:     { id: "0608", name: "Lampent" },
  chandelure:  { id: "0609", name: "Chandelure" },
  axew:        { id: "0610", name: "Axew" },
  fraxure:     { id: "0611", name: "Fraxure" },
  haxorus:     { id: "0612", name: "Haxorus" },
  mienfoo:     { id: "0619", name: "Mienfoo" },
  druddigon:   { id: "0621", name: "Druddigon" },
  pawniard:    { id: "0624", name: "Pawniard" },
  rufflet:     { id: "0627", name: "Rufflet" },
  deino:       { id: "0633", name: "Deino" },
  zweilous:    { id: "0634", name: "Zweilous" },
  hydreigon:   { id: "0635", name: "Hydreigon" },
  larvesta:    { id: "0636", name: "Larvesta" },
  volcarona:   { id: "0637", name: "Volcarona" },
  // Legendaries
  reshiram:    { id: "0643", name: "Reshiram" },
  zekrom:      { id: "0644", name: "Zekrom" },
  kyurem:      { id: "0646", name: "Kyurem" },
  genesect:    { id: "0649", name: "Genesect" },
};

/**
 * Get the atlas texture key for a pokemon.
 * Format: "pac-{key}" (e.g., "pac-pikachu")
 */
export function pacTexKey(key: string): string {
  return `pac-${key}`;
}

/**
 * Load Pokemon sprites as multiatlas from PAC repository.
 * Call this in preload() of BootScene.
 */
export function loadPmdSprites(scene: Phaser.Scene): void {
  for (const [key, config] of Object.entries(POKEMON_SPRITES)) {
    const atlasKey = pacTexKey(key);
    const jsonUrl = `${PAC_SPRITE_BASE}/${config.id}.json`;
    scene.load.multiatlas(atlasKey, jsonUrl, `${PAC_SPRITE_BASE}/`);
  }
}

/**
 * Load PMD portraits for UI use.
 */
export function loadPmdPortraits(scene: Phaser.Scene): void {
  for (const [key, config] of Object.entries(POKEMON_SPRITES)) {
    const url = `${PAC_PORTRAIT_BASE}/${config.id}/Normal.png`;
    scene.load.image(`portrait-${key}`, url);
  }
}

/**
 * No-op for backward compatibility — attack sprites are now in the same atlas.
 */
export function loadPmdAttackSprites(_scene: Phaser.Scene): void {
  // Attack animations are included in the multiatlas, no separate loading needed
}

/**
 * Create walk + idle + attack animations from loaded PAC atlases.
 * Scans atlas frame names to auto-discover animations and frame counts.
 * Call this in create() after sprites are loaded.
 */
export function createPmdAnimations(scene: Phaser.Scene): void {
  for (const [key] of Object.entries(POKEMON_SPRITES)) {
    const atlasKey = pacTexKey(key);
    if (!scene.textures.exists(atlasKey)) continue;

    const frameNames = scene.textures.get(atlasKey).getFrameNames();

    // Discover available animations by scanning frame names
    // Format: "Normal/{Action}/Anim/{Dir}/{FrameIdx}"
    const animFrameCounts = new Map<string, number>(); // "Walk/0" -> max frame index + 1

    for (const name of frameNames) {
      const match = name.match(/^Normal\/(\w+)\/Anim\/(\d)\/(\d{4})$/);
      if (match) {
        const [, action, dir, frameIdxStr] = match;
        const mapKey = `${action}/${dir}`;
        const idx = parseInt(frameIdxStr, 10);
        const cur = animFrameCounts.get(mapKey) ?? 0;
        if (idx + 1 > cur) animFrameCounts.set(mapKey, idx + 1);
      }
    }

    // Create walk animations for each direction
    for (let dir = 0; dir < 8; dir++) {
      const walkKey = `Walk/${dir}`;
      const frameCount = animFrameCounts.get(walkKey);
      if (!frameCount) continue;

      scene.anims.create({
        key: `${key}-walk-${PMD_DIRECTIONS[dir]}`,
        frames: scene.anims.generateFrameNames(atlasKey, {
          start: 0,
          end: frameCount - 1,
          zeroPad: 4,
          prefix: `Normal/Walk/Anim/${dir}/`,
        }),
        frameRate: 8,
        repeat: -1,
      });
    }

    // Create idle animation (direction 0 = down)
    const idleCount = animFrameCounts.get("Idle/0");
    if (idleCount) {
      scene.anims.create({
        key: `${key}-idle`,
        frames: scene.anims.generateFrameNames(atlasKey, {
          start: 0,
          end: idleCount - 1,
          zeroPad: 4,
          prefix: `Normal/Idle/Anim/0/`,
        }),
        frameRate: 4,
        repeat: -1,
      });
    } else {
      // Fallback: use first walk frame as idle
      const walkDown = animFrameCounts.get("Walk/0");
      if (walkDown) {
        scene.anims.create({
          key: `${key}-idle`,
          frames: [{ key: atlasKey, frame: "Normal/Walk/Anim/0/0000" }],
          frameRate: 1,
        });
      }
    }

    // Create attack animations for each direction
    for (let dir = 0; dir < 8; dir++) {
      const attackKey = `Attack/${dir}`;
      const frameCount = animFrameCounts.get(attackKey);
      if (!frameCount) continue;

      scene.anims.create({
        key: `${key}-attack-${PMD_DIRECTIONS[dir]}`,
        frames: scene.anims.generateFrameNames(atlasKey, {
          start: 0,
          end: frameCount - 1,
          zeroPad: 4,
          prefix: `Normal/Attack/Anim/${dir}/`,
        }),
        frameRate: 14,
        repeat: 0,
      });
    }

    // Create hurt animation (direction 0 only, play once)
    const hurtCount = animFrameCounts.get("Hurt/0");
    if (hurtCount) {
      scene.anims.create({
        key: `${key}-hurt`,
        frames: scene.anims.generateFrameNames(atlasKey, {
          start: 0,
          end: hurtCount - 1,
          zeroPad: 4,
          prefix: `Normal/Hurt/Anim/0/`,
        }),
        frameRate: 10,
        repeat: 0,
      });
    }
  }
}

/**
 * No-op for backward compatibility — attack anims created in createPmdAnimations.
 */
export function createPmdAttackAnimations(_scene: Phaser.Scene): void {
  // Attack animations are now created in createPmdAnimations()
}

/**
 * Get the correct direction name from a velocity vector.
 */
export function getDirectionFromVelocity(
  vx: number,
  vy: number,
): PmdDirection {
  if (Math.abs(vx) < 1 && Math.abs(vy) < 1) return "down";

  const angle = Math.atan2(vy, vx) * (180 / Math.PI);
  // Map angle to 8 directions
  if (angle >= -22.5 && angle < 22.5) return "right";
  if (angle >= 22.5 && angle < 67.5) return "down-right";
  if (angle >= 67.5 && angle < 112.5) return "down";
  if (angle >= 112.5 && angle < 157.5) return "down-left";
  if (angle >= 157.5 || angle < -157.5) return "left";
  if (angle >= -157.5 && angle < -112.5) return "up-left";
  if (angle >= -112.5 && angle < -67.5) return "up";
  return "up-right";
}
