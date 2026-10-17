'use strict';
function isWindowClass(e,name){return (' '+(e.className||'')+' ').includes(' '+name+' ')}
function closeAppWindow(){
 if(appConfirm){appConfirm(false);return}
 if(appScreen==='game'){menuMode=false;$('modal').style.display='none';refreshSelection();return}
 if(appScreen==='menu'){setAppScreen('game');return}
 if(appScreen==='result'){showHub();return}
 returnAppScreen(appReturn);
}
function decorateAppWindow(box,isPanel=false){
 if(!box||['landing','countryPage','recordsPage','confirmBox'].some(name=>isWindowClass(box,name)))return;
 const children=[...box.children];if(children.some(e=>isWindowClass(e,'windowHeader')))return;
 let close=children.find(e=>e.tagName==='BUTTON'&&isWindowClass(e,'close'));
 const title=children.find(e=>e.tagName==='H1'||e.tagName==='H2');
 if(!close){close=document.createElement('button');close.className='close';close.textContent='×';close.onclick=isPanel?()=>{panelOpen=false;refreshSelection()}:closeAppWindow}
 close.setAttribute('aria-label',tr('닫기','Close'));close.setAttribute('title',tr('닫기','Close'));
 const header=document.createElement('header');header.className='windowHeader';
 if(title)header.appendChild(title);else{const label=document.createElement('h2');label.textContent=tr('정보','Information');header.appendChild(label)}
 header.appendChild(close);
 const footer=children.find(e=>isWindowClass(e,'operationActions'));
 const content=document.createElement('div');content.className='windowContent';
 for(const node of [...box.childNodes])if(node!==title&&node!==close&&node!==footer)content.appendChild(node);
 box.appendChild(header);box.appendChild(content);if(footer)box.appendChild(footer);box.classList.add('windowFrame');
 if(isPanel&&box.style.display!=='none')box.style.display='flex';
}
function refreshWindowChrome(){
 for(const box of [...$('modal').children])if(isWindowClass(box,'box'))decorateAppWindow(box);
 if($('panel').children.length)decorateAppWindow($('panel'),true);
}
// Decorate after the complete panel builder has attached its controls and listeners.
for(const name of ['showPanel','showMenu','showSettings','showHelp','showRecords','showSaveSlots','showDiplomacy','showNuclearOverview','showBase','defenseMenu','showProductionInfo','endModal']){
 const original=window[name];if(typeof original!=='function')continue;
 window[name]=function(...args){const result=original.apply(this,args);refreshWindowChrome();return result};
}
if(typeof MutationObserver==='function'){
 let queued=false;const observer=new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;refreshWindowChrome()})});
 for(const node of [$('modal'),$('panel')])observer.observe(node,{childList:true,subtree:true});
}
$('menu').onclick=()=>showMenu();
$('coastBuild').onclick=()=>defenseMenu();
$('diplomacy').onclick=()=>showDiplomacy();
Object.assign(window.Terha,{showPanel,showMenu,showSettings,showHelp,showSaveSlots});
