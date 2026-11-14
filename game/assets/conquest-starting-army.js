'use strict';

// Country IDs follow the conquest roster. Only the larger armies start with heavy units.
const CONQUEST_HEAVY_RESERVES = [[1, 2], [1, 1, 2], [1, 16], [2]];

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
  }
 }
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
