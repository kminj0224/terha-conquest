
'use strict';
// This file must be last: an image can finish loading between classic scripts.
// Never start a frame until all render functions and module state exist.
let gameBooted=false;
function startGameRenderer(){
 if(gameBooted)return;
 gameBooted=true;
 requestAnimationFrame(draw);
}
// Present the front end immediately; map decoding must never gate the title.
showTitle();
worldImg.onload=startGameRenderer;
worldImg.onerror=()=>{menuMode=true;$('modal').style.display='flex';$('modal').innerHTML='<div class="box"><h2>지도 불러오기 오류</h2><p>앱을 다시 실행해 주세요.</p></div>'};
if(worldImg.complete&&worldImg.naturalWidth>0)startGameRenderer();
