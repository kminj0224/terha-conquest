'use strict';
// Enlarge Nakwol infantry artwork by 10%, anchored at the feet; machine-gunners keep their original size.
const NAKWOL_INFANTRY_SCALE=1.1;
const previousNakwolInfantrySprite=sprite;
sprite=function(u,p,now){
 if(u.f!==5||TYPES[u.type]?.branch!=='infantry'||u.type===10)return previousNakwolInfantrySprite(u,p,now);
 const anchor=unitVisualPosition(u,now);
 ctx.save();ctx.translate(anchor.x,anchor.y+14);ctx.scale(NAKWOL_INFANTRY_SCALE,NAKWOL_INFANTRY_SCALE);ctx.translate(-anchor.x,-anchor.y-14);
 const result=previousNakwolInfantrySprite(u,p,now);ctx.restore();return result;
};
Object.assign(window.Terha,{sprite,NAKWOL_INFANTRY_SCALE});
