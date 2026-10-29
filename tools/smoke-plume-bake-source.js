const smokePlumeFrames=[],smokeFrontFrames=[],SMOKE_PLUME_FRAME_COUNT=40;
function prepareSmokePlumeFrames(){
 if(smokePlumeFrames.length||!smokeFramesArt.idleReady)return smokePlumeFrames;
 const source=smokeFramesArt.idle,sw=source.naturalWidth/5,sh=source.naturalHeight,bands=192,rows=SMOKE_PLUME_LAYOUT.length;
 const boxAt=(list,at)=>{const i=Math.floor(at)%rows,a=list[i],b=list[(i+1)%rows],f=at%1;return[a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f]};
 for(let variant=0;variant<2;variant++){const frames=variant?smokeFrontFrames:smokePlumeFrames;
 for(let i=0;i<SMOKE_PLUME_FRAME_COUNT;i++){
  const image=document.createElement('canvas');image.width=80;image.height=192;
  const g=image.getContext('2d'),age=i/(SMOKE_PLUME_FRAME_COUNT-1),phase=i*.85+variant*2.3,first=Math.floor(phase)%5,next=(first+1)%5,mix=phase%1,travel=age*36;
  const late=Math.max(0,(age-.4)/.6),fade=Math.min(1,(1-age)/.45);
  for(let band=0;band<bands;band++){
   const height=1-band/(bands-1),clear=age<=.4?1:Math.max(0,Math.min(1,(height-late+.08)/.16));if(!clear||!fade)continue;
   const sample=(band/bands*rows+travel)%rows,bounds=boxAt(SMOKE_PLUME_LAYOUT,band/bands*rows);
   const width=Math.max(1,(bounds[1]-bounds[0])*.34)*(1+late*.45*height);
   const wind=(Math.sin(age*14-height*7+variant*1.4)*2+(variant?-1:1)*late*7)*height*height;
   const x=40+((bounds[0]+bounds[1])/2-96)*.34+wind-width/2;
   for(const [key,weight]of [[first,1-mix],[next,mix]]){
    if(weight<=0)continue;const b=boxAt(SMOKE_PLUME_PROFILES[key],sample);
    g.globalAlpha=weight*fade*clear*(1-late*.5*height);
    g.drawImage(source,key*sw+b[0]/192*sw,sample/rows*sh,Math.max(1,b[1]-b[0])/192*sw,Math.min(sh-sample/rows*sh,sh/bands+.3),x,band*192/bands,width,192/bands+.2);
   }
  }
  g.globalAlpha=1;g.globalCompositeOperation='source-atop';g.fillStyle='rgba(10,12,13,.4)';g.fillRect(0,0,80,192);
  frames.push(image);
 }}
 return smokePlumeFrames;
}

prepareSmokePlumeFrames();globalThis.bakedFrames=[...smokePlumeFrames,...smokeFrontFrames];