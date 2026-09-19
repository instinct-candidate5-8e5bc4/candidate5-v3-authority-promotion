#!/usr/bin/env python3
from pathlib import Path
import hashlib,json,shutil,stat,struct,sys,tempfile
HERE=Path(__file__).resolve().parent
OLD=HERE.parent/'root-admitter-candidate'/'uki'
OUT=HERE

def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def cpio(root,out):
 data=bytearray(); ino=1
 def ent(name,mode,body=b''):
  nonlocal ino
  nb=name.encode()+b'\0'; h=('070701'+f'{ino:08x}{mode:08x}{0:08x}{0:08x}{1:08x}{1:08x}{len(body):08x}{0:08x}{0:08x}{0:08x}{0:08x}{len(nb):08x}{0:08x}').encode(); ino+=1
  data.extend(h+nb); data.extend(b'\0'*(-len(data)%4)); data.extend(body); data.extend(b'\0'*(-len(data)%4))
 for p in sorted(root.rglob('*'),key=lambda x:str(x.relative_to(root)).encode()):
  n=str(p.relative_to(root)); st=p.lstat(); ent(n,(stat.S_IFLNK|0o777) if p.is_symlink() else ((stat.S_IFDIR|0o755) if p.is_dir() else (stat.S_IFREG|(st.st_mode&0o777))),p.readlink().as_posix().encode() if p.is_symlink() else (b'' if p.is_dir() else p.read_bytes()))
 ent('TRAILER!!!',0); data.extend(b'\0'*(-len(data)%512)); out.write_bytes(data)
def uki(stub,linux,initrd,cmd,out):
 b=stub.read_bytes(); peoff=struct.unpack_from('<I',b,0x3c)[0]; coff=peoff+4; n=struct.unpack_from('<H',b,coff+2)[0]; opt=coff+20; sect=opt+struct.unpack_from('<H',b,coff+16)[0]; sects=[]
 for i in range(n):
  o=sect+40*i; vsize,vaddr,rsize,roff=struct.unpack_from('<IIII',b,o+8); sects.append((vaddr,max(vsize,rsize)))
 sa=struct.unpack_from('<I',b,opt+32)[0]; fa=struct.unpack_from('<I',b,opt+36)[0]; va=(max(v+s for v,s in sects)+sa-1)//sa*sa; raw=(len(b)+fa-1)//fa*fa; z=bytearray(b+b'\0'*(raw-len(b)))
 for name,payload,flags in [(b'.cmdline',cmd.read_bytes(),0x40000040),(b'.linux',linux.read_bytes(),0x60000020),(b'.initrd',initrd.read_bytes(),0x40000040)]:
  rs=(len(payload)+fa-1)//fa*fa; vs=len(payload); h=name.ljust(8,b'\0')+struct.pack('<IIIIIIHHI',vs,va,rs,raw,0,0,0,0,flags); z[sect+40*n:sect+40*(n+1)]=h; n+=1; z.extend(payload+b'\0'*(rs-vs)); raw+=rs; va=(va+vs+sa-1)//sa*sa
 struct.pack_into('<H',z,coff+2,n); struct.pack_into('<I',z,opt+56,va); out.write_bytes(z)
with tempfile.TemporaryDirectory() as td:
 root=Path(td)/'initramfs'; shutil.copytree(OLD/'initramfs',root,symlinks=True)
 old=root/'init'; assert sha(old)=='6f6b504525b8f4f87a36422e5cc48c570220f1103514a204c36f3d70a8f2663f'
 old.rename(root/'init.root-admitter'); shutil.copy2(HERE/'cloud-boot-adapter.sh',root/'init'); (root/'init').chmod(0o755)
 cpio(root,OUT/'successor-initramfs.cpio')
uki(OLD/'linuxx64.efi.stub',OLD/'vmlinuz',OUT/'successor-initramfs.cpio',OLD/'cmdline',OUT/'successor-unsigned.efi')
inv={'schema':'v3.successor-uki-candidate-inventory.v1','status':'UNSIGNED_IMPLEMENTATION_CANDIDATE','artifacts':{n:{'bytes':(OUT/n).stat().st_size,'sha256':sha(OUT/n)} for n in ['cloud-boot-adapter.sh','device-manifest.v1.json','successor-initramfs.cpio','successor-unsigned.efi']},'preserved':{'cmdlineSha256':sha(OLD/'cmdline'),'kernelSha256':sha(OLD/'vmlinuz'),'oldInitSha256':sha(OLD/'initramfs'/'init'),'rootAdmitterSha256':sha(OLD/'initramfs'/'bin'/'measured-supervisor'),'verityRoot':'c8f1ca4197a6982aa09ea53dd92ef76fded30dce84c75ff63d2e978b4d227015'}}
(OUT/'inventory.v1.json').write_text(json.dumps(inv,sort_keys=True,separators=(',',':'))+'\n')
