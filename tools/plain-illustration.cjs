'use strict';
// World-space decorative illustration. No gameplay tile, anchor or geography writes.
const clamp=x=>Math.max(0,Math.min(1,x));
function hash(x,y){let n=Math.imul(x,374761393)^Math.imul(y,668265263);n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967295;}
module.exports=function(geo,cities,createCanvas){
 const reports=[];
 function tileAt(x,y){let best=null,dd=Infinity;const cx=Math.round((x-42.6666667)/64);for(let col=cx-1;col<=cx+1;col++){if(col<0||col>=112)continue;const row=Math.round((y-27.715-(col&1)*27.715)/55.43);for(let yy=row-1;yy<=row+1;yy++){if(yy<0||yy>=84)continue;const t=geo.tiles[yy*112+col],d=(t.x-x)**2+(t.y-y)**2;if(d<dd){dd=d;best=t;}}}return best;}
 const allowed=t=>t&&t.owner>=0&&t.city<0&&t.terrain<2;
 function paint(g,{sx,sy,sw,sh,profile,name},sdf){
  const c=createCanvas(1254,1254),p=c.getContext('2d');p.setTransform(1254/sw,0,0,1254/sh,-sx*1254/sw,-sy*1254/sh);
  const rich=profile===2,spacing=rich?33:39,drawn=[],eligible=new Set();
  const nearCities=cities.filter(q=>q.x>sx-150&&q.x<sx+sw+150&&q.cy>sy-150&&q.cy<sy+sh+150);
  function tuft(x,y,size,seed){
   // Eight blade arrangements with bent tapered silhouettes, grounded shadows and lit edges.
   const n=5+Math.floor(hash(seed,68)*6),lean=(hash(seed,69)-.5)*1.3;
   p.fillStyle='rgba(79,85,66,.16)';p.beginPath();p.ellipse(x+size*.18,y+size*.1,size*.85,size*.22,0,0,Math.PI*2);p.fill();
   for(let i=0;i<n;i++){const r=hash(seed+i,71),bx=x+(i/(n-1)-.5)*size*1.25,by=y+(hash(seed+i,72)-.5)*size*.22,h=size*(.42+r*.74),dx=(hash(seed+i,73)-.5)*size*.9+lean*h;
    p.beginPath();p.moveTo(bx-.8,by);p.quadraticCurveTo(bx+dx*.1,by-h*.75,bx+dx,by-h);p.quadraticCurveTo(bx+dx*.55,by-h*.40,bx+1.1,by+.2);p.fillStyle=i%3===0?'rgba(72,84,55,.85)':'rgba(99,113,73,.88)';p.fill();
    p.beginPath();p.moveTo(bx+.3,by-.3);p.quadraticCurveTo(bx+dx*.24,by-h*.55,bx+dx,by-h);p.strokeStyle='rgba(233,230,184,.85)';p.lineWidth=.65;p.stroke();
   }
  }
  for(let yy=Math.floor((sy-40)/spacing);yy<=(sy+sh+40)/spacing;yy++)for(let xx=Math.floor((sx-60)/spacing);xx<=(sx+sw+60)/spacing;xx++){
   const seed=xx*3917+yy*6553,x=(xx+hash(xx,yy)*.95)*spacing,y=(yy+hash(xx+181,yy)*.95)*spacing,t=tileAt(x,y);
   if(!allowed(t)||sdf(x,y)<10||nearCities.some(q=>((x-q.x)/(q.rx+15))**2+((y-q.cy)/(q.ry+12))**2<1))continue;
   const field=.5+.25*Math.sin(x*.016+Math.sin(y*.009)*2)+.25*Math.sin(y*.025-x*.005),pick=hash(xx+71,yy-35);
   if(pick>(rich?.92:.62)*(.35+field*.65))continue;
   eligible.add(t.id);const size=(rich?13:10)+hash(xx-21,yy+19)*(rich?9:7),w=size*(rich?3.5:2.5),h=size*.7;
   // Low irregular earth/grass swath: no hills, tree crowns or mountain silhouettes.
   p.save();p.translate(x,y);p.rotate((hash(xx+39,yy)-.5)*.28);
   p.beginPath();p.moveTo(-w,-h*.2);p.bezierCurveTo(-w*.7,-h*1.1,-w*.2,-h*.7,w*.22,-h*.9);p.bezierCurveTo(w*.65,-h*.75,w*.8,-h*.35,w,0);p.bezierCurveTo(w*.3,h*.65,-w*.6,h*.8,-w,-h*.2);
   const earth=pick<.20;p.fillStyle=earth?'rgba(164,144,108,.40)':rich?'rgba(116,131,88,.31)':'rgba(137,150,103,.25)';p.fill();
   p.strokeStyle='rgba(217,214,170,.24)';p.lineWidth=.65;p.beginPath();p.moveTo(-w*.8,-h*.4);p.bezierCurveTo(-w*.3,-h*.8,w*.2,-h*.85,w*.6,-h*.5);p.stroke();p.restore();
   const clusters=rich?4+Math.floor(hash(seed,77)*5):2+Math.floor(hash(seed,77)*4);
   for(let k=0;k<clusters;k++){const ox=(hash(seed+k,81)-.5)*w*1.6,oy=(hash(seed+k,82)-.5)*h*.9;tuft(x+ox,y+oy,size*(.42+hash(seed+k,83)*.5),seed+k*137);}
   // Short wind-combed grass strokes connect clumps without outlining hexagons.
   if(rich)for(let k=0;k<14;k++){const bx=x+(hash(seed+k,91)-.5)*w*2,by=y+(hash(seed+k,92)-.5)*h*2,len=1+hash(seed+k,93)*3;p.beginPath();p.moveTo(bx,by);p.quadraticCurveTo(bx+len*.5,by-len*.7,bx+len,by-len*.4);p.lineWidth=.45;p.strokeStyle=k%3?'rgba(114,130,90,.28)':'rgba(229,223,180,.40)';p.stroke();}
   if(pick<.09)for(let k=0;k<3;k++){const bx=x+(hash(seed+k,101)-.5)*w,by=y+hash(seed+k,102)*h,rr=.6+hash(seed+k,103)*1.1;p.fillStyle='rgba(105,103,88,.36)';p.beginPath();p.ellipse(bx,by,rr*1.6,rr*.7,0,0,Math.PI*2);p.fill();p.fillStyle='rgba(224,215,183,.55)';p.fillRect(bx-rr,by-rr*.5,rr*1.4,.55);}
   drawn.push({x,y,tile:t.id,recipe:Math.floor(hash(seed,68)*8)});
  }
  // Per-pixel eligibility mask ensures illustration never creates forest/mountain terrain.
  const pixels=p.getImageData(0,0,1254,1254);let visible=0,rejected=0;
  for(let y=0;y<1254;y++)for(let x=0;x<1254;x++){const i=(y*1254+x)*4;if(!pixels.data[i+3])continue;const wx=sx+(x+.5)/1254*sw,wy=sy+(y+.5)/1254*sh,t=tileAt(wx,wy),d=sdf(wx,wy);if(!allowed(t)||d<5||nearCities.some(q=>((wx-q.x)/(q.rx+5))**2+((wy-q.cy)/(q.ry+5))**2<1)){pixels.data[i+3]=0;rejected++;}else{pixels.data[i+3]*=clamp((d-5)/8);visible++;}}
  p.resetTransform();p.clearRect(0,0,1254,1254);p.putImageData(pixels,0,0);g.drawImage(c,sx,sy,sw,sh);c.width=c.height=0;
  reports.push({name,profile,decorationClusters:drawn.length,eligibleTiles:eligible.size,visiblePixels:visible,clippedPixels:rejected,onlyOrdinaryLand:drawn.every(q=>allowed(geo.tiles[q.tile])),recipes:[...new Set(drawn.map(q=>q.recipe))].sort()});
 }
 return{paint,reports};
};
