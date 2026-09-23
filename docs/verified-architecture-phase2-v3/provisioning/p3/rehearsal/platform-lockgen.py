#!/usr/bin/env python3
import lzma, json, hashlib, re, sys
def parse(path, suite):
    out={}
    with lzma.open(path,'rt',errors='replace') as f:
        stanza={}
        for line in f:
            line=line.rstrip('\n')
            if not line:
                if stanza and 'Package' in stanza:
                    out.setdefault(stanza['Package'],[]).append(stanza)
                stanza={}; continue
            if line[0]==' ':
                if stanza.get('_last'): stanza['_last']+= '\n'+line
                continue
            k,_,v=line.partition(': ')
            stanza[k]=v; stanza['_last']=None
        if stanza and 'Package' in stanza:
            out.setdefault(stanza['Package'],[]).append(stanza)
    return out
base=parse('noble-main.xz','noble'); upd=parse('noble-updates-main.xz','noble-updates')
ubase=parse('noble-universe.xz','noble-universe'); uupd=parse('noble-updates-universe.xz','noble-updates-universe')
# candidate: updates version preferred
def cand(name):
    if name in uupd: return uupd[name][0], 'noble-updates-universe'
    if name in upd: return upd[name][0], 'noble-updates'
    if name in ubase: return ubase[name][0], 'noble-universe'
    if name in base: return base[name][0], 'noble'
    return None, None
SNAPSHOT_TS='20260922T000000Z'
SNAP='https://snapshot.ubuntu.com/ubuntu/'+SNAPSHOT_TS
SEEDS_RUNTIME=['qemu-system-x86','ovmf','sbsigntool','openssl','dosfstools','gdisk','bubblewrap']
SEEDS_BUILD=['gcc','make','nasm','acpica-tools','uuid-dev','bison','flex','gnu-efi','m4','perl']
seen={}; order=[]
def resolve(name, role):
    if name in seen:
        if role=='build' and seen[name][1]=='runtime': seen[name]=(seen[name][0],'both')
        return
    pkg, suite = cand(name)
    if pkg is None: print('VIRTUAL-OR-MISSING: '+name, file=sys.stderr); return
    seen[name]=(pkg, role); order.append(name)
    deps=[]
    for field in ('Pre-Depends','Depends'):
        d=pkg.get(field,'')
        for alt in d.split(','):
            alt=alt.strip()
            if not alt: continue
            deps.append(alt)
    for alt in deps:
        picked=None
        for option in alt.split('|'):
            nm=re.split(r'[ (]', option.strip())[0]
            nm=nm.split(':')[0]
            if cand(nm)[0] is not None: picked=nm; break
        if picked: resolve(picked, role)
for s in SEEDS_RUNTIME: resolve(s,'runtime')
for s in SEEDS_BUILD: resolve(s,'build')
entries=[]
for name in order:
    pkg, role = seen[name]
    entries.append({'name':name,'version':pkg['Version'],'architecture':pkg.get('Architecture','amd64'),
        'size':int(pkg['Size']),'sha256':pkg['SHA256'],'url':'http://archive.ubuntu.com/ubuntu/'+pkg['Filename'],'role':role})
def h(p): return hashlib.sha256(open(p,'rb').read()).hexdigest()
lock={'schema':'platform.lock/v1','distro':'ubuntu-24.04-noble','arch':'amd64',
 'indices':{'noble-main':{'url':SNAP+'/dists/noble/main/binary-amd64/Packages.xz','sha256':h('noble-main.xz')},
            'noble-updates-main':{'url':SNAP+'/dists/noble-updates/main/binary-amd64/Packages.xz','sha256':h('noble-updates-main.xz')},
            'noble-universe':{'url':SNAP+'/dists/noble/universe/binary-amd64/Packages.xz','sha256':h('noble-universe.xz')},
            'noble-updates-universe':{'url':SNAP+'/dists/noble-updates/universe/binary-amd64/Packages.xz','sha256':h('noble-updates-universe.xz')}},
 'snapshot_ts':SNAPSHOT_TS,
 'policy':'runner base image is observational-only; every installed tool comes from this lock; install rejects any missing/extra/substituted deb',
 'packages':entries}
open('platform.lock.json','w').write(json.dumps(lock,indent=1,sort_keys=True)+'\n')
print('packages:',len(entries))
print('runtime:',sum(1 for e in entries if e['role']!='build'),'build-only:',sum(1 for e in entries if e['role']=='build'))
print('lock sha256:', hashlib.sha256(open('platform.lock.json','rb').read()).hexdigest())
