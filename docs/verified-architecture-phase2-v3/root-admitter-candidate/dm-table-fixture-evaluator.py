from pathlib import Path
import struct,sys
b=Path(sys.argv[1]).read_bytes();CAPACITY=16384
assert len(b)>=40
start,length,status,nxt,typ=struct.unpack_from('<QQiI16s',b)
assert start==0 and length==131072 and typ.rstrip(b'\0')==b'verity'
params=b[40:];nul=params.index(b'\0');assert nul==len(params)-1
used=40+nul+1;aligned=(used+7)&~7
assert len(b)==used
assert nxt==aligned
assert nxt<=CAPACITY
fields=params[:-1].split(b' ');assert len(fields)==10
assert fields[0]==b'1' and fields[3:8]==[b'4096',b'4096',b'16384',b'0',b'sha256'] and len(fields[8])==64 and fields[9]==b'-'
print('DM_TABLE_VALID_FIXTURE_EVALUATOR=PASS')
