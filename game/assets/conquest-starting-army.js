'use strict';

// Country IDs follow the conquest roster. Only the larger armies start with heavy units.
const CONQUEST_HEAVY_RESERVES = [[1, 2], [1, 1, 2], [1, 16], [2]];

// Alternate five tanks and five artillery units along each land border.
const DANTE_BORDER_ROSTER = [
 [1, 2], [2, 2], [13, 2], [3, 3], [14, 3],
 [16, 2], [1, 3], [15, 2], [13, 2], [2, 3]
];

function deployDanteBorderArmy(occupied) {
 const faction = 1;
 const borders = new Map();
 for (const [tile, land] of tiles.entries()) {
  if (land.owner !== faction) continue;
  for (const neighbor of neighbors(tile)) {
   const rival = tiles[neighbor].owner;
   if (rival < 0 || rival === faction) continue;
   if (!borders.has(rival)) borders.set(rival, new Map());
   borders.get(rival).set(tile, 0);
  }
 }

 for (const depth of borders.values()) {
  // Expand inward on Dante territory, including borders too short for ten units.
  for (const [tile, steps] of depth) {
   if (steps === 3) continue;
   for (const neighbor of neighbors(tile)) {
    if (tiles[neighbor].owner === faction && !depth.has(neighbor)) depth.set(neighbor, steps + 1);
   }
  }
 }

 // Place one unit per front in each pass so adjacent borders share available sites.
 const placements = new Map([...borders.keys()].map(rival => [rival, []]));
 for (const [type, level] of DANTE_BORDER_ROSTER) {
  const preferredDepth = TYPES[type].branch === 'artillery' ? 1 : 0;
  for (const [rival, depth] of borders) {
   const placed = placements.get(rival);
   let site, best = Infinity;
   for (const [tile, steps] of depth) {
    if (occupied.has(tile) || moveCost({f: faction, type}, tile) >= 99999) continue;
    const crowding = placed.reduce((sum, other) => sum + Math.max(0, 3 - distance(tile, other)), 0);
    const score = Math.abs(steps - preferredDepth) * 2 + crowding * 3;
    if (score < best || (score === best && tile < site)) {
     site = tile;
     best = score;
    }
   }
   if (site === undefined) continue;
   const unit = makeUnit(faction, type, site, level);
   unit.initialDanteBorder = rival;
   occupied.add(site);
   placed.push(site);
  }
 }
}

function deployConquestStartingArmy() {
 const cityTiles = new Set(cities.map(q => q.tile));
 units = units.filter(u => ['navy', 'air', 'helicopter'].includes(TYPES[u.type].branch));
 const occupied = new Set([...cityTiles, ...units.map(u => u.tile), ...missileBases.map(b => b.tile)]);
 const garrisonTypes = [0, 0, 0, 8, 0, 9, 0, 10];
 const garrisonsByCountry = Array(factions.length).fill(0);
 for (const q of cities) {
  const n = garrisonsByCountry[q.f]++;
  const type = q.f === 4 && [2, 3].includes(tiles[q.tile].terrain)
   ? DEKPHUING_GUERRILLA : garrisonTypes[n % garrisonTypes.length];
  makeUnit(q.f, type, q.tile);
 }

 for (const [f, types] of CONQUEST_HEAVY_RESERVES.entries()) {
  const capital = cities.find(q => q.f === f && q.capital);
  if (!capital) continue;
  const sites = tiles.map((t, i) => i).filter(i => tiles[i].owner === f && !occupied.has(i));
  sites.sort((a, b) => distance(capital.tile, a) - distance(capital.tile, b) || a - b);
  for (const [n, type] of types.entries()) {
   const tile = sites[n];
   if (tile === undefined) break;
   makeUnit(f, type, tile);
   occupied.add(tile);
  }
 }
 deployDanteBorderArmy(occupied);
}

// Apply after geography, naval grants and difficulty-specific setup have finished.
const previousConquestSetup = setup;
setup = function (...args) {
 const result = previousConquestSetup(...args);
 if (!activeScenario) {
  deployConquestStartingArmy();
  faceInitialArmy();
  danteFrontPlan = null;
  danteExpansionPlan = null;
  buildDanteFrontPlan();
  invalidateActionVisuals();
  save();
  updateHUD();
  refreshSelection();
 }
 return result;
};
Object.assign(window.Terha, {setup});
