import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
import {normalizeCapture} from '../extension/shared/capture-format.js';
const html=fs.readFileSync(new URL('../extension/popup.html',import.meta.url),'utf8');
const code=fs.readFileSync(new URL('../extension/popup.js',import.meta.url),'utf8').replace(/^import .*;\n/,'');
const tick=()=>new Promise(resolve=>setTimeout(resolve,10));
const fixture={format:'sorcerii-capture',version:2,id:'test',mode:'section',source:{url:'https://example.com/',title:'Example',width:1200,height:800},warnings:[],root:{tag:'section',styles:{},attrs:{},children:['Text']}};
function popup(state,send){const dom=new JSDOM(html,{url:'https://extension.example/',runScripts:'outside-only'});dom.window.normalizeCapture=normalizeCapture;dom.window.chrome={runtime:{getManifest:()=>({version:'0.2.2'}),sendMessage:async m=>m.type==='SC_STATE'?{ok:true,...state}:send(m)},storage:{onChanged:{addListener(){}}}};dom.window.eval(code);return dom;}
test('send shows immediate busy feedback, prevents duplicate delivery, then reports review ready',async()=>{
 let release,calls=0;const state={pending:{capture:fixture},tabs:[{id:7,url:'https://sorcerii.com',title:'Editor'}]},dom=popup(state,()=>{calls++;return new Promise(resolve=>{release=resolve;});});await tick();const d=dom.window.document,button=d.querySelector('#send');button.click();button.click();assert.equal(calls,1);assert.equal(button.disabled,true);assert.equal(d.querySelector('#status').dataset.state,'sending');release({ok:true,status:'staged'});await tick();assert.equal(d.querySelector('#status').dataset.state,'ready');assert.equal(button.disabled,false);dom.window.close();
});
test('confirmed import survives reopening; unavailable destinations remain disabled',async()=>{
 const dom=popup({pending:null,lastReceipt:{status:'inserted',title:'Example',count:42},tabs:[]},()=>{});await tick();assert.match(dom.window.document.querySelector('#status').textContent,/42 editable elements/);assert.equal(dom.window.document.querySelector('#status').dataset.state,'success');dom.window.close();
 const missing=popup({pending:{capture:fixture},tabs:[]},()=>{});await tick();assert.equal(missing.window.document.querySelector('#send').disabled,true);missing.window.close();
});
test('failed delivery reports an error and leaves Send available for retry',async()=>{
 const dom=popup({pending:{capture:fixture},tabs:[{id:7,url:'https://sorcerii.com',title:'Editor'}]},async()=>({ok:false,error:'Editor unavailable'}));await tick();dom.window.document.querySelector('#send').click();await tick();assert.equal(dom.window.document.querySelector('#status').dataset.state,'error');assert.equal(dom.window.document.querySelector('#send').disabled,false);assert.match(dom.window.document.querySelector('#error').textContent,/Editor unavailable/);dom.window.close();
});
