package android.webkit;
/** Compile-only API 17 signatures, excluded from classes.dex. Android supplies this class. */
public abstract class WebSettings {
 public abstract void setJavaScriptEnabled(boolean enabled);
 public abstract void setDomStorageEnabled(boolean enabled);
 public abstract void setDatabaseEnabled(boolean enabled);
 public abstract void setDatabasePath(String path);
 public abstract void setAllowFileAccess(boolean enabled);
 public abstract void setAllowContentAccess(boolean enabled);
 public abstract void setAllowFileAccessFromFileURLs(boolean enabled);
 public abstract void setAllowUniversalAccessFromFileURLs(boolean enabled);
 public abstract void setMediaPlaybackRequiresUserGesture(boolean enabled);
}
