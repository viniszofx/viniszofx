import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const root = fileURLToPath(new URL('../', import.meta.url));
const appPort = 30000 + Math.floor(Math.random() * 10000);
const baseUrl = `http://127.0.0.1:${appPort}`;
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(appPort)], {cwd:root,stdio:'ignore'});
const debugPort = 15000 + Math.floor(Math.random() * 10000);
const profile = mkdtempSync(join(tmpdir(), 'viniszofx-browser-'));
const downloads = mkdtempSync(join(tmpdir(), 'viniszofx-downloads-'));
const browser = spawn(process.env.VINISZOFX_TEST_BROWSER || '/usr/bin/microsoft-edge', ['--headless=new','--no-sandbox','--disable-gpu',`--remote-debugging-port=${debugPort}`,`--user-data-dir=${profile}`,'about:blank'], {stdio:'ignore'});
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
let socket;
try {
  for(let n=0;n<100;n++) { try { if((await fetch(baseUrl+'/dashboard/employees')).ok) break; } catch {} await sleep(100); }
  let targets;
  for(let n=0;n<100;n++) { try { targets = await fetch(`http://127.0.0.1:${debugPort}/json`).then(r=>r.json()); if(targets.some(x=>x.type==='page')) break; } catch {} await sleep(100); }
  assert.ok(targets, 'Browser did not start');
  socket = new WebSocket(targets.find(x=>x.type==='page').webSocketDebuggerUrl);
  await new Promise(resolve=>socket.addEventListener('open',resolve,{once:true}));
  let step = "starting"; const pending = new Map(); let sequence = 0; const exceptions=[]; const invalidRequests=[];
  socket.addEventListener('message',event=>{const message=JSON.parse(event.data); if(message.method==='Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails.text); if(message.method==='Network.requestWillBeSent' && /notes\.viniszofx\.invalid|\/api\//.test(message.params.request.url)) { invalidRequests.push(message.params.request.url); console.error('Local asset request:', step, message.params.type, message.params.documentURL, JSON.stringify(message.params.initiator)); } if(!message.id)return;const handler=pending.get(message.id);pending.delete(message.id);if(message.error) handler.reject(message.error); else handler.resolve(message.result);});
  const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
  const evaluate=async(expression)=>{const response=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(response.exceptionDetails) throw new Error(response.exceptionDetails.exception?.description??response.exceptionDetails.text);return response.result.value;};
  const until=async(expression)=>{for(let n=0;n<150;n++){if(await evaluate(`Boolean(${expression})`))return;await sleep(100);}throw new Error('Timed out: '+expression);};
  const click=async(text)=>{await until(`Array.from(document.querySelectorAll('button,[role="menuitem"]')).some(x=>x.textContent.trim()===${JSON.stringify(text)})`); await evaluate(`Array.from(document.querySelectorAll('button,[role="menuitem"]')).find(x=>x.textContent.trim()===${JSON.stringify(text)}).click()`);};
  await call('Runtime.enable');await call('Page.enable');await call('Network.enable');
  await call('Emulation.setDeviceMetricsOverride',{width:1400,height:900,deviceScaleFactor:1,mobile:false});
  const field=async(label,value)=>evaluate(`(()=>{const el=document.querySelector('[aria-label='+${JSON.stringify(JSON.stringify(label))}+']');const descriptor=Object.getOwnPropertyDescriptor(el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value');descriptor.set.call(el,${JSON.stringify(value)});el.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  await call('Page.navigate',{url:baseUrl+'/dashboard/employees'});
  await until(`document.querySelector('h1')?.textContent==='Employees' && !Array.from(document.querySelectorAll('button')).find(x=>x.textContent==='Novo empregado')?.disabled`);
  for (const name of ['Ana Silva','Bruno Souza']) {
   await click('Novo empregado');await until(`document.querySelector('[role="dialog"] input[aria-label="Nome"]')`);await field('Nome',name);await click('Salvar empregado');
   await until(`!document.querySelector('[role="dialog"]') && document.querySelector('button[aria-label="Abrir empregado '+${JSON.stringify(name)}+ '"]')`);
  }
  await call('Page.navigate',{url:baseUrl+'/dashboard/trip'});await until(`document.querySelector('h1')?.textContent==='Trip' && !Array.from(document.querySelectorAll('button')).find(x=>x.textContent==='New trip')?.disabled`);
  await click('New trip');await until(`document.querySelector('input[aria-label="Selecionar colaborador Ana Silva"]')`);
  await field('Descrição da viagem','Viagem com equipe');
  await evaluate(`document.querySelector('input[aria-label="Selecionar colaborador Ana Silva"]').click()`);
  await evaluate(`document.querySelector('input[aria-label="Selecionar colaborador Bruno Souza"]').click()`);
  await click('Salvar trip');await until(`!document.querySelector('[role="dialog"]') && document.querySelector('main article')?.textContent.includes('Ana Silva, Bruno Souza')`);
  await evaluate(`document.querySelector('button[aria-label="Abrir viagem Viagem com equipe"]').click()`);
  await until(`!document.querySelector('[role="dialog"]') && document.querySelector('input[aria-label="Selecionar colaborador Ana Silva"]')`);
  assert.ok(await evaluate(`document.querySelector('input[aria-label="Selecionar colaborador Ana Silva"]').checked && document.querySelector('input[aria-label="Selecionar colaborador Bruno Souza"]').checked`));
  await evaluate(`document.querySelector('input[aria-label="Selecionar colaborador Bruno Souza"]').click()`);
  await sleep(900);await call('Page.reload');await until(`document.querySelector('input[aria-label="Selecionar colaborador Ana Silva"]')`);
  assert.ok(await evaluate(`document.querySelector('input[aria-label="Selecionar colaborador Ana Silva"]').checked && !document.querySelector('input[aria-label="Selecionar colaborador Bruno Souza"]').checked`));
  for (const title of ['Cliente e Board','Colaboradores (opcional)','Informações da viagem','Transporte','Hospedagem','Datas','Descrição (opcional)']) {
   await evaluate(`(()=>{const summary=Array.from(document.querySelectorAll('summary')).find(x=>x.textContent===${JSON.stringify(title)});summary.click();})()`);
   assert.ok(await evaluate(`!Array.from(document.querySelectorAll('summary')).find(x=>x.textContent===${JSON.stringify(title)}).parentElement.open`));
   await evaluate(`Array.from(document.querySelectorAll('summary')).find(x=>x.textContent===${JSON.stringify(title)}).click()`);
   assert.ok(await evaluate(`Array.from(document.querySelectorAll('summary')).find(x=>x.textContent===${JSON.stringify(title)}).parentElement.open`));
  }
  assert.ok(await evaluate(`document.querySelector('input[aria-label="Selecionar colaborador Ana Silva"]').checked`),'Collapsing must preserve selections');
  await field('Buscar colaboradores','ANA');assert.equal(await evaluate(`document.querySelectorAll('input[aria-label^="Selecionar colaborador"]').length`),1);
  await call('Emulation.setDeviceMetricsOverride',{width:375,height:812,deviceScaleFactor:1,mobile:true});await sleep(150);assert.ok(await evaluate(`document.documentElement.scrollWidth<=innerWidth`));
  await click('Recolher todos');await until(`Array.from(document.querySelectorAll('details')).every(section=>!section.open)`);
  await evaluate(`Array.from(document.querySelectorAll('summary')).find(x=>x.textContent==='Colaboradores (opcional)').click()`);
  await until(`Array.from(document.querySelectorAll('summary')).find(x=>x.textContent==='Colaboradores (opcional)').parentElement.open`);
  await call('Page.reload');await until(`document.querySelector('input[aria-label="Selecionar colaborador Ana Silva"]')`);await sleep(300);
  assert.ok(await evaluate(`Array.from(document.querySelectorAll('summary')).find(x=>x.textContent==='Colaboradores (opcional)').parentElement.open`),'Open section must be restored');
  assert.ok(await evaluate(`Array.from(document.querySelectorAll('details')).filter(section=>section.querySelector('summary')?.textContent!=='Colaboradores (opcional)').every(section=>!section.open)`),'Closed sections must be restored');
  assert.ok(await evaluate(`document.querySelector('input[aria-label="Selecionar colaborador Ana Silva"]').checked`),'Collapsing all must preserve trip data');
  assert.equal(exceptions.length,0,exceptions.join('\n'));
  console.log('PASS: multiple collaborators, creation, auto-save removal, reload, search, mobile and persisted section preferences.');
} finally {socket?.close();browser.kill();server.kill();await sleep(300);rmSync(profile,{recursive:true,force:true});rmSync(downloads,{recursive:true,force:true});}
