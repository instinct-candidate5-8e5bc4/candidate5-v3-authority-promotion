from pathlib import Path
import stat,sys
r=Path(sys.argv[1]);out=Path(sys.argv[2]);data=bytearray();ino=1
def ent(name,mode,body=b''):
 global ino
 nb=name.encode()+b'\0';h=('070701'+f'{ino:08x}{mode:08x}{0:08x}{0:08x}{1:08x}{1:08x}{len(body):08x}{0:08x}{0:08x}{0:08x}{0:08x}{len(nb):08x}{0:08x}').encode();ino+=1;data.extend(h+nb);data.extend(b'\0'*(-len(data)%4));data.extend(body);data.extend(b'\0'*(-len(data)%4))
for p in sorted(r.rglob('*'),key=lambda x:str(x.relative_to(r)).encode()):
 n=str(p.relative_to(r)); st=p.lstat(); ent(n,(stat.S_IFLNK|0o777) if p.is_symlink() else ((stat.S_IFDIR|0o755) if p.is_dir() else (stat.S_IFREG|(st.st_mode&0o777))),p.readlink().as_posix().encode() if p.is_symlink() else (b'' if p.is_dir() else p.read_bytes()))
ent('TRAILER!!!',0);data.extend(b'\0'*(-len(data)%512));out.write_bytes(data)
