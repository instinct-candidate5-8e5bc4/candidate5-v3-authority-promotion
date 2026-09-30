# Independent verification of actual landed ID raster pixels. Read-only.
import sys,json,os,hashlib,math
from PIL import Image
root=sys.argv[1];capture=json.load(open(os.path.join(root,'r3-sweep-full.json')));proof=json.load(open(os.path.join(root,'r3-sweep-pixel-verdict.json')))
colors={'school-casualty-adult-v1':(255,0,0),'school-medical-bag':(0,255,0),'school-treatment-chair':(0,0,255)}
assert len(capture['shots'])==17 and len(proof['rows'])==17
for s,row in zip(capture['shots'],proof['rows']):
 assert s['name']==row['name'];rect=s['canvasRect'];im=Image.open(os.path.join(root,os.path.basename(s['idPath']))).convert('RGB')
 for entity,color in colors.items():
  points=[(i%im.width,i//im.width) for i,c in enumerate(im.get_flattened_data() if hasattr(im,'get_flattened_data') else im.getdata()) if c==color];assert points
  box=next(b['pixelBounds'] for b in s['frame']['projectedBounds'] if b['entityId']==entity);assert all(math.isfinite(v) for v in box)
  assert 0<=box[0]<box[2]<=rect['width'] and 0<=box[1]<box[3]<=rect['height']
  assert all(box[0]+rect['x']-2<=x<=box[2]+rect['x']+2 and box[1]+rect['y']-2<=y<=box[3]+rect['y']+2 for x,y in points)
  expected=next(e for e in row['entities'] if e['entityId']==entity);assert expected['visiblePixelCount']==len(points) and expected['projectedPixelBounds']==box
 for kind,key in [('path','beautySha256'),('idPath','idSha256')]:
  assert hashlib.sha256(open(os.path.join(root,os.path.basename(s[kind])),'rb').read()).hexdigest()==row[key]
print('PIXELS_VERIFIED')
