'use strict';
// Nakwol infantry: three-soldier artwork, aligned by figure scale rather
// than by weapon/tripod or spare transparent canvas area.
const nakwolGrenadierArt=loadBaekArt('nakwol-grenadier-idle.webp','nakwol-grenadier-fire.webp');
const nakwolAntitankArt=loadBaekArt('nakwol-antitank-idle.webp','nakwol-antitank-fire.webp');
const nakwolMachinegunArt=loadBaekArt('nakwol-machinegun.webp');
Object.assign(NAKWOL_INFANTRY_PROFILES,{
 8:{art:nakwolGrenadierArt,baseFacing:-1,
    // Grenade launcher muzzles measured in the FIRE artwork, not the idle one.
    muzzles:baekMuzzles([[29,69],[467,34],[933,80]]),
    projectile:'baekGrenade',flashAngle:.65},
 9:{art:nakwolAntitankArt,baseFacing:-1,
    muzzles:baekMuzzles([[18,277],[425,179],[895,344]]),
    projectile:'baekRocket'},
 10:{art:nakwolMachinegunArt,baseFacing:-1,
    // The centre gunner is ~8% shorter in source pixels than Baek's MG crew.
    // Enlarge by 8% to match SOLDIERS, not the tripod's complete silhouette.
    width:69,height:52,
    muzzles:baekMuzzles([[23,601]]),burst:true}
});
