import json,subprocess,tempfile,time,urllib.request,websocket,sys
url,out,port=sys.argv[1],sys.argv[2],int(sys.argv[3]);profile=tempfile.mkdtemp(prefix='p3-bound-');p=subprocess.Popen(['/usr/bin/google-chrome','--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--remote-debugging-port='+str(port),'--user-data-dir='+profile,'--enable-precise-memory-info',url],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
try:
 for _ in range(150):
  try: tab=next(x for x in json.load(urllib.request.urlopen(f'http://127.0.0.1:{port}/json',timeout=1)) if x['type']=='page');break
  except:time.sleep(.1)
 ws=websocket.create_connection(tab['webSocketDebuggerUrl'],timeout=20,suppress_origin=True);i=1;time.sleep(8);expr="(()=>({ready:document.readyState,title:document.title,body:{...document.body.dataset},html:{...document.documentElement.dataset},observer:globalThis.__p3BoundedObserver?.snapshot?.()||null,boot:window.__bootTrace||[],canvas:[document.querySelector('#world')?.width,document.querySelector('#world')?.height],errors:globalThis.__p3BoundedObserver?.snapshot?.().errors||[]}))()";ws.send(json.dumps({'id':i,'method':'Runtime.evaluate','params':{'expression':expr,'returnByValue':True}}))
 while True:
  r=json.loads(ws.recv())
  if r.get('id')==i:break
 json.dump(r['result']['result'].get('value'),open(out,'w'),indent=2,ensure_ascii=False)
finally:p.terminate();p.wait(timeout=10)
