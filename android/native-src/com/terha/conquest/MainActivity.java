package com.terha.conquest;

import android.app.Activity;
import android.os.Bundle;
import android.content.Intent;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/** The WebView is created once per Activity; returning from Home never reloads it. */
public class MainActivity extends Activity {
    private WebView web;
    private void immersive() {
        getWindow().setFlags(1024,1024);
        getWindow().getDecorView().setSystemUiVisibility(5894);
    }
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        immersive();
        web=new WebView(this);
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
        web.loadUrl("file:///android_asset/index.html"+(state!=null?"#resume":""));
    }
    @Override public void onBackPressed() {
        if(web!=null)web.loadUrl("javascript:window.terhaBack&&window.terhaBack()");
    }
    @Override protected void onPause() {
        if(web!=null){web.loadUrl("javascript:window.terhaBackground&&window.terhaBackground()");web.onPause();}
        super.onPause();
    }
    @Override protected void onResume() {
        super.onResume();
        immersive();
        if(web!=null){web.onResume();web.loadUrl("javascript:window.terhaForeground&&window.terhaForeground()");}
    }
    @Override protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        // The launcher can deliver a new intent to the existing Activity. Keep the page intact.
    }
    @Override public void onWindowFocusChanged(boolean focused) {
        super.onWindowFocusChanged(focused);
        if(focused)immersive();
    }
    @Override protected void onDestroy() {
        if(web!=null){web.removeJavascriptInterface("TerhaNative");web.destroy();web=null;}
        super.onDestroy();
    }
    public final class ExitBridge {
        @JavascriptInterface public void exitGame() {
            runOnUiThread(new Runnable(){public void run(){finish();}});
        }
    }
}
