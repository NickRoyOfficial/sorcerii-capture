import {normalizeCapture,toProject} from './shared/capture-format.js';
const $=id=>document.getElementById(id);let pending=null,busy=false;
async function call(msg){const result=await chrome.runtime.sendMessage(msg);if(!result?.ok)throw Error(result?.error||'The extension did not respond.');return result;}
async function run(fn){if(busy)return;busy=true;$('error').textContent='';try{await fn();}catch(error){$('error').textContent=error.message;}finally{busy=false;}}
async function refresh(){const state=await call({type:'SC_STATE'});pending=state.pending;$('capture-actions').hidden=!!pending;$('pending').hidden=!pending;if(!pending)return;
 const capture=normalizeCapture(pending.capture);$('title').textContent=capture.source.title;$('summary').textContent=new URL(capture.source.url).hostname+' · '+capture.count+' elements · '+capture.source.width+'px · '+capture.mode;
 $('warnings').replaceChildren(...capture.warnings.map(w=>{const p=document.createElement('p');p.textContent=w;return p;}));
 $('destination').replaceChildren(...state.tabs.map(tab=>{const o=document.createElement('option');o.value=tab.id;o.textContent=tab.title+' · '+new URL(tab.url).hostname;return o;}));$('send').disabled=!state.tabs.length;
 if(!state.tabs.length){const o=document.createElement('option');o.textContent='Open Sorcerii Studio, then refresh';$('destination').append(o);}
}
for(const mode of ['page','section'])$(mode).addEventListener('click',()=>run(async()=>{await call({type:'SC_START',mode});window.close();}));
$('refresh').addEventListener('click',()=>run(refresh));
$('send').addEventListener('click',()=>run(async()=>{const result=await call({type:'SC_SEND',tabId:Number($('destination').value)});$('status').textContent=result.status==='inserted'?'This capture was already inserted.':'Capture staged. Switch to Sorcerii to review and confirm insertion.';await refresh();}));
$('discard').addEventListener('click',()=>run(async()=>{if(!confirm('Discard this pending capture? Download JSON first if you want to keep it.'))return;await call({type:'SC_DISCARD'});await refresh();}));
$('download').addEventListener('click',()=>run(async()=>{if(!pending)return;const payload={...toProject(pending.capture),capture:pending.capture},blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=(pending.capture.source.title.replace(/[^a-zA-Z0-9_-]+/g,'-').slice(0,60)||'website')+'.capture.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);$('status').textContent='JSON downloaded. Import it in Sorcerii to review, or keep it as a backup.';}));
chrome.storage.onChanged.addListener(changes=>{if(changes.pending&&!busy)run(refresh);});
run(refresh);
