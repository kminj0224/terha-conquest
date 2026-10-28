'use strict';
// Scenario data only: all unit orders, combat, economy and UI use conquest rules.
IRON_CROWN_CAMPAIGN.implementedMissions=[1,2];
Object.assign(IRON_CROWN_CAMPAIGN.missions[1],{status:'playable',objective:'관문·남부 보급소 확보, 반격 격퇴 후 철관 동쪽 이탈',design:'24×16 장소 지도. 통행료 600골드/외곽 탈환 선택. 다방향 웨이브는 기본 일정 또는 전선 진출·목표 점령에 반응해 조기 진입. 관문·남부 보급소 확보, 반격 격퇴와 철관 이탈로 즉시 승리. 턴 하한·강제 유지·대기 조건 없음. 전력과 전선 부담으로 20턴 이상의 플레이를 목표로 밸런싱. 초기 전력만으로 버티기 어려운 대전차·포병·측면 공격. 생산과 후방 방어 필요.'});
IRON_CROWN_CAMPAIGN.battle2={
 id:'iron-crown-m02',schema:2,enemyGoldCeiling:500,map:{origin:{x:40,y:30},cols:24,rows:16,image:'campaign-m02-map-v3.webp'},player:2,
 fortress:{type:14,q:2,r:8,name:'〈철관〉'},exit:{q:22,r:7},
 cities:[['서부 전진기지',2,9,2,2,3,true,null],['관문 외곽 진지',12,7,1,2,2,false,1800],['남부 보급소',11,11,1,2,2,false,1200],['북부 포대',14,3,1,1,1,false,1600],['동부 군용도로',20,7,1,1,1,false,2000]],
 friendly:[[0,3,8],[0,3,9],[2,2,7]],
 enemy:[[0,7,8],[12,8,7],[9,10,7],[10,12,8],[16,14,4],[9,13,4],[0,11,12],[8,12,11],[1,18,7],[9,19,8]],hardExtra:[[9,13,6],[2,16,8]],
 triggers:[{id:'depot',city:2,owner:2,message:'남부 보급소 확보'},{id:'battery',city:3,owner:2,message:'북부 포대 확보'}],
 waves:[
  {turn:5,name:'동부 선발대',edge:'east',troops:[0,12,8,9]},
  {turn:9,name:'북부 대전차·포병대',edge:'north',troops:[9,9,16,2,0]},
  {turn:13,name:'남부 우회대',edge:'southwest',troops:[11,12,8,0]},
  {turn:17,name:'동부 기갑대·남부 측면대',edge:'split',troops:[1,13,9,0,11,16]},
  {turn:20,name:'관문 탈환대',edge:'split',troops:[14,1,9,2,16,0,8]}
 ]
};
IRON_CROWN_CAMPAIGN.intro2=[
 {speaker:'',scene:'field',text:'관문도시의 바깥길에서 행군이 멎었다. 성벽 위에는 왕국의 깃발이 걸려 있었지만, 문 앞의 차단기는 내려가 있었다.'},
 {speaker:'kessel',scene:'field',text:'문 폭은 충분합니다. 다만 저 차단기를 둔 채로 지나가면 앞쪽 냉각관부터 찢어집니다.'},
 {speaker:'edric',scene:'field',text:'왕실 인가서를 보내라. 문을 열고 통행 담당자를 내보내라고 전해.'},
 {speaker:'steward',scene:'field',text:'관문 영주 각하의 집사입니다. 인가서는 받았습니다. 각하께서는 왕명을 부정하지 않으십니다.'},
 {speaker:'edric',scene:'field',text:'그렇다면 문이 닫혀 있을 이유가 없겠군.'},
 {speaker:'steward',scene:'field',text:'북쪽 포대와 남쪽 보급소를 제국군이 점거했습니다. 문을 여는 순간 성내 창고까지 포격에 노출됩니다.'},
 {speaker:'rozena',scene:'room',text:'서신에는 왕실의 재산 조사에 응할 수 없다는 문장도 있습니다. 포대와는 별개의 사안이군요.'},
 {speaker:'steward',scene:'room',text:'가문의 창고를 왕실 창고로 기재한 조사서에는 서명할 수 없습니다. 원정군의 비용을 저희 영지에서 충당하는 일도 마찬가지입니다.'},
 {speaker:'edric',scene:'room',text:'우리는 창고를 접수하러 온 것이 아니오. 공창으로 가는 길을 요구하는 거요.'},
 {speaker:'steward',scene:'room',text:'통행에 필요한 경비 비용을 지급하시면 중앙 집결 구역을 개방하겠습니다. 외곽 보급소를 되찾아 주셔도 됩니다.'},
 {speaker:'rozena',scene:'room',text:'금액은 육백. 지급 항목은 통행 경비로 한정하겠습니다. 왕실 자산에 대한 조사권의 포기는 포함하지 않습니다.'},
 {speaker:'steward',scene:'room',text:'그 문구라면 각하께 전달할 수 있습니다. 외곽 탈환을 택하시면 보급소 사용권을 드리겠습니다.'},
 {speaker:'',scene:'room',text:'집사의 통신이 끊기자 케셀이 도로 도면을 펼쳤다. 가운데 길에서 갈라진 두 갈래가 성벽 바깥으로 길게 돌아갔다.'},
 {speaker:'kessel',scene:'room',text:'북쪽 길은 포대 아래입니다. 남쪽은 돌아가지만 서쪽 기지로 다시 이어집니다. 어느 쪽도 막아 놓을 길은 아닙니다.'},
 {speaker:'edric',scene:'room',text:'중앙만 뚫고 지나가면 뒤가 잘리겠군. 서쪽에는 무엇이 있나?'},
 {speaker:'kessel',scene:'room',text:'우리 선발대가 잡아 둔 기지가 있습니다. 남쪽 길이 그 기지 뒤편으로 나옵니다.'},
 {speaker:'rozena',scene:'room',text:'통행료를 지급하면 관문 앞에서 전개할 수 있습니다. 외곽을 탈환하면 자금을 남기는 대신 길을 직접 확보해야 합니다.'},
 {speaker:'edric',scene:'room',text:'어느 쪽이든 내 병력을 영주의 수비대에 편입시키지는 않겠소. 그 조건도 적으시오.'},
 {speaker:'rozena',scene:'room',text:'지휘권은 베른 경에게 유지됩니다. 보급소 사용 기한은 원정군의 통과 완료까지로 고쳤습니다.'},
 {speaker:'',scene:'field',text:'관측수가 동쪽 도로의 차량 행렬을 보고했다. 북쪽 포대에서는 견인 차량들이 포신을 돌리고 있었다.'},
 {speaker:'kessel',scene:'field',text:'기관을 세우지는 않겠습니다. 이 자리에 오래 서면 북쪽에서 우리 갑판이 보입니다.'},
 {speaker:'edric',scene:'field',text:'포대 사거리 밖으로 옮겨라. 전진할 부대와 서쪽을 지킬 부대를 나눈다.'},
 {speaker:'rozena',scene:'field',text:'집사에게 서명한 조건서를 보내겠습니다. 관문과 남쪽 보급소의 인계 확인은 각각 받아 두어야 합니다.'},
 {speaker:'edric',scene:'field',text:'길을 열고 다시 빼앗기지 않는 것이 먼저다. 〈철관〉만 통과했다고 행군이 끝나는 것은 아니야.'},
 {speaker:'',scene:'field',text:'서쪽 기지에서 신호기가 올라갔다. 에드릭은 도면의 중앙 교차로와 남쪽 길을 차례로 짚고 명령서를 넘겼다.'}
];
