#!/usr/bin/env python3
"""Repackage the retained Android shell with current game assets and original signing key."""
import pathlib,zipfile,struct,subprocess,os,urllib.request
ROOT=pathlib.Path(__file__).resolve().parent;os.chdir(ROOT)
VERSION='1.11.49';CODE=194
subprocess.run(['python3','tools/prepare_operation_music.py'],check=True)
T=ROOT/'tools';T.mkdir(exist_ok=True)
for name,url in [('ecj.jar','https://repo.maven.apache.org/maven2/org/eclipse/jdt/ecj/3.33.0/ecj-3.33.0.jar'),('apksig.jar','https://repo.maven.apache.org/maven2/com/android/tools/build/apksig/2.3.0/apksig-2.3.0.jar')]:
 if not (T/name).exists():urllib.request.urlretrieve(url,T/name)
for d in ['android/build','deliverables']:(ROOT/d).mkdir(parents=True,exist_ok=True)
def manifest_version(data):
 b=bytearray(data);off=8;strings=[]
 while off<len(b):
  kind,head,size=struct.unpack_from('<HHI',b,off)
  if kind==1:
   count,_,flags,start,_=struct.unpack_from('<IIIII',b,off+8)
   assert not flags&0x100,'Expected UTF16 Android shell string pool'
   for j in range(count):
    p=off+start+struct.unpack_from('<I',b,off+head+4*j)[0];n=struct.unpack_from('<H',b,p)[0];assert n<0x8000
    s=b[p+2:p+2+2*n].decode('utf-16le');strings.append(s)
    if s=='1.10.65':
     encoded=VERSION.encode('utf-16le')
     assert len(encoded)<=n*2,'App version longer than original manifest string slot'
     struct.pack_into('<H',b,p,len(VERSION))
     b[p+2:p+2+len(encoded)]=encoded
     b[p+2+len(encoded):p+2+2*n+2]=bytes(n*2+2-len(encoded))
  elif kind==0x102:
   start,asize,count=struct.unpack_from('<HHH',b,off+24)
   for j in range(count):
    p=off+16+start+j*asize;name=struct.unpack_from('<I',b,p+4)[0]
    if strings[name]=='versionCode':assert b[p+15]==0x10;struct.pack_into('<I',b,p+16,CODE)
  off+=size
 return bytes(b)
with zipfile.ZipFile('android/native-shell.zip') as base,zipfile.ZipFile('android/build/aligned.apk','w') as out:
 entries=[(i,base.read(i)) for i in base.infolist()]
 for p in sorted(pathlib.Path('game/assets').iterdir()):
  if p.is_file():
   i=zipfile.ZipInfo('assets/'+p.name);i.compress_type=zipfile.ZIP_DEFLATED;entries.append((i,p.read_bytes()))
 for i,data in entries:
  if i.filename=='AndroidManifest.xml':data=manifest_version(data)
  zi=zipfile.ZipInfo(i.filename);zi.compress_type=zipfile.ZIP_STORED if i.filename=='resources.arsc' else i.compress_type;zi.external_attr=i.external_attr
  if zi.compress_type==zipfile.ZIP_STORED:
   pos=out.fp.tell()+30+len(zi.filename.encode());pad=(-pos)%4
   if pad:zi.extra=struct.pack('<HH',0xcafe,pad)+bytes(pad)
  out.writestr(zi,data)
j=pathlib.Path(os.environ.get('JAVA_HOME','/usr/lib/jvm/java-17-openjdk-amd64'));java=str(j/'bin/java');env=os.environ.copy();env['LD_LIBRARY_PATH']=str(j/'lib')+':'+str(j/'lib/server')
subprocess.run([java,'-jar','tools/ecj.jar','-17','-classpath','tools/apksig.jar','-d','tools','tools/SignApk.java','tools/VerifyUpdate.java'],env=env,check=True)
result='deliverables/Terha-Conquest-v'+VERSION+'.apk'
subprocess.run([java,'--add-exports','java.base/sun.security.x509=ALL-UNNAMED','--add-exports','java.base/sun.security.util=ALL-UNNAMED','--add-exports','java.base/sun.security.pkcs=ALL-UNNAMED','-cp','tools:tools/apksig.jar','SignApk','android/build/aligned.apk',result],env=env,check=True)
with zipfile.ZipFile(result) as z:
 assert z.testzip() is None
 for p in pathlib.Path('game/assets').iterdir():
  if p.is_file():assert z.read('assets/'+p.name)==p.read_bytes(),p
print(result)


















