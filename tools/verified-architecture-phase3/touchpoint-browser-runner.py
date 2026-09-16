import json,os,subprocess,tempfile,time,urllib.request,websocket,sys
url=sys.argv[1]; out=sys.argv[2]; port=9333 if 'off' in out else 9334
profile=tempfile.mkdtemp(prefix='p3-chrome-')
p=subprocess.Popen(['/usr/bin/google-chrome','--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--remote-debugging-port='+str(port),'--user-data-dir='+profile,'--enable-precise-memory-info',url],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
try:
 for _ in range(100):
  try:
   tabs=json.load(urllib.request.urlopen(f'http://127.0.0.1:{port}/json',timeout=1));tab=next(x for x in tabs if x['type']=='page');break
  except Exception:time.sleep(.1)
 else:raise RuntimeError('CDP unavailable')
 ws=websocket.create_connection(tab['webSocketDebuggerUrl'],timeout=45,suppress_origin=True);i=0
 def ev(expr):
  global i;i+=1;ws.send(json.dumps({'id':i,'method':'Runtime.evaluate','params':{'expression':expr,'awaitPromise':True,'returnByValue':True}}))
  while True:
   r=json.loads(ws.recv())
   if r.get('id')==i:return r['result']['result'].get('value')
 time.sleep(8)
 data=ev("(()=>({url:location.href,ready:document.readyState,title:document.title,bodyDataset:{...document.body.dataset},htmlDataset:{...document.documentElement.dataset},errors:window.__bootTrace||[],observer:globalThis.__p3ObserverGate?.snapshot?.()||globalThis.__p3ObserverGate,app:{sceneText:document.querySelector('.scene')?.innerText||'',canvas:[document.querySelector('#world')?.width,document.querySelector('#world')?.height],audit:document.body.dataset.performanceaudit||null}}))()")
 json.dump(data,open(out,'w'),indent=2,ensure_ascii=False)
finally:p.terminate();p.wait(timeout=10)
