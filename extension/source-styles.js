// Reads authored CSS without changing the source DOM or executing source scripts.
(() => {
 const inherited=new Set('fontFamily fontSize fontWeight fontStyle lineHeight letterSpacing textAlign color textTransform textIndent direction wordBreak overflowWrap whiteSpace textShadow listStyleType visibility'.split(' '));
 const layoutDefaults={width:'auto',height:'auto',minWidth:'auto',minHeight:'auto',maxWidth:'none',maxHeight:'none',top:'auto',right:'auto',bottom:'auto',left:'auto',flexBasis:'auto',gridTemplateColumns:'none',gridTemplateRows:'none',transform:'none',filter:'none',backdropFilter:'none'};
 const kebab=s=>s.replace(/[A-Z]/g,c=>'-'+c.toLowerCase());
 const split=s=>{const out=[];let level=0,start=0,quote='';for(let i=0;i<s.length;i++){const c=s[i];if(quote){if(c===quote&&s[i-1]!=='\\')quote='';continue;}if(c==='"'||c==="'")quote=c;else if(c==='('||c==='[')level++;else if(c===')'||c===']')level--;else if(c===','&&!level){out.push(s.slice(start,i).trim());start=i+1;}}out.push(s.slice(start).trim());return out;};
 function specificity(selector){
  let s=selector.replace(/:where\((?:[^()]|\([^()]*\))*\)/g,''),bonus=[0,0,0];
  s=s.replace(/:(?:is|not|has)\(((?:[^()]|\([^()]*\))*)\)/g,(_,body)=>{const ranks=split(body).map(specificity).sort(compare);const best=ranks.at(-1)||[0,0,0];bonus=bonus.map((n,i)=>n+best[i]);return '';});
  const attrs=(s.match(/\[[^\]]*\]/g)||[]).length;
  s=s.replace(/\[[^\]]*\]/g,'');const ids=(s.match(/#[\w-]+/g)||[]).length;const classes=(s.match(/\.[\w-]+|:(?!:)[\w-]+(?:\([^)]*\))?/g)||[]).length;
  s=s.replace(/#[\w-]+|\.[\w-]+|:{1,2}[\w-]+(?:\([^)]*\))?/g,'');
  return [ids+bonus[0],attrs+classes+bonus[1],(s.match(/(?:^|[\s>+~])(?:[a-zA-Z][\w-]*)/g)||[]).length+bonus[2]];
 }
 function compare(a,b){for(let i=0;i<Math.max(a.length,b.length);i++)if((a[i]||0)!==(b[i]||0))return (a[i]||0)-(b[i]||0);return 0;}
 function media(text){
  if(!text||/^(all|screen)$/i.test(text.trim()))return [{}];
  return split(text).map(part=>{let minWidth=0,maxWidth=20000,ok=true;
   const rest=part.replace(/\(\s*(min|max)-width\s*:\s*([\d.]+)(px|em|rem)\s*\)/gi,(_,side,n,unit)=>{const size=Number(n)*(unit.toLowerCase()==='px'?1:16);if(side.toLowerCase()==='min')minWidth=Math.max(minWidth,size);else maxWidth=Math.min(maxWidth,size);return '';}).replace(/\b(?:only|screen|all|and)\b/gi,'').trim();
   if(rest||minWidth>maxWidth)ok=false;return ok?{minWidth,maxWidth}:null;
  }).filter(Boolean);
 }
 function resolve(value,vars,depth=0){
  if(depth>16)return '';
  let s=value;
  for(let i=0;i<20&&s.includes('var(');i++){
   const start=s.lastIndexOf('var(');let level=1,end=start+4;for(;end<s.length&&level;end++){if(s[end]==='(')level++;if(s[end]===')')level--;}
   if(level)return '';const body=s.slice(start+4,end-1),comma=body.indexOf(','),name=(comma<0?body:body.slice(0,comma)).trim(),fallback=comma<0?'':body.slice(comma+1).trim();
   const replacement=resolve(vars[name]??fallback,vars,depth+1);if(!replacement)return '';s=s.slice(0,start)+replacement+s.slice(end);
  }
  return s.includes('var(')?'':s;
 }
 function create(root,props,{normalizeMotion=true}={}){
  const warnings=new Set(),rules=[],fontFaces=[],fontStylesheets=[],bounds=new Set(),cache=new WeakMap();let order=0;
  const cssProps=props.map(k=>[k,kebab(k)]);
  function declarations(style,base){const out={};if(!style)return out;
   // Retain declaration order and shorthands until variables are resolved.
   out.entries=Array.from(style).map(css=>({css,value:style.getPropertyValue(css).trim(),important:style.getPropertyPriority(css)==='important',base}));return out;
  }
  const scratch=document.createElement('div').style;
  const expansionCache=new WeakMap();
  function expanded(decls,vars){const names=[...new Set((decls.entries||[]).flatMap(item=>[...item.value.matchAll(/var\(\s*(--[\w-]+)/g)].map(m=>m[1])))],signature=names.map(name=>name+':'+vars[name]).join('|');let cache=expansionCache.get(decls);if(!cache){cache=new Map();expansionCache.set(decls,cache);}if(cache.has(signature))return {...cache.get(signature)};const out={};scratch.cssText='';
   for(const item of decls.entries||[]){if(item.css.startsWith('--'))continue;let value=resolve(item.value,vars);if(!value)continue;
    value=value.replace(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)'"\s]+))\s*\)/gi,(_,a,b,c)=>{try{return 'url("'+new URL(a??b??c,item.base).href+'")';}catch{return '';}});
    scratch.setProperty(item.css,value,item.important?'important':'');
   }
   for(const [key,css]of cssProps){const value=scratch.getPropertyValue(css);if(value)out[key]={value,important:scratch.getPropertyPriority(css)==='important'};}cache.set(signature,out);return {...out};
  }
  function read(sheet,conditions=[{}],depth=0){if(depth>8)return;let list;try{list=sheet.cssRules;}catch{warnings.add('Some stylesheets could not be read. Their responsive rules may need manual adjustment.');return;}
   for(const rule of Array.from(list||[])){
    if(rules.length>6000)throw Error('Too many stylesheet rules. Choose a simpler source page.');
    if(rule.type===3){if(rule.styleSheet)read(rule.styleSheet,conditions,depth+1);continue;}
    if(rule.type===5){const family=rule.style.getPropertyValue('font-family').replace(/^['"]|['"]$/g,''),src=rule.style.getPropertyValue('src');for(const m of src.matchAll(/url\(\s*["']?([^\s)"']+)["']?\s*\)/g)){try{const url=new URL(m[1],sheet.href||document.baseURI).href;if(/^https?:/.test(url))fontFaces.push({family,url,weight:rule.style.getPropertyValue('font-weight')||'400',style:rule.style.getPropertyValue('font-style')||'normal'});}catch{}}continue;}
    if(rule.media){const ranges=media(rule.media.mediaText||rule.conditionText);if(!ranges.length){warnings.add('Non-width media queries are omitted. Check orientation, print and preference-specific styling manually.');continue;}const combined=conditions.flatMap(a=>ranges.map(b=>({minWidth:Math.max(a.minWidth||0,b.minWidth||0),maxWidth:Math.min(a.maxWidth??20000,b.maxWidth??20000)}))).filter(a=>a.minWidth<=a.maxWidth);read({cssRules:rule.cssRules,href:sheet.href},combined,depth+1);continue;}
    if(rule.type===12){if(globalThis.CSS?.supports?.(rule.conditionText))read({cssRules:rule.cssRules,href:sheet.href},conditions,depth+1);continue;}
    if(rule.selectorText&&rule.style){const selectors=split(rule.selectorText).filter(s=>!s.includes('::')&&!/:(hover|active|focus|focus-visible|focus-within|visited|target|checked|disabled|enabled)\b/.test(s));if(!selectors.length)continue;
     for(const c of conditions){if(c.minWidth>0&&c.minWidth<20000)bounds.add(c.minWidth);if(c.maxWidth>0&&c.maxWidth<20000)bounds.add(c.maxWidth);}
     rules.push({selectors:selectors.map(s=>({selector:s,rank:specificity(s)})),conditions,decls:declarations(rule.style,sheet.href||document.baseURI),order:order++});
    }else if(rule.cssRules&&rule.type!==7)warnings.add('Layered, container or nested CSS rules are omitted. Check those layouts manually.');
   }
  }
  for(const sheet of Array.from(document.styleSheets||[])){if(sheet.disabled)continue;const text=sheet.media?.mediaText;const conditions=media(text);if(conditions.length)read(sheet,conditions);if(sheet.href)try{const u=new URL(sheet.href);if(u.origin==='https://fonts.googleapis.com')fontStylesheets.push(u.href);}catch{}}
  const edges=[...bounds].sort((a,b)=>a-b);if(edges.length>24)throw Error('Too many responsive boundaries. Choose a simpler source page.');
  const ranges=[];let previous=0;for(const edge of edges){if(edge>previous)ranges.push({minWidth:previous,maxWidth:edge,minExclusive:previous!==0,maxExclusive:true,sample:(previous+edge)/2});ranges.push({minWidth:edge,maxWidth:edge,sample:edge});previous=edge;}ranges.push({minWidth:previous,maxWidth:20000,minExclusive:previous!==0,sample:Math.min(20000,previous+1000)});
  const matches=el=>{if(cache.has(el))return cache.get(el);const found=[];for(const rule of rules){let rank=null;for(const item of rule.selectors)try{if(el.matches(item.selector)&&(!rank||compare(item.rank,rank)>0))rank=item.rank;}catch{}if(rank)found.push({...rule,rank});}cache.set(el,found);return found;};
  const states=new WeakMap(),inlineCache=new WeakMap();
  function at(el,width){let byWidth=states.get(el);if(!byWidth){byWidth=new Map();states.set(el,byWidth);}if(byWidth.has(width))return byWidth.get(width);
   const parent=el.parentElement?at(el.parentElement,width):{vars:{}},styles={},ranks={};let vars=parent.vars;
   const write=(decls,rank,variables=false)=>{for(const [key,item]of Object.entries(decls)){const score=[Number(item.important),...rank];if(ranks[key]&&compare(score,ranks[key])<0)continue;ranks[key]=score;if(variables){if(vars===parent.vars)vars={...parent.vars};vars[key]=item.value;}else styles[key]=item.value;}};
   const selected=matches(el).filter(rule=>rule.conditions.some(c=>width>=(c.minWidth||0)&&width<=(c.maxWidth??20000))).map(rule=>({decls:rule.decls,rank:[0,...rule.rank,rule.order]}));
   if(!inlineCache.has(el))inlineCache.set(el,declarations(el.style,document.baseURI));selected.push({decls:inlineCache.get(el),rank:[1,0,0,0,0]});
   for(const item of selected){const custom={};for(const entry of item.decls.entries||[])if(entry.css.startsWith('--'))custom[entry.css]=entry;write(custom,item.rank,true);}
   if(vars!==parent.vars){const rawVars={...vars};for(const key of Object.keys(vars)){const value=resolve(rawVars[key],rawVars);if(value)vars[key]=value;else delete vars[key];}}
   const cls=typeof el.className==='string'?el.className:'';
   const reveal=normalizeMotion&&/(?:\bword-blur\b|\bgsap_split_letter\b|\bsplit-(?:word|char)\b)/.test(cls);
   for(const item of selected){const decls=expanded(item.decls,vars);if(reveal&&item.rank[0]===1)for(const key of ['transform','filter','opacity','visibility'])delete decls[key];write(decls,item.rank);}
   if(reveal){Object.assign(styles,{transform:'none',filter:'none',opacity:'1'});warnings.add('Recognized split-text reveal effects were captured in their readable state. Source motion is not imported.');
    const track=el.closest?.('[aria-label]');if(/\bgsap_split_letter\b/.test(cls)&&track&&track!==el){const siblings=Array.from(track.parentElement?.children||[]),first=siblings.find(n=>n!==track&&n.getAttribute('aria-label')===track.getAttribute('aria-label'));if(first&&siblings.indexOf(first)<siblings.indexOf(track)&&getComputedStyle(track).position==='absolute')styles.transform='translateY(100%)';}
   }
   const result={vars,styles};byWidth.set(width,result);return result;
  }
  function capture(el,computed){
   const parent=el.parentElement?getComputedStyle(el.parentElement):null,defaults={};
   for(const key of props){const v=computed[key];if(typeof v!=='string'||!v)continue;defaults[key]=key in layoutDefaults?layoutDefaults[key]:inherited.has(key)&&el!==root&&parent?.[key]===v?'inherit':v;}
   // Root sizing describes normal flow rather than its measured document rectangle.
   if(el===root&&el.localName==='body')Object.assign(defaults,{width:'auto',height:'auto',marginTop:'0px',marginRight:'0px',marginBottom:'0px',marginLeft:'0px'});
   const all=ranges.map(r=>({...defaults,...at(el,r.sample).styles})),base=all.at(-1),responsive=[];
   for(let i=0;i<ranges.length-1;i++){const delta=Object.fromEntries(Object.entries(all[i]).filter(([k,v])=>base[k]!==v));if(!Object.keys(delta).length)continue;const {sample,...range}=ranges[i];const last=responsive.at(-1);if(last&&JSON.stringify(last.styles)===JSON.stringify(delta)&&last.maxWidth===range.minWidth&&!(last.maxExclusive&&range.minExclusive)){last.maxWidth=range.maxWidth;last.maxExclusive=!!range.maxExclusive;}else responsive.push({...range,styles:delta});}
   return {base,rules:responsive};
  }
  return {capture,warnings,fontFaces,fontStylesheets,breakpoints:edges};
 }
 globalThis.__sorceriiSourceStyles={create};
})();
