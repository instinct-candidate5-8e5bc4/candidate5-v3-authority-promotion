#!/usr/bin/env python3
from pathlib import Path
import hashlib,json,stat,struct,sys
HERE=Path(__file__).resolve().parent
OLD=HERE.parent/'root-admitter-candidate'/'uki'
OUT=Path(sys.argv[1]).resolve() if len(sys.argv)==2 else HERE
OUT.mkdir(parents=True,exist_ok=True)

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
def parse_cpio(blob):
 out=[]; o=0
 while True:
  if blob[o:o+6] != b'070701': raise ValueError('E_CPIO_MAGIC')
  vals=[int(blob[o+6+i*8:o+14+i*8],16) for i in range(13)]; o+=110
  namesize=vals[11]; name=blob[o:o+namesize-1].decode(); o+=namesize; o+=(-o)%4
  size=vals[6]; body=blob[o:o+size]; o+=size; o+=(-o)%4
  if name=='TRAILER!!!': break
  out.append({'name':name,'ino':vals[0],'mode':vals[1],'uid':vals[2],'gid':vals[3],'nlink':vals[4],'mtime':vals[5],'body':body,'devmaj':vals[7],'devmin':vals[8],'rdevmaj':vals[9],'rdevmin':vals[10],'check':vals[12]})
 return out
def emit_cpio(entries,out):
 data=bytearray()
 def ent(e):
  nb=e['name'].encode()+b'\0'; body=e['body']; h=('070701'+''.join(f"{e[k]:08x}" for k in ('ino','mode','uid','gid','nlink','mtime'))+f'{len(body):08x}'+''.join(f"{e[k]:08x}" for k in ('devmaj','devmin','rdevmaj','rdevmin'))+f'{len(nb):08x}{e["check"]:08x}').encode(); data.extend(h+nb); data.extend(b'\0'*(-len(data)%4)); data.extend(body); data.extend(b'\0'*(-len(data)%4))
 for e in entries: ent(e)
 ent({'name':'TRAILER!!!','ino':max(e['ino'] for e in entries)+1,'mode':0,'uid':0,'gid':0,'nlink':1,'mtime':0,'body':b'','devmaj':0,'devmin':0,'rdevmaj':0,'rdevmin':0,'check':0})
 data.extend(b'\0'*(-len(data)%512)); out.write_bytes(data)
old_entries=parse_cpio((OLD/'initramfs.cpio').read_bytes())
old_init=next(e for e in old_entries if e['name']=='init')
assert hashlib.sha256(old_init['body']).hexdigest()=='6f6b504525b8f4f87a36422e5cc48c570220f1103514a204c36f3d70a8f2663f'
adapter=(HERE/'cloud-boot-adapter.sh').read_bytes()
new=[]
for e in old_entries:
 if e['name']=='init':
  preserved=dict(e); preserved['name']='init.root-admitter'; new.append(preserved)
  current=dict(e); current['body']=adapter; current['mode']=(current['mode']&~0o7777)|0o755; new.append(current)
 else: new.append(dict(e))
next_ino=max(e['ino'] for e in new)+1
producer_files=[
 ('bin/gce-by-id-producer',HERE/'provider-producer/produce-google-by-id.sh',0o755),
 ('sbin/scsi_id',HERE/'provider-producer/lib/udev/scsi_id',0o755),
 ('gce-disk-naming.rules',HERE/'provider-producer/rules.d/65-gce-disk-naming.rules',0o644),
]
for rel,path,perm in producer_files:
 new.append({'name':rel,'ino':next_ino,'mode':stat.S_IFREG|perm,'uid':0,'gid':0,'nlink':1,'mtime':1,'body':path.read_bytes(),'devmaj':0,'devmin':0,'rdevmaj':0,'rdevmin':0,'check':0}); next_ino+=1
