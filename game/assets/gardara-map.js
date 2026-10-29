'use strict';
// Added land uses existing ocean tile IDs. The original seven coastlines do not move.
const GARDARA=7,GARDARA_TILES=[];
for(let i=0;i<tiles.length;i++){
 const t=tiles[i],dx=(t.x-58)/12.8,dy=(t.y-110)/7.5,a=Math.atan2(dy,dx);
 const edge=1+.09*Math.sin(a*3+.7)+.055*Math.cos(a*5-1);
 if(MAP.tiles[i][0]<0&&Math.hypot(dx,dy)<edge){const terrain=(t.x*17+t.y*23)%11<5?2:1;MAP.tiles[i]=[GARDARA,terrain];t.owner=GARDARA;t.terrain=terrain;GARDARA_TILES.push(i)}
}
