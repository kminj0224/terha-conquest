#!/usr/bin/env python3
"""Repackage the retained Android shell with current game assets and original signing key."""
import pathlib,zipfile,struct,subprocess,os,urllib.request
ROOT=pathlib.Path(__file__).resolve().parent;os.chdir(ROOT)
VERSION='1.11.92';CODE=237
subprocess.run(['python3','tools/prepare_operation_music.py'],check=True)
T=ROOT/'tools';T.mkdir(exist_ok=True)
for name,url in [('ecj.jar','https://repo.maven.apache.org/maven2/org/eclipse/jdt/ecj/3.33.0/ecj-3.33.0.jar'),('apksig.jar','https://repo.maven.apache.org/maven2/com/android/tools/build/apksig/2.3.0/apksig-2.3.0.jar')]:
 if not (T/name).exists():urllib.request.urlretrieve(url,T/name)
for d in ['android/build','deliverables']:(ROOT/d).mkdir(parents=True,exist_ok=True)
APP_NAME='테르하 : 낙원의 기억'
# Keep the installed Android launcher icon in the precompiled drawable slot.
# The source artwork is a compact WebP; the signed APK always contains a PNG.
LAUNCHER_PNG=subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-i','game/assets/launcher-icon.webp','-frames:v','1','-f','image2pipe','-vcodec','png','-'],stdout=subprocess.PIPE,check=True).stdout
assert LAUNCHER_PNG.startswith(b'\x89PNG\r\n\x1a\n'), 'Launcher icon conversion failed'
def manifest_version(data):
 # Rebuild the UTF-16 pool: the new label can exceed the retained shell's slot.
 b=bytearray(data);off=8;strings=[]
 while off<len(b):
  kind,head,size=struct.unpack_from('<HHI',b,off)
  if kind==1:
   count,styles,flags,start,style_start=struct.unpack_from('<IIIII',b,off+8)
   assert not flags&0x100 and styles==0 and style_start==0,'Expected unstyled UTF16 shell pool'
   offsets=[];pool=bytearray()
   for j in range(count):
    p=off+start+struct.unpack_from('<I',b,off+head+4*j)[0];n=struct.unpack_from('<H',b,p)[0];assert n<0x8000
    value=b[p+2:p+2+2*n].decode('utf-16le')
    value={'1.10.65':VERSION,'테르하: 전장의 국권':APP_NAME}.get(value,value)
    strings.append(value);offsets.append(len(pool));encoded=value.encode('utf-16le')
    pool+=struct.pack('<H',len(encoded)//2)+encoded+b'\0\0'
   pool+=bytes((-len(pool))%4)
   new_start=head+4*count;new_size=new_start+len(pool)
   chunk=bytearray(b[off:off+head]);struct.pack_into('<I',chunk,4,new_size);struct.pack_into('<I',chunk,20,new_start)
   chunk+=struct.pack('<'+'I'*count,*offsets)+pool
   b[off:off+size]=chunk;struct.pack_into('<I',b,4,len(b));size=new_size
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
  if p.is_file() and not p.name.startswith("."):
   i=zipfile.ZipInfo('assets/'+p.name);i.compress_type=zipfile.ZIP_DEFLATED;entries.append((i,p.read_bytes()))
 for i,data in entries:
  if i.filename=='AndroidManifest.xml':data=manifest_version(data)
  elif i.filename=='res/drawable/icon.png':data=LAUNCHER_PNG
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
  if p.is_file() and not p.name.startswith("."):assert z.read('assets/'+p.name)==p.read_bytes(),p
print(result)




















