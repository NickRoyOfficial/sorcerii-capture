// Transport only. The editor validates, previews and confirms before insertion.
(() => {
 if(window!==window.top||globalThis.__sorceriiCaptureBridge)return;globalThis.__sorceriiCaptureBridge=true;
 const ORIGINS=new Set(['https://sorcerii.com','https://www.sorcerii.com','https://sorceriistudio.nickroyofficial.chatgpt.site']);if(!ORIGINS.has(location.origin))return;
 const receipts=new Map();
 chrome.runtime.onMessage.addListener((msg,_sender,respond)=>{
  if(msg?.type!=='SC_OFFER')return false;
  const id=msg.capture?.id;if(typeof id!=='string'||typeof msg.token!=='string'){respond({ok:false,error:'Invalid offer.'});return false;}
  const previous=receipts.get(id);if(previous){clearTimeout(previous.timer);previous.respond?.({ok:false,error:'Offer superseded.'});}
  const timer=setTimeout(()=>{const r=receipts.get(id);if(r?.token===msg.token){r.respond?.({ok:false,error:'The editor did not respond.'});r.respond=null;}},5000);
  receipts.set(id,{token:msg.token,respond,timer});
  window.postMessage({channel:'sorcerii-capture',type:'offer',capture:msg.capture,token:msg.token},location.origin);return true;
 });
 window.addEventListener('message',event=>{
  const m=event.data;if(event.source!==window||event.origin!==location.origin||m?.channel!=='sorcerii-capture'||m.type!=='receipt')return;
  const r=receipts.get(m.id);if(!r||m.token!==r.token)return;
  if(['staged','inserted','discarded','rejected'].includes(m.status)){clearTimeout(r.timer);r.respond?.({ok:m.status!=='rejected',status:m.status,error:typeof m.error==='string'?m.error.slice(0,300):''});r.respond=null;
   if(['inserted','discarded'].includes(m.status)){chrome.runtime.sendMessage({type:'SC_RESOLVED',id:m.id,token:m.token,status:m.status}).catch(()=>{});receipts.delete(m.id);}
  }
 });
})();
