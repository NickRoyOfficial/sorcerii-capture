// Versioned, dependency-free contract shared with Sorcerii Studio's receiver.
export const FORMAT='sorcerii-capture';
export const VERSION=1;
export const LIMITS={nodes:8000,depth:36,bytes:6*1024*1024,text:1000000};
export const TAGS=new Set('section div header footer nav main aside article ul ol li figure figcaption details form label blockquote a select fieldset dl dt dd dialog h1 h2 h3 h4 h5 h6 p span strong small em mark pre code legend option button input textarea summary br hr img video audio progress meter output'.split(' '));
export const STYLE_PROPS=('display flexDirection flexWrap justifyContent alignItems alignContent justifyItems alignSelf justifySelf gap rowGap columnGap gridTemplateColumns gridTemplateRows gridAutoFlow gridColumn gridRow flexGrow flexShrink flexBasis order paddingTop paddingRight paddingBottom paddingLeft marginTop marginRight marginBottom marginLeft width height minWidth minHeight maxWidth maxHeight overflow overflowX overflowY aspectRatio boxSizing objectFit objectPosition position top right bottom left zIndex float clear fontFamily fontSize fontWeight fontStyle lineHeight letterSpacing textAlign color textDecoration textDecorationLine textDecorationStyle textDecorationColor textTransform textIndent columnCount direction wordBreak overflowWrap whiteSpace textOverflow textShadow listStyleType backgroundColor backgroundImage backgroundSize backgroundPosition backgroundRepeat backgroundAttachment backgroundClip backgroundOrigin borderRadius borderTopLeftRadius borderTopRightRadius borderBottomRightRadius borderBottomLeftRadius borderWidth borderStyle borderColor borderTopWidth borderTopStyle borderTopColor borderRightWidth borderRightStyle borderRightColor borderBottomWidth borderBottomStyle borderBottomColor borderLeftWidth borderLeftStyle borderLeftColor opacity boxShadow transform transformOrigin filter backdropFilter visibility').split(' ');
const ATTRS=new Set('id href src alt title target rel role aria-label aria-labelledby aria-describedby aria-hidden for type name placeholder required disabled multiple rows cols size min max step pattern maxlength minlength autocomplete inputmode width height controls muted loop playsinline preload poster open start reversed'.split(' '));
const forbidden=new Set(['__proto__','prototype','constructor']);
export function assertPlain(value){
 const seen=new WeakSet(),stack=[[value,0]];let count=0;
 while(stack.length){const [v,d]=stack.pop();if(!v||typeof v!=='object')continue;
  if(seen.has(v)||d>85)throw Error('Capture is cyclic or too deeply nested.');seen.add(v);
  const p=Object.getPrototypeOf(v);if(!Array.isArray(v)&&p!==Object.prototype&&p!==null)throw Error('Capture must be plain JSON.');
  for(const k of Object.keys(v)){if(forbidden.has(k)||++count>700000)throw Error('Capture contains unsafe or excessive fields.');if(v[k]&&typeof v[k]==='object')stack.push([v[k],d+1]);}
 }
}
export function safeURL(value,kind='href',base){
 const v=String(value??'').trim();if(!v||v.length>3000000||/[\u0000-\u0020<>]/.test(v))return '';
 if(kind==='src'&&/^data:image\/(png|jpeg|gif|webp|avif);base64,[a-zA-Z0-9+/=]+$/.test(v))return v;
 if(kind==='href'&&v.startsWith('#'))return v;
 try{const url=new URL(v,base);return ['http:','https:',...(kind==='href'?['mailto:','tel:']:[])].includes(url.protocol)?url.href:'';}catch{return '';}
}
export function safeStyle(value,key){
 const v=String(value??'').trim();if(!v||v.length>(key==='backgroundImage'?8192:1024)||/[{}<>\\]/.test(v))return '';
 let rest=v;
 if(key==='backgroundImage'){
  let valid=true;rest=rest.replace(/url\(\s*(?:"([^"\r\n]*)"|'([^'\r\n]*)'|([^)'"\s]+))\s*\)/gi,(_,a,b,c)=>{const u=a??b??c;if(/["'<>\\\u0000-\u0020]/.test(u)||!/^https?:\/\//i.test(u))valid=false;return 'image';});if(!valid)return '';
 }
 return /^[a-zA-Z0-9#.,()%\s/+\-'":]*$/.test(rest)&&!/url\s*\(|\/\*|\*\/|expression|javascript|vbscript|import|behavior|binding/i.test(rest)?v:'';
}
export function normalizeCapture(input){
 assertPlain(input);
 if(!input||input.format!==FORMAT||input.version!==VERSION||!['page','section'].includes(input.mode)||typeof input.id!=='string'||!/^[a-zA-Z0-9_-]{1,100}$/.test(input.id)||forbidden.has(input.id))throw Error('Choose a supported Sorcerii Capture file.');
 if(new TextEncoder().encode(JSON.stringify(input)).length>LIMITS.bytes)throw Error('Capture exceeds the 6 MB limit. Choose a smaller section.');
 const source=input.source;if(!source||typeof source.title!=='string'||!/^https?:\/\//i.test(source.url||'')||!safeURL(source.url,'src')||!Number.isFinite(source.width)||source.width<1||source.width>20000||!Number.isFinite(source.height)||source.height<1||source.height>20000)throw Error('Invalid capture source.');
 const warnings=Array.isArray(input.warnings)?input.warnings.filter(v=>typeof v==='string').slice(0,100).map(v=>v.slice(0,600)):[];let count=0,text=0;
 const node=(n,depth)=>{
  if(typeof n==='string'){text+=n.length;if(text>LIMITS.text)throw Error('Capture contains too much text.');return n;}
  if(!n||depth>LIMITS.depth||++count>LIMITS.nodes||!TAGS.has(n.tag)||!Array.isArray(n.children)||n.children.length>LIMITS.nodes)throw Error('Capture hierarchy exceeds supported limits. Choose a smaller section.');
  const attrs={},styles={};for(const [k,v]of Object.entries(n.attrs||{})){
   if(!ATTRS.has(k)||typeof v!=='string'||v.length>3000000)continue;
   if(['href','src','poster'].includes(k)){const u=safeURL(v,k==='href'?'href':'src',source.url);if(u)attrs[k]=u;}
   else if(v.length<2000)attrs[k]=v;
  }
  // Values and submitted field content never enter a capture.
  if(n.tag==='input'&&attrs.type==='password'){delete attrs.name;delete attrs.placeholder;}
  if(attrs.target==='_blank')attrs.rel='noopener noreferrer';
  if(['video','audio'].includes(n.tag)&&!['none','metadata','auto'].includes(attrs.preload))delete attrs.preload;
  if(['meter','progress'].includes(n.tag))for(const k of ['min','max'])delete attrs[k];
  for(const [k,v]of Object.entries(n.styles||{}))if(STYLE_PROPS.includes(k)&&typeof v==='string'){const safe=safeStyle(v,k);if(safe)styles[k]=safe;}
  return {tag:n.tag,name:typeof n.name==='string'?n.name.slice(0,100):n.tag,attrs,styles,children:n.tag==='textarea'?[]:n.children.map(c=>node(c,depth+1))};
 };
 const root=node(input.root,0);if(typeof root==='string')throw Error('A capture needs an element root.');
 return {format:FORMAT,version:VERSION,id:input.id,mode:input.mode,source:{url:source.url,title:source.title.slice(0,300),width:source.width,height:source.height},createdAt:typeof input.createdAt==='string'?input.createdAt:'',warnings,root,count};
}
export function toProject(input,makeId=()=>crypto.randomUUID()){
 const capture=normalizeCapture(input),prefix='capture-'+makeId().replace(/[^a-zA-Z0-9]/g,'').slice(0,20),htmlIds=new Map();let index=0;
 const scan=n=>{if(typeof n==='string')return;if(n.attrs.id&&!htmlIds.has(n.attrs.id))htmlIds.set(n.attrs.id,prefix+'-'+(++index));n.children.forEach(scan);};scan(capture.root);
 const used=new Set();
 const convert=n=>{
  if(typeof n==='string')return n;
  const attrs={...n.attrs};if(attrs.id){const original=attrs.id;if(used.has(original))delete attrs.id;else{attrs.id=htmlIds.get(original);used.add(original);}}
  for(const k of ['for','aria-labelledby','aria-describedby'])if(attrs[k])attrs[k]=attrs[k].split(/\s+/).map(id=>htmlIds.get(id)).filter(Boolean).join(' ');
  if(attrs.href){let fragment=attrs.href.startsWith('#')?attrs.href.slice(1):'';try{const a=new URL(attrs.href,capture.source.url),b=new URL(capture.source.url);if(a.origin===b.origin&&a.pathname===b.pathname&&a.search===b.search)fragment=decodeURIComponent(a.hash.slice(1));}catch{}
   if(fragment&&htmlIds.has(fragment))attrs.href='#'+htmlIds.get(fragment);
  }
  // Preserve captured form children rather than installing demo success/error wrappers.
  if(n.tag==='form')attrs['data-t0-form-states']='capture';
  return {id:makeId(),tag:n.tag,name:n.name,attrs,styles:{desktop:{...n.styles},tablet:{},mobile:{}},children:n.children.map(convert)};
 };
 const tree=convert(capture.root),section={id:makeId(),name:tree.name||'Captured '+capture.mode,premade:false,rootElement:true,family:'cards',variant:'grid',blockId:'page-element',description:'Captured website elements',heading:'',body:'',cta:'',items:'',notes:'',role:'',density:'comfortable',tone:'light',visible:true,tree};
 return {schemaVersion:1,id:makeId(),name:capture.source.title||'Captured website',business:'',industry:'',audience:'',goal:'',framework:'',notes:'Captured from '+capture.source.url+' at '+capture.source.width+'px. Current-width snapshot; responsive behavior is not reconstructed.',templateId:'blank',pages:[{id:makeId(),name:'Captured page',slug:'',sections:[section]}]};
}
export function hierarchyHTML(root,escape,limit=250){let shown=0;const render=n=>{if(typeof n==='string')return '';if(++shown>limit)return '';return '<details'+(shown<5?' open':'')+'><summary>'+escape(n.name||n.tag)+' &lt;'+escape(n.tag)+'&gt;</summary>'+n.children.map(render).join('')+'</details>';};const html=render(root);return html+(shown>limit?'<p>Preview shortened. The full captured hierarchy is retained.</p>':'');}
