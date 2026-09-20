#!/usr/bin/env python3
from pathlib import Path
import hashlib, importlib.util, json, shutil, stat, subprocess, sys
B=Path(__file__).resolve().parent
OUT=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else B/'hostile-runtime-work'
OUT.mkdir(parents=True,exist_ok=True)
spec=importlib.util.spec_from_file_location('successor_builder',B/'build-successor.py'); m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
base=m.parse_cpio((B/'full-handoff-test-initramfs.cpio').read_bytes())
base_init=next(e for e in base if e['name']=='init')['body'].decode()
producer='/bin/sh /bin/gce-by-id-producer || fail E_PROVIDER_NAMESPACE'

def hook(src, text):
    assert src.count(producer)==1
    return src.replace(producer,producer+'\n'+text)

def emit(name, init_text=None, old_body=None, old_mode=None, extras=()):
    es=[dict(e) for e in base]
    for e in es:
        if e['name']=='init' and init_text is not None: e['body']=init_text.encode()
        if e['name']=='init.root-admitter':
            if old_body is not None: e['body']=old_body
            if old_mode is not None: e['mode']=(e['mode']&~0o7777)|old_mode
    ino=max(e['ino'] for e in es)+1
    for path,body,mode in extras:
        es.append({'name':path,'ino':ino,'mode':stat.S_IFREG|mode,'uid':0,'gid':0,'nlink':1,'mtime':1,'body':body,'devmaj':0,'devmin':0,'rdevmaj':0,'rdevmin':0,'check':0}); ino+=1
    p=OUT/(name+'.cpio');m.emit_cpio(es,p);return p

cases=[]
def add(name,expected,p,disks='normal'): cases.append({'name':name,'expected':expected,'initrd':p.name,'initrdSha256':hashlib.sha256(p.read_bytes()).hexdigest(),'diskMutation':disks})
add('missing-expected-link','E_PROVIDER_LINK_MISSING',emit('missing-expected-link',hook(base_init,'$BB rm -f "$BYID/google-v3-reviewed-evidence"')))
add('extra-google-v3-link','E_EXTRA_MANAGED_DEVICE',emit('extra-google-v3-link',hook(base_init,'$BB ln -s /dev/sda "$BYID/google-v3-unexpected"')))
add('duplicate-or-ambiguous-target','E_ROLE_PROBE_MOUNT',emit('duplicate-or-ambiguous-target',hook(base_init,'$BB rm -f "$BYID/google-v3-reviewed-evidence"\n$BB ln -s "$BYID/google-v3-reviewed-output" "$BYID/google-v3-reviewed-evidence"')))
add('swapped-identity-links','E_ROLE_MARKER_MISMATCH',emit('swapped-identity-links',hook(base_init,'t=$($BB readlink "$BYID/google-v3-reviewed-root"); u=$($BB readlink "$BYID/google-v3-reviewed-input"); $BB rm "$BYID/google-v3-reviewed-root" "$BYID/google-v3-reviewed-input"; $BB ln -s "$u" "$BYID/google-v3-reviewed-root"; $BB ln -s "$t" "$BYID/google-v3-reviewed-input"')))
add('wrong-underlying-type','E_DEVICE_NODE',emit('wrong-underlying-type',hook(base_init,'$BB rm -f "$BYID/google-v3-reviewed-root"; $BB ln -s /dev/null "$BYID/google-v3-reviewed-root"')))
add('non-symlink-by-id-substitution','E_PROVIDER_LINK_SUBSTITUTION',emit('non-symlink-by-id-substitution',hook(base_init,'$BB rm -f "$BYID/google-v3-reviewed-root"; $BB echo x > "$BYID/google-v3-reviewed-root"')))
add('outside-dev-or-stale-link','E_PROVIDER_LINK_RESOLVE',emit('outside-dev-or-stale-link',hook(base_init,'$BB rm -f "$BYID/google-v3-reviewed-root"; $BB ln -s /no/such/device "$BYID/google-v3-reviewed-root"')))
add('wrong-preexisting-mount-target','E_MOUNT_TARGET_EXISTS',emit('wrong-preexisting-mount-target',hook(base_init,'$BB mkdir /reviewed-root')))
add('wrong-filesystem-type-or-options','E_ROLE_PROBE_MOUNT',emit('wrong-filesystem-type-or-options',base_init),'reviewed-root-unformatted')
# Executable static-boundary test: immutable shim verifies the adapter-under-test bytes before execution.
mut=base_init.replace("EXPECTED='v3-rootfs-data", "EXPECTED='v3-substituted-rootfs-data",1).encode()
refhash=hashlib.sha256(base_init.encode()).hexdigest()
shim=f'''#!/bin/sh\nset -eu\nBB=/bin/busybox\n[ "$($BB sha256sum /adapter-under-test | $BB cut -d' ' -f1)" = {refhash} ] || {{ $BB echo E_ADAPTER_IDENTITY >&2; exit 98; }}\nexec /adapter-under-test\n'''
add('adapter-substitution','E_ADAPTER_IDENTITY',emit('adapter-substitution',shim,extras=(('adapter-under-test',mut,0o755),)))
add('old-init-substitution','E_OLD_INIT_IDENTITY',emit('old-init-substitution',base_init,old_body=b'#!/bin/sh\nexit 0\n'))
add('incorrect-handoff','E_OLD_INIT_EXEC',emit('incorrect-handoff',base_init,old_mode=0o644))
(OUT/'matrix-inputs.v1.json').write_text(json.dumps({'schema':'v3.hostile-runtime-inputs.v1','baseInitramfsSha256':hashlib.sha256((B/'full-handoff-test-initramfs.cpio').read_bytes()).hexdigest(),'cases':cases},sort_keys=True,separators=(',',':'))+'\n')
print(OUT/'matrix-inputs.v1.json')
