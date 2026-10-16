import java.io.*;
import java.util.*;
import com.android.apksig.*;
public class VerifyUpdate {
 public static void main(String[] args) throws Exception {
  ApkVerifier.Result a=new ApkVerifier.Builder(new File(args[0])).setMinCheckedPlatformVersion(26).setMaxCheckedPlatformVersion(35).build().verify();
  ApkVerifier.Result b=new ApkVerifier.Builder(new File(args[1])).setMinCheckedPlatformVersion(26).setMaxCheckedPlatformVersion(35).build().verify();
  if(!a.isVerified()||!b.isVerified())throw new RuntimeException("Invalid APK signature "+a.getErrors()+b.getErrors());
  if(!Arrays.equals(a.getSignerCertificates().get(0).getEncoded(),b.getSignerCertificates().get(0).getEncoded()))throw new RuntimeException("Update certificates differ");
  System.out.println("Both APK signatures valid; identical update certificate");
 }
}
