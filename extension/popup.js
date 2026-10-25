import {normalizeCapture} from './shared/capture-format.js';
const $=id=>document.getElementById(id);let pending=null,busy=false;
async function call(msg){const result=await chrome.runtime.sendMessage(msg);if(!result?.ok)throw Error(result?.error||'The extension did not respond.');return result;}
async function run(fn){if(busy)return;busy=true;$('error').textContent='';$('send').disabled=true;try{await fn();}catch(error){$('error').textContent=error.message;}finally{busy=false;$('send').disabled=!pending||!/^\d+$/.test($('destination').value);}}
async function refresh(){const state=await call({type:'SC_STATE'});pending=state.pending;$('capture-actions').hidden=!!pending;$('pending').hidden=!pending;if(!pending){if(state.lastReceipt?.status==='inserted')setStatus('success','Imported into Sorcerii',state.lastReceipt.title+' · '+state.lastReceipt.count+' editable elements.');return;}
 if($('status').dataset.state==='success'){$('status').replaceChildren();delete $('status').dataset.state;}
 const capture=normalizeCapture(pending.capture);$('title').textContent=capture.source.title;$('summary').textContent=new URL(capture.source.url).hostname+' · '+capture.count+' elements · '+capture.source.width+'px · '+capture.mode;
 $('warnings').replaceChildren(...capture.warnings.map(w=>{const p=document.createElement('p');p.textContent=w;return p;}));
 $('destination').replaceChildren(...state.tabs.map(tab=>{const o=document.createElement('option');o.value=tab.id;o.textContent=tab.title+' · '+new URL(tab.url).hostname;return o;}));$('send').disabled=!state.tabs.length;
 if(!state.tabs.length){const o=document.createElement('option');o.value='';o.textContent='Open Sorcerii Studio, then refresh';$('destination').append(o);}
}
for(const mode of ['page','section'])$(mode).addEventListener('click',()=>run(async()=>{await call({type:'SC_START',mode});window.close();}));
$('refresh').addEventListener('click',()=>run(refresh));
function setStatus(state,title,detail){const box=$('status');box.dataset.state=state;box.replaceChildren();const strong=document.createElement('strong'),small=document.createElement('span');strong.textContent=title;small.textContent=detail;box.append(strong,small);}
$('send').addEventListener('click',()=>run(async()=>{setStatus('sending','Sending to Sorcerii…','Preparing your capture for review.');$('send').textContent='Sending…';try{const result=await call({type:'SC_SEND',tabId:Number($('destination').value)});setStatus(result.status==='inserted'?'success':'ready',result.status==='inserted'?'Already imported':'Ready in Sorcerii','Review the destination and click Insert elements to finish.');await refresh();}catch(error){setStatus('error','Capture not sent','Your capture is still available. Please try again.');throw error;}finally{$('send').textContent='Send to Sorcerii';}}));
$('discard').addEventListener('click',()=>run(async()=>{if(!confirm('Discard this pending capture? Download JSON first if you want to keep it.'))return;await call({type:'SC_DISCARD'});await refresh();}));
$('download').addEventListener('click',()=>run(async()=>{if(!pending)return;const payload=pending.capture,blob=new Blob([JSON.stringify(payload)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=(pending.capture.source.title.replace(/[^a-zA-Z0-9_-]+/g,'-').slice(0,60)||'website')+'.capture.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);$('status').textContent='JSON downloaded. Import it in Sorcerii to review, or keep it as a backup.';}));
chrome.storage.onChanged.addListener(changes=>{if((changes.pending||changes.lastReceipt)&&!busy)run(refresh);});
run(refresh);

document.querySelector('.version').textContent=chrome.runtime.getManifest().version;
