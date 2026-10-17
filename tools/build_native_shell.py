#!/usr/bin/env python3
"""Recompile only the Activity DEX; retain the original manifest, resources, and app identity."""
import os,pathlib,subprocess,urllib.request,zipfile,hashlib,shutil
ROOT=pathlib.Path(__file__).resolve().parents[1]
os.chdir(ROOT)
for name,url,sha in [('android-stubs.jar', 'https://repo.maven.apache.org/maven2/com/google/android/android/4.1.1.4/android-4.1.1.4.jar', '84072541cbb711eff89f7277100ff854929a446dba7ceb1b195c340e0b4fd3cb'), ('dx.jar', 'https://repo.maven.apache.org/maven2/com/google/android/tools/dx/1.7/dx-1.7.jar', '923302e666d76e126e4cdf7129318532b258b1a66e435b92ccc29e91a60357bf')]:
 p=ROOT/'tools'/name
 if not p.exists():urllib.request.urlretrieve(url,p)
 if hashlib.sha256(p.read_bytes()).hexdigest()!=sha:raise RuntimeError(name+' checksum mismatch')
j=pathlib.Path(os.environ.get('JAVA_HOME','/usr/lib/jvm/java-17-openjdk-amd64'));env=os.environ.copy();env['LD_LIBRARY_PATH']=str(j/'lib')+':'+str(j/'lib/server');java=str(j/'bin/java')
classes=ROOT/'android/build/native-classes'
if classes.exists():shutil.rmtree(classes)
classes.mkdir(parents=True,exist_ok=True)
sources=[str(p)for base in ['android/native-src','android/compile-stubs']for p in pathlib.Path(base).rglob('*.java')]
subprocess.run([java,'-jar','tools/ecj.jar','-1.6','-classpath','tools/android-stubs.jar','-d',str(classes),*sources],env=env,check=True)
dex=ROOT/'android/build/native-classes.dex'
archive=ROOT/'android/build/native-classes.jar'
with zipfile.ZipFile(archive,'w')as z:
 for p in (classes/'com').rglob('*.class'):z.write(p,p.relative_to(classes).as_posix())
subprocess.run([java,'-cp','tools/dx.jar','com.android.dx.command.Main','--dex','--output='+str(dex),str(archive)],env=env,check=True)
p=ROOT/'android/native-shell.zip'
with zipfile.ZipFile(p)as z:entries=[(i,z.read(i))for i in z.infolist()]
with zipfile.ZipFile(p,'w',zipfile.ZIP_DEFLATED)as z:
 for i,data in entries:z.writestr(i,dex.read_bytes()if i.filename=='classes.dex'else data)
print('Native shell rebuilt; resources and application identity retained')
