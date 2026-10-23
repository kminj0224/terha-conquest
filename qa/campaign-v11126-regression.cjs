module.exports=async function({run}){
 run(`(()=>{
  const check=(v,m)=>{if(!v)throw Error(m)};
  setup();
  const oldCities=cities,oldPlayer=player,oldRelations=diplomacy.map(row=>row.slice());
  try{
   player=0;check(!rannaPostNakwolWar(),'Nakwol alive must prevent expansion');
   cities=cities.filter(q=>q.f!==5);
   check(rannaPostNakwolWar(),'AI Ranna must expand after Nakwol falls');
   for(const f of [0,1,2,3,6])check(atWar(4,f)&&atWar(f,4),'Symmetric war with survivor '+f);
   check(!rannaPostNakwolWar(),'Repeat must be idempotent');
   diplomacy=oldRelations.map(row=>row.slice());player=4;
   check(!rannaPostNakwolWar()&&diplomacy[4][0]==='neutral','Player Ranna diplomacy must stay manual');
   player=0;cities=cities.filter(q=>q.f!==4);check(!rannaPostNakwolWar(),'Defeated Ranna cannot declare');
  }finally{cities=oldCities;player=oldPlayer;diplomacy=oldRelations}
  const key=CAMPAIGN_LOADING_ART_KEY,old=localStorage.getItem(key),next=campaignLoadingArtNext;
  try{
   localStorage.setItem(key,'0');
   const expected=['campaign-loading.png','campaign-loading-baek.jpg','campaign-loading-guerrillas.jpg','campaign-loading-artillery.png','campaign-loading-bomber.png','campaign-loading.png'];
   for(const src of expected){check(selectCampaignLoadingArt().src===src,'Loading rotation order');check(document.getElementById('campaignLoadingImage').src===src,'Selected cover');}
   campaignLoadingArtNext=0;check(selectCampaignLoadingArt().src==='campaign-loading-baek.jpg','Rotation survives runtime reset');
   localStorage.setItem(key,'invalid');selectCampaignLoadingArt();
  }finally{campaignLoadingArtNext=next;if(old===null)localStorage.removeItem(key);else localStorage.setItem(key,old)}
  setup();
 })()`);
 console.log('PASS: Ranna AI post-Nakwol wars, player and elimination exclusions, persistent loading artwork order and wrap');
};
