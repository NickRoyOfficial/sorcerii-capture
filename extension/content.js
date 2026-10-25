// Runs only after the user activates capture. Kept in the extension's isolated world.
(() => {
 if(globalThis.__sorceriiCapture)return;
 const HOST='sorcerii-capture-overlay';
 const SKIP=new Set('script style link meta noscript template head base title source track'.split(' '));
 const GRAPHICS=new Set(['svg','canvas','iframe','object','embed']);
 const VOID=new Set(['img','input','br','hr']);
 const ATTRS='id href src alt title target role aria-label aria-labelledby aria-describedby aria-hidden for type name placeholder required disabled multiple rows cols size min max step pattern maxlength minlength autocomplete inputmode controls autoplay muted loop playsinline preload poster open start reversed'.split(' ');
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const label=el=>el.getAttribute('aria-label')||el.id&&el.localName+' #'+el.id||el.localName+(typeof el.className==='string'&&el.className.trim()?'.'+el.className.trim().split(/\s+/).slice(0,2).join('.'):'');
 let active=null;
 function snapshot(root,options){
  const tags=new Set(options.tags),warnings=new Set(),props=options.props;let count=0,characters=0,removed=0;
  const source=globalThis.__sorceriiSourceStyles?.create(root,props,{normalizeMotion:options.normalizeMotion!==false});
  const visit=(el,depth)=>{
   if(el.nodeType===3){characters+=el.textContent.length;if(characters>1000000)throw Error('Too much text. Select a smaller section.');return el.textContent;}
   if(el.nodeType!==1||el.id===HOST||SKIP.has(el.localName))return null;
   if(++count>8000||depth>36)throw Error('This selection exceeds the hierarchy limit. Select a smaller section.');
   const original=el.localName,placeholder=GRAPHICS.has(original),tag=tags.has(original)?original:original==='body'?'div':'div';
   if(!tags.has(original)&&original!=='body'&&!placeholder)warnings.add('Unsupported HTML tags were mapped to containers; their children and order were retained.');
   const computed=getComputedStyle(el),styles={},attrs={};
   for(const prop of props){const v=computed[prop];if(typeof v==='string'&&v)styles[prop]=v;}
   for(const key of ATTRS)if(el.hasAttribute(key))attrs[key]=el.getAttribute(key);
   // Never read .value, .checked, selection state, cookies or site storage.
   if(original==='input'&&attrs.type==='password'){delete attrs.name;delete attrs.placeholder;}
   for(const key of ['src','poster','href'])if(attrs[key]){try{if(!attrs[key].startsWith('#')&&!attrs[key].startsWith('data:'))attrs[key]=new URL(attrs[key],document.baseURI).href;}catch{delete attrs[key];}}
   if(original==='img'){const src=el.currentSrc||el.getAttribute('src')||el.getAttribute('data-src')||'';if(src)try{attrs.src=new URL(src,document.baseURI).href;}catch{}if(attrs.src)warnings.add('Images remain linked to their source URLs. Some may need to be uploaded in Sorcerii.');}
   if(el.shadowRoot)warnings.add('Shadow DOM contents are outside this version; the host element is retained.');
   if(placeholder){warnings.add('SVG, canvas and embedded-frame contents were replaced with labeled placeholders.');attrs['aria-label']=original.toUpperCase()+' omitted';attrs.role='img';return {tag:'div',name:original.toUpperCase()+' (omitted)',attrs:{role:attrs.role,'aria-label':attrs['aria-label']},styles,children:[]};}
   if(['video','audio'].includes(original)){const media=el.currentSrc||el.getAttribute('src')||el.querySelector?.('source[src]')?.getAttribute('src');if(media)try{attrs.src=new URL(media,document.baseURI).href;}catch{}}
   const sourceStyles=source?.capture(el,computed);
   const children=[];if(!VOID.has(tag)&&original!=='textarea')for(const child of el.childNodes){const n=visit(child,depth+1);if(n!==null)children.push(n);}
   if(options.simplifyText&&children.every(n=>typeof n==='string')&&source?.canFlattenText(el,computed)){removed++;return children.join('');}
   return {tag,name:label(el).slice(0,100),attrs,...(sourceStyles?{styles:{},sourceStyles}:{styles}),children};
  };
  const tree=visit(root,0);
  if(removed)warnings.add('Simplified '+removed+' animation-only text wrappers. Layout containers and styled text were retained.');
  return {format:'sorcerii-capture',version:2,id:crypto.randomUUID(),mode:options.mode,source:{url:location.href,title:document.title||location.hostname,width:innerWidth,height:innerHeight},createdAt:new Date().toISOString(),warnings:[...(source?[...source.warnings]:['Current-width fallback. Source stylesheets were unavailable.']), 'Pseudo-elements and source JavaScript behavior are not imported. Remote images and fonts remain linked to their source.',...warnings],fontFaces:source?.fontFaces||[],fontStylesheets:source?.fontStylesheets||[],breakpoints:source?.breakpoints||[],root:tree};
 }
 function preview(root){let count=0,shown=0;const visit=(el,depth)=>{
  if(el.nodeType!==1||SKIP.has(el.localName)||el.id===HOST)return '';
  if(++count>8000||depth>36)throw Error('Select a smaller section: the hierarchy exceeds supported limits.');
  const visible=shown++<180;let children='';if(!GRAPHICS.has(el.localName))for(const c of el.children)children+=visit(c,depth+1);
  return visible?'<details'+(depth<2?' open':'')+'><summary>'+esc(label(el))+'</summary>'+children+'</details>':'';
 };const html=visit(root,0);return {html:html+(shown>180?'<p>Preview shortened. All supported descendants will be captured.</p>':''),count};}
 async function lazyLoad(root,state){
  const x=scrollX,y=scrollY,began=Date.now(),bottom=root===document.body?()=>document.documentElement.scrollHeight:()=>root.getBoundingClientRect().bottom+scrollY;
  try{let position=Math.max(0,root.getBoundingClientRect().top+scrollY-innerHeight/3);for(let step=0;step<60&&Date.now()-began<10000;step++){
   if(state.cancelled)throw Error('Capture cancelled.');window.scrollTo({top:position,left:x,behavior:'instant'});await new Promise(r=>setTimeout(r,100));if(position+innerHeight>=bottom())break;position+=Math.max(300,innerHeight*.75);
  }}finally{window.scrollTo({top:y,left:x,behavior:'instant'});}
 }
 function start(options){
  active?.close();const state={cancelled:false,root:options.mode==='page'?document.body:null,frozen:options.mode==='page',busy:false,options};active=state;
  const host=document.createElement('div');host.id=HOST;host.style.cssText='all:initial!important;position:fixed!important;inset:0!important;z-index:2147483647!important;pointer-events:none!important';
  const shadow=host.attachShadow({mode:'open'});shadow.innerHTML=`<style>
:host{all:initial}*{box-sizing:border-box} .outline{position:fixed;pointer-events:none;border:2px solid #aaa;background:#ffffff0b;box-shadow:0 0 0 9999px #0005;display:none}.panel{position:fixed;right:20px;top:20px;width:350px;max-height:calc(100vh - 40px);overflow:auto;pointer-events:auto;background:#161519;color:#eee;border:1px solid #000;border-radius:12px;box-shadow:inset 0 1px #ffffff25,0 16px 60px #0007;font:13px/1.5 system-ui;padding:18px}.head{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}strong{font-size:15px;font-weight:600}.muted{color:#b9b7c0}button{font:inherit;color:inherit;background:#28272c;border:1px solid #050506;border-radius:6px;padding:9px 12px;cursor:pointer;box-shadow:inset 0 1px #ffffff25}button:focus-visible{outline:2px solid #ddd;outline-offset:2px}button:disabled{opacity:.4;cursor:default}.primary{background:#eee;color:#151419}.actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}.tree{max-height:230px;overflow:auto;background:#0d0c0f;border:1px solid #39373e;border-radius:6px;padding:10px;margin:12px 0}details{margin-left:10px}summary{cursor:pointer;overflow-wrap:anywhere}label{display:flex;gap:8px;margin:12px 0}p{margin:8px 0}.error{color:#ffc4c4}.hidden{display:none!important}
</style><div class="outline"></div><section class="panel" role="dialog" aria-label="Sorcerii Capture"><div class="head"><strong>Sorcerii Capture</strong><button data-command="cancel" aria-label="Cancel capture">×</button></div><div class="body"></div></section>`;
  document.documentElement.append(host);const body=shadow.querySelector('.body'),outline=shadow.querySelector('.outline');
  const draw=()=>{const r=state.root?.getBoundingClientRect();outline.style.display=r?'block':'none';if(r)Object.assign(outline.style,{top:r.top+'px',left:r.left+'px',width:r.width+'px',height:r.height+'px'});};
  const review=()=>{draw();if(!state.frozen){body.innerHTML='<p>Hover over a section, then click to select it.</p><p class="muted">↑ Parent · ↓ First child · Esc Cancel</p>';return;}
   try{const p=preview(state.root);body.innerHTML='<p><strong>'+esc(options.mode==='page'?'Entire page':label(state.root))+'</strong></p><p class="muted">'+p.count+' elements · '+Math.round(state.root.getBoundingClientRect().width)+'px wide</p><div class="actions"><button data-command="parent">Parent</button><button data-command="child">First child</button><button data-command="reselect">Reselect</button></div><div class="tree">'+p.html+'</div><label><input type="checkbox" class="lazy" checked>Load lazy content before capture</label><label><input type="checkbox" class="motion" checked>Finish recognized text reveal effects</label><label><input type="checkbox" class="simplify">Simplify animation text</label><p class="muted">Merges plain letter/word animation fragments. Keeps layout wrappers, links and differently styled text.</p><p class="muted">Source width rules are retained where readable. Graphics and site behavior may be omitted. Form values are excluded.</p><div class="actions"><button class="primary" data-command="capture">Confirm capture</button><button data-command="cancel">Cancel</button></div>';if(options.mode==='page')body.querySelectorAll('[data-command="parent"],[data-command="child"],[data-command="reselect"]').forEach(b=>b.disabled=true);}
   catch(e){body.innerHTML='<p class="error">'+esc(e.message)+'</p><button data-command="reselect">Reselect</button>';}
  };
  const inOverlay=e=>e.composedPath().includes(host);
  const move=e=>{if(state.frozen||state.busy||inOverlay(e))return;const target=e.composedPath().find(n=>n.nodeType===1);if(target&&target!==document.documentElement){state.root=target;draw();}};
  const select=e=>{if(inOverlay(e)||state.busy)return;e.preventDefault();e.stopImmediatePropagation();if(state.root){state.frozen=true;review();}};
  const block=e=>{if(!inOverlay(e)&&!state.busy){e.preventDefault();e.stopImmediatePropagation();}};
  const key=e=>{if(e.key==='Escape'){e.preventDefault();state.close();return;}if(inOverlay(e)||state.busy)return;if(['ArrowUp','ArrowDown','Enter'].includes(e.key)){e.preventDefault();e.stopImmediatePropagation();if(e.key==='ArrowUp'&&state.root?.parentElement!==document.documentElement)state.root=state.root?.parentElement||state.root;if(e.key==='ArrowDown')state.root=state.root?.firstElementChild||state.root;if(e.key==='Enter')state.frozen=true;review();}};
  state.close=()=>{state.cancelled=true;host.remove();document.removeEventListener('pointermove',move,true);document.removeEventListener('click',select,true);document.removeEventListener('pointerdown',block,true);document.removeEventListener('keydown',key,true);window.removeEventListener('scroll',draw,true);window.removeEventListener('resize',draw);if(active===state)active=null;};
  shadow.addEventListener('click',async e=>{const command=e.target.closest('[data-command]')?.dataset.command;if(!command)return;
   if(command==='cancel'){state.close();chrome.runtime.sendMessage({type:'SC_CANCEL',token:options.token}).catch(()=>{});return;}
   if(state.busy)return;
   if(command==='reselect'){options.mode='section';state.frozen=false;review();return;}
   if(command==='parent'&&state.root?.parentElement!==document.documentElement){state.root=state.root.parentElement;review();return;}
   if(command==='child'){state.root=state.root?.firstElementChild||state.root;review();return;}
   if(command!=='capture'||!state.root?.isConnected)return;
   state.busy=true;const load=body.querySelector('.lazy')?.checked;options.normalizeMotion=body.querySelector('.motion')?.checked!==false;options.simplifyText=body.querySelector('.simplify')?.checked===true;body.innerHTML='<p role="status">Capturing the hierarchy…</p><p class="muted">'+(load?'Loading lazy content. You can cancel above.':'Reading the loaded page.')+'</p>';
   try{if(load)await lazyLoad(state.root,state);if(state.cancelled)return;if(!state.root.isConnected)throw Error('The selected section was replaced by the site. Reselect it.');const capture=snapshot(state.root,options);if(state.cancelled)return;const result=await chrome.runtime.sendMessage({type:'SC_CAPTURED',token:options.token,capture});if(!result?.ok)throw Error(result?.error||'Could not save capture.');state.close();}
   catch(err){if(!state.cancelled){state.busy=false;review();const p=document.createElement('p');p.className='error';p.textContent=err.message;body.prepend(p);}}
  });
  document.addEventListener('pointermove',move,true);document.addEventListener('click',select,true);document.addEventListener('pointerdown',block,true);document.addEventListener('keydown',key,true);window.addEventListener('scroll',draw,true);window.addEventListener('resize',draw);review();return {ok:true};
 }
 globalThis.__sorceriiCapture={start,snapshot,preview,cancel:()=>active?.close()};
})();
