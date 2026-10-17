'use strict';
// Nakwol keeps the Baekyang city artwork for every non-capital tier, recolored for its purple identity.
const NAKWOL_CITY_ART={5:loadBaekArt('nakwol-city-purple.png'),4:loadBaekArt('nakwol-city-purple4.png'),3:loadBaekArt('nakwol-city-purple3.png'),2:loadBaekArt('nakwol-city-purple-small.png')};
const previousPhotoCityProfile=photoCityProfile;
photoCityProfile=function(q){
 if(q?.origin===5&&!q.capital&&q.name!=='낙월성'){
  const profile=baekCityProfile(q);
  return{...profile,art:NAKWOL_CITY_ART[profile.key]||profile.art};
 }
 return previousPhotoCityProfile(q);
};
Object.assign(window.Terha,{photoCityProfile,NAKWOL_CITY_ART});
