<template>
<div class="c">
<main class="k">
<header class="h">
<h1>Voice Recorder</h1>
<p :class="['s', {a:r}]">{{m}}</p>
</header>
<div :class="['t', {p:r}]">{{f}}</div>
<div class="v">
<canvas ref="cv" width="200" height="48" class="b"></canvas>
</div>
<div class="o">
<button v-if="!r" @click="s" class="n n-r" aria-label="Record">
<svg class="i" viewBox="0 0 24 24"><path d="M12 14c1.7 0 3-1.3 3-3V5c0-1.7-1.3-3-3-3S9 3.3 9 5v6c0 1.7 1.3 3 3 3zm5.3-3c0 3-2.5 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.4 2.7 6.2 6 6.7V21h2v-3.3c3.3-.5 6-3.3 6-6.7h-1.7z"/></svg>
</button>
<button v-else @click="e" class="n n-s" aria-label="Stop">
<svg class="i" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
</button>
</div>
<section v-if="l.length" class="g">
<h2>Saved Tracks</h2>
<ul class="u">
<li v-for="t in l" :key="t.id" class="x">
<div class="j">
<input v-if="eId===t.id" ref="eIn" v-model="eNm" @blur="sN(t)" @keyup.enter="sN(t)" class="rn-i"/>
<span v-else @click="eT(t)" class="y">{{t.n}}</span>
<span class="z">{{t.d}}</span>
</div>
<div class="q">
<button @click="p(t)" class="a-b" :aria-label="t.p?'Pause':'Play'">
<svg v-if="!t.p" class="i-s" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
<svg v-else class="i-s" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
</button>
<button @click="d(t.id)" class="a-b d-b" aria-label="Delete">
<svg class="i-s" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
</button>
</div>
</li>
</ul>
</section>
</main>
</div>
</template>

<script setup>
import {ref,computed,onMounted,onBeforeUnmount,nextTick} from 'vue';
const r=ref(!1),m=ref('Ready to record'),sSec=ref(0),l=ref([]),cv=ref(null),eId=ref(null),eNm=ref(''),eIn=ref(null);
let rec=null,ch=[],tm=null,db=null,aCtx=null,an=null,aSrc=null,anim=null;
const f=computed(()=>{
const mn=Math.floor(sSec.value/60),sc=sSec.value%60;
return `${mn.toString().padStart(2,'0')}:${sc.toString().padStart(2,'0')}`;
});
const req=indexedDB.open('A_DB',1);
req.onupgradeneeded=e=>e.target.result.createObjectStore('b');
req.onsuccess=e=>{db=e.target.result;h();};
function h(){
const mf=JSON.parse(localStorage.getItem('m')||'[]');
l.value=mf.map(t=>({...t,p:!1,el:null,u:''}));
onMounted(()=>clCanvas());
}
function sM(){localStorage.setItem('m',JSON.stringify(l.value.map(t=>({id:t.id,n:t.n,d:t.d}))));}
function clCanvas(){
const c=cv.value;if(!c)return;
const ctx=c.getContext('2d');
ctx.clearRect(0,0,c.width,c.height);
ctx.fillStyle='#2d3139';ctx.fillRect(0,c.height/2-1,c.width,2);
}
function draw(){
if(!r.value)return;
anim=requestAnimationFrame(draw);
const c=cv.value;if(!c)return;
const ctx=c.getContext('2d'),w=c.width,h=c.height;
const buf=new Uint8Array(an.frequencyBinCount);
an.getByteTimeDomainData(buf);
ctx.fillStyle='#1a1d24';ctx.fillRect(0,0,w,h);
ctx.lineWidth=2;ctx.strokeStyle='#ef4444';ctx.beginPath();
const sl=w/buf.length;let x=0;
for(let i=0;i<buf.length;i++){
const v=buf[i]/128.0,y=v*h/2;
if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
x+=sl;
}
ctx.lineTo(w,h/2);ctx.stroke();
}
async function s(){
ch=[];
try{
const st=await navigator.mediaDevices.getUserMedia({audio:!0});
aCtx=new (window.AudioContext||window.webkitAudioContext)();
an=aCtx.createAnalyser();an.fftSize=256;
aSrc=aCtx.createMediaStreamSource(st);aSrc.connect(an);
rec=new MediaRecorder(st);
rec.ondataavailable=e=>e.data.size>0&&ch.push(e.data);
rec.onstop=async()=>{
const b=new Blob(ch,{type:'audio/webm'}),dur=f.value,id=Date.now();
const buf=await b.arrayBuffer();
const tx=db.transaction('b','readwrite');
tx.objectStore('b').put(buf,id);
tx.oncomplete=()=>{
l.value.push({id,n:`Track ${l.value.length+1}`,d:dur,p:!1,el:null,u:''});
sM();
};
st.getTracks().forEach(t=>t.stop());
if(aCtx){aCtx.close();aCtx=null;}
cancelAnimationFrame(anim);clCanvas();clearInterval(tm);
};
rec.start();r.value=!0;m.value='Recording active...';sSec.value=0;
tm=setInterval(()=>sSec.value++,1000);
draw();
}catch(e){m.value='Microphone access denied';}
}
function e(){
if(rec&&rec.state!=='inactive'){rec.stop();r.value=!1;m.value='Recording saved';}
}
function eT(t){
eId.value=t.id;eNm.value=t.n;
nextTick(()=>{if(eIn.value&&eIn.value[0])eIn.value[0].focus();});
}
function sN(t){
if(eId.value===null)return;
const nm=eNm.value.trim();
if(nm)t.n=nm;
eId.value=null;sM();
}
function p(t){
l.value.forEach(k=>k.id!==t.id&&k.p&&(k.el.pause(),k.p=!1));
if(t.p){t.el.pause();t.p=!1;m.value='Playback paused';}
else if(t.el){t.el.play();t.p=!0;m.value=`Playing ${t.n}`;}
else{
const tx=db.transaction('b','readonly');
tx.objectStore('b').get(t.id).onsuccess=e=>{
const buf=e.target.result;if(!buf)return;
const b=new Blob([buf],{type:'audio/webm'});
t.u=URL.createObjectURL(b);t.el=new Audio(t.u);
t.el.play();t.p=!0;m.value=`Playing ${t.n}`;
t.el.onended=()=>{t.p=!1;m.value='Playback finished';};
};
}
}
function d(id){
const i=l.value.findIndex(t=>t.id===id);
if(i!==-1){
const t=l.value[i];
if(t.el){t.el.pause();if(t.u)URL.revokeObjectURL(t.u);}
const tx=db.transaction('b','readwrite');
tx.objectStore('b').delete(id);
tx.oncomplete=()=>{l.value.splice(i,1);sM();m.value='Track deleted';};
}
}
onBeforeUnmount(()=>{clearInterval(tm);cancelAnimationFrame(anim);if(aCtx)aCtx.close();l.value.forEach(t=>t.u&&URL.revokeObjectURL(t.u));});
</script>

