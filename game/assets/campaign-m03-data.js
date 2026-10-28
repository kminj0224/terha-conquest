'use strict';
IRON_CROWN_CAMPAIGN.implementedMissions=[1,2,3];
Object.assign(IRON_CROWN_CAMPAIGN.missions[2],{status:'playable',objective:'중앙역·신호소를 확보하고 5턴 동안 방어',design:'26×18 철도 야적장. 두 거점 동시 점령 뒤 방어전으로 전환. 병력 하역/왕실 화물 우선 선택, 반응형 반격. 일반 병력은 임무별 편성, 철관·연구·자원만 계승.'});
IRON_CROWN_CAMPAIGN.battle3={
 id:'iron-crown-m03',schema:2,starTurns:[50,35,24],enemyGoldCeiling:500,holdRequired:5,
 map:{origin:{x:40,y:30},cols:26,rows:18,image:'campaign-m03-map.webp'},player:2,
 fortress:{type:14,q:2,r:8,name:'〈철관〉'},exit:{q:23,r:9},
 cities:[['서부 화물기지',2,10,2,2,3,true,null],['중앙역',13,9,1,2,3,false,1600],['신호소',18,6,1,2,2,false,1200],['남부 하역장',10,14,1,2,2,false,900],['동부 차량기지',23,10,1,1,1,false,2000],['서부 정비소',4,13,2,2,3,false,null]],
 friendly:[[0,3,9],[0,3,10],[9,2,11],[2,4,9]],
 enemy:[[0,17,5],[0,15,10],[0,8,9],[10,10,8],[9,11,10],[2,14,8],[0,13,10],[1,16,9],[9,17,6],[10,18,7],[16,19,5],[0,10,13],[12,11,14],[2,22,11],[1,22,8],[0,21,10]],
 hardExtra:[[9,12,7],[2,18,5],[1,20,11]],
 triggers:[{id:'loading-yard',city:3,owner:2,message:'남부 하역장 확보'}],
 waves:[
  {turn:6,stage:'approach',name:'북부 선로 경계대',edge:'north',entry:{q:17,r:2},troops:[0,0,9,12,2]},
  {turn:11,stage:'station',name:'중앙역 탈환대',edge:'east',entry:{q:23,r:7},troops:[0,0,1,2,9,10]},
  {turn:17,stage:'hold2',name:'남부 우회 기동대',edge:'southwest',entry:{q:12,r:15},troops:[0,0,0,9,2,12]},
  {turn:20,stage:'hold4',name:'철도 기갑 예비대',edge:'split',entry:{q:23,r:10},troops:[0,0,0,1,14,2,9,10]}
 ]
};
IRON_CROWN_CAMPAIGN.intro3=[
 {speaker:'',scene:'field',text:'화물역 외곽에서 선로가 세 갈래로 나뉘었다. 청회색 고가 배관 아래로 꺼진 신호등이 늘어서 있었고, 중앙역의 유리벽에는 제국군의 차량 번호가 비쳤다.'},
 {speaker:'kessel',scene:'field',text:'서쪽 하역장은 우리 손에 있습니다. 중앙 분기기가 동쪽으로 잠겨 있어서 기관차를 더 넣을 수는 없습니다.'},
 {speaker:'edric',scene:'field',text:'역 건물만 잡으면 되나?'},
 {speaker:'kessel',scene:'field',text:'신호소도 필요합니다. 역에서 열어도 저쪽에서 다시 잠글 수 있습니다. 두 군데를 같이 잡아야 합니다.'},
 {speaker:'',scene:'room',text:'로제나는 회색 정장 소매의 물기를 닦고 단말기를 지휘 탁자에 연결했다. 배차표의 여섯 줄이 푸른 화면 위에 나타났다.'},
 {speaker:'rozena',scene:'room',text:'왕실 화물 여섯 편성입니다. 빈 화차와 고정 장치를 먼저 보내라는 공창의 요청이 들어왔습니다.'},
 {speaker:'edric',scene:'room',text:'내 증원 편성은 어디 있소?'},
 {speaker:'rozena',scene:'room',text:'서부 인입선에 있습니다. 같은 하역선과 견인차를 씁니다.'},
 {speaker:'kessel',scene:'room',text:'분기기 구동부 둘이 나갔습니다. 지금 인원으로는 한쪽씩만 풀 수 있습니다.'},
 {speaker:'edric',scene:'room',text:'병력부터 내려야 역을 지키지. 화차를 비워 놓는다고 제국군이 물러가는 건 아니오.'},
 {speaker:'rozena',scene:'room',text:'공창의 물건을 실을 차량이 없으면 역을 잡아도 반출은 못 합니다. 제 담당 항목도 비어 있군요.'},
 {speaker:'',scene:'room',text:'케셀은 배차표 옆에 하역선 도면을 겹쳤다. 청회색 작업복의 소매 끝이 화면의 남쪽 지선을 가렸다.'},
 {speaker:'kessel',scene:'room',text:'남부 하역장을 잡으면 사용할 면적은 늘어납니다. 다만 중앙 신호는 그대로 저쪽 손입니다.'},
 {speaker:'edric',scene:'room',text:'우선순위 하나만 정하시오. 두 가지를 동시에 약속한 서류는 받지 않겠소.'},
 {speaker:'rozena',scene:'room',text:'병력 하역을 먼저 하면 호송 장비 편성은 대기합니다. 왕실 화물을 먼저 하면 증원 하역이 뒤로 갑니다. 비용과 배차 기록은 구분해 두겠습니다.'},
 {speaker:'',scene:'field',text:'중앙역의 확성기에서 통신 주파수가 흘러나왔다. 에드릭이 차량 안의 수신기를 돌리자 세베린 아슈의 목소리가 들렸다.'},
 {speaker:'severin',scene:'field',text:'해당 선로의 운행은 제국 회랑 파견군이 관리한다. 승인 없는 입환과 하역을 중단하라.'},
 {speaker:'edric',scene:'field',text:'왕실 철도의 배차표를 가지고 왔다. 신호를 해제해라.'},
 {speaker:'severin',scene:'field',text:'선로 소유권과 운행 통제는 별개의 항목이다. 귀 부대가 이미 점유한 서부 하역장도 인계 대상에 포함된다.'},
 {speaker:'rozena',scene:'field',text:'그 통보는 수령했습니다. 인계 동의로 기록하지는 마십시오.'},
 {speaker:'',scene:'field',text:'통신이 끊겼다. 신호소 북쪽의 인입선에서 장갑차가 움직였고, 역 남쪽에서는 견인포의 차륜이 화물차 사이로 보였다.'},
 {speaker:'kessel',scene:'room',text:'중앙역과 신호소를 유지한 상태로 다섯 차례 교대가 지나면 분기기 시험을 끝낼 수 있습니다. 하나라도 넘어가면 시험부터 다시 해야 합니다.'},
 {speaker:'edric',scene:'room',text:'먼저 두 군데를 잡는다. 생산 기지는 서쪽에 남겨 두고, 신호소 뒤로 돌아오는 길도 감시해.'},
 {speaker:'rozena',scene:'room',text:'배차 우선순위를 등록하겠습니다. 하역 결과는 역 인계서에 첨부하겠습니다.'},
 {speaker:'',scene:'field',text:'서부 기지의 차단봉이 올라갔다. 젖은 선로 옆으로 보병들이 흩어졌고, 〈철관〉의 푸른 관측등이 중앙역 방향으로 돌아갔다.'}
];
