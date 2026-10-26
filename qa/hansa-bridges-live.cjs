'use strict';
module.exports=async function({run,nodes,click,settle,drain}){
 const assert=require('assert');
 run(`setup();started=true;player=0;setAppScreen('game');units=units.filter(u=>distance(u.tile,hansaBridgeCity().tile)>8);`);
 assert.equal(run('hansaBridges.length'),4);
 assert(run('hansaBridges.every(b=>b.open&&b.deck.length&&b.deck.every(i=>tiles[i].owner===0&&MAP.tiles[i][0]<0))'));
 assert(run('hansaBridges.every(b=>supplyLandConnected(hansaBridgeCity(),{tile:worldTileAt(b.z.x,b.z.y)}))'));
 run('buildRegions()');assert(run('hansaBridges.every(b=>b.deck.every(i=>tiles[i].owner===0))'));
 // The western ambiguous row follows the bridge's upper intersecting hexes.
 assert.deepEqual(JSON.parse(run("JSON.stringify(hansaBridges.find(b=>b.name==='west').deck)")),[4344,4343,4342,4341,4340]);
 run(`var bridgeToasts=[];var bridgeToastOriginal=toast;toast=function(s){bridgeToasts.push(s);return bridgeToastOriginal(s)};var eastBridge=hansaBridges.find(b=>b.name==='east');var bridgeFriend=makeUnit(0,0,eastBridge.deck[0],1);`);
 run('askHansaBridge(eastBridge)');await Promise.resolve();assert.equal(run('bridgeToasts.at(-1)'),'차단 불가 : 아군 유닛 존재');assert(!nodes.has('confirmYes'));assert(run('eastBridge.open&&!eastBridge.transition'));
 run('units=units.filter(u=>u.id!==bridgeFriend.id);var bridgeAlly=makeUnit(5,0,eastBridge.deck[0],1)');assert.equal(run('hansaBridgeBlockReason(eastBridge)'),'차단 불가 : 아군 유닛 존재');run('units=units.filter(u=>u.id!==bridgeAlly.id)');
 // A unit covering an endpoint keeps its selection and gains a neighboring footer action.
 run('var controlFriend=makeUnit(0,0,worldTileAt(eastBridge.a.x,eastBridge.a.y),1);selectUnit(controlFriend)');
 const footer=nodes.get('selectionActions').children,infoIndex=footer.indexOf(nodes.get('selectionInfo'));
 assert.equal(footer[infoIndex+1].id,'selectionBridge');assert.equal(nodes.get('selectionBridge').style.display,'inline-block');
 await click('selectionBridge');await Promise.resolve();assert(nodes.has('confirmYes'));await click('confirmNo');await Promise.resolve();assert.equal(run('selected.id'),run('controlFriend.id'));
 run('units=units.filter(u=>u.id!==controlFriend.id);selected=null;refreshSelection()');assert.equal(nodes.get('selectionBridge').style.display,'none');
 // Real hit testing and the existing two-button confirmation overlay.
 run(`cam.x=eastBridge.a.x;cam.y=eastBridge.a.y;cam.z=2;tap(screenW/2-15,screenH/2-15)`);await Promise.resolve();assert(nodes.get('confirmOverlay').textContent.includes('교각을 차단하시겠습니까?'));await click('confirmNo');await Promise.resolve();assert(run('!eastBridge.transition'));
 run('var bridgeEnemy=makeUnit(1,0,eastBridge.deck[0],1);var bridgeCargo=makeUnit(1,0,eastBridge.deck[0],1);bridgeCargo.carriedBy=bridgeEnemy.id;var bridgeFXBefore=fx.length;var bridgeKillCalls=0;var bridgeKillOriginal=kill;kill=function(...a){bridgeKillCalls++;return bridgeKillOriginal(...a)}');
 run('askHansaBridge(eastBridge)');await Promise.resolve();await click('confirmYes');await Promise.resolve();
 assert.equal(run('bridgeKillCalls'),0);assert.equal(run('fx.length'),run('bridgeFXBefore'));assert(run('!units.includes(bridgeEnemy)&&!units.includes(bridgeCargo)'));
 assert.equal(run('moveCost({type:0,f:0},eastBridge.deck[0])'),99999);
 run('var bridgeT=eastBridge.transition.start');assert.equal(run('hansaBridgeAmount(eastBridge,bridgeT+1500)'),.5);
 run('updateHansaBridges(bridgeT+2999)');assert(run('eastBridge.open'));run('updateHansaBridges(bridgeT+3000)');assert(!run('eastBridge.open'));assert(run('eastBridge.deck.every(i=>tiles[i].owner===-1)'));
 run('askHansaBridge(eastBridge)');await Promise.resolve();assert(nodes.get('confirmOverlay').textContent.includes('연결하시겠습니까?'));await click('confirmYes');await Promise.resolve();run('updateHansaBridges(eastBridge.transition.start+3000)');assert(run('eastBridge.open'));
 for(const name of ['north','south']){run(`var quickBridge=hansaBridges.find(b=>b.name==='${name}');setHansaBridge(quickBridge,false,10000);updateHansaBridges(11499)`);assert(run('quickBridge.open'));run('updateHansaBridges(11500)');assert(!run('quickBridge.open'))}
 // Save/load preserves both blocked spans and troops on connected deck hexes.
 run('var savedDeckUnit=makeUnit(0,0,eastBridge.deck[0],1);var savedDeckId=savedDeckUnit.id;var savedDeckTile=savedDeckUnit.tile;save(1)');
 assert.equal(await drain(run('load(1)')),true);assert(run("!hansaBridges.find(b=>b.name==='north').open"));assert.equal(run('units.find(u=>u.id===savedDeckId).tile'),run('savedDeckTile'));assert(run('tiles[savedDeckTile].owner===0'));
 run(`units=units.filter(u=>u.id!==savedDeckId);for(const b of hansaBridges){b.open=false;b.target=false;b.transition=null}applyHansaBridgeTerrain();var hansaSource=hansaBridgeCity();hansaSource.level=5;var bridgeTarget=cities.find(q=>q.origin===1&&!q.capital);bridgeTarget.f=0;bridgeTarget.level=5;for(const q of cities){q.queue=null;q.produced=false}food[0]=money[0]=oil[0]=100000;selected={kind:'city',id:bridgeTarget.id};panelOpen=true;supplyChoice={target:bridgeTarget.id,source:hansaSource.id};`);
 assert.equal(run('supplyReason(bridgeTarget,hansaSource,0,1,false)'),'한사특별도 교각 연결 필요');assert.equal(run('supplyReason(bridgeTarget,hansaSource,5,1,false)'),'한사특별도에는 해상수송로가 없습니다');
 run("var beforeBridgeChoiceToasts=bridgeToasts.length;selectCity(bridgeTarget,true);cityCommandOpen('units')");await click('supplyHome'+run('hansaSource.id'));assert.equal(run('bridgeToasts.length'),run('beforeBridgeChoiceToasts'));
 const button=nodes.get('unitCatalogue').querySelectorAll('button').find(b=>b.title==='한사특별도 교각 연결 필요');assert(button,'blocked unit is still clickable');button.onclick();assert.equal(run('bridgeToasts.at(-1)'),'한사특별도 교각 연결 필요');
 run(`setHansaBridge(hansaBridges[0],true,20000);updateHansaBridges(23000)`);assert.notEqual(run('supplyReason(bridgeTarget,hansaSource,0,1,false)'),'한사특별도 교각 연결 필요');
 // AI reacts to actual enemies within wrapped radius five and restores afterwards.
 run(`setup();started=true;setAppScreen('game');player=1;units=[];var aiHansa=hansaBridgeCity();var threatTile=tiles.findIndex((t,i)=>t.owner>=0&&distance(i,aiHansa.tile)===5);var bridgeThreat=makeUnit(1,0,threatTile,1);updateHansaBridgeAI(30000,true)`);
 assert(run('hansaBridges.every(b=>b.transition&&b.target===false)'));run('updateHansaBridges(33000)');assert(run('hansaBridges.every(b=>!b.open)'));
 run('units=[];updateHansaBridgeAI(34000,true);updateHansaBridges(37000)');assert(run('hansaBridges.every(b=>b.open)'));
 run('player=0;var legacyBridgeSave=snapshot();delete legacyBridgeSave.hansaBridges;delete legacyBridgeSave.hansaBridgeSchema;migrateArmy(legacyBridgeSave)');assert(run('hansaBridges.every(b=>b.open)'));
 run('for(const b of hansaBridges){b.open=false;b.target=false}setup();started=true;setAppScreen("game")');assert(run('hansaBridges.every(b=>b.open)'));
 // Actual Canvas emits two independently retracting half-spans and all eight sprites.
 run(`var bridgeLines=[],bridgeImages=[],bridgeDrawImage=ctx.drawImage,bridgeStroke=ctx.stroke;ctx.drawImage=function(im,...a){if(im===hansaBridgeAtlas.idle||im===hansaBridgeWestArt.idle)bridgeImages.push(a);return bridgeDrawImage(im,...a)};ctx.stroke=function(){bridgeLines.push(ctx.lineWidth);return bridgeStroke()};for(const b of hansaBridges){drawHansaBridgeSpan(b,0);drawHansaBridgeBuilding(b,true);drawHansaBridgeBuilding(b,false)}ctx.drawImage=bridgeDrawImage;ctx.stroke=bridgeStroke`);
 assert.equal(run('bridgeImages.length'),8);assert.equal(run('bridgeLines.length'),16);assert(run("hansaBridgeBuildingBox(hansaBridges.find(b=>b.name==='west'),true).extended"));assert.equal(run('TYPES[SAPROS].def'),0);
 run('toast=bridgeToastOriginal;kill=bridgeKillOriginal');await settle();
 console.log('PASS: four logical decks, unchanged lake, upper western hexes, real confirmation/click, allied blockers, silent enemy removal, durations/reverse animation, save/load/legacy/new campaign, source-specific supply messages, AI radius and actual Canvas sprites/spans');
};
