import java.io.*;
import java.nio.file.*;
import java.security.*;
import java.security.spec.*;
import java.security.cert.*;
import java.util.*;
import com.android.apksig.*;
public class SignApk {
 public static void main(String[] args) throws Exception {
  PrivateKey key=KeyFactory.getInstance("RSA").generatePrivate(new PKCS8EncodedKeySpec(Files.readAllBytes(Paths.get("tools/key.der"))));
  X509Certificate cert=(X509Certificate)CertificateFactory.getInstance("X.509").generateCertificate(new FileInputStream("tools/cert.der"));
  ApkSigner.SignerConfig signer=new ApkSigner.SignerConfig.Builder("terha",key,Collections.singletonList(cert)).build();
  new ApkSigner.Builder(Collections.singletonList(signer)).setInputApk(new File(args[0])).setOutputApk(new File(args[1])).setMinSdkVersion(26).setV1SigningEnabled(true).setV2SigningEnabled(true).build().sign();
  ApkVerifier.Result r=new ApkVerifier.Builder(new File(args[1])).setMinCheckedPlatformVersion(26).setMaxCheckedPlatformVersion(35).build().verify();
  System.out.println("Verified="+r.isVerified()+" v1="+r.isVerifiedUsingV1Scheme()+" v2="+r.isVerifiedUsingV2Scheme());
  System.out.println("Errors: "+r.getErrors());if(!r.isVerified())throw new RuntimeException("Signature failed");
 }
}
