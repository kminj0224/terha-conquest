'use strict';
const lerp=(a,b,t)=>a+(b-a)*t,clamp=x=>Math.max(0,Math.min(1,x));
function hash(x,y){let n=Math.imul(x,374761393)^Math.imul(y,668265263);n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967295;}
function value(x,y){const xx=Math.floor(x),yy=Math.floor(y);let u=x-xx,v=y-yy;u=u*u*(3-2*u);v=v*v*(3-2*v);return lerp(lerp(hash(xx,yy),hash(xx+1,yy),u),lerp(hash(xx,yy+1),hash(xx+1,yy+1),u),v);}
function ground(x,y,style){const broad=value(x*.008,y*.008),medium=value(x*.028+61,y*.028-19),fibres=value(x*.19+2*Math.sin(y*.018),y*.055+77),fine=value(x*.72,y*.72);return style===1?{scale:.915+broad*.12+medium*.04,grain:(fibres-.5)*2.3+(fine-.5)*1.4}:{scale:.825+broad*.22+medium*.14,grain:(fibres-.5)*6.8+(fine-.5)*2.2};}
function water(g,r,path,style,ocean){
 const a=style===1,base=a?'#638e87':'#648b99',deep=a?'#235c68':'#244c62';
 g.save();path(r,0);g.fillStyle=base;g.fill();g.clip();
 // Gradual depth bands follow the actual channel normals, independent of map orientation.
 g.save();g.filter='blur(1.25px)';for(const [ratio,alpha]of [[.94,.12],[.80,.16],[.65,.18],[.48,.18],[.28,.12]]){path({...r,samples:r.samples.map(p=>({...p,width:p.width*ratio}))},0);g.globalAlpha=alpha;g.fillStyle=deep;g.fill();}g.restore();
 // Fine reflected-water material breaks up smooth vector bands without changing the river outline.
 g.save();g.globalCompositeOperation='soft-light';g.globalAlpha=a?.28:.42;
 const px=a?120:100,py=a?65:52;g.scale(px/ocean.width,py/ocean.height);g.fillStyle=g.createPattern(ocean,'repeat');
 const xx=r.samples.map(p=>p.x),yy=r.samples.map(p=>p.y),pad=Math.max(...r.samples.map(p=>p.width))+5;
 g.fillRect((Math.min(...xx)-pad)*ocean.width/px,(Math.min(...yy)-pad)*ocean.height/py,(Math.max(...xx)-Math.min(...xx)+pad*2)*ocean.width/px,(Math.max(...yy)-Math.min(...yy)+pad*2)*ocean.height/py);g.restore();
 const seed=(Number(r.id)||0)*61;
 for(let j=2;j<r.samples.length-2;j+=2){const p=r.samples[j];if(p.width<2.8||hash(j+seed,13)<.28)continue;const n=hash(j+seed,41),tx=-p.ny,ty=p.nx,off=(hash(j+seed,57)-.5)*p.width*1.25;
  const travel=(hash(j+seed,17)-.5)*6,x=p.x+p.nx*off+tx*travel,y=p.y+p.ny*off+ty*travel,len=Math.min(p.width*.55,1.8+n*6.5),bow=(hash(j+seed,73)-.5)*1.8;
  g.beginPath();g.moveTo(x-p.nx*len*.5,y-p.ny*len*.5);g.quadraticCurveTo(x+tx*bow,y+ty*bow,x+p.nx*len*.5,y+p.ny*len*.5);g.strokeStyle=a?'#c8ded2':'#d6e2df';g.globalAlpha=(a?.11:.17)+n*.08;g.lineWidth=.30+n*.32;g.stroke();

 }
 g.restore();
}
module.exports={ground,water};
