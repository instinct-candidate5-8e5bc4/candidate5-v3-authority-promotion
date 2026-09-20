#!/usr/bin/env python3
ROOT='b24dcf930604552f6624c87f1acb92069ca1bced98a726f29444ea4cb150ccb8'
def ok(s,data='8:0',hashdev='8:16'):
 f=s.split();return len(f)==13 and f[:4]==['0','196608','verity','1'] and f[4:11]==[data,hashdev,'4096','4096','24576','0','sha256'] and f[11:]==[ROOT,'-']
g=f'0 196608 verity 1 8:0 8:16 4096 4096 24576 0 sha256 {ROOT} -'
c=[('real',g,1),('canonical',g,1),('wrong-root',g.replace(ROOT,'0'*64),0),('wrong-data',g.replace('8:0','8:1',1),0),('wrong-hash',g.replace('8:16','8:17'),0),('size',g.replace('196608','196609'),0),('offset',g.replace('24576 0','24577 0'),0),('algorithm',g.replace('sha256','sha512'),0),('missing',' '.join(g.split()[:-1]),0),('extra',g+' ignore_zero_blocks',0),('malformed','bad',0),('normalized','  '+g.replace(' ','   ')+' ',1),('different',g.replace('4096 4096','512 4096'),0)]
for n,s,w in c:assert ok(s)==bool(w),n
print('DM_TABLE_SEMANTIC_FIXTURES_PASS')
