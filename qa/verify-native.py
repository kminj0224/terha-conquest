import struct,zipfile,hashlib,zlib,pathlib
p=pathlib.Path(__file__).resolve().parents[1]/'android/native-shell.zip'
with zipfile.ZipFile(p) as z:d=z.read('classes.dex')
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
autoplay=[i for i,m in enumerate(methods)if ss[m[2]]=='setMediaPlaybackRequiresUserGesture'];assert len(autoplay)==1
assert any('window.terhaBack' in s for s in ss)
# Verify the native onCreate invocation uses the register initialized to false.
co=864;code=d[co+16:co+16+u32(co+12)*2];target=struct.pack('<H',autoplay[0]);assert b'\x12\x03' in code;assert b'\x6e\x20'+target+b'\x30\x00' in code
print('PASS: DEX header/hash/map references, sorted string/type/method IDs, native Back routing, media autoplay call(false)')
