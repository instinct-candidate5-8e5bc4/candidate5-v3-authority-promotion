from pathlib import Path
import hashlib,json,sys
bs=4096;data=Path(sys.argv[1]).read_bytes();assert len(data)%bs==0;levels=[];cur=data
while len(cur)>bs:
 ds=[hashlib.sha256(cur[i:i+bs]).digest() for i in range(0,len(cur),bs)];packed=b''.join(ds);packed+=b'\0'*((-len(packed))%bs);levels.append(packed);cur=packed
root=hashlib.sha256(cur).hexdigest();tree=b''.join(reversed(levels));Path(sys.argv[2]).write_bytes(tree)
x={'schema':'v3.dm-verity-metadata.v1','algorithm':'sha256','dataBlockSize':bs,'hashBlockSize':bs,'dataBlocks':len(data)//bs,'hashStartBlock':0,'salt':'','rootHash':root,'dataImageSha256':hashlib.sha256(data).hexdigest(),'hashTreeSha256':hashlib.sha256(tree).hexdigest(),'hashTreeByteLength':len(tree),'format':'dm-verity format=1; separate data/hash devices'};Path(sys.argv[3]).write_text(json.dumps(x,sort_keys=True,separators=(',',':'))+'\n');print(root)
