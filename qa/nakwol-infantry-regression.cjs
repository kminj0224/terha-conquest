const assert = require('assert');
module.exports = function({run}){
 const report = run(`(()=>{
   const check=(ok,message)=>{if(!ok)throw Error(message)};
   const files=[
     ['grenadier',8,'nakwol-grenadier-idle.webp','nakwol-grenadier-fire.webp'],
     ['antitank',9,'nakwol-antitank-idle.webp','nakwol-antitank-fire.webp'],
     ['machinegun',10,'nakwol-machinegun.webp','nakwol-machinegun.webp']
   ];
   const report={};
   for(const [name,type,idle,fire] of files){
     const unit={f:5,type,level:1,tile:0,hp:95},
       profile=infantryArtProfile(unit);
     check(profile&&profile.art, 'Nakwol artwork profile missing: '+name);
     check(profile.art.idleReady&&profile.art.fireReady,'Nakwol art failed loading: '+name);
     check(profile.art.idle.src===idle&&profile.art.fire.src===fire,'Wrong Nakwol artwork: '+name);
     check(profile.art.idle.naturalWidth===768&&profile.art.idle.naturalHeight===576,
       'Nakwol idle image dimensions: '+name);
     check(profile.art.fire.naturalWidth===768&&profile.art.fire.naturalHeight===576,
       'Nakwol firing image dimensions: '+name);
     check(Array.isArray(profile.muzzles)&&profile.muzzles.length>0,'Missing attack muzzle: '+name);
     report[name]=[profile.art.idle.naturalWidth,profile.art.idle.naturalHeight];
   }
   const rifle=infantryArtProfile({f:5,type:0});
   check(rifle.art.idleReady&&rifle.art.fireReady,'Original Nakwol rifle sprites lost');
   check(NAKWOL_INFANTRY_SCALE===1.1,'Nakwol rifle/squad scale changed');
   check(NAKWOL_INFANTRY_PROFILES[10].width===69&&NAKWOL_INFANTRY_PROFILES[10].height===52,
     'Nakwol MG soldier sizing must be independent of transparent frame and tripod');
   check(NAKWOL_INFANTRY_PROFILES[8].projectile==='baekGrenade' &&
         NAKWOL_INFANTRY_PROFILES[9].projectile==='baekRocket' &&
         NAKWOL_INFANTRY_PROFILES[10].burst===true,
         'Infantry combat actions lost');
   check(!infantryArtProfile({f:0,type:8}).art.idle.src.includes('nakwol'),
     'Nakwol art must not overwrite Baek infantry');
   return report;
 })()`);
 assert.deepEqual(Object.keys(report).sort(),['antitank','grenadier','machinegun']);
 console.log('PASS: five Nakwol infantry images decoded, grenade/rocket/MG profiles and figure-relative sizing:',report);
};
