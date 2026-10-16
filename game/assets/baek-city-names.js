'use strict';
// Labels only: stable city IDs, positions, ownership and province geography are retained.
const BAEK_CITY_RENAMES={"천진림":"신마주","조경":"선월","세제":"운경","조경세제":"선월","전일":"서정","미타모리":"청류","야카세와":"해원","시라나와":"설하","칸자오":"금란","류톈":"유성","리안":"명하","량안":"연화","북원양":"북운"};
function applyBaekCityNames(){for(const q of cities){if(q.origin!==0||q.capital||q.name==='한사특별도')continue;const legacy=q.name.endsWith('주')?q.name.slice(0,-1):q.name;if(BAEK_CITY_RENAMES[legacy])q.name=BAEK_CITY_RENAMES[legacy];else if(q.name.endsWith('시'))q.name=q.name.slice(0,-1)}}
const cityNamesSetup=setup;setup=function(...args){const result=cityNamesSetup(...args);applyBaekCityNames();save();updateHUD();refreshSelection();return result};
const cityNamesMigration=migrateArmy;migrateArmy=function(...args){const result=cityNamesMigration(...args);applyBaekCityNames();return result};
Object.assign(window.Terha,{setup,migrateArmy,applyBaekCityNames});