emit_cpio(sorted(new,key=lambda e:e['name'].encode()),OUT/'successor-initramfs.cpio')
uki(OLD/'linuxx64.efi.stub',OLD/'vmlinuz',OUT/'successor-initramfs.cpio',OLD/'cmdline',OUT/'successor-unsigned.efi')
member_vector=[{'name':e['name'],'mode':f"{e['mode']:08x}",'size':len(e['body']),'sha256':hashlib.sha256(e['body']).hexdigest()} for e in new]
inv={'schema':'v3.successor-uki-candidate-inventory.v2','status':'SUCCESSOR_UKI_CONCRETE_CANDIDATE_READY_FOR_OWNER_REVIEW','artifacts':{n:{'bytes':((HERE/n) if n in ('cloud-boot-adapter.sh','build-successor.py','builder-runtime.v1.json','hostile-test-plan.v1.json','provider-producer/produce-google-by-id.sh','provider-producer/rules.d/65-gce-disk-naming.rules','provider-producer/lib/udev/scsi_id','provider-producer/lib/x86_64-linux-gnu/libc.so.6','provider-producer/lib64/ld-linux-x86-64.so.2','verify-candidate.py') else (OUT/n)).stat().st_size,'gitMode':'100755' if n in ('cloud-boot-adapter.sh','build-successor.py','verify-candidate.py') else '100644','sha256':sha((HERE/n) if n in ('cloud-boot-adapter.sh','build-successor.py','builder-runtime.v1.json','hostile-test-plan.v1.json','provider-producer/produce-google-by-id.sh','provider-producer/rules.d/65-gce-disk-naming.rules','provider-producer/lib/udev/scsi_id','provider-producer/lib/x86_64-linux-gnu/libc.so.6','provider-producer/lib64/ld-linux-x86-64.so.2','verify-candidate.py') else (OUT/n))} for n in ['cloud-boot-adapter.sh','build-successor.py','builder-runtime.v1.json','hostile-test-plan.v1.json','provider-producer/produce-google-by-id.sh','provider-producer/rules.d/65-gce-disk-naming.rules','provider-producer/lib/udev/scsi_id','provider-producer/lib/x86_64-linux-gnu/libc.so.6','provider-producer/lib64/ld-linux-x86-64.so.2','verify-candidate.py','successor-initramfs.cpio','successor-unsigned.efi']},'initramfsMembers':member_vector,'preserved':{'cmdlineSha256':sha(OLD/'cmdline'),'kernelSha256':sha(OLD/'vmlinuz'),'oldInitSha256':hashlib.sha256(old_init['body']).hexdigest(),'rootAdmitterSha256':sha(OLD/'initramfs'/'bin'/'measured-supervisor'),'verityRoot':'c8f1ca4197a6982aa09ea53dd92ef76fded30dce84c75ff63d2e978b4d227015'},'externalBinding':{'domain':'V3-SUCCESSOR-UKI-EXTERNAL-BINDING:v1','rule':'At signing review, freeze Git commit/tree and blob IDs/modes for README.md, build-successor.py, cloud-boot-adapter.sh and inventory.v1.json; bind their SHA-256 values plus unsigned/signed UKI SHA-256 and public certificate DER SHA-256 in one canonical record. The retained production key signs sha256(domain NUL || canonical record). Firmware authenticates embedded UKI bytes; this detached signature authenticates external evidence.'}}
(OUT/'inventory.v1.json').write_text(json.dumps(inv,sort_keys=True,separators=(',',':'))+'\n')

def git_blob(data): return hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()
bind_names=['README.md','build-successor.py','builder-runtime.v1.json','cloud-boot-adapter.sh','hostile-test-plan.v1.json','provider-producer/produce-google-by-id.sh','provider-producer/rules.d/65-gce-disk-naming.rules','provider-producer/lib/udev/scsi_id','provider-producer/lib/x86_64-linux-gnu/libc.so.6','provider-producer/lib64/ld-linux-x86-64.so.2','verify-candidate.py','inventory.v1.json','successor-initramfs.cpio','successor-unsigned.efi']
binding={'schema':'v3.successor-uki-external-binding.v1','status':'SUCCESSOR_UKI_CONCRETE_CANDIDATE_READY_FOR_OWNER_REVIEW','domain':'V3-SUCCESSOR-UKI-EXTERNAL-BINDING:v1','records':[]}
for n in bind_names:
 src=(HERE/n) if n in ('README.md','build-successor.py','builder-runtime.v1.json','cloud-boot-adapter.sh','hostile-test-plan.v1.json','provider-producer/produce-google-by-id.sh','provider-producer/rules.d/65-gce-disk-naming.rules','provider-producer/lib/udev/scsi_id','provider-producer/lib/x86_64-linux-gnu/libc.so.6','provider-producer/lib64/ld-linux-x86-64.so.2','verify-candidate.py') else (OUT/n)
 data=src.read_bytes(); binding['records'].append({'path':n,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'gitBlob':git_blob(data),'gitMode':'100755' if n in ('build-successor.py','cloud-boot-adapter.sh','provider-producer/produce-google-by-id.sh','provider-producer/lib/udev/scsi_id','provider-producer/lib/x86_64-linux-gnu/libc.so.6','provider-producer/lib64/ld-linux-x86-64.so.2','verify-candidate.py') else '100644'})
binding['signingRule']='productionSignature = RSA-PSS-SHA256(privateKey, SHA256(UTF8(domain) || 0x00 || canonicalRecordWithoutSignature)); canonical JSON is sorted-key compact UTF-8 plus LF; signature and certificate DER are adjacent public artifacts and not fields in the signed core'
(OUT/'successor-authority-record.v1.json').write_text(json.dumps(binding,sort_keys=True,separators=(',',':'))+'\n')
