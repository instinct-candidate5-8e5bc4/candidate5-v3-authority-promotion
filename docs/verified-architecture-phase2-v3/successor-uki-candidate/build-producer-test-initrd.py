#!/usr/bin/env python3
from pathlib import Path
import importlib.util,sys
B=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('successor_builder',B/'build-successor.py')
m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
entries=m.parse_cpio((B/'successor-initramfs.cpio').read_bytes())
for e in entries:
 if e['name']=='init': e['body']=(B/'vm-test/guest-init.sh').read_bytes(); e['mode']=(e['mode']&~0o7777)|0o755
ino=max(e['ino'] for e in entries)+1
for name,path,mode in [('virtio_scsi.ko',B/'vm-test/virtio_scsi.ko',0o100644)]:
 entries.append({'name':name,'ino':ino,'mode':mode,'uid':0,'gid':0,'nlink':1,'mtime':1,'body':path.read_bytes(),'devmaj':0,'devmin':0,'rdevmaj':0,'rdevmin':0,'check':0});ino+=1
m.emit_cpio(entries,Path(sys.argv[1]) if len(sys.argv)>1 else B/'producer-test-initramfs.cpio')
