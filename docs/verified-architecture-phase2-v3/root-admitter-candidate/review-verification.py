from pathlib import Path
import hashlib,json,subprocess,struct
R=Path(__file__).parent;U=R/'uki';h=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
m=json.load(open(R/'dm-verity-metadata.v1.json'));rep=json.load(open(R/'reproduction-evidence.v1.json'));boot=json.load(open(R/'external-boot-measurement-binding.v1.json'));db=json.load(open(U/'uefi-db-policy.v1.json'))
assert m['dataImageSha256']==h(R/'root-admitter-rootfs.ext4') and m['hashTreeSha256']==h(R/'root-admitter-rootfs.verity') and m['rootHash']==rep['rootHash']==boot['dmVerity']['rootHash']==db['verityRoot']
assert all((rep[x] for x in ('binaryByteEqual','imageByteEqual','verityByteEqual','deterministicSignatureByteEqual','noGeneratedArtifactExecutedBootedOrMounted')))
assert not boot['selfAdmission'] and not boot['executionAuthorized'];assert boot['uki']['signedSha256']==h(U/'root-admitter-signed.efi')==db['boot']['signedUkiSha256']
src=(R/'measured-supervisor.c').read_text();assert all(x in src for x in ('DM_STATUS_TABLE_FLAG','DM_ACTIVE_PRESENT_FLAG','DM_BUFFER_FULL_FLAG','target_count!=1','t->sector_start!=0','t->length!=131072','returned_used!=used','t->next!=aligned','t->next>sizeof b-d->data_start','devid("/dev/v3-rootfs-data"','devid("/dev/v3-rootfs-hash"','field!=10'));assert 'execve(args[0],args,env)' in src and '"PATH=/usr/bin","LANG=C","LC_ALL=C","TZ=UTC","PWD=/",NULL' in src;assert m['rootHash'] not in src and 'v3.root_admitter_verity=%s' in src and 'DM_READONLY_FLAG' in src and 'O_NOFOLLOW' in src and 'chroot("/verity-root")' in src
hdr=subprocess.check_output(['/usr/bin/readelf','-hW',str(R/'measured-supervisor.elf')],text=True);ph=subprocess.check_output(['/usr/bin/readelf','-lW',str(R/'measured-supervisor.elf')],text=True);assert 'DYN (Position-Independent Executable file)' in hdr and 'INTERP' not in ph
cmd=(U/'cmdline').read_text().split();assert cmd.count('v3.root_admitter_verity='+m['rootHash'])==1
assert db['setup']['dbEntryCount']==1 and db['boot']['bootEntryCount']==1 and db['boot']['rejectUnsigned'] and db['boot']['rejectOtherSigners']
# Independently reconstruct format-1, empty-salt verity tree/root.
D=(R/'root-admitter-rootfs.ext4').read_bytes();levels=[];cur=D
while len(cur)>4096:
 packed=b''.join(hashlib.sha256(cur[i:i+4096]).digest() for i in range(0,len(cur),4096));packed+=b'\0'*(-len(packed)%4096);levels.append(packed);cur=packed
assert b''.join(levels)==(R/'root-admitter-rootfs.verity').read_bytes() and hashlib.sha256(cur).hexdigest()==m['rootHash']

# Regression: complete in-chroot closure, immutable bind targets, fail-closed init.
cb=(R.parent/'external-admission-launcher-candidate/external-admission-closure.v1.bin').read_bytes();pos=0;count=0
while pos<len(cb):
 fs=[]
 for _ in range(3): e=cb.index(b'\0',pos);fs.append(cb[pos:e].decode());pos=e+1
 e=cb.index(b'\n',pos);want=cb[pos:e].decode();pos=e+1;p=R/'rootfs'/fs[0].lstrip('/');assert p.stat().st_size==int(fs[2]) and h(p)==want;count+=1
assert count==30
for d in ('reviewed-root','reviewed-input','reviewed-output','reviewed-evidence','proc'): assert (R/'rootfs'/d).is_dir()
init=(U/'initramfs/init').read_text();assert 'set -eu' in init and init.count('|| fail ')>=20 and 'dmsetup table' in init and 'mountpoint -q' in init and ' -ef ' in init

assert len(json.load(open(R/'build/build-inputs.v1.json'))['inputs'])>100 and len(json.load(open(R/'hostile-review.v1.json'))['cases'])>=19
print('ROOT_ADMITTER_STATIC_REVIEW=PASS')