<style scoped>
:deep(*){box-sizing:border-box;margin:0;padding:0;}
.c{display:flex;justify-content:center;align-items:center;min-height:100vh;background:#0f1115;color:#e2e8f0;font-family:system-ui;padding:16px;}
.k{width:100%;max-width:420px;background:#1a1d24;border-radius:24px;padding:24px;box-shadow:0 12px 32px rgba(0,0,0,.4);}
.h{text-align:center;margin-bottom:24px;}
.h h1{font-size:1.5rem;font-weight:600;color:#f8fafc;margin-bottom:4px;}
.s{font-size:.875rem;color:#94a3b8;transition:color .3s;}
.a{color:#ef4444;}
.t{text-align:center;font-size:3.5rem;font-weight:300;color:#f8fafc;margin-bottom:16px;font-variant-numeric:tabular-nums;}
.p{animation:pl 2s infinite ease-in-out;}
@keyframes pl{0%,100%{opacity:1}50%{opacity:.7}}
.v{display:flex;justify-content:center;align-items:center;height:48px;margin-bottom:32px;}
.b{width:200px;height:48px;display:block;background:#1a1d24;}
.o{display:flex;justify-content:center;margin-bottom:32px;}
.n{display:flex;justify-content:center;align-items:center;width:72px;height:72px;border-radius:50%;border:none;cursor:pointer;-webkit-tap-highlight-color:transparent;}
.n:active{transform:scale(.92);}
.n-r{background:#3b82f6;}
.n-s{background:#ef4444;}
.i{width:32px;height:32px;fill:#fff;}
.g{border-top:1px solid #2d3139;padding-top:20px;}
.g h2{font-size:1rem;color:#94a3b8;margin-bottom:12px;}
.u{list-style:none;max-height:200px;overflow-y:auto;}
.x{display:flex;justify-content:space-between;align-items:center;background:#22262f;padding:12px 16px;border-radius:12px;margin-bottom:8px;}
.j{display:flex;flex-direction:column;gap:2px;flex:1;min-width:0;margin-right:12px;}
.y{font-size:.935rem;font-weight:500;color:#f1f5f9;cursor:pointer;text-overflow:ellipsis;overflow:hidden;white-space:nowrap;}
.rn-i{background:#1a1d24;border:1px solid #3b82f6;border-radius:4px;color:#f1f5f9;font-size:.935rem;font-weight:500;padding:2px 6px;outline:none;width:100%;font-family:inherit;}
.z{font-size:.75rem;color:#64748b;}
.q{display:flex;gap:8px;flex-shrink:0;}
.a-b{display:flex;justify-content:center;align-items:center;width:36px;height:36px;border-radius:50%;border:none;background:#2d3139;cursor:pointer;-webkit-tap-highlight-color:transparent;}
.d-b:hover{background:#7f1d1d;}
.i-s{width:18px;height:18px;fill:#94a3b8;}
.a-b:hover .i-s{fill:#f8fafc;}
.d-b:hover .i-s{fill:#f87171;}
</style>
