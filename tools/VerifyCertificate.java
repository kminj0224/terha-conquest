import java.io.*;
import java.nio.file.*;
import java.util.*;
import com.android.apksig.*;
public class VerifyCertificate {
 public static void main(String[] args) throws Exception {
  ApkVerifier.Result r=new ApkVerifier.Builder(new File(args[0])).setMinCheckedPlatformVersion(26).setMaxCheckedPlatformVersion(35).build().verify();
  if(!r.isVerified())throw new RuntimeException("Invalid signature "+r.getErrors());
  if(!Arrays.equals(r.getSignerCertificates().get(0).getEncoded(),Files.readAllBytes(Paths.get("tools/cert.der"))))throw new RuntimeException("Original certificate differs");
  System.out.println("Valid APK signature; original update certificate retained");
 }
}
