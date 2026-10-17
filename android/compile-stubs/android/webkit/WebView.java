package android.webkit;
import android.content.Context;
import android.view.View;
/** Compile-only API signatures. The platform supplies the runtime WebView. */
public class WebView extends View {
 public WebView(Context context){super(context);}
 public native WebSettings getSettings();
 public native void addJavascriptInterface(Object object,String name);
 public native void removeJavascriptInterface(String name);
 public native void setWebViewClient(WebViewClient client);
 public native void loadUrl(String url);
 public native void evaluateJavascript(String script,ValueCallback<String> callback);
 public native void onPause();
 public native void onResume();
 public native void pauseTimers();
 public native void resumeTimers();
 public native void destroy();
}
