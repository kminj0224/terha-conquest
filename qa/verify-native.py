"""Check the retained Android shell, exit bridge, and lifecycle without an Android device."""
import struct,zipfile,hashlib,zlib,pathlib
root=pathlib.Path(__file__).resolve().parents[1]
with zipfile.ZipFile(root/'android/native-shell.zip')as z:d=z.read('classes.dex')
def u32(o):return struct.unpack_from('<I',d,o)[0]
def ul(o):
 v=0;s=0
 while True:
  b=d[o];o+=1;v|=(b&127)<<s;s+=7
  if b<128:return v,o
assert u32(32)==len(d);assert d[12:32]==hashlib.sha1(d[32:]).digest();assert u32(8)==zlib.adler32(d[12:])&0xffffffff
ss=[]
for i in range(u32(56)):
 o=u32(u32(60)+4*i);n,o=ul(o);s=d[o:d.index(0,o)].decode();assert len(s)==n;ss.append(s)
assert ss==sorted(ss);types=[ss[u32(u32(68)+4*i)]for i in range(u32(64))];assert types==sorted(types)
methods=[struct.unpack_from('<HHI',d,u32(92)+8*i)for i in range(u32(88))];assert methods==sorted(methods,key=lambda m:(m[0],m[2],m[1]))
names=[(types[c],ss[n])for c,p,n in methods];code={};annotated=set()
for i in range(u32(96)):
 co=u32(100)+32*i;annotations=u32(co+20);data=u32(co+24)
 if annotations:
  nf,nm,np=struct.unpack_from('<III',d,annotations+4)
  for j in range(nm):
   method,aset=struct.unpack_from('<II',d,annotations+16+nf*8+j*8)
   for k in range(u32(aset)):
    off=u32(aset+4+4*k);visibility=d[off];typ,_=ul(off+1)
    if visibility==1 and types[typ]=='Landroid/webkit/JavascriptInterface;':annotated.add(method)
 if not data:continue
 pos=data;counts=[]
 for _ in range(4):v,pos=ul(pos);counts.append(v)
 for _ in range(counts[0]+counts[1]):_,pos=ul(pos);_,pos=ul(pos)
 for count in counts[2:]:
  method=0
  for _ in range(count):
   delta,pos=ul(pos);method+=delta;_,pos=ul(pos);off,pos=ul(pos)
   if off:code[method]=d[off+16:off+16+u32(off+12)*2]
main='Lcom/terha/conquest/MainActivity;';bridge=main[:-1]+'$ExitBridge;'
assert names.index((bridge,'exitGame'))in annotated
assert not any(t.startswith('Landroid/')for t in [types[u32(u32(100)+32*i)]for i in range(u32(96))]),'Compile stubs leaked into app'
# Decode only instruction widths present in this small Activity, rejecting anything unexpected.
widths={op:1 for op in [0,1,4,7,10,11,12,13,14,15,16,17,18,29,30,33,39,40]}
for op in [2,5,8,19,21,22,25,26,28,31,32,34,35,41]:widths[op]=2
for op in [3,6,9,20,23,27,36,37,38,42,43,44]:widths[op]=3
widths[24]=5
for op in range(45,62):widths[op]=2
for op in range(68,110):widths[op]=2
for op in list(range(110,115))+list(range(116,121)):widths[op]=3
for op in range(123,144):widths[op]=1
for op in range(144,176):widths[op]=2
for op in range(176,208):widths[op]=1
for op in range(208,227):widths[op]=2
def instructions(index):
 body=code[index];o=0
 while o<len(body):
  op=body[o];assert op in widths,hex(op)
  yield o,op,body[o:o+widths[op]*2]
  o+=widths[op]*2
 assert o==len(body)
for index in code:list(instructions(index))
def constants(index):return[ss[struct.unpack_from('<H',b,2)[0]]for _,op,b in instructions(index)if op==26]
autoplay=names.index(('Landroid/webkit/WebSettings;','setMediaPlaybackRequiresUserGesture'));regs={};checked=False
for _,op,b in instructions(names.index((main,'onCreate'))):
 if op==18:regs[b[1]&15]=(b[1]>>4)-(16 if b[1]&128 else 0)
 if op==19:regs[b[1]]=struct.unpack_from('<h',b,2)[0]
 if op==110 and struct.unpack_from('<H',b,2)[0]==autoplay:
  args=[b[4]&15,b[4]>>4,b[5]&15,b[5]>>4,b[1]&15][:b[1]>>4];assert regs.get(args[1])==0;checked=True
assert checked
assert any('window.terhaBack' in s for s in constants(names.index((main,'onBackPressed'))))
assert '#resume'in ss and 'TerhaNative'in ss
for method in ['onPause','onResume','onNewIntent']:
 assert not any('file:///'in s for s in constants(names.index((main,method)))),'Lifecycle reloads the game'
assert any('terhaBackground'in s for s in constants(names.index((main,'onPause'))))
assert any('terhaForeground'in s for s in constants(names.index((main,'onResume'))))
print('PASS: DEX checksums/IDs/instruction boundaries, annotated native exit bridge, media autoplay(false), Back routing, resume without page reload, saved-instance recovery marker')
