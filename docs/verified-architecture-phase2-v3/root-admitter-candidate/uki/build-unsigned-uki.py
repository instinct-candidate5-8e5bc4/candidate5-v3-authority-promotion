from pathlib import Path
import struct,subprocess,sys
stub,linux,initrd,cmd,out=map(Path,sys.argv[1:])
b=stub.read_bytes();peoff=struct.unpack_from('<I',b,0x3c)[0];coff=peoff+4;n=struct.unpack_from('<H',b,coff+2)[0];opt=coff+20;sect=opt+struct.unpack_from('<H',b,coff+16)[0];sects=[]
for i in range(n):
 o=sect+40*i;vsize,vaddr,rsize,roff=struct.unpack_from('<IIII',b,o+8);sects.append((vaddr,max(vsize,rsize)))
sa=struct.unpack_from('<I',b,opt+32)[0];fa=struct.unpack_from('<I',b,opt+36)[0];va=(max(v+s for v,s in sects)+sa-1)//sa*sa;raw=(len(b)+fa-1)//fa*fa;z=bytearray(b+b'\0'*(raw-len(b)))
for name,payload,flags in [(b'.cmdline',cmd.read_bytes(),0x40000040),(b'.linux',linux.read_bytes(),0x60000020),(b'.initrd',initrd.read_bytes(),0x40000040)]:
 rs=(len(payload)+fa-1)//fa*fa;vs=len(payload);h=name.ljust(8,b'\0')+struct.pack('<IIIIIIHHI',vs,va,rs,raw,0,0,0,0,flags);z[sect+40*n:sect+40*(n+1)]=h;n+=1;z.extend(payload+b'\0'*(rs-vs));raw+=rs;va=(va+vs+sa-1)//sa*sa
struct.pack_into('<H',z,coff+2,n);struct.pack_into('<I',z,opt+56,va);out.write_bytes(z)
