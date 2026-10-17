'use strict';
// Keep the live WebView. Returning to it never loads a save or changes screens.
// Remove only the obsolete v1.10.70 recovery marker; ordinary save slots are untouched.
try{localStorage.removeItem('terha-background-session')}catch{}
window.terhaBackground=function(){applyAppAudio()};
window.terhaForeground=function(){applyAppAudio()};
