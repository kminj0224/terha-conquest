module.exports=async function({run}){
await run(`(async()=>{
setup();busy=false;player=1;tech.fill(0);oil.fill(100000);food.fill(100000);units=[];
const auraCheck=(ok,m)=>{if(!ok)throw Error(m)};
const center=tiles.findIndex((t,i)=>t.owner===1&&!cityAt(i)&&!baseAt(i)&&t.terrain===1);
const ring=n=>tiles.findIndex((t,i)=>t.owner>=0&&!cityAt(i)&&!baseAt(i)&&distance(center,i)===n);
const tank=makeUnit(1,1,center),commando=makeUnit(1,17,ring(2));
const baseAttack=supportUnitAttack(tank),baseDef=TYPES[1].def;
auraCheck(unitAttack(tank)===Math.round(baseAttack*1.5),'Dante attack at exact radius 2');
const duplicate=makeUnit(1,17,ring(1));auraCheck(unitAttack(tank)===Math.round(baseAttack*1.5),'No attack stacking');duplicate.hp=0;
commando.tile=ring(3);auraCheck(unitAttack(tank)===baseAttack,'Attack removed outside range');
commando.tile=ring(2);commando.carriedBy=999;auraCheck(unitAttack(tank)===baseAttack,'Carried source excluded');delete commando.carriedBy;
commando.f=0;auraCheck(unitAttack(tank)===baseAttack,'Enemy source excluded');commando.f=1;
commando.hp=0;auraCheck(unitAttack(tank)===baseAttack,'Dead source excluded');commando.hp=130;
tank.carriedBy=999;auraCheck(unitAttack(tank)===baseAttack,'Carried recipient excluded');delete tank.carriedBy;
auraCheck(unitAttack({type:1,f:1,level:1})===supportUnitAttack({type:1,f:1,level:1}),'Production preview has no phantom aura');
commando.hp=0;const black=makeUnit(0,6,ring(2)),rifle=makeUnit(0,0,center),enemy=makeUnit(1,1,ring(1));
auraCheck(specialIncomingFactor(rifle)===.4,'Infantry shield at radius 2');
const normalDamage=supportDamage(enemy,rifle);auraCheck(damage(enemy,rifle)===Math.round(normalDamage*.4),'Exactly 60 percent less direct damage');
const normalCounter=Math.round(supportDamage(enemy,rifle)*.4);auraCheck(counterattackDamage(enemy,rifle,enemy.hp)===Math.round(damage(enemy,rifle)*.4),'Counterattack uses shield');
black.tile=ring(3);auraCheck(damage(enemy,rifle)===supportDamage(enemy,rifle),'Shield removed outside range');
black.tile=ring(2);black.carriedBy=999;auraCheck(specialIncomingFactor(rifle)===1,'Carried Black Legion excluded');delete black.carriedBy;
black.f=1;auraCheck(specialIncomingFactor(rifle)===1,'Shield only own faction');black.f=0;
auraCheck(specialIncomingFactor(tank)===1,'Shield excludes armor');black.hp=0;
const knight=makeUnit(2,18,ring(2));tank.f=2;
auraCheck(unitArmor(tank)===baseDef*2,'Knight doubles armor at radius 2');
const armoredDamage=damage(enemy,tank);knight.tile=ring(3);
auraCheck(unitArmor(tank)===baseDef&&damage(enemy,tank)>armoredDamage,'Armor and damage reset outside radius');
knight.tile=ring(2);knight.hp=0;auraCheck(unitArmor(tank)===baseDef,'Dead knight excluded');knight.hp=unitMaxHp(knight);
knight.carriedBy=999;auraCheck(unitArmor(tank)===baseDef,'Carried knight excluded');delete knight.carriedBy;
knight.f=1;auraCheck(unitArmor(tank)===baseDef,'Enemy knight excluded');knight.f=2;
const armoredCar=makeUnit(2,12,center);auraCheck(unitArmor(armoredCar)===TYPES[12].def*2,'Armor branch includes armored cars');
auraCheck(unitArmor(rifle)===TYPES[0].def,'Knight excludes infantry');
auraCheck(TYPES[1].def===baseDef,'Shared base armor untouched');
units=[];const traveler=makeUnit(1,15,center);
for(const ai of [false,true])for(const type of [15,16]){
 traveler.type=type;traveler.tile=center;freshOrders(traveler);moving=[];
 const destination=[...reachable(traveler).costs.keys()].find(i=>i!==center&&!cityAt(i)&&!baseAt(i));
 auraCheck(destination!==undefined&&moveUnit(traveler,destination,ai),'Move accepted');
 auraCheck(movingAnimation(traveler.id)?.duration===(ai?650:950),'Mortar matches towed travel duration');
}
moving=[];setup();return true;
})()`);
console.log('PASS: live two-tile attack/infantry damage/armor support, exit/death/transport/faction exclusions, no stacking/base stat mutation, mortar and towed movement timing');
};
