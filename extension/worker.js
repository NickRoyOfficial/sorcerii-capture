import {normalizeCapture,STYLE_PROPS,TAGS} from './shared/capture-format.js';
const ORIGINS=new Set(['https://sorcerii.com','https://www.sorcerii.com','https://sorceriistudio.nickroyofficial.chatgpt.site']);
const patterns=[...ORIGINS].map(v=>v+'/*');
let serial=Promise.resolve();
const queue=fn=>{const p=serial.then(fn,fn);serial=p.catch(()=>{});return p;};
export function allowedEditor(url){try{return ORIGINS.has(new URL(url).origin);}catch{return false;}}
async function read(){return (await chrome.storage.local.get(['pending','lastError']));}
async function handle(msg,sender){
 if(!msg||typeof msg.type!=='string')return {ok:false,error:'Invalid message.'};
 const fromPopup=!sender.tab&&sender.url===chrome.runtime.getURL('popup.html');
 if(msg.type==='SC_CAPTURED'||msg.type==='SC_CANCEL'){
  const {run}=await chrome.storage.session.get('run');
  if(!run||sender.tab?.id!==run.tabId||msg.token!==run.token||Date.now()-run.startedAt>300000)throw Error('This capture session expired. Start again.');
  if(msg.type==='SC_CAPTURED'){
   const {pending}=await read();if(pending)throw Error('A previous capture is still pending. Insert or discard it first.');
   const capture=normalizeCapture(msg.capture);await chrome.storage.local.set({pending:{capture,offer:null},lastError:''});await chrome.action.setBadgeText({text:'1'});
  }
  await chrome.storage.session.remove('run');return {ok:true};
 }
 if(msg.type==='SC_RESOLVED'){
  const {pending}=await read();if(!pending?.offer||!allowedEditor(sender.tab?.url)||pending.offer.tabId!==sender.tab.id||msg.token!==pending.offer.token||msg.id!==pending.capture.id)throw Error('Unrecognized capture receipt.');
  if(msg.status==='inserted'||msg.status==='discarded'){await chrome.storage.local.remove('pending');await chrome.action.setBadgeText({text:''});}return {ok:true};
 }
 if(!fromPopup)throw Error('Use the extension toolbar to start this action.');
 if(msg.type==='SC_STATE'){
  const state=await read(),tabs=await chrome.tabs.query({url:patterns});return {ok:true,...state,tabs:tabs.filter(t=>allowedEditor(t.url)).map(t=>({id:t.id,title:t.title||'Sorcerii Studio',url:t.url}))};
 }
 if(msg.type==='SC_START'){
  if((await read()).pending)throw Error('Insert, download or discard your pending capture first.');
  const [tab]=await chrome.tabs.query({active:true,currentWindow:true});if(!tab?.id||!/^https?:\/\//i.test(tab.url||''))throw Error('Open a normal website tab first. Browser settings and extension stores cannot be captured.');
  if(allowedEditor(tab.url))throw Error('Open the source website, then activate capture there.');
  const token=crypto.randomUUID();await chrome.storage.session.set({run:{tabId:tab.id,token,startedAt:Date.now()}});
  await chrome.scripting.executeScript({target:{tabId:tab.id},files:['source-styles.js','content.js']});
  await chrome.scripting.executeScript({target:{tabId:tab.id},func:options=>globalThis.__sorceriiCapture.start(options),args:[{mode:msg.mode==='page'?'page':'section',token,props:STYLE_PROPS,tags:[...TAGS]}]});return {ok:true};
 }
 if(msg.type==='SC_DISCARD'){await chrome.storage.local.remove('pending');await chrome.action.setBadgeText({text:''});return {ok:true};}
 if(msg.type==='SC_SEND'){
  const {pending}=await read();if(!pending)throw Error('Capture a page or section first.');const tab=await chrome.tabs.get(msg.tabId);if(!allowedEditor(tab.url))throw Error('Choose a Sorcerii editor tab.');
  const offer={tabId:tab.id,token:crypto.randomUUID()};await chrome.storage.local.set({pending:{...pending,offer}});
  try{await chrome.scripting.executeScript({target:{tabId:tab.id},files:['bridge.js']});const result=await chrome.tabs.sendMessage(tab.id,{type:'SC_OFFER',capture:pending.capture,token:offer.token});if(!result?.ok)throw Error(result?.error||'Open Sorcerii Studio and try again.');return {ok:true,status:result.status};}
  catch(e){throw Error('Could not stage the capture. Reload the Sorcerii tab, then send again. '+e.message);}
 }
 throw Error('Unknown extension action.');
}
chrome.runtime.onMessage.addListener((msg,sender,respond)=>{queue(()=>handle(msg,sender)).then(respond,error=>respond({ok:false,error:error.message}));return true;});
