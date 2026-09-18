from pathlib import Path
import struct,json,hashlib
params=b'1 8:1 8:2 4096 4096 24576 0 sha256 '+b'a'*64+b' -\0'
# linux dm_target_spec: sector_start u64, length u64, status i32, next u32, target_type[16]
size=40;used=size+len(params);nxt=(used+7)&~7
spec=struct.pack('<QQiI16s',0,196608,0,nxt,b'verity\0')+params
Path('dm-table-valid-response.v1.bin').write_bytes(spec)
Path('dm-table-valid-response.v1.json').write_text(json.dumps({'schema':'v3.dm-table-valid-response.v1','targetCount':1,'sectorStart':0,'sectorLength':196608,'targetType':'verity','specSize':size,'parameterByteLengthIncludingNul':len(params),'usedBytes':used,'next':nxt,'nextNonzero':True,'alignment':8,'recordSha256':hashlib.sha256(spec).hexdigest()},sort_keys=True,separators=(',',':'))+'\n')
