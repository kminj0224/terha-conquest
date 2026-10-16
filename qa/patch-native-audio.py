"""Patch the small retained v65 shell: enable menu autoplay and route Back to JS.
Reorders DEX string/method IDs and updates every affected reference/checksum.
The original setAllowContentAccess call already passes false; file:// assets do not
need content:// access, so that call can become the media gesture setting.
"""
import struct,hashlib,zlib,zipfile,pathlib
R=pathlib.Path(__file__).resolve().parents[1];p=R/'android/native-shell.zip'
with zipfile.ZipFile(p) as z:entries=[(i,z.read(i))for i in z.infolist()]
d=bytearray(next(data for i,data in entries if i.filename=='classes.dex'))
def u32(o):return struct.unpack_from('<I',d,o)[0]
def ul(o):
 v=0;s=0
 while True:
  b=d[o];o+=1;v|=(b&127)<<s;s+=7
  if b<128:return v,o

def leb(v):
 out=bytearray()
 while True:
  b=v&127;v>>=7;out.append(b|(128 if v else 0))
  if not v:return out
ns,so=struct.unpack_from('<II',d,56);strings=[]
for i in range(ns):o=u32(so+4*i);_,o=ul(o);strings.append(d[o:d.index(0,o)].decode())
if 'setMediaPlaybackRequiresUserGesture' in strings:print('Native audio already patched');raise SystemExit
new=list(strings);new[new.index('setAllowContentAccess')]='setMediaPlaybackRequiresUserGesture';order=sorted(range(ns),key=lambda i:new[i]);sm={old:i for i,old in enumerate(order)}
nm,mo=struct.unpack_from('<II',d,88);methods=[struct.unpack_from('<HHI',d,mo+8*i)for i in range(nm)];morder=sorted(range(nm),key=lambda i:(methods[i][0],sm[methods[i][2]],methods[i][1]));mm={old:i for i,old in enumerate(morder)}
for i,old in enumerate(morder):c,pr,n=methods[old];struct.pack_into('<HHI',d,mo+8*i,c,pr,sm[n])
for count,off in [(u32(64),u32(68))]:
 for i in range(count):struct.pack_into('<I',d,off+4*i,sm[u32(off+4*i)])
for i in range(u32(72)):o=u32(76)+12*i;struct.pack_into('<I',d,o,sm[u32(o)])
for i in range(u32(80)):o=u32(84)+8*i+4;struct.pack_into('<I',d,o,sm[u32(o)])
classoff=u32(100);cdo=u32(classoff+24);o=cdo;counts=[]
for _ in range(4):v,o=ul(o);counts.append(v)
for _ in range(sum(counts[:2])):
 for _ in range(2):_,o=ul(o)
code=[]
for count in counts[2:]:
 idx=0
 for _ in range(count):diff,o=ul(o);idx+=diff;_,o=ul(o);co,o=ul(o);assert mm[idx]==idx;code.append(co)
# The tiny shell uses this bounded opcode set; reject unexpected code rather than guess.
sizes={0x0:1,0xc:1,0xe:1,0x12:1,0x13:2,0x14:3,0x1a:2,0x22:2,0x38:2,0x54:2,0x5b:2,0x6e:3,0x6f:3,0x70:3,0x71:3,0x72:3}
for co in code:
 o=co+16;end=o+u32(co+12)*2
 while o<end:
  op=d[o];assert op in sizes,hex(op)
  if op==0x1a:struct.pack_into('<H',d,o+2,sm[struct.unpack_from('<H',d,o+2)[0]])
  if op in [0x6e,0x6f,0x70,0x71,0x72]:struct.pack_into('<H',d,o+2,mm[struct.unpack_from('<H',d,o+2)[0]])
  o+=sizes[op]*2
 assert o==end
mapoff=u32(52);mp=[list(v)for v in struct.iter_unpack('<HHII',d[mapoff+4:mapoff+4+u32(mapoff)*12])];start=next(v[3]for v in mp if v[0]==0x2002);debug=next(v[3]for v in mp if v[0]==0x2003);rebuilt=bytearray()
for i,old in enumerate(order):struct.pack_into('<I',d,so+i*4,start+len(rebuilt));v=new[old];rebuilt+=leb(len(v))+v.encode()+b'\0'
delta=len(rebuilt)-(debug-start)
def patch_name(o):
 v,end=ul(o)
 if v:
  encoded=leb(sm[v-1]+1);assert len(encoded)==end-o;d[o:end]=encoded
 return end
for co in code:
 pos=u32(co+8);_,o=ul(pos);cnt,o=ul(o)
 for _ in range(cnt):o=patch_name(o)
 while True:
  op=d[o];o+=1
  if op==0:break
  if op in [1,2,5,6]:_,o=ul(o)
  elif op in [3,4]:
   _,o=ul(o);o=patch_name(o);_,o=ul(o)
   if op==4:o=patch_name(o)
  elif op==9:o=patch_name(o)
  else:assert op in [7,8] or op>=10
 struct.pack_into('<I',d,co+8,pos+delta)
source=u32(classoff+16)
if source!=0xffffffff:struct.pack_into('<I',d,classoff+16,sm[source])
struct.pack_into('<I',d,classoff+24,cdo+delta)
result=d[:start]+rebuilt+d[debug:mapoff];result+=b'\0'*((-len(result))%4);newmap=len(result)
for entry in mp:
 if entry[3]>=debug:entry[3]+=delta
 if entry[0]==0x1000:entry[3]=newmap
result+=struct.pack('<I',len(mp))+b''.join(struct.pack('<HHII',*v)for v in mp)
struct.pack_into('<I',result,32,len(result));struct.pack_into('<I',result,52,newmap);struct.pack_into('<I',result,104,len(result)-u32(108));result[12:32]=hashlib.sha1(result[32:]).digest();struct.pack_into('<I',result,8,zlib.adler32(result[12:])&0xffffffff)
with zipfile.ZipFile(p,'w',zipfile.ZIP_DEFLATED) as z:
 for i,data in entries:z.writestr(i,result if i.filename=='classes.dex' else data)
print('Native Back routing retained; menu autoplay enabled; DEX tables/checksums rebuilt')
