'use strict';
// Install before the art modules so cold-start image decoding is covered as well.
const campaignImages=new Set(),CampaignImage=window.Image;
window.Image=new Proxy(CampaignImage,{construct(target,args){const image=Reflect.construct(target,args);campaignImages.add(image);return image}});
let campaignLoading=false,campaignRenderedFrames=0;
const campaignFrame=()=>new Promise(resolve=>requestAnimationFrame(resolve));
async function decodeCampaignImage(image){
 if(!image.src)return;
 if(typeof image.decode==='function'){try{await image.decode()}catch(error){console.warn('Campaign image unavailable',image.src)}return}
 if(image.complete)return;
 await new Promise(resolve=>{image.addEventListener('load',resolve,{once:true});image.addEventListener('error',resolve,{once:true})});
}
function campaignGroundReady(){
 const left=cam.x-screenW/2/cam.z,right=cam.x+screenW/2/cam.z,top=cam.y-screenH/2/cam.z,bottom=cam.y+screenH/2/cam.z;
 let visible=GROUND_DATA.chunks.filter(q=>q.x+q.w>left&&q.x<right&&q.y+q.h>top&&q.y<bottom);
 if(cam.z<.55||visible.length>14)visible=[groundOverview];
 return visible.every(meta=>{const entry=groundChunks.get(meta.name);return entry&&!entry.loading&&(!!entry.canvas||entry.failed)});
}
function setCampaignProgress(value,stage){
 const fill=document.getElementById('campaignProgressFill'),label=document.getElementById('campaignProgressText');
 if(fill){fill.style.width=value+'%';fill.parentElement.setAttribute('aria-valuenow',String(Math.round(value)));fill.classList.toggle('pending',value<100)}
 if(label)label.textContent=(typeof appSettings!=='undefined'&&appSettings.language==='en'?stage[1]:stage[0])+' · '+Math.round(value)+'%';
}
async function runCampaignLoading(action){
 if(campaignLoading)return false;
 campaignLoading=true;const cover=document.getElementById('campaignLoading');cover.classList.add('active');cover.setAttribute('aria-hidden','false');
 try{
  setCampaignProgress(3,['작전 준비 중','Preparing operation']);
  await decodeCampaignImage(document.getElementById('campaignLoadingImage'));
  // Yield twice so the cover is painted before synchronous setup or save migration.
  await campaignFrame();await campaignFrame();
  setCampaignProgress(10,['지도 생성 중','Building map']);const result=action();campaignRenderedFrames=0;if(result===false)return false;
  const images=[...campaignImages];let decoded=0;await Promise.all(images.map(async image=>{await decodeCampaignImage(image);setCampaignProgress(25+45*(++decoded/Math.max(1,images.length)),['이미지 불러오는 중','Loading artwork'])}));
  if(!worldImg.naturalWidth)throw new Error('World map image could not be decoded');
  if(document.fonts)await document.fonts.ready;
  setCampaignProgress(75,['지도·유닛 렌더링 중','Rendering map and units']);let stable=0,previous='';
  while(stable<2){await campaignFrame();const key=[cam.x,cam.y,cam.z,c.width,c.height,groundRevision,campaignRenderedFrames>0].join(':');if(campaignGroundReady()&&campaignRenderedFrames>0){stable=key===previous?stable+1:0;previous=key}else stable=0}
  setCampaignProgress(100,['준비 완료','Ready']);await campaignFrame();await campaignFrame();return result;
 }catch(error){console.error('Campaign loading failed',error);toast('작전을 불러오지 못했습니다');return false}
 finally{cover.classList.remove('active');cover.setAttribute('aria-hidden','true');campaignLoading=false}
}
