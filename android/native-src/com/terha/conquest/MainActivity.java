package com.terha.conquest;

import android.app.Activity;
import android.os.Bundle;
import android.content.Intent;
import android.content.MutableContextWrapper;
import android.view.ViewGroup;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.lang.ref.WeakReference;

/** Retain the running JS world across Activity recreation, not only saved game data. */
public class MainActivity extends Activity {
    private static WebView retainedWeb;
    private static MutableContextWrapper retainedContext;
    private static WeakReference<MainActivity> owner=new WeakReference<MainActivity>(null);
    private static boolean quitting;
    private WebView web;

    private void immersive() {
        getWindow().setFlags(1024,1024);
        getWindow().getDecorView().setSystemUiVisibility(5894);
    }
    private static void detach(WebView view) {
        if(view!=null&&view.getParent() instanceof ViewGroup)((ViewGroup)view.getParent()).removeView(view);
    }
    private void notifyGame(String callback) {
        if(web!=null)web.evaluateJavascript("window."+callback+"&&window."+callback+"()",null);
    }
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        immersive();
        // Home/Recents and Activity recreation reattach this exact live WebView.
        // No asset URL, START page, setup(), or load() is called in the retained path.
        if(retainedWeb!=null&&!quitting){
            web=retainedWeb;
            detach(web);
            retainedContext.setBaseContext(this);
            owner=new WeakReference<MainActivity>(this);
            setContentView(web);
            return;
        }
        quitting=false;
        retainedContext=new MutableContextWrapper(this);
        web=new WebView(retainedContext);
        retainedWeb=web;
        owner=new WeakReference<MainActivity>(this);
        web.setBackgroundColor(0xff101719);
        WebSettings settings=web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setDatabasePath(getFilesDir().getAbsolutePath());
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(false);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setMediaPlaybackRequiresUserGesture(false);
        web.addJavascriptInterface(new ExitBridge(),"TerhaNative");
        web.setWebViewClient(new WebViewClient());
        setContentView(web);
        // A genuinely new session starts at START; automatic save recovery was removed.
        web.loadUrl("file:///android_asset/index.html");
    }
    @Override public void onBackPressed() {notifyGame("terhaBack");}
    @Override protected void onPause() {
        if(web!=null){notifyGame("terhaBackground");web.onPause();web.pauseTimers();}
        super.onPause();
    }
    @Override protected void onResume() {
        super.onResume();
        immersive();
        if(web!=null){web.resumeTimers();web.onResume();notifyGame("terhaForeground");}
    }
    @Override protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        // Reopening from launcher or Recents must not navigate or initialize the game.
    }
    @Override public void onWindowFocusChanged(boolean focused) {
        super.onWindowFocusChanged(focused);
        if(focused)immersive();
    }
    @Override protected void onDestroy() {
        if(web!=null&&owner.get()==this){
            detach(web);
            owner.clear();
            if(quitting||isFinishing()){
                web.removeJavascriptInterface("TerhaNative");
                web.destroy();retainedWeb=null;retainedContext=null;
            }else{
                // Release the old Activity while retaining the JS heap, canvas and current actions.
                retainedContext.setBaseContext(getApplicationContext());
            }
        }
        web=null;
        super.onDestroy();
    }
    public static final class ExitBridge {
        @JavascriptInterface public void exitGame() {
            final MainActivity current=owner.get();
            if(current!=null)current.runOnUiThread(new Runnable(){public void run(){quitting=true;current.finish();}});
        }
    }
}
